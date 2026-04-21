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
