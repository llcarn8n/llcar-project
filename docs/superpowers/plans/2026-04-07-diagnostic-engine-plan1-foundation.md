# Diagnostic Engine — Plan 1: Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Создать фундамент диагностического движка — таблицы в БД, Vehicle Profile, 4-level Knowledge Base loader, pipeline (normalizer → feature extractor → fact generator), persistence baselines.

**Architecture:** Django app `diagnostic` на существующем сервере (185.55.57.145). Рефакторинг anomaly_engine.py в модульную структуру. Всё новое — в `dashboard_build/diagnostic/`. Существующие endpoints (`/api/anomaly/`, `/api/data/`) не трогаем.

**Tech Stack:** Python 3.12, Django, PostgreSQL + TimescaleDB, psycopg2. Без новых зависимостей кроме того что уже на сервере.

**Spec:** `docs/engine-design/01-ARCHITECTURE-OVERVIEW.md` через `09-DIAGNOSIS-BUILDER-API.md`

**Existing code:**
- `dashboard_build/anomaly_engine.py` — 562 строки, текущий движок (будет рефакторен)
- `dashboard_build/schema_anomaly.sql` — SQL схема (будет расширена)
- `_archive/old-dashboard-build/dashboard_build/tests/` — 8 тестовых файлов

---

## File Structure

```
dashboard_build/
├── anomaly_engine.py              ← СУЩЕСТВУЕТ, будет импортироваться (не трогаем)
├── schema_anomaly.sql             ← СУЩЕСТВУЕТ, расширяем новыми таблицами
├── diagnostic/                    ← НОВЫЙ модуль
│   ├── __init__.py
│   ├── vehicle_profile.py         ← VehicleProfile dataclass + DB load/save
│   ├── knowledge_base.py          ← 4-level KB resolver (DTC + situations)
│   ├── normalizer.py              ← Валидация + режим + контекст двигателя
│   ├── feature_extractor.py       ← Производные фичи (из anomaly_engine)
│   ├── facts.py                   ← Typed Facts (FactType, Fact, FactGenerator)
│   ├── baseline_store.py          ← Welford baselines с DB persistence
│   └── pipeline.py                ← Оркестратор: raw data → facts
├── tests/
│   ├── __init__.py
│   ├── test_vehicle_profile.py
│   ├── test_knowledge_base.py
│   ├── test_normalizer.py
│   ├── test_feature_extractor.py
│   ├── test_facts.py
│   ├── test_baseline_store.py
│   └── test_pipeline.py
└── data/                          ← Симлинк или копия KB файлов для тестов
    ├── dtc-index-sample.json      ← 100 DTC кодов для тестов
    └── situations-sample.json     ← 20 ситуаций для тестов
```

---

## Task 1: Database Schema — создать таблицы на сервере

**Files:**
- Modify: `dashboard_build/schema_anomaly.sql`

- [ ] **Step 1: Расширить schema_anomaly.sql новыми таблицами**

Добавить в конец файла `dashboard_build/schema_anomaly.sql`:

```sql
-- ============================================
-- DIAGNOSTIC ENGINE v2 TABLES
-- ============================================

-- Vehicle Profile
CREATE TABLE IF NOT EXISTS vehicle_profiles (
    client_hash VARCHAR(64) PRIMARY KEY,
    vin VARCHAR(17),
    brand VARCHAR(40) NOT NULL,
    model VARCHAR(60) NOT NULL,
    generation VARCHAR(20),
    year INTEGER,
    engine_code VARCHAR(40),
    engine_type VARCHAR(10) DEFAULT 'ice',
    mileage_km INTEGER DEFAULT 0,
    platform VARCHAR(40),
    modifications JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DTC Events (с freeze frame контекстом)
CREATE TABLE IF NOT EXISTS dtc_events (
    id SERIAL PRIMARY KEY,
    time TIMESTAMPTZ NOT NULL,
    client_hash VARCHAR(64) NOT NULL,
    dtc_code VARCHAR(10) NOT NULL,
    ecu VARCHAR(10),
    freeze_frame JSONB,
    resolved_at TIMESTAMPTZ,
    occurrences INTEGER DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_dtc_events_client_code ON dtc_events(client_hash, dtc_code, time DESC);

-- Fact Log (для ML training, 180 дней retention)
CREATE TABLE IF NOT EXISTS fact_log (
    time TIMESTAMPTZ NOT NULL,
    client_hash VARCHAR(64) NOT NULL,
    fact_type VARCHAR(40) NOT NULL,
    severity VARCHAR(20),
    confidence REAL,
    tier VARCHAR(5),
    details JSONB
);
SELECT create_hypertable('fact_log', 'time', if_not_exists => TRUE);
SELECT add_retention_policy('fact_log', INTERVAL '180 days', if_not_exists => TRUE);
CREATE INDEX IF NOT EXISTS idx_fact_log_client ON fact_log(client_hash, time DESC);

-- User Feedback (ground truth для ML)
CREATE TABLE IF NOT EXISTS user_feedback (
    id SERIAL PRIMARY KEY,
    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    client_hash VARCHAR(64) NOT NULL,
    rule_name VARCHAR(40) NOT NULL,
    diagnosis_time TIMESTAMPTZ,
    action VARCHAR(20) NOT NULL,
    comment TEXT
);
CREATE INDEX IF NOT EXISTS idx_feedback_client ON user_feedback(client_hash);

-- DTC Patterns (мульти-DTC, статическая)
CREATE TABLE IF NOT EXISTS dtc_patterns (
    id SERIAL PRIMARY KEY,
    pattern_codes TEXT[] NOT NULL,
    diagnosis TEXT NOT NULL,
    confidence_boost INTEGER DEFAULT 20,
    situation_id TEXT,
    description TEXT
);

-- Обновить diagnostic_persistence (добавить escalation поля)
ALTER TABLE diagnostic_persistence
    ADD COLUMN IF NOT EXISTS first_triggered TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS max_confidence INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS escalation_level INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS user_dismissed_at TIMESTAMPTZ;
```

- [ ] **Step 2: Заполнить dtc_patterns начальными данными**

Добавить в конец того же файла:

```sql
-- Начальные мульти-DTC паттерны (из YouTube кейсов)
INSERT INTO dtc_patterns (pattern_codes, diagnosis, confidence_boost, description) VALUES
    ('{"P0171","P0174"}', 'air_leak', 25, 'Оба банка бедные = общий подсос воздуха, не инжектор'),
    ('{"P0172","P0175"}', 'rich_mixture', 25, 'Оба банка богатые = общая проблема (форсунки, давление, ДМРВ)'),
    ('{"P0300","P0301","P0302"}', 'ignition_coil', 20, 'Два соседних цилиндра = общая катушка зажигания, не свечи'),
    ('{"P0300","P0301","P0303"}', 'ignition_coil', 20, 'Два цилиндра = катушка или модуль зажигания'),
    ('{"P0420","P0430"}', 'bad_fuel', 20, 'Оба катализатора = некачественное топливо, не каталитик'),
    ('{"P0171","P0101"}', 'maf_failure', 25, 'Бедная смесь + ошибка ДМРВ = неисправный ДМРВ'),
    ('{"P0016","P0011"}', 'vvt_problem', 20, 'Рассогласование + управление VVT = фазорегулятор')
ON CONFLICT DO NOTHING;
```

- [ ] **Step 3: Деплой на сервер**

```bash
# Копировать SQL на сервер
scp dashboard_build/schema_anomaly.sql webadmin@185.55.57.145:/tmp/

# Выполнить
ssh webadmin@185.55.57.145 "psql -U postgres -d vehinfo -f /tmp/schema_anomaly.sql"
```

Ожидаемый результат: все таблицы созданы без ошибок.

- [ ] **Step 4: Проверить таблицы**

```bash
ssh webadmin@185.55.57.145 "psql -U postgres -d vehinfo -c \"\\dt\" | grep -E 'vehicle_profiles|dtc_events|fact_log|user_feedback|dtc_patterns|diagnostic_persistence|anomaly_baselines|anomaly_scores'"
```

Ожидаемый результат: 7+ таблиц в списке.

- [ ] **Step 5: Commit**

```bash
git add dashboard_build/schema_anomaly.sql
git commit -m "feat: extend DB schema — vehicle_profiles, dtc_events, fact_log, user_feedback, dtc_patterns, escalation"
```

---

## Task 2: Vehicle Profile — dataclass + DB persistence

**Files:**
- Create: `dashboard_build/diagnostic/__init__.py`
- Create: `dashboard_build/diagnostic/vehicle_profile.py`
- Create: `dashboard_build/tests/__init__.py`
- Create: `dashboard_build/tests/test_vehicle_profile.py`

- [ ] **Step 1: Создать структуру модуля**

```bash
mkdir -p dashboard_build/diagnostic dashboard_build/tests
touch dashboard_build/diagnostic/__init__.py dashboard_build/tests/__init__.py
```

- [ ] **Step 2: Написать тест для VehicleProfile**

Файл `dashboard_build/tests/test_vehicle_profile.py`:

