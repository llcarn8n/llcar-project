# S27 — Backend deploy notes

## `/api/kb-image/<hash>.webp` — добавлено в `dashboard_build/diagnostic/api_views.py` (строка ~1160+)

### Что нужно сделать на проде

1. **Добавить в Django urls.py** (путь на сервере, обычно `/var/www/html/django/dashboard/urls.py`):

```python
from dashboard_build.diagnostic.api_views import kb_image  # или путь к вашему модулю

urlpatterns += [
    re_path(r'^api/kb-image/(?P<hash>[0-9a-f]{64})\.webp$', kb_image, name='kb_image'),
]
```

2. **Переменная окружения** `KB_IMAGES_ROOT` — путь к директории с изображениями на сервере. Задаётся в `wsgi.py` / `settings.py` / systemd unit:

```
Environment="KB_IMAGES_ROOT=/var/kb-images"
```

Default если не задан: `/var/kb-images`.

3. **Файловая раскладка на сервере:**

```
/var/kb-images/
  ab/                    # первые 2 hex-цифры хеша
    abc123...def.webp    # полный 64-hex hash
  ef/
    efabc...xyz.webp
```

Скрипт шардинга (запустить один раз на сервере после rsync):

```bash
cd /var/kb-images
for f in */images/*.webp; do
  hash=$(basename "$f" .webp)
  shard="${hash:0:2}"
  mkdir -p "$shard"
  mv "$f" "$shard/"
done
```

4. **rsync с Пети на прод** (выполнить вручную один раз, ~25-70GB):

```bash
rsync -avz --include='*/' --include='*.webp' --exclude='*' \
  /mnt/d/manuals-export/ user@185.55.57.145:/var/kb-images-raw/
# затем на сервере — раскидать по shard'ам скриптом выше
```

5. **nginx cache** (`/etc/nginx/sites-available/llcar.conf` или include):

```nginx
proxy_cache_path /var/cache/nginx/kb-images levels=1:2 keys_zone=kb_image:50m max_size=20g inactive=365d use_temp_path=off;

server {
    location ~ ^/api/kb-image/([0-9a-f]{64})\.webp$ {
        proxy_pass http://unix:/run/gunicorn.sock;
        proxy_cache kb_image;
        proxy_cache_valid 200 1y;
        proxy_cache_valid 404 5m;
        proxy_cache_key "$uri";
        add_header X-Cache $upstream_cache_status;
        expires 1y;
    }
}
```

6. **Проверка после деплоя:**

```bash
# Проверка endpoint'а (должен вернуть 200 + image/webp)
curl -I https://llcar.ru/api/kb-image/<some-existing-hash>.webp

# Проверка кеша (второй запрос должен иметь X-Cache: HIT)
curl -I https://llcar.ru/api/kb-image/<hash>.webp 2>&1 | grep -i x-cache
```

### Frontend

Файл `llcar-dashboard/src/utils/manualImages.ts`:
- `resolveManualImage(markdownSrc)` → возвращает `/api/kb-image/<hash>.webp` если src соответствует `images/<sha256>.webp`, иначе null
- `extractImageSrc(markdownImage)` — разбирает `![alt](src)`

Обновлён `ManualViewer.tsx`: если resolver вернул URL — рендерит `<img>` с `onError` fallback на placeholder «Изображение недоступно». Иначе — старый плейсхолдер 📷.

### Fallback / безопасность

- Hash regex `^[0-9a-f]{64}$` — только lowercase hex, 64 символа. Любой другой формат — 404.
- Path traversal исключён: `KB_IMAGES_ROOT / shard / hash.webp` собирается из валидированного hash'а.
- При отсутствии файла — 404 с 64-байтовой `transparent.webp` placeholder и `Cache-Control: max-age=300` (чтобы 404 тоже кешировались коротко).
- При `OSError` (права, зависший mount) — чистый 404 без содержимого.

### Оценка нагрузки

- 861K картинок × 30-80KB ≈ 25-70GB total
- `proxy_cache` на nginx = 20GB LRU — покрывает hot set (обычно <10% просмотренных)
- Cache-Control immutable 1y — после первого hit клиент больше не спрашивает сервер

### Rollback

- Удалить из urls.py → endpoint перестаёт отвечать → frontend `onError` показывает placeholder вместо картинки
- `ManualViewer.tsx` продолжает работать
