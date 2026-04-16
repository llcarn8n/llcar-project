# Cloud Bearing Pipeline — полная спецификация (Randall-Antoni Stage I)

**Статус:** S5/optional, ещё не начат.
**Оценка:** 3–5 сессий (80–140 часов).
**Предусловия:** bench-подшипник с известным дефектом, SSH-доступ к 185.55.57.145, подтверждённый storage-бюджет (~60 ГБ на 1000 устройств за квартал), Android-репо LLCAR.

Текущая реализация — **Stage 0**: частотно-грубый `spectral_kurtosis_audio` + `kurtogram_best_band_*` из STFT-сводок на устройстве (~1.5 KB per session). Дефект подшипника детектируется косвенно через BPFO-гармоники в предвычисленных фичах.

**Stage I** (эта спецификация) — полный pipeline по **сырому сигналу** на сервере:
SANC → Spectral Kurtosis → Kurtogram → WPT → Hilbert envelope → FFT → BPFO/BPFI peak detector.
Источник: Randall R.B., Antoni J. (2011) "Rolling element bearing diagnostics — a tutorial", DOI:10.1016/j.ymssp.2010.07.017.

---

## Блок 1. Device-side: сырой буфер + аплоад

**Android-репо (не в текущем репозитории):**
- Новая опция пользователя: *«Разрешить фоновую запись сырого сигнала подшипника для облачной диагностики»* (opt-in, дефолт OFF).
- Триггер записи: средний RMS акселерометра `az_std > 0.5 g` держится >30 сек **или** пользователь явно нажал «Глубокий анализ подшипника».
- Буфер: IMU 200 Гц × 3 оси (ax/ay/az) + audio 16 кГц моно, 60 сек, float32.
  - IMU: 200 × 3 × 4 × 60 = 144 КБ.
  - Audio: 16000 × 4 × 60 = ~3.7 МБ.
  - Итого per session: ~3.9 МБ.
- Формат: Apache Parquet с Zstd, фактический размер ~1.6–1.8 МБ.
- Метаданные (JSON sidecar): `client_hash`, `vin`, `rpm_median`, `speed_median`, `regime`, `bpfo_expected_from_profile`, `timestamp_ms`, `device_fw_version`.
- Upload endpoint: `POST /api/v2/bearing-raw/` (новый).
  - TLS, gzip, Authorization через существующий device-token.
  - Rate-limit: не более 1 пакета в сутки на устройство (cooldown 24 ч).
  - Response 202 Accepted с `job_id`.

**Budget-gate (анти-нагрузка канала):**
- Аплоад разрешён только по Wi-Fi.
- Ретрай exponential backoff (5 мин / 30 мин / 2 ч / отмена).

---

## Блок 2. Backend ingest (Django `dashboard_build/`)

**Новые файлы:**
- `dashboard_build/diagnostic/api_bearing_raw.py` — view `POST /api/v2/bearing-raw/`.
- `dashboard_build/diagnostic/bearing_storage.py` — обёртка над S3/MinIO/filesystem.
- `dashboard_build/migrations/0XX_bearing_raw_jobs.sql` — миграция Timescale.

**Таблица `bearing_raw_jobs` (PostgreSQL/TimescaleDB):**
```sql
CREATE TABLE bearing_raw_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    time TIMESTAMPTZ NOT NULL DEFAULT now(),
    client_hash TEXT NOT NULL,
    vin TEXT,
    storage_key TEXT NOT NULL,            -- путь в бакете/на FS
    size_bytes BIGINT,
    metadata JSONB,                       -- rpm/speed/regime/bpfo_expected
    status TEXT NOT NULL DEFAULT 'pending', -- pending|processing|done|failed
    queued_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    error TEXT,
    result JSONB                          -- BPFO_peaks, SK_best, kurtogram_band, confidence
);
CREATE INDEX idx_bearing_raw_client_time ON bearing_raw_jobs(client_hash, time DESC);
CREATE INDEX idx_bearing_raw_status_queued ON bearing_raw_jobs(status, queued_at) WHERE status='pending';
```

**Storage:**
- MVP: локальная FS `/var/llcar-bearing-raw/<yyyy-mm-dd>/<uuid>.parquet`.
- Ротация: cron `find /var/llcar-bearing-raw/ -mtime +90 -delete`.
- При росте парка → S3/MinIO (параметризовать через env `BEARING_STORAGE_BACKEND`).

**Storage-бюджет:** 1000 устройств × 1 файл/день × 1.8 МБ × 90 дней = **~160 ГБ peak**. Оценка консервативная (opt-in понизит в 3–5×).

---

## Блок 3. Worker (Python, отдельный процесс)

**Новый файл:** `dashboard_build/diagnostic/bearing_worker.py` (~500 строк).

### 3.1 Выбор queue-runtime

Два варианта, выбрать один:

| Вариант | Плюсы | Минусы |
|---|---|---|
| **Celery + Redis** | Стандарт, retry, monitoring (Flower) | Redis = ещё один сервис; webadmin без sudo не может ставить systemd unit |
| **Polling-скрипт в systemd/cron** | Нулевая инфра, webadmin-level | Нет автоскейла, сам пишешь retry |