```python
"""Tests for VehicleProfile — dataclass + LTFT corrections + KB path."""
import pytest
from diagnostic.vehicle_profile import VehicleProfile


class TestVehicleProfileCreation:
    def test_basic_creation(self):
        vp = VehicleProfile(
            client_hash='abc123',
            brand='chery',
            model='tiggo_8_pro',
            year=2021,
        )
        assert vp.brand == 'chery'
        assert vp.engine_type == 'ice'
        assert vp.modifications == {}

    def test_full_creation(self):
        vp = VehicleProfile(
            client_hash='abc123',
            brand='bmw',
            model='x5',
            generation='e53',
            year=2003,
            engine_code='M54',
            engine_type='ice',
            mileage_km=185000,
            platform='BMW_E53',
            modifications={'lpg': True, 'euro2_removed_cat': True},
        )
        assert vp.generation == 'e53'
        assert vp.modifications['lpg'] is True


class TestLtftCorrections:
    def test_no_modifications(self):
        vp = VehicleProfile(client_hash='x', brand='ford', model='focus', year=2020)
        assert vp.ltft_base_offset == 0.0
        assert vp.ltft_tolerance_mult == 1.0

    def test_euro2_offset(self):
        vp = VehicleProfile(
            client_hash='x', brand='opel', model='astra', year=2010,
            modifications={'euro2_removed_cat': True},
        )
        assert vp.ltft_base_offset == -7.5

    def test_lpg_tolerance(self):
        vp = VehicleProfile(
            client_hash='x', brand='opel', model='astra', year=2010,
            modifications={'lpg': True},
        )
        assert vp.ltft_tolerance_mult == 1.5

    def test_gm_platform(self):
        vp = VehicleProfile(
            client_hash='x', brand='opel', model='astra', year=2010,
            platform='GM_E2XX',
        )
        assert vp.ltft_tolerance_mult == 1.3

    def test_japanese_brand(self):
        vp = VehicleProfile(
            client_hash='x', brand='toyota', model='camry', year=2020,
        )
        assert vp.ltft_tolerance_mult == 0.7

    def test_lpg_overrides_japanese(self):
        """ГБО расширяет допуск даже для японских марок."""
        vp = VehicleProfile(
            client_hash='x', brand='toyota', model='camry', year=2020,
            modifications={'lpg': True},
        )
        assert vp.ltft_tolerance_mult == 1.5

    def test_euro2_plus_lpg(self):
        vp = VehicleProfile(
            client_hash='x', brand='opel', model='astra', year=2010,
            modifications={'euro2_removed_cat': True, 'lpg': True},
        )
        assert vp.ltft_base_offset == -7.5
        assert vp.ltft_tolerance_mult == 1.5


class TestKbResolutionPath:
    def test_without_generation(self):
        vp = VehicleProfile(
            client_hash='x', brand='chery', model='tiggo_8_pro', year=2021,
        )
        path = vp.kb_resolution_path
        assert path == [
            'brand/chery/model/tiggo_8_pro',
            'brand/chery',
            'universal',
        ]

    def test_with_generation(self):
        vp = VehicleProfile(
            client_hash='x', brand='bmw', model='x5', generation='e53', year=2003,
        )
        path = vp.kb_resolution_path
        assert path == [
            'brand/bmw/model/x5/generation/e53',
            'brand/bmw/model/x5',
            'brand/bmw',
            'universal',
        ]
```

- [ ] **Step 3: Запустить тест — убедиться что падает**

```bash
cd dashboard_build && python -m pytest tests/test_vehicle_profile.py -v
```

Ожидаемый результат: FAIL — `ModuleNotFoundError: No module named 'diagnostic'`

- [ ] **Step 4: Реализовать VehicleProfile**

Файл `dashboard_build/diagnostic/vehicle_profile.py`:

```python
"""Vehicle Profile — идентификация автомобиля и калибровочные коэффициенты.

Определяет:
- Какую Knowledge Base загружать (4-level: brand → model → generation)
- Какие коррекции применять к LTFT/STFT
- К какой группе относить для ML
"""
from dataclasses import dataclass, field
from typing import Optional, Dict, List

JAPANESE_BRANDS = frozenset({
    'toyota', 'honda', 'mazda', 'subaru', 'nissan', 'mitsubishi',
    'suzuki', 'lexus', 'infiniti', 'acura',
})

GM_PLATFORM_PREFIXES = ('GM_',)


@dataclass
class VehicleProfile:
    client_hash: str
    brand: str
    model: str
    year: int
    vin: Optional[str] = None
    generation: Optional[str] = None
    engine_code: Optional[str] = None
    engine_type: str = 'ice'
    mileage_km: int = 0
    platform: Optional[str] = None
    modifications: Dict = field(default_factory=dict)

    @property
    def ltft_base_offset(self) -> float:
        """Сдвиг нуля LTFT из-за модификаций (Евро-2 / удалён кат)."""
        if self.modifications.get('euro2_removed_cat'):
            return -7.5
        return 0.0

    @property
    def ltft_tolerance_mult(self) -> float:
        """Множитель допуска LTFT по марке/модификациям/платформе."""
        # ГБО перекрывает всё — самый широкий допуск
        if self.modifications.get('lpg'):
            return 1.5
        # GM-платформы — шире стандарта
        if self.platform and any(
            self.platform.startswith(p) for p in GM_PLATFORM_PREFIXES
        ):
            return 1.3
        # Японские марки — уже стандарта
        if self.brand in JAPANESE_BRANDS:
            return 0.7
        return 1.0

    @property
    def kb_resolution_path(self) -> List[str]:
        """Порядок поиска в KB: most specific first."""
        path = []
        if self.generation:
            path.append(f'brand/{self.brand}/model/{self.model}/generation/{self.generation}')
        path.append(f'brand/{self.brand}/model/{self.model}')
        path.append(f'brand/{self.brand}')
        path.append('universal')
        return path

    def to_db_row(self) -> dict:
        """Сериализация для INSERT/UPDATE в vehicle_profiles."""
        import json
        return {
            'client_hash': self.client_hash,
            'vin': self.vin,
            'brand': self.brand,
            'model': self.model,
            'generation': self.generation,
            'year': self.year,
            'engine_code': self.engine_code,
            'engine_type': self.engine_type,
            'mileage_km': self.mileage_km,
            'platform': self.platform,
            'modifications': json.dumps(self.modifications),
        }

    @classmethod
    def from_db_row(cls, row: dict) -> 'VehicleProfile':
        """Десериализация из SELECT vehicle_profiles."""
        import json
        mods = row.get('modifications', '{}')
        if isinstance(mods, str):
            mods = json.loads(mods)
        return cls(
            client_hash=row['client_hash'],
            vin=row.get('vin'),
            brand=row['brand'],
            model=row['model'],
            generation=row.get('generation'),
            year=row.get('year', 0),
            engine_code=row.get('engine_code'),
            engine_type=row.get('engine_type', 'ice'),
            mileage_km=row.get('mileage_km', 0),
            platform=row.get('platform'),
            modifications=mods,
        )
```

- [ ] **Step 5: Запустить тесты — убедиться что проходят**

```bash
cd dashboard_build && python -m pytest tests/test_vehicle_profile.py -v
```

Ожидаемый результат: все 10 тестов PASS.

- [ ] **Step 6: Commit**

```bash
git add dashboard_build/diagnostic/ dashboard_build/tests/
git commit -m "feat: VehicleProfile — dataclass with LTFT corrections and KB resolution path"
```

---

## Task 3: Knowledge Base Loader (4-level resolver)

**Files:**
- Create: `dashboard_build/diagnostic/knowledge_base.py`
- Create: `dashboard_build/tests/test_knowledge_base.py`
- Create: `dashboard_build/data/dtc-index-sample.json`
- Create: `dashboard_build/data/situations-sample.json`

- [ ] **Step 1: Создать тестовые данные (sample)**

Файл `dashboard_build/data/dtc-index-sample.json`:

```json
{
  "meta": {"total": 5},
  "codes": {
    "P0171": {"severity": "info", "title_ru": "Бедная смесь (банк 1)", "system_id": "engine", "can_drive": "yes_caution"},
    "P0174": {"severity": "info", "title_ru": "Бедная смесь (банк 2)", "system_id": "engine", "can_drive": "yes_caution"},
    "P0300": {"severity": "urgent", "title_ru": "Пропуски зажигания", "system_id": "ignition", "can_drive": "yes_caution"},
    "P0420": {"severity": "warning", "title_ru": "Низкая эффективность катализатора", "system_id": "exhaust", "can_drive": "yes_safe"},
    "B0001": {"severity": "critical", "title_ru": "Неисправность датчика удара", "system_id": "sensors", "can_drive": "no_stop"}
  }
}
```

Файл `dashboard_build/data/situations-sample.json`:

