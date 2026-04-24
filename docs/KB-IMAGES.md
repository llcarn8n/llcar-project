# KB Images Pipeline

Как картинки мануалов доставляются пользователю.

## Архитектура

```
 Source (D:/manuals-export)           Репо                     Прод сервер
─────────────────────────────        ──────                   ─────────────────
 <brand>/<gen>/
 ├── manual.md                ──→    llcar-dashboard/         ──→  /var/www/.../
 │   содержит ![](images/         public/data/kb/                    spa-v3/data/
 │   <sha256>.webp)           (через deploy-v3.sh rsync             (без *.webp!)
 │                             с --exclude='*.webp')
 │
 └── images/                   НЕ идёт через deploy-v3       ──→  /var/kb-images/
     ├── ab/ab1234…webp        (нужен sync-kb-images.sh          <shard>/<hash>.webp
     ├── cd/cd5678…webp         отдельным проходом)
     └── …
```

## Компоненты

### 1. Markdown формат ссылки
```markdown
![описание](images/<sha256>.webp)
```
- Обязателен `.webp` (хэш 64 hex символа)
- Путь `images/...` относительный — это соглашение, не реальный относительный путь на
  сервере. Frontend трансформирует его в абсолютный.

### 2. Frontend — `llcar-dashboard/src/utils/manualImages.ts`
```ts
const HASH_WEBP = /^images\/([0-9a-f]{64})\.webp$/i
export function resolveManualImage(src: string) {
  const m = src.match(HASH_WEBP)
  return m ? `/api/kb-image/${m[1].toLowerCase()}.webp` : null
}
```
- Вход: `images/<hash>.webp`
- Выход: `/api/kb-image/<hash>.webp` (absolute URL)

### 3. Frontend — `llcar-dashboard/src/components/kb/ManualViewer.tsx`
Рендерит `<img src={resolved} loading="lazy" decoding="async" onError={…}>`.
`onError` скрывает `<img>` и показывает placeholder «Изображение недоступно».

### 4. Django — `dashboard_build/diagnostic/api_views.py#kb_image`
```python
_KB_IMAGE_ROOT = Path(os.environ.get("KB_IMAGES_ROOT", "/var/kb-images"))

def kb_image(request, hash):
    # Валидирует [0-9a-f]{64}
    # 2-level sharding: hash[:2]/<hash>.webp
    path = _KB_IMAGE_ROOT / hash[:2] / f"{hash}.webp"
    if not path.is_file():
        return placeholder_404()  # 1x1 прозрачный webp
    return HttpResponse(data, content_type="image/webp",
                         headers={"Cache-Control": "public, max-age=31536000, immutable",
                                  "ETag": f'"{hash}"'})
```

- `KB_IMAGES_ROOT` env var, по дефолту `/var/kb-images/`
- Immutable cache на 1 год (safe: hash = content-addressable, картинка не
  изменится под тем же именем)
- Если файла нет — 200 OK с placeholder (не ломает вёрстку)

## Деплой картинок на сервер

### scripts/sync-kb-images.sh

Картинки **не** синхронизируются через `deploy-v3.sh` (там `--exclude='*.webp'`).
Синк — отдельный шаг:

```bash
# 1. Построить manifest (какие hash'и реально нужны)
python scripts/s27_audit_image_refs.py
# → .omc/research/images-manifest.txt  (hash<TAB>src_path)
# → .omc/research/s27-image-refs-audit.md (отчёт)

# 2. Проверить объём (не копировать)
scripts/sync-kb-images.sh --check-only

# 3. Копировать в локальный staging (с раскладкой по sharding)
scripts/sync-kb-images.sh

# 4. Залить на сервер
scripts/sync-kb-images.sh --remote
```

Зачем selective sync:
- В `D:\manuals-export` 687 тыс webp-файлов (десятки ГБ)
- В мануалах упомянуто ~380 тыс уникальных hash'ей → копируем только их
- Инкрементальный rsync пропускает уже синхронизированные

### Проверка в проде

```bash
# Random sample hash из manifest
hash=$(head -1 .omc/research/images-manifest.txt | awk '{print $1}')
curl -I https://llcar.app/api/kb-image/$hash.webp
# Ожидаем: 200 OK, content-type: image/webp, Cache-Control: immutable
```

## Troubleshooting

| Симптом | Причина | Fix |
|---|---|---|
| Все картинки placeholder | `/var/kb-images/` пуста | Запустить `sync-kb-images.sh --remote` |
| Отдельные картинки битые | Hash из manual.md нет в D:\ (normalize или reingest обновил) | Прогнать `s27_audit_image_refs.py` — проверить broken_refs |
| 502/504 на `/api/kb-image/` | Django-воркер упал или nginx mis-route | Проверить `systemctl status gunicorn` + nginx config |
| Неправильные CORS/Content-Type | Nginx не проксирует правильно | Django выставляет правильные заголовки; nginx должен только `proxy_pass` |