**Рекомендация:** polling-скрипт (MVP), Celery после 10k сессий/месяц.

Скелет polling:
```python
# systemd user-unit ИЛИ cron @reboot
while True:
    job = fetch_pending_job()  # FOR UPDATE SKIP LOCKED
    if job is None:
        time.sleep(30); continue
    try:
        result = process(job)
        mark_done(job.id, result)
    except Exception as e:
        mark_failed(job.id, str(e))
```

### 3.2 Pipeline (Randall-Antoni 2011)

Зависимости: `numpy`, `scipy`, `pywt` (уже есть), `librosa` (для load parquet audio), опционально `sancpy` (SANC на базе LMS).

```python
def process(job):
    # 1. Load raw
    audio, fs_audio = load_audio(job.storage_key)       # 16 kHz
    imu,   fs_imu   = load_imu(job.storage_key)          # 200 Hz × 3 axis
    rpm = job.metadata['rpm_median']

    # 2. SANC — Self-Adaptive Noise Cancellation
    # Удаляем детерминированные компоненты (gears, engine harmonics)
    # Оставляем только случайную ударную компоненту подшипника
    audio_random = sanc_filter(audio, delay_samples=int(fs_audio*0.01),
                               filter_order=256, mu=1e-4)

    # 3. Spectral Kurtosis (per-frequency kurtosis)
    sk = spectral_kurtosis(audio_random, nperseg=2048, noverlap=1536)

    # 4. Fast Kurtogram (Antoni 2007) — tree-structured filter bank
    best_band, best_sk = fast_kurtogram(audio_random, fs_audio,
                                         levels=8)  # (f_low, f_high)

    # 5. Band-pass filter по best_band
    filtered = bandpass(audio_random, fs_audio, *best_band, order=8)

    # 6. Wavelet Packet Transform — уточнение best_band
    # (опционально, если best_sk < 4.0)
    wpt_coeffs = pywt.wavedec(filtered, 'db10', level=5)

    # 7. Hilbert envelope
    analytic = scipy.signal.hilbert(filtered)
    envelope = np.abs(analytic)

    # 8. FFT envelope spectrum
    env_spec = np.abs(np.fft.rfft(envelope - envelope.mean()))
    freqs = np.fft.rfftfreq(len(envelope), 1/fs_audio)

    # 9. BPFO/BPFI detector
    bpfo_expected = job.metadata.get('bpfo_expected')  # из VehicleProfile
    if bpfo_expected is None:
        return {'status': 'no_bpfo_expected', 'best_band': best_band}

    peaks = detect_harmonics(env_spec, freqs, bpfo_expected,
                              n_harmonics=5, tolerance_hz=1.5)
    confidence = score_peaks(peaks, noise_floor=env_spec.median() * 3)

    return {
        'status': 'ok',
        'best_band_hz': list(best_band),
        'best_sk': float(best_sk),
        'bpfo_harmonics_found': len(peaks),
        'bpfo_confidence': float(confidence),
        'peak_freqs_hz': [float(p.freq) for p in peaks],
        'peak_amplitudes': [float(p.amp) for p in peaks],
    }
```

### 3.3 Бюджет вычислений
- 60 сек audio @ 16 кГц = 960k samples.
- SANC (LMS, order 256): ~0.8 сек на Ryzen 3700X.
- Fast Kurtogram (8 уровней): ~1.5 сек.
- Hilbert + FFT: ~0.3 сек.
- **Всего: ~3 сек на job.** Polling worker обрабатывает 1000 jobs/час спокойно.

---

## Блок 4. Интеграция с rule_engine

**Новый production-правило `wheel_bearing_bpfo_cloud_stage1`** (в `dashboard_build/diagnostic/rules/complex_rules.py`):
- Источник confidence: `bearing_raw_jobs.result.bpfo_confidence` (за последние 30 дней).
- Условие срабатывания: `bpfo_harmonics_found >= 3` AND `bpfo_confidence >= 0.6`.
- Приоритет: выше чем Stage 0 (`wheel_bearing_bpfo_harmonic`).
- Если Stage I даёт результат — Stage 0 suppress'ится (через `supersedes` поле в rule).

**Schema добавление в `threshold_rules.json`:**
```json
{
  "name": "wheel_bearing_bpfo_cloud_stage1",
  "tier": "T2",
  "supersedes": "wheel_bearing_bpfo_harmonic",
  "source": "cloud_pipeline",
  "min_confidence": 60,
  "cooldown_days": 14,
  "dtc_hint": null,
  "reference_appendix": "A.30"
}
```

---

## Блок 5. Валидация (bench-подшипник)

**Без этого блока production-деплой ЗАПРЕЩЁН.**