```json
[
  {
    "id": "lean_mixture",
    "title": "Обеднённая смесь",
    "quickAnswer": "Проверьте подсос воздуха. Начните с крышки маслозаливной горловины (бесплатно).",
    "urgency": 4,
    "category": "engine",
    "layers": ["engine", "fuel"],
    "dtc_codes": ["P0171", "P0174"],
    "canDrive": "осторожно",
    "priceRange": "3000-25000 руб",
    "commonMistakes": ["Замена лямбды без проверки подсоса"]
  },
  {
    "id": "engine_overheat",
    "title": "Перегрев двигателя",
    "quickAnswer": "Остановитесь. Проверьте уровень антифриза. Не открывайте крышку на горячую.",
    "urgency": 5,
    "category": "engine",
    "layers": ["engine", "cooling"],
    "dtc_codes": [],
    "canDrive": "нет",
    "priceRange": "2000-80000 руб",
    "commonMistakes": ["Продолжение движения при перегреве"]
  },
  {
    "id": "suspension_noise",
    "title": "Подвеска стучит",
    "quickAnswer": "Стойки стабилизатора — первое что проверять. Расходник, 2-4K руб.",
    "urgency": 3,
    "category": "chassis",
    "layers": ["chassis", "suspension"],
    "dtc_codes": [],
    "canDrive": "да",
    "priceRange": "2000-20000 руб",
    "commonMistakes": ["Замена амортизаторов без проверки стоек стабилизатора"]
  }
]
```

- [ ] **Step 2: Написать тест для KB resolver**

Файл `dashboard_build/tests/test_knowledge_base.py`:

```python
"""Tests for KnowledgeBase — 4-level DTC/situation resolver."""
import pytest
import os
import json
from diagnostic.knowledge_base import KnowledgeBase

FIXTURES = os.path.join(os.path.dirname(__file__), '..', 'data')


@pytest.fixture
def kb():
    return KnowledgeBase(
        dtc_index_path=os.path.join(FIXTURES, 'dtc-index-sample.json'),
        situations_path=os.path.join(FIXTURES, 'situations-sample.json'),
    )


class TestDtcLookup:
    def test_known_code(self, kb):
        result = kb.resolve_dtc('P0171')
        assert result['title_ru'] == 'Бедная смесь (банк 1)'
        assert result['severity'] == 'info'
        assert result['can_drive'] == 'yes_caution'

    def test_unknown_code(self, kb):
        result = kb.resolve_dtc('P9999')
        assert result is None

    def test_critical_code(self, kb):
        result = kb.resolve_dtc('B0001')
        assert result['severity'] == 'critical'
        assert result['can_drive'] == 'no_stop'


class TestSituationLookup:
    def test_by_dtc_code(self, kb):
        situations = kb.find_situations_by_dtc('P0171')
        assert len(situations) >= 1
        assert situations[0]['id'] == 'lean_mixture'

    def test_by_dtc_no_match(self, kb):
        situations = kb.find_situations_by_dtc('B0001')
        assert len(situations) == 0

    def test_by_category(self, kb):
        situations = kb.find_situations_by_category('engine')
        assert len(situations) >= 2

    def test_by_system_id(self, kb):
        """DTC system_id → situation category маппинг."""
        situations = kb.find_situations_by_system_id('engine')
        assert len(situations) >= 1


class TestMultiDtcPatterns:
    def test_air_leak_pattern(self, kb):
        pattern = kb.match_dtc_pattern(['P0171', 'P0174'])
        assert pattern is not None
        assert pattern['diagnosis'] == 'air_leak'
        assert pattern['confidence_boost'] == 25

    def test_single_code_no_pattern(self, kb):
        pattern = kb.match_dtc_pattern(['P0171'])
        assert pattern is None

    def test_unrelated_codes_no_pattern(self, kb):
        pattern = kb.match_dtc_pattern(['P0300', 'B0001'])
        assert pattern is None


class TestSystemCategoryMapping:
    def test_engine_maps(self, kb):
        cats = kb.system_id_to_categories('engine')
        assert 'engine' in cats

    def test_ignition_maps_to_engine(self, kb):
        cats = kb.system_id_to_categories('ignition')
        assert 'engine' in cats

    def test_exhaust_maps(self, kb):
        cats = kb.system_id_to_categories('exhaust')
        assert 'engine' in cats
```

- [ ] **Step 3: Запустить — убедиться что падает**

```bash
cd dashboard_build && python -m pytest tests/test_knowledge_base.py -v
```

Ожидаемый результат: FAIL — `ModuleNotFoundError`

- [ ] **Step 4: Реализовать KnowledgeBase**

Файл `dashboard_build/diagnostic/knowledge_base.py`:

```python
"""Knowledge Base — 4-level resolver для DTC кодов и диагностических ситуаций.

Уровни: universal → brand → model → generation (most specific wins).
Сейчас загружает universal. Brand/model/generation добавляются через add_brand_layer().
"""
import json
from typing import Optional, Dict, List, Set


# DTC system_id → situation category маппинг
SYSTEM_TO_CATEGORY = {
    'engine': ['engine'],
    'fuel': ['engine'],
    'ignition': ['engine'],
    'cooling': ['engine'],
    'exhaust': ['engine'],
    'emission': ['engine'],
    'transmission': ['drivetrain'],
    'drivetrain': ['drivetrain'],
    'brakes': ['brakes'],
    'abs': ['brakes'],
    'electrical': ['electrical'],
    'battery': ['electrical'],
    'charging': ['electrical'],
    'sensors': ['electrical'],
    'lighting': ['electrical'],
    'body': ['body'],
    'interior': ['body'],
    'exterior': ['body'],
    'climate': ['body'],
    'airbag': ['safety'],
    'srs': ['safety'],
    'suspension': ['chassis'],
    'steering': ['chassis'],
    'chassis': ['chassis'],
    'network': ['electrical'],
    'communication': ['electrical'],
}

# Мульти-DTC паттерны (загружаются из БД, но для offline — хардкод)
DEFAULT_DTC_PATTERNS = [
    {'pattern_codes': {'P0171', 'P0174'}, 'diagnosis': 'air_leak', 'confidence_boost': 25,
     'description': 'Оба банка бедные = общий подсос воздуха'},
    {'pattern_codes': {'P0172', 'P0175'}, 'diagnosis': 'rich_mixture', 'confidence_boost': 25,
     'description': 'Оба банка богатые = форсунки/давление/ДМРВ'},
    {'pattern_codes': {'P0300', 'P0301', 'P0302'}, 'diagnosis': 'ignition_coil', 'confidence_boost': 20,
     'description': 'Два соседних цилиндра = катушка зажигания'},
    {'pattern_codes': {'P0420', 'P0430'}, 'diagnosis': 'bad_fuel', 'confidence_boost': 20,
     'description': 'Оба катализатора = некачественное топливо'},
    {'pattern_codes': {'P0171', 'P0101'}, 'diagnosis': 'maf_failure', 'confidence_boost': 25,
     'description': 'Бедная смесь + ошибка ДМРВ = неисправный ДМРВ'},
    {'pattern_codes': {'P0016', 'P0011'}, 'diagnosis': 'vvt_problem', 'confidence_boost': 20,
     'description': 'Рассогласование + VVT = фазорегулятор'},
]


class KnowledgeBase:
    def __init__(self, dtc_index_path: str = None, situations_path: str = None):
        self._dtc_codes: Dict[str, dict] = {}
        self._situations: List[dict] = []
        self._dtc_patterns = DEFAULT_DTC_PATTERNS
        self._brand_layers: Dict[str, dict] = {}

        if dtc_index_path:
            self._load_dtc_index(dtc_index_path)
        if situations_path:
            self._load_situations(situations_path)

    def _load_dtc_index(self, path: str):
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        self._dtc_codes = data.get('codes', {})

    def _load_situations(self, path: str):
        with open(path, 'r', encoding='utf-8') as f:
            self._situations = json.load(f)

    def add_brand_layer(self, brand: str, dtc_path: str = None, situations_path: str = None):
        """Добавить brand-level overlay. Most specific wins при resolve."""
        layer = {'dtc': {}, 'situations': []}
        if dtc_path:
            with open(dtc_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            layer['dtc'] = data.get('codes', {})
        if situations_path:
            with open(situations_path, 'r', encoding='utf-8') as f:
                layer['situations'] = json.load(f)
        self._brand_layers[brand] = layer

    # ── DTC Resolution ──

    def resolve_dtc(self, code: str, brand: str = None) -> Optional[dict]:
        """Resolve DTC code. Brand-level overrides universal."""
        if brand and brand in self._brand_layers:
            brand_dtc = self._brand_layers[brand]['dtc']
            if code in brand_dtc:
                return brand_dtc[code]
        return self._dtc_codes.get(code)

    # ── Situation Resolution ──

    def find_situations_by_dtc(self, code: str, brand: str = None) -> List[dict]:
        """Найти ситуации по DTC коду."""
        results = []
        situations = self._get_situations(brand)
        for sit in situations:
            if code in sit.get('dtc_codes', []):
                results.append(sit)
        return results

    def find_situations_by_category(self, category: str, brand: str = None) -> List[dict]:
        """Найти ситуации по категории."""
        situations = self._get_situations(brand)
        return [s for s in situations if s.get('category') == category]

    def find_situations_by_system_id(self, system_id: str, brand: str = None) -> List[dict]:
        """Найти ситуации через system_id → category маппинг."""
        categories = self.system_id_to_categories(system_id)
        situations = self._get_situations(brand)
        return [s for s in situations
                if s.get('category') in categories
                or any(l in categories for l in s.get('layers', []))]

    def _get_situations(self, brand: str = None) -> List[dict]:
        """Brand situations если есть, иначе universal."""
        if brand and brand in self._brand_layers:
            brand_sits = self._brand_layers[brand]['situations']
            if brand_sits:
                return brand_sits
        return self._situations

    # ── Multi-DTC Patterns ──

    def match_dtc_pattern(self, codes: List[str]) -> Optional[dict]:
        """Проверить комбинацию DTC кодов на известные паттерны."""
        code_set = set(codes)
        for pattern in self._dtc_patterns:
            if pattern['pattern_codes'].issubset(code_set):
                return pattern
        return None

    # ── Taxonomy ──

    @staticmethod
    def system_id_to_categories(system_id: str) -> List[str]:
        """system_id из DTC → категории ситуаций."""
        return SYSTEM_TO_CATEGORY.get(system_id, [system_id])
```

