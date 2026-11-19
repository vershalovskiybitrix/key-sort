#!/usr/bin/env bash
set -euo pipefail

project_dir="${KEY_SORT_DIR:-/opt/vershalovskiy.com/key-sort}"
python_bin="${PYTHON_BIN:-python3.12}"

cd "$project_dir"

if [[ ! -x .venv/bin/python ]]; then
  "$python_bin" -m venv .venv
fi

.venv/bin/pip install -r requirements.txt
install -m 0644 key-sort.service /etc/systemd/system/key-sort.service
install -m 0644 key-sort-limits.conf /etc/nginx/conf.d/key-sort-limits.conf
install -m 0644 key-sort.vershalovskiy.com.nginx /etc/nginx/sites-available/key-sort.vershalovskiy.com
ln -sfn /etc/nginx/sites-available/key-sort.vershalovskiy.com /etc/nginx/sites-enabled/key-sort.vershalovskiy.com

systemctl daemon-reload
nginx -t
systemctl enable --now key-sort.service
systemctl restart key-sort.service
systemctl reload nginx

curl --fail --silent http://127.0.0.1:8815/health
