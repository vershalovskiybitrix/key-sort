#!/usr/bin/env bash
set -euo pipefail

project_dir="${KEY_SORT_DIR:-/opt/vershalovskiy.com/key-sort}"
python_bin="${PYTHON_BIN:-python3.12}"
domain="${KEY_SORT_DOMAIN:-key-sort.vershalovskiy.com}"
api_port="${KEY_SORT_PORT:-8815}"
service_user="${KEY_SORT_USER:-www-data}"
service_group="${KEY_SORT_GROUP:-www-data}"

[[ "$project_dir" =~ ^/[A-Za-z0-9._/-]+$ ]] || { echo "Некорректный KEY_SORT_DIR" >&2; exit 2; }
[[ "$domain" =~ ^[A-Za-z0-9.-]+$ ]] || { echo "Некорректный KEY_SORT_DOMAIN" >&2; exit 2; }
[[ "$api_port" =~ ^[0-9]+$ ]] && (( api_port >= 1 && api_port <= 65535 )) || { echo "Некорректный KEY_SORT_PORT" >&2; exit 2; }
[[ "$service_user" =~ ^[A-Za-z_][A-Za-z0-9_-]*$ ]] || { echo "Некорректный KEY_SORT_USER" >&2; exit 2; }
[[ "$service_group" =~ ^[A-Za-z_][A-Za-z0-9_-]*$ ]] || { echo "Некорректный KEY_SORT_GROUP" >&2; exit 2; }

cd "$project_dir"

chmod 0644 \
  app.py \
  index.html \
  keyword-parser.html \
  budget-forecast.html \
  text-format.html \
  subtract.html \
  multiplier.html \
  extension-install.html \
  assets/app.css \
  assets/app.js \
  assets/services.css \
  assets/services-common.js \
  assets/services-menu.js \
  assets/region-select.js \
  assets/regions.json \
  assets/keyword-parser.js \
  assets/budget-forecast.js \
  assets/text-format.js \
  assets/subtract.js \
  assets/multiplier.js \
  assets/favicon.svg \
  assets/vcg-logo.png \
  assets/fonts/RobotoMono.ttf \
  assets/fonts/SourceCodePro.ttf \
  downloads/key-sort-extension.zip

temp_dir="$(mktemp -d)"
trap 'rm -rf "$temp_dir"' EXIT

render_config() {
  local source="$1"
  local destination="$2"
  sed \
    -e "s|/opt/vershalovskiy.com/key-sort|$project_dir|g" \
    -e "s|key-sort\.vershalovskiy\.com|$domain|g" \
    -e "s|127\.0\.0\.1:8815|127.0.0.1:$api_port|g" \
    -e "s|KEY_SORT_PORT=8815|KEY_SORT_PORT=$api_port|g" \
    -e "s|User=www-data|User=$service_user|g" \
    -e "s|Group=www-data|Group=$service_group|g" \
    "$source" > "$destination"
}

if [[ ! -x .venv/bin/python ]]; then
  "$python_bin" -m venv .venv
fi

.venv/bin/pip install -r requirements.txt
render_config key-sort.service "$temp_dir/key-sort.service"
install -m 0644 "$temp_dir/key-sort.service" /etc/systemd/system/key-sort.service
install -m 0644 key-sort-limits.conf /etc/nginx/conf.d/key-sort-limits.conf

systemctl daemon-reload
systemctl enable --now key-sort.service
systemctl restart key-sort.service
health_ready=false
for _ in {1..20}; do
  if curl --fail --silent --output /dev/null "http://127.0.0.1:$api_port/health"; then
    health_ready=true
    break
  fi
  sleep 0.5
done
[[ "$health_ready" == true ]] || { echo "API не запустился за 10 секунд" >&2; exit 1; }

certificate_dir="/etc/letsencrypt/live/$domain"
if [[ ! -f "$certificate_dir/fullchain.pem" || ! -f "$certificate_dir/privkey.pem" ]]; then
  render_config key-sort.bootstrap.nginx "$temp_dir/key-sort.bootstrap.nginx"
  bootstrap_available="/etc/nginx/sites-available/$domain.bootstrap"
  bootstrap_enabled="/etc/nginx/sites-enabled/$domain.bootstrap"
  install -m 0644 "$temp_dir/key-sort.bootstrap.nginx" "$bootstrap_available"
  ln -sfn "$bootstrap_available" "$bootstrap_enabled"
  nginx -t
  systemctl reload nginx
  echo "Установлена временная HTTP-конфигурация. Получите сертификат:"
  echo "certbot certonly --webroot -w /var/www/html -d $domain"
  echo "После получения сертификата повторно запустите deploy.sh."
  exit 0
fi

render_config key-sort.vershalovskiy.com.nginx "$temp_dir/key-sort.nginx"
site_available="/etc/nginx/sites-available/$domain"
site_enabled="/etc/nginx/sites-enabled/$domain"
install -m 0644 "$temp_dir/key-sort.nginx" "$site_available"
ln -sfn "$site_available" "$site_enabled"
rm -f "/etc/nginx/sites-enabled/$domain.bootstrap"
nginx -t
systemctl reload nginx