- [ ] **Step 5: Запустить тесты**

```bash
cd dashboard_build && python -m pytest tests/test_knowledge_base.py -v
```

Ожидаемый результат: все 11 тестов PASS.

- [ ] **Step 6: Commit**

```bash
mkdir -p dashboard_build/data
git add dashboard_build/diagnostic/knowledge_base.py dashboard_build/tests/test_knowledge_base.py dashboard_build/data/
git commit -m "feat: KnowledgeBase — 4-level resolver with DTC, situations, multi-DTC patterns"
```

---

## Task 4: Normalizer — валидация + режим + контекст

**Files:**
- Create: `dashboard_build/diagnostic/normalizer.py`
- Create: `dashboard_build/tests/test_normalizer.py`

- [ ] **Step 1: Написать тест**

Файл `dashboard_build/tests/test_normalizer.py`:

```python
"""Tests for Normalizer — validation, regime classification, engine context."""
import pytest
from datetime import datetime
from diagnostic.normalizer import normalize_packet, NormalizedPacket, EngineContext, Regime


class TestValidation:
    def test_valid_packet(self):
        result = normalize_packet({
            'timestamp': '2026-04-07T14:00:00Z',
            'client_hash': 'abc',
            'rpm': 1200, 'speed': 45, 'coolant': 87, 'voltage': 14.2,
            'ltft_bank1': 8.0, 'stft_bank1': 2.0,
        })
        assert result is not None
        assert result.rpm == 1200
        assert result.speed == 45

    def test_impossible_rpm_rejected(self):
        result = normalize_packet({
            'timestamp': '2026-04-07T14:00:00Z',
            'client_hash': 'abc',
            'rpm': 50000,
        })
        assert result.rpm is None  # отброшено

    def test_impossible_coolant_rejected(self):
        result = normalize_packet({
            'timestamp': '2026-04-07T14:00:00Z',
            'client_hash': 'abc',
            'coolant': -200,
        })
        assert result.coolant_temp is None


class TestRegimeClassification:
    def test_idle(self):
        result = normalize_packet({
            'timestamp': '2026-04-07T14:00:00Z', 'client_hash': 'abc',
            'rpm': 750, 'speed': 0,
        })
        assert result.regime == Regime.IDLE

    def test_city(self):
        result = normalize_packet({
            'timestamp': '2026-04-07T14:00:00Z', 'client_hash': 'abc',
            'rpm': 2000, 'speed': 45,
        })
        assert result.regime == Regime.CITY

    def test_highway(self):
        result = normalize_packet({
            'timestamp': '2026-04-07T14:00:00Z', 'client_hash': 'abc',
            'rpm': 2500, 'speed': 95,
        })
        assert result.regime == Regime.HIGHWAY

    def test_braking(self):
        result = normalize_packet({
            'timestamp': '2026-04-07T14:00:00Z', 'client_hash': 'abc',
            'rpm': 1500, 'speed': 40, 'ax_avg': -3.0,
        })
        assert result.regime == Regime.BRAKING


class TestEngineContext:
    def test_cold_engine(self):
        result = normalize_packet({
            'timestamp': '2026-04-07T14:00:00Z', 'client_hash': 'abc',
            'coolant': 45,
        })
        assert result.engine_context.warm is False

    def test_warm_engine(self):
        result = normalize_packet({
            'timestamp': '2026-04-07T14:00:00Z', 'client_hash': 'abc',
            'coolant': 90,
        })
        assert result.engine_context.warm is True


class TestTierDetection:
    def test_t1_obd_only(self):
        result = normalize_packet({
            'timestamp': '2026-04-07T14:00:00Z', 'client_hash': 'abc',
            'rpm': 1200, 'speed': 40,
        })
        assert result.tier == 'T1'

    def test_t2_with_accel(self):
        result = normalize_packet({
            'timestamp': '2026-04-07T14:00:00Z', 'client_hash': 'abc',
            'rpm': 1200, 'ax_avg': 0.1, 'ay_avg': 0.0, 'az_avg': 9.8,
            'ax_std': 0.3, 'ay_std': 0.2, 'az_std': 0.4,
        })
        assert result.tier == 'T2'

    def test_t3_with_audio(self):
        result = normalize_packet({
            'timestamp': '2026-04-07T14:00:00Z', 'client_hash': 'abc',
            'rpm': 1200,
            'ax_avg': 0.1, 'az_std': 0.4,
            'dominant_freq': 120.0, 'dominant_amp': 30.0,
        })
        assert result.tier == 'T3'
```

- [ ] **Step 2: Запустить — падает**

```bash
cd dashboard_build && python -m pytest tests/test_normalizer.py -v
```

- [ ] **Step 3: Реализовать Normalizer**

Файл `dashboard_build/diagnostic/normalizer.py`:

```python
"""Normalizer — валидация сырых данных, классификация режима, контекст двигателя.

Шаг 1 pipeline: Raw Data → NormalizedPacket.
"""
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional, List


class Regime(Enum):
    IDLE = 'idle'
    CITY = 'city'
    HIGHWAY = 'highway'
    ACCELERATION = 'acceleration'
    BRAKING = 'braking'
    CORNERING = 'cornering'
    UNKNOWN = 'unknown'


@dataclass
class EngineContext:
    warm: bool = False
    minutes_running: float = 0.0
    ambient_temp: Optional[float] = None
    cold_start: bool = False


@dataclass
class NormalizedPacket:
    timestamp: datetime
    client_hash: str
    # OBD (T1)
    rpm: Optional[float] = None
    speed: Optional[float] = None
    coolant_temp: Optional[float] = None
    voltage: Optional[float] = None
    ltft_bank1: Optional[float] = None
    stft_bank1: Optional[float] = None
    ltft_bank2: Optional[float] = None
    stft_bank2: Optional[float] = None
    maf: Optional[float] = None
    map_pressure: Optional[float] = None
    o2_voltage: Optional[float] = None
    dtc_codes: List[str] = field(default_factory=list)
    # Accelerometer (T2)
    ax_avg: Optional[float] = None
    ay_avg: Optional[float] = None
    az_avg: Optional[float] = None
    ax_std: Optional[float] = None
    ay_std: Optional[float] = None
    az_std: Optional[float] = None
    ax_min: Optional[float] = None
    ax_max: Optional[float] = None
    ay_min: Optional[float] = None
    ay_max: Optional[float] = None
    az_min: Optional[float] = None
    az_max: Optional[float] = None
    # Audio (T3)
    dominant_freq: Optional[float] = None
    dominant_amp: Optional[float] = None
    audio_quality: Optional[float] = None
    # Computed
    regime: Regime = Regime.UNKNOWN
    engine_context: EngineContext = field(default_factory=EngineContext)
    tier: str = 'T1'


# ── Validation bounds ──

VALID_RANGES = {
    'rpm': (0, 10000),
    'speed': (0, 300),
    'coolant': (-50, 250),
    'voltage': (0, 25),
    'ltft_bank1': (-100, 100),
    'stft_bank1': (-100, 100),
    'ltft_bank2': (-100, 100),
    'stft_bank2': (-100, 100),
    'maf': (0, 1000),
    'map_pressure': (0, 500),
    'o2_voltage': (0, 2.0),
    'dominant_freq': (0, 20000),
    'dominant_amp': (0, 10000),
    'audio_quality': (0, 100),
}


def _validate(value, field_name):
    """Return value if in valid range, else None."""
    if value is None:
        return None
    bounds = VALID_RANGES.get(field_name)
    if bounds and not (bounds[0] <= value <= bounds[1]):
        return None
    return value


def _classify_regime(speed, rpm, ax_avg, ay_avg):
    """Classify driving regime from speed, RPM, acceleration."""
    speed = speed or 0
    rpm = rpm or 0
    if speed < 3:
        return Regime.IDLE
    if ax_avg is not None and ax_avg < -2.0 and speed > 5:
        return Regime.BRAKING
    if ax_avg is not None and ax_avg > 2.0:
        return Regime.ACCELERATION
    if ay_avg is not None and abs(ay_avg) > 2.5:
        return Regime.CORNERING
    if speed > 70:
        return Regime.HIGHWAY
    return Regime.CITY


def _detect_tier(has_accel: bool, has_audio: bool) -> str:
    if has_audio and has_accel:
        return 'T3'
    if has_accel:
        return 'T2'
    return 'T1'


def normalize_packet(raw: dict) -> NormalizedPacket:
    """Normalize raw data dict into NormalizedPacket."""
    ts = raw.get('timestamp', '')
    if isinstance(ts, str):
        try:
            ts = datetime.fromisoformat(ts.replace('Z', '+00:00'))
        except ValueError:
            ts = datetime.now()

    rpm = _validate(raw.get('rpm'), 'rpm')
    speed = _validate(raw.get('speed'), 'speed')
    coolant = _validate(raw.get('coolant'), 'coolant')
    voltage = _validate(raw.get('voltage'), 'voltage')
    ax_avg = raw.get('ax_avg')
    ay_avg = raw.get('ay_avg')
    az_std = raw.get('az_std')

    has_accel = any(raw.get(k) is not None for k in ('ax_avg', 'ay_avg', 'az_avg', 'ax_std', 'az_std'))
    has_audio = any(raw.get(k) is not None for k in ('dominant_freq', 'dominant_amp'))

    regime = _classify_regime(speed, rpm, ax_avg, ay_avg)
    engine_ctx = EngineContext(
        warm=(coolant is not None and coolant > 80),
        cold_start=(coolant is not None and coolant < 60),
        ambient_temp=raw.get('ambient_temp'),
    )

    return NormalizedPacket(
        timestamp=ts,
        client_hash=raw.get('client_hash', ''),
        rpm=rpm,
        speed=speed,
        coolant_temp=coolant,
        voltage=voltage,
        ltft_bank1=_validate(raw.get('ltft_bank1'), 'ltft_bank1'),
        stft_bank1=_validate(raw.get('stft_bank1'), 'stft_bank1'),
        ltft_bank2=_validate(raw.get('ltft_bank2'), 'ltft_bank2'),
        stft_bank2=_validate(raw.get('stft_bank2'), 'stft_bank2'),
        maf=_validate(raw.get('maf'), 'maf'),
        map_pressure=_validate(raw.get('map_pressure'), 'map_pressure'),
        o2_voltage=_validate(raw.get('o2_voltage'), 'o2_voltage'),
        dtc_codes=raw.get('dtc_codes', []),
        ax_avg=ax_avg,
        ay_avg=ay_avg,
        az_avg=raw.get('az_avg'),
        ax_std=raw.get('ax_std'),
        ay_std=raw.get('ay_std'),
        az_std=az_std,
        ax_min=raw.get('ax_min'),
        ax_max=raw.get('ax_max'),
        ay_min=raw.get('ay_min'),
        ay_max=raw.get('ay_max'),
        az_min=raw.get('az_min'),
        az_max=raw.get('az_max'),
        dominant_freq=_validate(raw.get('dominant_freq'), 'dominant_freq'),
        dominant_amp=_validate(raw.get('dominant_amp'), 'dominant_amp'),
        audio_quality=_validate(raw.get('audio_quality'), 'audio_quality'),
        regime=regime,
        engine_context=engine_ctx,
        tier=_detect_tier(has_accel, has_audio),
    )
```

