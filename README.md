# Key Sort

Сервис сортировки поисковых запросов по группам, минус-словам и минус-фразам с русской морфологией.

Для внутренней фильтрации минус-слов сохраняется морфологический ключ «лемма + часть речи». В поле и при копировании остаются обычные слова без технических меток. Глаголы, инфинитивы, причастия и деепричастия объединяются в одну грамматическую семью; полные, краткие и сравнительные формы прилагательных — в другую. Слова, для которых словарь допускает несколько частей речи, не объединяются автоматически и сравниваются в точной словоформе.

Морфологические данные основаны на словаре [OpenCorpora](https://opencorpora.org/) и используются на условиях [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/).

В режиме частотностей запрос и число разделяются запятой, точкой с запятой или табуляцией. Обычный пробел считается частью поискового запроса, поэтому `психологический 2026` не превращается в запрос с частотностью `2026`.

При копировании проекта, пожалуйста, по возможности указывайте ссылку на оригинальную страницу: [key-sort.vershalovskiy.com](https://key-sort.vershalovskiy.com/).

## Состав проекта

- `index.html` — структура клиентского интерфейса.
- `assets/app.css` — локальные стили интерфейса.
- `assets/app.js` — локальная логика обработки запросов.
- `services.html` и страницы сервисов — парсинг, прогноз бюджета, форматирование, вычитание и перемножение.
- `assets/services*.css`, `assets/services*.js` — общие и прикладные файлы сервисов.
- `chrome-extension/` — Chrome-расширение для локального хранения ключей и прямых запросов к API Яндекса.
- `assets/vcg-logo.png` — локальная исходная копия логотипа; для автономной загрузки она встроена в `index.html` как data URI.
- `assets/fonts/` — локальные Source Code Pro и Roboto Mono с лицензиями OFL.
- `app.py` — локальный HTTP API морфологии.
- `requirements.txt` — зафиксированные Python-зависимости.
- `key-sort.service` — служба systemd.
- `key-sort.vershalovskiy.com.nginx` — рабочая HTTPS-конфигурация nginx.
- `key-sort.bootstrap.nginx` — временная HTTP-конфигурация для первого получения сертификата.
- `key-sort-limits.conf` — ограничение частоты запросов к API.
- `deploy.sh` — повторяемая установка и обновление службы/nginx на Linux.
- `tests/` — автоматические проверки морфологии.

## Автономность

После установки Python-зависимостей сервис не загружает для работы шрифты, изображения, JavaScript или CSS с внешних сайтов. Source Code Pro и Roboto Mono находятся в `assets/fonts/`, JavaScript и CSS — в `assets/`, логотип и favicon встроены в `index.html`, локальная исходная копия логотипа хранится в `assets/vcg-logo.png`, морфологический словарь установлен локально вместе с `pymorphy3-dicts-ru`.

Основная страница и локальные сервисы обращаются к API своего домена только для лемматизации: `/api/lemmatize`. Запросы Wordstat и Директа выполняет Chrome-расширение напрямую к Яндексу; ключи находятся в `chrome.storage.local` и странице не передаются. Ссылки на основной сайт, Telegram и электронную почту являются обычной навигацией и не загружают ресурсы без действия пользователя.

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

При запуске через `deploy.sh` эти значения можно передать переменными `KEY_SORT_DIR`, `KEY_SORT_DOMAIN`, `KEY_SORT_PORT`, `KEY_SORT_USER` и `KEY_SORT_GROUP`. Скрипт проверяет значения и создаёт серверные конфигурации с нужными путями.

## Установка

Для стандартного пути и текущего домена после клонирования можно выполнить `sudo bash deploy.sh`. Если сертификата ещё нет, первый запуск установит временную HTTP-конфигурацию и выведет команду Certbot; после получения сертификата запустите скрипт повторно.

Пример для другого домена и каталога:

```bash
sudo env KEY_SORT_DIR=/opt/example.com/key-sort KEY_SORT_DOMAIN=key-sort.example.com KEY_SORT_PORT=8815 bash deploy.sh
```

Ниже те же действия приведены по шагам для ручной настройки.

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

Автоматические проверки морфологии:

```bash
.venv/bin/python -m unittest discover -s tests -v
```

nginx публикует только страницу, локальные стили, JavaScript, шрифты, логотип и два API-маршрута. Backend, виртуальное окружение, документация и серверные конфигурации по HTTP недоступны. CSP разрешает странице выполнять скрипты и загружать ресурсы только с собственного домена.

Если API три раза подряд не отвечает, страница завершает текущую обработку через точное сравнение слов, показывает предупреждение и проверяет восстановление API не чаще одного раза в минуту. Запросы лемматизации отправляются пакетами не чаще примерно трёх раз в секунду; nginx дополнительно ограничивает один IP пятью запросами в секунду.
