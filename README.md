# Key Sort

Сервис сортировки поисковых запросов по группам, минус-словам и минус-фразам с русской морфологией.

## Состав проекта

- `index.html` — весь клиентский интерфейс и логика обработки запросов.
- `assets/vcg-logo.png` — локальная исходная копия логотипа; для автономной загрузки она встроена в `index.html` как data URI.
- `app.py` — локальный HTTP API морфологии.
- `requirements.txt` — зафиксированные Python-зависимости.
- `key-sort.service` — служба systemd.
- `key-sort.vershalovskiy.com.nginx` — рабочая HTTPS-конфигурация nginx.
- `key-sort.bootstrap.nginx` — временная HTTP-конфигурация для первого получения сертификата.
- `key-sort-limits.conf` — ограничение частоты запросов к API.

## Автономность

После установки Python-зависимостей сервис не загружает для работы шрифты, изображения, JavaScript или CSS с внешних сайтов. Логотип и favicon встроены в `index.html`, локальная исходная копия логотипа хранится в `assets/vcg-logo.png`, морфологический словарь установлен локально вместе с `pymorphy3-dicts-ru`.

Клиент обращается только к API своего домена: `/api/lemmatize`. Ссылки на основной сайт, Telegram и электронную почту являются обычной навигацией и не загружают ресурсы без действия пользователя.

Для первоначальной установки нужен доступ к репозиторию и PyPI. Если сервер должен устанавливаться полностью без интернета, Python-пакеты из `requirements.txt` нужно заранее скачать в локальный каталог пакетов.

## Требования к серверу

- Linux с systemd;
- Python 3.12 и модуль `venv`;
- nginx;
- certbot и плагин certbot для nginx либо другой способ получить TLS-сертификат;
- DNS-запись домена, указывающая на сервер.

Текущие конфигурации используют:

- каталог `/opt/vershalovskiy.com/key-sort`;
- локальный API `127.0.0.1:8815`;
- пользователя и группу `www-data`;
- домен `key-sort.vershalovskiy.com`.

При другом каталоге, порте, пользователе или домене замените эти значения в `key-sort.service`, `key-sort.vershalovskiy.com.nginx` и при необходимости в `app.py`.

## Установка

### 1. Получить проект

```bash
sudo mkdir -p /opt/vershalovskiy.com
cd /opt/vershalovskiy.com
sudo git clone https://github.com/vershalovskiybitrix/key-sort.git key-sort
cd key-sort
```

Не переносите `.venv` со старого сервера: виртуальное окружение содержит абсолютные пути и создаётся заново на целевой системе.

### 2. Создать Python-окружение

```bash
sudo python3.12 -m venv /opt/vershalovskiy.com/key-sort/.venv
sudo /opt/vershalovskiy.com/key-sort/.venv/bin/python -m pip install --upgrade pip
sudo /opt/vershalovskiy.com/key-sort/.venv/bin/pip install -r /opt/vershalovskiy.com/key-sort/requirements.txt
sudo chown -R root:www-data /opt/vershalovskiy.com/key-sort
sudo chmod -R u=rwX,g=rX,o=rX /opt/vershalovskiy.com/key-sort
```

### 3. Установить и запустить systemd-службу

Если проект расположен не в `/opt/vershalovskiy.com/key-sort`, сначала исправьте `WorkingDirectory` и `ExecStart` в `key-sort.service`.

```bash
sudo cp key-sort.service /etc/systemd/system/key-sort.service
sudo systemctl daemon-reload
sudo systemctl enable --now key-sort.service
sudo systemctl status key-sort.service
curl http://127.0.0.1:8815/health
```

Ожидаемый ответ проверки:

```json
{"status":"ok"}
```

### 4. Подготовить nginx и получить сертификат

Сначала замените домен в `key-sort.bootstrap.nginx`, затем установите временную HTTP-конфигурацию:

```bash
sudo cp key-sort.bootstrap.nginx /etc/nginx/sites-available/key-sort
sudo ln -s /etc/nginx/sites-available/key-sort /etc/nginx/sites-enabled/key-sort
sudo nginx -t
sudo systemctl reload nginx
```

После обновления DNS получите сертификат. Для текущей bootstrap-конфигурации подходит webroot `/var/www/html`:

```bash
sudo certbot certonly --webroot -w /var/www/html -d key-sort.vershalovskiy.com
```

Для другого домена укажите его вместо `key-sort.vershalovskiy.com`.

### 5. Включить рабочую HTTPS-конфигурацию

В `key-sort.vershalovskiy.com.nginx` проверьте:

- `server_name`;
- `root`;
- пути `ssl_certificate` и `ssl_certificate_key`;
- адрес API в `proxy_pass`.

Затем установите рабочую конфигурацию и общий лимит API:

```bash
sudo cp key-sort-limits.conf /etc/nginx/conf.d/key-sort-limits.conf
sudo cp key-sort.vershalovskiy.com.nginx /etc/nginx/sites-available/key-sort
sudo nginx -t
sudo systemctl reload nginx
```

### 6. Проверить опубликованный сервис

```bash
curl -I https://key-sort.vershalovskiy.com/
curl https://key-sort.vershalovskiy.com/api/health
curl -X POST https://key-sort.vershalovskiy.com/api/lemmatize \
  -H 'Content-Type: application/json; charset=utf-8' \
  --data '{"words":["психолог","психологи","бежать","бежит"]}'
```

В ответе `психолог` и `психологи` должны получить одинаковый морфологический ключ; `бежать` и `бежит` также должны быть объединены как глагол.

## Перенос на другой домен

Данные проектов не хранятся на сервере. Автосохранение находится в IndexedDB браузера и привязано к домену. Перед отключением старого домена экспортируйте каждый нужный проект в JSON, а на новом домене импортируйте соответствующий файл.

Для переноса:

1. Разверните проект и пересоздайте `.venv` на новом сервере.
2. Измените домен и пути в nginx/systemd.
3. Выпустите сертификат для нового домена.
4. Проверьте `/api/health` и `/api/lemmatize`.
5. Переключите DNS.
6. Импортируйте пользовательские JSON-проекты на новом домене.
7. После проверки отключите старый сервер.

## Обновление

```bash
cd /opt/vershalovskiy.com/key-sort
sudo git pull --ff-only
sudo /opt/vershalovskiy.com/key-sort/.venv/bin/pip install -r requirements.txt
sudo systemctl restart key-sort.service
```

Если менялись nginx-конфигурации:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Диагностика

```bash
sudo systemctl status key-sort.service
sudo journalctl -u key-sort.service -n 200 --no-pager
sudo nginx -t
sudo tail -n 200 /var/log/nginx/error.log
```

Если API недоступен, страница продолжит работать, но морфологическое объединение отключится и останется точное сравнение слов.