- [ ] **Step 4: Запустить тесты**

```bash
cd dashboard_build && python -m pytest tests/test_normalizer.py -v
```

Ожидаемый результат: все 10 тестов PASS.

- [ ] **Step 5: Commit**

```bash
git add dashboard_build/diagnostic/normalizer.py dashboard_build/tests/test_normalizer.py
git commit -m "feat: Normalizer — validation, regime classification, engine context, tier detection"
```

---

## Task 5: Feature Extractor — производные фичи

**Files:**
- Create: `dashboard_build/diagnostic/feature_extractor.py`
- Create: `dashboard_build/tests/test_feature_extractor.py`

- [ ] **Step 1: Написать тест**

Файл `dashboard_build/tests/test_feature_extractor.py`:

```python
"""Tests for Feature Extractor — derived diagnostic features."""
import pytest
import math
from diagnostic.feature_extractor import extract_features
from diagnostic.normalizer import NormalizedPacket, Regime, EngineContext
from datetime import datetime


def _make_packet(**kwargs):
    defaults = dict(
        timestamp=datetime.now(), client_hash='test', regime=Regime.CITY,
        engine_context=EngineContext(), tier='T2',
    )
    defaults.update(kwargs)
    return NormalizedPacket(**defaults)


class TestTotalVibration:
    def test_computes_rms(self):
        pkt = _make_packet(ax_std=3.0, ay_std=4.0, az_std=0.0)
        features = extract_features(pkt)
        assert features['total_vibration'] == pytest.approx(5.0, abs=0.01)

    def test_none_if_no_accel(self):
        pkt = _make_packet()
        features = extract_features(pkt)
        assert features['total_vibration'] is None


class TestCrestFactor:
    def test_computes(self):
        pkt = _make_packet(
            az_avg=9.8, az_std=0.5, az_min=8.5, az_max=11.0,
        )
        features = extract_features(pkt)
        assert features['crest_factor_z'] is not None
        assert features['crest_factor_z'] > 1.0  # peak > rms always


class TestFuelTrimFeatures:
    def test_ltft_abs(self):
        pkt = _make_packet(ltft_bank1=-12.0)
        features = extract_features(pkt)
        assert features['ltft_abs'] == 12.0

    def test_fuel_trim_delta(self):
        pkt = _make_packet(ltft_bank1=10.0, stft_bank1=-3.0)
        features = extract_features(pkt)
        assert features['fuel_trim_delta'] == 13.0

    def test_sign_match_same(self):
        pkt = _make_packet(ltft_bank1=10.0, stft_bank1=5.0)
        features = extract_features(pkt)
        assert features['fuel_trim_sign_match'] is True

    def test_sign_match_different(self):
        pkt = _make_packet(ltft_bank1=10.0, stft_bank1=-5.0)
        features = extract_features(pkt)
        assert features['fuel_trim_sign_match'] is False
```

- [ ] **Step 2: Запустить — падает**

```bash
cd dashboard_build && python -m pytest tests/test_feature_extractor.py -v
```

- [ ] **Step 3: Реализовать**

Файл `dashboard_build/diagnostic/feature_extractor.py`:

```python
"""Feature Extractor — производные диагностические метрики.

Шаг 2 pipeline: NormalizedPacket → features dict.
Расширяет существующий compute_derived_features() из anomaly_engine.py.
"""
import math
from typing import Dict, Optional
from .normalizer import NormalizedPacket

TIRE_DIAMETER = 0.63


def extract_features(packet: NormalizedPacket) -> Dict[str, Optional[float]]:
    """Extract all derived features from normalized packet."""
    f = {}

    # ── Vibration features (T2) ──
    stds = []
    for axis in ('x', 'y', 'z'):
        s = getattr(packet, f'a{axis}_std', None)
        if s is not None:
            stds.append(s)
    f['total_vibration'] = math.sqrt(sum(s * s for s in stds)) if stds else None

    for axis in ('x', 'y', 'z'):
        avg = getattr(packet, f'a{axis}_avg', None)
        std = getattr(packet, f'a{axis}_std', None)
        mn = getattr(packet, f'a{axis}_min', None)
        mx = getattr(packet, f'a{axis}_max', None)

        # Crest Factor = peak / RMS
        if all(v is not None for v in (avg, std, mn, mx)):
            peak = max(abs(mn), abs(mx))
            rms = math.sqrt(avg * avg + std * std)
            f[f'crest_factor_{axis}'] = round(peak / rms, 3) if rms > 1e-9 else None
        else:
            f[f'crest_factor_{axis}'] = None

        # Shape Ratio = std / range
        if std is not None and mn is not None and mx is not None:
            rng = mx - mn
            f[f'shape_ratio_{axis}'] = round(std / rng, 3) if rng > 1e-9 else None
        else:
            f[f'shape_ratio_{axis}'] = None

        # Range
        if mn is not None and mx is not None:
            f[f'a{axis}_range'] = round(mx - mn, 3)
        else:
            f[f'a{axis}_range'] = None

    # ── Fuel Trim features (T1) ──
    ltft = packet.ltft_bank1
    stft = packet.stft_bank1

    f['ltft_abs'] = abs(ltft) if ltft is not None else None
    f['fuel_trim_delta'] = abs(ltft - stft) if ltft is not None and stft is not None else None

    if ltft is not None and stft is not None:
        ltft_sign = 1 if ltft >= 0 else -1
        stft_sign = 1 if stft >= 0 else -1
        f['fuel_trim_sign_match'] = (ltft_sign == stft_sign)
    else:
        f['fuel_trim_sign_match'] = None

    # ── Speed/vibration ratio (T2) ──
    if f['total_vibration'] is not None and packet.speed is not None:
        f['vibration_speed_ratio'] = round(
            f['total_vibration'] / max(packet.speed, 1.0), 4
        )
    else:
        f['vibration_speed_ratio'] = None

    # ── Virtual frequency identification (T3) ──
    f['virtual_freq_source'] = None
    f['virtual_freq_order'] = None

    dom_freq = packet.dominant_freq
    rpm = packet.rpm
    speed = packet.speed

    if dom_freq is not None and rpm and rpm > 0:
        engine_base = rpm / 60.0
        for order in range(1, 9):
            expected = engine_base * order
            if abs(dom_freq - expected) < 5.0:
                f['virtual_freq_source'] = 'engine'
                f['virtual_freq_order'] = order
                break

        if f['virtual_freq_source'] is None and speed and speed > 5:
            tire_freq = speed / (3.6 * math.pi * TIRE_DIAMETER)
            for harmonic in range(1, 13):
                expected = tire_freq * harmonic
                if abs(dom_freq - expected) < 5.0:
                    f['virtual_freq_source'] = 'wheel'
                    f['virtual_freq_order'] = harmonic
                    break

    return f
```