- Закупка: bench-установка с подшипником 6206 (или 6207/6208), возможность вносить контролируемый дефект (искусственная риска наружного кольца 0.5 мм × 2 мм через EDM).
- Стенд: электродвигатель 0–3000 об/мин, акселерометр + микрофон рядом с подшипником.
- Датасет:
  - **Baseline (исправный):** 30 × 60 сек записей на разных RPM (500/1000/1500/2000/2500/3000).
  - **С дефектом outer race:** 30 × 60 сек.
  - **С дефектом inner race:** 30 × 60 сек.
  - **С дефектом cage:** 15 × 60 сек.
- Верификация pipeline:
  - Baseline → `bpfo_confidence < 0.2` в 29/30 случаях (FPR ≤ 3.3%).
  - Outer race → `bpfo_harmonics_found ≥ 3` в 27/30 случаях (recall ≥ 0.9).
  - Inner race → `bpfi_harmonics_found ≥ 3` в 26/30 случаях.
  - Cage → `ftf_matches ≥ 2` в 12/15.

**Альтернатива без bench:** публичные датасеты CWRU Bearing Data Center (Case Western) или Paderborn Bearing Dataset. НО они в 48 кГц / вибрация-only, надо ресемплить под нашу реальность 16 кГц audio.

---

## Блок 6. UI — отображение результатов Stage I

**Новый компонент:** `llcar-dashboard/src/components/diagnostics/BearingStage1Panel.tsx` (~150 строк).

Показывает:
- Статус последнего job: `pending` / `processing` / `done` / `failed` (SSE или polling `/api/v2/bearing-raw/status/<job_id>/`).
- При `done`:
  - Envelope spectrum chart (react-chartjs-2 или Recharts) с отметками ожидаемой BPFO и найденных гармоник.
  - `best_band_hz` badge ("3.2–4.8 кГц, SK=6.1").
  - `bpfo_confidence` meter (0–100).
- Кнопка «Запустить новый анализ» — срабатывает только если прошлый job старше 24 ч (совпадает с device cooldown).

---

## Блок 7. Roadmap — сессии

| Сессия | Что делаем | Ключевой артефакт |
|---|---|---|
| **S5.1** | Блоки 1–2: device-opt-in, upload endpoint, миграция `bearing_raw_jobs`, локальный FS storage | `api_bearing_raw.py`, миграция, Android opt-in toggle |
| **S5.2** | Блок 3: polling worker, SANC/SK/Kurtogram/Env implementation на CWRU-датасете (заглушка вместо bench) | `bearing_worker.py`, unit-тесты на CWRU golden signals |
| **S5.3** | Блок 4: интеграция в rule_engine, shadow-правило `wheel_bearing_bpfo_cloud_stage1_shadow` 30 дней | `complex_rules.py`, shadow_metrics SQL |
| **S5.4** | Блок 5: bench-валидация (без bench — откладываем, с bench — 2–3 недели на stream) | Отчёт precision/recall vs bench |
| **S5.5** | Блок 6: UI BearingStage1Panel + promotion shadow → production | Deploy в prod, запись в CHANGES v2.2 |

---

## Критические риски

1. **Storage-бюджет:** 160 ГБ/квартал peak — нужен отдельный диск на сервере (текущий `/var/llcar-dashboard/` имеет ~40 ГБ свободных). Без расширения — упирается в 3–4 недели ingest.
2. **Bench недоступен:** без него нельзя верифицировать pipeline на реальном дефекте. CWRU/Paderborn — proxy, но не покрывает наш 16 кГц audio-канал. Деплой в production без валидации = высокий FPR, мусорные алерты пользователям.
3. **Полинг-воркер деградирует при >10k jobs/день:** Celery обязателен после первых 2 недель ingest.
4. **Opt-in < 5%:** если пользователи не разрешают raw-аплоад, датасет растёт медленно и валидация продакшн-модели откладывается.
5. **GDPR/персональные данные:** аудио с салона содержит речь. Нужен preprocessing на устройстве: высокочастотный band-pass ≥ 500 Гц (вырезает большую часть речи) ДО аплоада.

---

## Что НЕ входит в S5 (явно отложено)

- Моделирование gearbox defect spectrum (требует отдельного слоя SANC-SOA).
- Deep-learning bearing classifier (нужен датасет минимум 100k jobs).
- Edge-компьютинг на устройстве (Stage I требует ~3 ГБ RAM peak во время Kurtogram — невозможно на Android).
- Cross-device federated learning.

---

## Источники

- Randall R.B., Antoni J. (2011). "Rolling element bearing diagnostics — a tutorial." MSSP. DOI:10.1016/j.ymssp.2010.07.017
- Antoni J. (2006). "The spectral kurtosis: a useful tool for characterising non-stationary signals." MSSP. DOI:10.1016/j.ymssp.2004.09.001
- Antoni J. (2007). "Fast computation of the kurtogram for the detection of transient faults." MSSP. DOI:10.1016/j.ymssp.2005.12.002
- CWRU Bearing Data Center: https://engineering.case.edu/bearingdatacenter
- Paderborn Bearing Dataset: Lessmeier et al. 2016, PHM Europe.