## Инварианты

1. **Content-addressable**: hash = SHA-256 содержимого webp. Если картинка изменится — hash новый, URL новый, кэш работает корректно.
2. **Ни один webp не попадает в git**: `.gitignore` блокирует `*.webp` в public/data/kb/.
3. **Sharding 2-level**: первые 2 char hash = подпапка. 256 подпапок × avg ~1500 файлов = 384 тыс.
4. **KB_IMAGES_ROOT на сервере = `/var/kb-images/`** (по умолчанию). Override env var если другой путь.

---

## S29 Pipeline Learnings (2026-04-24)

Реальный опыт доставки 422 387 webp из `D:/manuals-export/` в `/var/www/html/django/kb-images/`. Baseline 24% → Final 100% (100/100 curl samples + 37/37 Playwright browser requests на Audi A4). Закоммичено в `785a369` + `ee3bd3f`.

### 1. Atomic compress write

Параллельный запуск compress + upload требует atomic rename, иначе scp захватит partial webp:

```python
# scripts/s28_compress_kb_images.py
tmp = dst.with_suffix(".webp.tmp")
img.save(tmp, format="webp", quality=quality, method=6)
tmp.replace(dst)  # POSIX-atomic
```

### 2. Upload методы по скорости (628 webp/shard)

| метод | время/shard | total (143 shards) | статус |
|---|--:|--:|---|
| `tar chunks × 5 shards` (v1 s28) | 60s но ломался | — | ❌ SSH abort |
| `scp -r <shard>` (v2) | **220s** | **9 часов** | ❌ per-file latency |
| `tar cf - <shard> \| ssh tar xf -` (v3) | **6-25s** | **~90 мин** | ✅ **30× быстрее** |

Рабочий вариант — `scripts/s29_upload_kb_images_v3.sh`.

### 3. SSH rate-limit на 185.55.57.145

Симптом: `kex_exchange_identification: Software caused connection abort` при быстрой серии SSH.
Причина: sshd `MaxStartups` режет >10 unauth connections.

Решения:
- **Single-SSH inventory** вместо 256 × `ssh ls`: один call собирает counts через server-side loop
- **`sleep 2-3s`** между scp/tar calls

### 4. Count-based skip > presence-based skip

Старый скрипт проверял только `[[ -d remote/shard ]]` — неполные шарды не догружались.

Правильно:
```bash
local_n=$(find "$STAGING/$shard" -maxdepth 1 -name "*.webp" | wc -l)
remote_n="${REMOTE_COUNTS[$shard]:-0}"
if (( remote_n >= local_n )); then skipped; fi
```

Безопасный re-run, всегда catch-up только delta.

### 5. Параллельное compress+upload workflow

```bash
# Swap manifest v2 → current
mv images-manifest.txt images-manifest-v1.txt
mv images-manifest-v2.txt images-manifest.txt

# Параллельно — atomic write позволяет
python scripts/s28_compress_kb_images.py --workers 8 &   # ~90 мин
bash scripts/s29_upload_kb_images_v3.sh &                # первый pass ~25 мин

# После первого pass upload делаем re-run пока compress работает
bash scripts/s29_upload_kb_images_v3.sh                  # ~90 мин, догоняет delta

# Финальный pass
bash scripts/s29_upload_kb_images_v3.sh                  # ~30 сек, всё skip

# Verify
N=100 bash scripts/s29_verify_kb_images.sh               # → 100/100 200 OK
```

### 6. Текущие пути прода (updated 2026-04-24)

| ключ | значение |
|---|---|
| Remote host | `webadmin@185.55.57.145` |
| KB_IMAGES_ROOT | **`/var/www/html/django/kb-images/`** (мигрировано с `/var/kb-images/` в `21b1170`) |
| API route | `/api/kb-image/<hash>` (зарегистрирован в `ea1d4b0`) |
| Test URL | `https://llcar.ru/api/kb-image/<hash>.webp` (200 OK, image/webp, Cache-Control: immutable) |

### 7. Скрипты S29

| файл | назначение |
|---|---|
| `scripts/s28_compress_kb_images.py` | resumable compress, atomic write |
| `scripts/s29_upload_kb_images_v3.sh` | **primary** — tar-over-ssh per-shard, resumable |
| `scripts/s29_verify_kb_images.sh` | sample N curl HEAD, % 200 OK |
| `scripts/s29_verify_vehicles_vs_kb.py` | H3.10 baseline check |
| `scripts/s29_full_manual_mapper.py` | fuzzy mapping vehicles ↔ kb ↔ D:/sources |