- [ ] **Step 4: Запустить тесты**

```bash
cd dashboard_build && python -m pytest tests/test_feature_extractor.py -v
```

Ожидаемый результат: все 7 тестов PASS.

- [ ] **Step 5: Commit**

```bash
git add dashboard_build/diagnostic/feature_extractor.py dashboard_build/tests/test_feature_extractor.py
git commit -m "feat: Feature Extractor — vibration, crest factor, fuel trim, virtual freq"
```

---

## Task 6: Typed Facts — модель фактов + генератор

**Files:**
- Create: `dashboard_build/diagnostic/facts.py`
- Create: `dashboard_build/tests/test_facts.py`

- [ ] **Step 1: Написать тест**

Файл `dashboard_build/tests/test_facts.py`:

```python
"""Tests for Typed Facts — fact model and generator."""
import pytest
from datetime import datetime
from diagnostic.facts import FactType, Fact, FactGenerator
from diagnostic.normalizer import NormalizedPacket, Regime, EngineContext
from diagnostic.knowledge_base import KnowledgeBase
from diagnostic.feature_extractor import extract_features
from diagnostic.vehicle_profile import VehicleProfile
import os

FIXTURES = os.path.join(os.path.dirname(__file__), '..', 'data')


@pytest.fixture
def kb():
    return KnowledgeBase(
        dtc_index_path=os.path.join(FIXTURES, 'dtc-index-sample.json'),
        situations_path=os.path.join(FIXTURES, 'situations-sample.json'),
    )


@pytest.fixture
def vp():
    return VehicleProfile(client_hash='test', brand='opel', model='astra', year=2010)


@pytest.fixture
def generator(kb, vp):
    return FactGenerator(vehicle_profile=vp, knowledge_base=kb)


class TestFactModel:
    def test_fact_creation(self):
        f = Fact(
            type=FactType.DTC_ACTIVE,
            timestamp=datetime.now(),
            value=1.0,
            severity='warning',
            confidence=0.9,
            context={'regime': 'idle'},
            source_tier='T1',
            details={'code': 'P0171'},
        )
        assert f.type == FactType.DTC_ACTIVE
        assert f.severity == 'warning'


class TestDtcFacts:
    def test_generates_dtc_fact(self, generator):
        pkt = NormalizedPacket(
            timestamp=datetime.now(), client_hash='test',
            regime=Regime.IDLE, engine_context=EngineContext(),
            tier='T1', dtc_codes=['P0171'],
        )
        features = extract_features(pkt)
        facts = generator.generate(pkt, features)
        dtc_facts = [f for f in facts if f.type == FactType.DTC_ACTIVE]
        assert len(dtc_facts) == 1
        assert dtc_facts[0].details['code'] == 'P0171'

    def test_multi_dtc_pattern(self, generator):
        pkt = NormalizedPacket(
            timestamp=datetime.now(), client_hash='test',
            regime=Regime.IDLE, engine_context=EngineContext(),
            tier='T1', dtc_codes=['P0171', 'P0174'],
        )
        features = extract_features(pkt)
        facts = generator.generate(pkt, features)
        pattern_facts = [f for f in facts if f.type == FactType.MULTI_DTC_PATTERN]
        assert len(pattern_facts) == 1
        assert pattern_facts[0].details['diagnosis'] == 'air_leak'


class TestOverheatFact:
    def test_overheat_detected(self, generator):
        pkt = NormalizedPacket(
            timestamp=datetime.now(), client_hash='test',
            regime=Regime.CITY, engine_context=EngineContext(warm=True),
            tier='T1', coolant_temp=108.0,
        )
        features = extract_features(pkt)
        facts = generator.generate(pkt, features)
        overheat_facts = [f for f in facts if f.type == FactType.OVERHEAT]
        assert len(overheat_facts) == 1
        assert overheat_facts[0].severity == 'danger'

    def test_no_overheat_normal(self, generator):
        pkt = NormalizedPacket(
            timestamp=datetime.now(), client_hash='test',
            regime=Regime.CITY, engine_context=EngineContext(warm=True),
            tier='T1', coolant_temp=90.0,
        )
        features = extract_features(pkt)
        facts = generator.generate(pkt, features)
        overheat_facts = [f for f in facts if f.type == FactType.OVERHEAT]
        assert len(overheat_facts) == 0


class TestLowVoltageFact:
    def test_low_voltage_at_rpm(self, generator):
        pkt = NormalizedPacket(
            timestamp=datetime.now(), client_hash='test',
            regime=Regime.CITY, engine_context=EngineContext(warm=True),
            tier='T1', voltage=12.1, rpm=1500,
        )
        features = extract_features(pkt)
        facts = generator.generate(pkt, features)
        voltage_facts = [f for f in facts if f.type == FactType.LOW_VOLTAGE]
        assert len(voltage_facts) == 1

    def test_low_voltage_idle_ok(self, generator):
        """Низкое напряжение на низких оборотах — не генератор."""
        pkt = NormalizedPacket(
            timestamp=datetime.now(), client_hash='test',
            regime=Regime.IDLE, engine_context=EngineContext(),
            tier='T1', voltage=12.5, rpm=600,
        )
        features = extract_features(pkt)
        facts = generator.generate(pkt, features)
        voltage_facts = [f for f in facts if f.type == FactType.LOW_VOLTAGE]
        assert len(voltage_facts) == 0
```

- [ ] **Step 2: Запустить — падает**

```bash
cd dashboard_build && python -m pytest tests/test_facts.py -v
```

- [ ] **Step 3: Реализовать**

Файл `dashboard_build/diagnostic/facts.py`:

```python
"""Typed Facts — промежуточный слой между фичами и правилами.

Шаг 3 pipeline: NormalizedPacket + features → List[Fact].
Факт = нормализованное утверждение о состоянии с контекстом.
"""
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional, Dict, List, Any

from .normalizer import NormalizedPacket
from .knowledge_base import KnowledgeBase
from .vehicle_profile import VehicleProfile


class FactType(Enum):
    # Мгновенные
    DTC_ACTIVE = 'dtc_active'
    LTFT_SEVERITY = 'ltft_severity'
    OVERHEAT = 'overheat'
    LOW_VOLTAGE = 'low_voltage'
    VIBRATION_ANOMALY = 'vibration_anomaly'
    AUDIO_ANOMALY = 'audio_anomaly'
    THRESHOLD_BREACH = 'threshold_breach'
    # Трендовые
    CUSUM_ALARM = 'cusum_alarm'
    BASELINE_DRIFT = 'baseline_drift'
    LTFT_TREND = 'ltft_trend'
    DEGRADATION = 'degradation'
    # Корреляционные
    VIBRATION_RPM_CORRELATION = 'vibration_rpm_corr'
    AUDIO_WHEEL_CORRELATION = 'audio_wheel_corr'
    MULTI_DTC_PATTERN = 'multi_dtc_pattern'


@dataclass
class Fact:
    type: FactType
    timestamp: datetime
    value: float = 0.0
    severity: str = 'ok'           # ok / warning / critical / danger
    confidence: float = 1.0        # 0.0-1.0
    context: Dict[str, Any] = field(default_factory=dict)
    source_tier: str = 'T1'
    details: Dict[str, Any] = field(default_factory=dict)


class FactGenerator:
    """Генерирует факты из NormalizedPacket + features."""

    def __init__(self, vehicle_profile: VehicleProfile, knowledge_base: KnowledgeBase):
        self.profile = vehicle_profile
        self.kb = knowledge_base

    def generate(self, packet: NormalizedPacket, features: Dict) -> List[Fact]:
        facts = []
        ctx = {
            'regime': packet.regime.value,
            'engine_warm': packet.engine_context.warm,
            'cold_start': packet.engine_context.cold_start,
        }

        # 1. DTC facts
        for code in packet.dtc_codes:
            dtc_info = self.kb.resolve_dtc(code, self.profile.brand)
            severity = 'warning'
            if dtc_info:
                sev_map = {'critical': 'danger', 'urgent': 'critical',
                           'warning': 'warning', 'info': 'warning'}
                severity = sev_map.get(dtc_info.get('severity', ''), 'warning')

            facts.append(Fact(
                type=FactType.DTC_ACTIVE,
                timestamp=packet.timestamp,
                value=1.0,
                severity=severity,
                context=ctx,
                source_tier=packet.tier,
                details={
                    'code': code,
                    'title': dtc_info.get('title_ru', code) if dtc_info else code,
                    'can_drive': dtc_info.get('can_drive', 'unknown') if dtc_info else 'unknown',
                    'system_id': dtc_info.get('system_id', 'unknown') if dtc_info else 'unknown',
                },
            ))

        # 2. Multi-DTC pattern
        if len(packet.dtc_codes) >= 2:
            pattern = self.kb.match_dtc_pattern(packet.dtc_codes)
            if pattern:
                facts.append(Fact(
                    type=FactType.MULTI_DTC_PATTERN,
                    timestamp=packet.timestamp,
                    value=float(len(packet.dtc_codes)),
                    severity='critical',
                    context=ctx,
                    source_tier=packet.tier,
                    details={
                        'codes': packet.dtc_codes,
                        'diagnosis': pattern['diagnosis'],
                        'confidence_boost': pattern['confidence_boost'],
                        'description': pattern.get('description', ''),
                    },
                ))

        # 3. Overheat
        if packet.coolant_temp is not None and packet.coolant_temp > 105:
            facts.append(Fact(
                type=FactType.OVERHEAT,
                timestamp=packet.timestamp,
                value=packet.coolant_temp,
                severity='danger',
                context=ctx,
                source_tier=packet.tier,
                details={'coolant': packet.coolant_temp, 'threshold': 105},
            ))

        # 4. Low voltage (only meaningful at RPM > 1000)
        if (packet.voltage is not None and packet.voltage < 13.0
                and packet.rpm is not None and packet.rpm > 1000):
            facts.append(Fact(
                type=FactType.LOW_VOLTAGE,
                timestamp=packet.timestamp,
                value=packet.voltage,
                severity='warning',
                context=ctx,
                source_tier=packet.tier,
                details={'voltage': packet.voltage, 'rpm': packet.rpm},
            ))

        return facts
```

- [ ] **Step 4: Запустить тесты**

```bash
cd dashboard_build && python -m pytest tests/test_facts.py -v
```

Ожидаемый результат: все 8 тестов PASS.

- [ ] **Step 5: Commit**

```bash
git add dashboard_build/diagnostic/facts.py dashboard_build/tests/test_facts.py
git commit -m "feat: Typed Facts — FactType, Fact, FactGenerator with DTC, overheat, voltage"
```

---

## Task 7: Baseline Store — Welford с DB persistence

**Files:**
- Create: `dashboard_build/diagnostic/baseline_store.py`
- Create: `dashboard_build/tests/test_baseline_store.py`

- [ ] **Step 1: Написать тест**

Файл `dashboard_build/tests/test_baseline_store.py`:

```python
"""Tests for BaselineStore — Welford with persistence and decay."""
import pytest
import math
from diagnostic.baseline_store import BaselineStore, RegimeBaseline, MAX_BASELINE_WINDOW


class TestRegimeBaseline:
    def test_single_update(self):
        bl = RegimeBaseline()
        bl.update(10.0)
        assert bl.count == 1
        assert bl.mean == 10.0

    def test_multiple_updates(self):
        bl = RegimeBaseline()
        for v in [10.0, 20.0, 30.0]:
            bl.update(v)
        assert bl.count == 3
        assert bl.mean == pytest.approx(20.0)
        assert bl.std == pytest.approx(10.0, abs=0.1)

    def test_z_score(self):
        bl = RegimeBaseline()
        for i in range(50):
            bl.update(100.0 + i * 0.1)
        z = bl.z_score(110.0)
        assert z > 2.0  # значительное отклонение

    def test_z_score_insufficient_data(self):
        bl = RegimeBaseline()
        for i in range(5):
            bl.update(float(i))
        z = bl.z_score(100.0)
        assert z == 0.0  # недостаточно данных

    def test_none_ignored(self):
        bl = RegimeBaseline()
        bl.update(None)
        assert bl.count == 0


class TestBaselineStore:
    def test_get_creates_new(self):
        store = BaselineStore()
        bl = store.get('idle', 'az_std')
        assert bl.count == 0

    def test_update_features(self):
        store = BaselineStore()
        store.update('idle', {'az_std': 1.0, 'rpm': 750})
        assert store.get('idle', 'az_std').count == 1
        assert store.get('idle', 'rpm').mean == 750.0

    def test_is_ready(self):
        store = BaselineStore()
        for i in range(30):
            store.update('idle', {'az_std': 0.3 + i * 0.01, 'total_vibration': 0.5})
        assert store.is_ready('idle') is True

    def test_not_ready_few_samples(self):
        store = BaselineStore()
        store.update('idle', {'az_std': 0.3, 'total_vibration': 0.5})
        assert store.is_ready('idle') is False

    def test_confidence(self):
        store = BaselineStore()
        for i in range(100):
            store.update('city', {'az_std': 1.2, 'total_vibration': 2.0})
        conf = store.confidence('city')
        assert 0.0 < conf <= 1.0


class TestBaselineDecay:
    def test_freezes_at_max_window(self):
        bl = RegimeBaseline()
        for i in range(MAX_BASELINE_WINDOW + 100):
            bl.update(float(i))
        assert bl.count == MAX_BASELINE_WINDOW


class TestSerialization:
    def test_to_dict_and_back(self):
        bl = RegimeBaseline()
        for v in [1.0, 2.0, 3.0]:
            bl.update(v)
        d = bl.to_dict()
        bl2 = RegimeBaseline.from_dict(d)
        assert bl2.count == bl.count
        assert bl2.mean == pytest.approx(bl.mean)
        assert bl2.m2 == pytest.approx(bl.m2)
```

- [ ] **Step 2: Запустить — падает**

```bash
cd dashboard_build && python -m pytest tests/test_baseline_store.py -v
```

- [ ] **Step 3: Реализовать**

Файл `dashboard_build/diagnostic/baseline_store.py`:

```python
"""Baseline Store — Welford online statistics с decay и сериализацией.

Per client x regime x feature. MAX_WINDOW=500 для защиты от drift.
"""
import math
from typing import Dict, Optional, Tuple
from dataclasses import dataclass

MIN_BASELINE_SAMPLES = 30
GOOD_BASELINE_SAMPLES = 200
MAX_BASELINE_WINDOW = 500

KEY_FEATURES = ('az_std', 'total_vibration')

BASELINE_FEATURES = [
    'ax_avg', 'ay_avg', 'az_avg',
    'ax_std', 'ay_std', 'az_std',
    'ax_range', 'ay_range', 'az_range',
    'rpm', 'speed', 'coolant', 'voltage',
    'audio_quality', 'dominant_freq', 'dominant_amp',
    'total_vibration', 'crest_factor_z',
    'ltft_abs', 'fuel_trim_delta',
]


@dataclass
class RegimeBaseline:
    count: int = 0
    mean: float = 0.0
    m2: float = 0.0
    min_val: float = float('inf')
    max_val: float = float('-inf')

    @property
    def variance(self):
        return self.m2 / max(self.count - 1, 1) if self.count > 1 else 0.0

    @property
    def std(self):
        return math.sqrt(self.variance)

    def update(self, value):
        if value is None:
            return
        if self.count >= MAX_BASELINE_WINDOW:
            return  # freeze — защита от drift при деградации
        self.count += 1
        delta = value - self.mean
        self.mean += delta / self.count
        delta2 = value - self.mean
        self.m2 += delta * delta2
        self.min_val = min(self.min_val, value)
        self.max_val = max(self.max_val, value)

    def z_score(self, value):
        if value is None or self.count < MIN_BASELINE_SAMPLES or self.std < 1e-9:
            return 0.0
        return (value - self.mean) / self.std

    def to_dict(self) -> dict:
        return {
            'count': self.count,
            'mean': self.mean,
            'm2': self.m2,
            'min_val': self.min_val if self.min_val != float('inf') else None,
            'max_val': self.max_val if self.max_val != float('-inf') else None,
        }

    @classmethod
    def from_dict(cls, d: dict) -> 'RegimeBaseline':
        return cls(
            count=d.get('count', 0),
            mean=d.get('mean', 0.0),
            m2=d.get('m2', 0.0),
            min_val=d.get('min_val') if d.get('min_val') is not None else float('inf'),
            max_val=d.get('max_val') if d.get('max_val') is not None else float('-inf'),
        )


class BaselineStore:
    def __init__(self):
        self.baselines: Dict[Tuple[str, str], RegimeBaseline] = {}

    def get(self, regime, feature: str) -> RegimeBaseline:
        regime_str = regime.value if hasattr(regime, 'value') else str(regime)
        key = (regime_str, feature)
        if key not in self.baselines:
            self.baselines[key] = RegimeBaseline()
        return self.baselines[key]

    def update(self, regime, features: Dict[str, Optional[float]]):
        for feat, val in features.items():
            if val is not None:
                self.get(regime, feat).update(val)

    def is_ready(self, regime) -> bool:
        return all(
            self.get(regime, f).count >= MIN_BASELINE_SAMPLES
            for f in KEY_FEATURES
        )

    def confidence(self, regime) -> float:
        counts = [self.get(regime, f).count for f in BASELINE_FEATURES
                  if self.get(regime, f).count > 0]
        if not counts:
            return 0.0
        avg_count = sum(counts) / len(counts)
        return min(avg_count / GOOD_BASELINE_SAMPLES, 1.0)

    def to_db_rows(self, client_hash: str) -> list:
        """Serialize all baselines to list of dicts for DB INSERT."""
        rows = []
        for (regime, feature), bl in self.baselines.items():
            if bl.count > 0:
                row = bl.to_dict()
                row['client_hash'] = client_hash
                row['regime'] = regime
                row['feature'] = feature
                rows.append(row)
        return rows

    @classmethod
    def from_db_rows(cls, rows: list) -> 'BaselineStore':
        """Load from DB SELECT results."""
        store = cls()
        for row in rows:
            key = (row['regime'], row['feature'])
            store.baselines[key] = RegimeBaseline.from_dict(row)
        return store
```

- [ ] **Step 4: Запустить тесты**

```bash
cd dashboard_build && python -m pytest tests/test_baseline_store.py -v
```

Ожидаемый результат: все 11 тестов PASS.

- [ ] **Step 5: Commit**

```bash
git add dashboard_build/diagnostic/baseline_store.py dashboard_build/tests/test_baseline_store.py
git commit -m "feat: BaselineStore — Welford with MAX_WINDOW decay and DB serialization"
```

---

## Task 8: Pipeline — оркестратор полного цикла

**Files:**
- Create: `dashboard_build/diagnostic/pipeline.py`
- Create: `dashboard_build/tests/test_pipeline.py`

- [ ] **Step 1: Написать тест**

Файл `dashboard_build/tests/test_pipeline.py`:

```python
"""Tests for Pipeline — full cycle: raw data → facts."""
import pytest
import os
from diagnostic.pipeline import DiagnosticPipeline
from diagnostic.vehicle_profile import VehicleProfile

FIXTURES = os.path.join(os.path.dirname(__file__), '..', 'data')


@pytest.fixture
def pipeline():
    vp = VehicleProfile(client_hash='test', brand='opel', model='astra', year=2010)
    return DiagnosticPipeline(
        vehicle_profile=vp,
        dtc_index_path=os.path.join(FIXTURES, 'dtc-index-sample.json'),
        situations_path=os.path.join(FIXTURES, 'situations-sample.json'),
    )


class TestFullPipeline:
    def test_healthy_packet(self, pipeline):
        result = pipeline.process({
            'timestamp': '2026-04-07T14:00:00Z',
            'client_hash': 'test',
            'rpm': 1200, 'speed': 45, 'coolant': 87, 'voltage': 14.2,
        })
        assert result['packet'] is not None
        assert result['features'] is not None
        assert isinstance(result['facts'], list)
        assert result['tier'] == 'T1'
        assert result['regime'] == 'city'

    def test_dtc_generates_facts(self, pipeline):
        result = pipeline.process({
            'timestamp': '2026-04-07T14:00:00Z',
            'client_hash': 'test',
            'rpm': 750, 'speed': 0,
            'dtc_codes': ['P0171'],
        })
        dtc_facts = [f for f in result['facts'] if f.type.value == 'dtc_active']
        assert len(dtc_facts) == 1

    def test_overheat_generates_danger(self, pipeline):
        result = pipeline.process({
            'timestamp': '2026-04-07T14:00:00Z',
            'client_hash': 'test',
            'rpm': 2000, 'speed': 60, 'coolant': 110,
        })
        danger_facts = [f for f in result['facts'] if f.severity == 'danger']
        assert len(danger_facts) >= 1

    def test_baseline_updates(self, pipeline):
        for i in range(35):
            pipeline.process({
                'timestamp': f'2026-04-07T14:{i:02d}:00Z',
                'client_hash': 'test',
                'rpm': 750, 'speed': 0,
                'az_std': 0.3 + i * 0.01,
                'ax_std': 0.1, 'ay_std': 0.1,
            })
        assert pipeline.baselines.is_ready('idle') is True

    def test_t3_with_all_sensors(self, pipeline):
        result = pipeline.process({
            'timestamp': '2026-04-07T14:00:00Z',
            'client_hash': 'test',
            'rpm': 2000, 'speed': 80,
            'ax_avg': 0.1, 'ay_avg': 0.0, 'az_avg': 9.8,
            'ax_std': 0.5, 'ay_std': 0.3, 'az_std': 0.8,
            'dominant_freq': 120, 'dominant_amp': 30,
        })
        assert result['tier'] == 'T3'
        assert result['features']['total_vibration'] is not None
```

- [ ] **Step 2: Запустить — падает**

```bash
cd dashboard_build && python -m pytest tests/test_pipeline.py -v
```

- [ ] **Step 3: Реализовать**

Файл `dashboard_build/diagnostic/pipeline.py`:

```python
"""Diagnostic Pipeline — оркестратор полного цикла.

Raw data → Normalizer → Feature Extractor → Fact Generator → results.
Обновляет baselines. Готовит данные для Rule Engine (Plan 2).
"""
from typing import Dict, List, Any

from .normalizer import normalize_packet, NormalizedPacket
from .feature_extractor import extract_features
from .facts import Fact, FactGenerator
from .knowledge_base import KnowledgeBase
from .vehicle_profile import VehicleProfile
from .baseline_store import BaselineStore


class DiagnosticPipeline:
    def __init__(
        self,
        vehicle_profile: VehicleProfile,
        dtc_index_path: str = None,
        situations_path: str = None,
        baselines: BaselineStore = None,
    ):
        self.profile = vehicle_profile
        self.kb = KnowledgeBase(
            dtc_index_path=dtc_index_path,
            situations_path=situations_path,
        )
        self.baselines = baselines or BaselineStore()
        self.fact_generator = FactGenerator(
            vehicle_profile=self.profile,
            knowledge_base=self.kb,
        )

    def process(self, raw_data: dict) -> Dict[str, Any]:
        """Process one data packet through the full pipeline.

        Returns dict with: packet, features, facts, tier, regime, baseline_ready.
        """
        # Step 1: Normalize
        packet = normalize_packet(raw_data)

        # Step 2: Extract features
        features = extract_features(packet)

        # Step 3: Update baselines
        baseline_features = {}
        for key, val in features.items():
            if val is not None and isinstance(val, (int, float)):
                baseline_features[key] = val
        # Add raw OBD values to baselines too
        if packet.rpm is not None:
            baseline_features['rpm'] = packet.rpm
        if packet.speed is not None:
            baseline_features['speed'] = packet.speed
        if packet.coolant_temp is not None:
            baseline_features['coolant'] = packet.coolant_temp
        if packet.voltage is not None:
            baseline_features['voltage'] = packet.voltage
        if packet.ltft_bank1 is not None:
            baseline_features['ltft_abs'] = abs(packet.ltft_bank1)

        self.baselines.update(packet.regime.value, baseline_features)

        # Step 4: Generate facts
        facts = self.fact_generator.generate(packet, features)

        return {
            'packet': packet,
            'features': features,
            'facts': facts,
            'tier': packet.tier,
            'regime': packet.regime.value,
            'baseline_ready': self.baselines.is_ready(packet.regime.value),
            'baseline_confidence': self.baselines.confidence(packet.regime.value),
        }
```

- [ ] **Step 4: Запустить тесты**

```bash
cd dashboard_build && python -m pytest tests/test_pipeline.py -v
```

Ожидаемый результат: все 5 тестов PASS.

- [ ] **Step 5: Запустить ВСЕ тесты — полная регрессия**

```bash
cd dashboard_build && python -m pytest tests/ -v
```

Ожидаемый результат: все 52 теста PASS (10 + 11 + 10 + 7 + 8 + 11 + 5 из tasks 2-8).

- [ ] **Step 6: Commit**

```bash
git add dashboard_build/diagnostic/pipeline.py dashboard_build/tests/test_pipeline.py
git commit -m "feat: DiagnosticPipeline — full cycle raw data → normalized → features → facts"
```

---

## Summary

| Task | Что создали | Тесты |
|------|------------|-------|
| 1 | DB schema (9 таблиц) | Проверка на сервере |
| 2 | VehicleProfile (dataclass + LTFT коррекции) | 10 тестов |
| 3 | KnowledgeBase (4-level resolver + DTC patterns) | 11 тестов |
| 4 | Normalizer (валидация + режим + контекст) | 10 тестов |
| 5 | Feature Extractor (производные фичи) | 7 тестов |
| 6 | Typed Facts (FactType + Fact + FactGenerator) | 8 тестов |
| 7 | BaselineStore (Welford + decay + serialization) | 11 тестов |
| 8 | Pipeline (оркестратор полного цикла) | 5 тестов |

**Итого:** 8 tasks, ~62 теста, фундамент для Plan 2 (Rules & Diagnosis).

**После Plan 1 сервер умеет:** принять данные → нормализовать → извлечь фичи → сгенерировать факты → обновить baselines. Не умеет: ставить диагнозы, формировать отчёты, отвечать через API (это Plan 2).
