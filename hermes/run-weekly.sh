#!/bin/bash
# Hermes cron(--no-agent) 주간 조사 진입점. cron 환경에는 PATH 가 비어 있을 수 있어 node/gh 경로를 보강한다.
export PATH="$HOME/.local/share/mise/installs/node/24/bin:/opt/homebrew/bin:/usr/local/bin:$HOME/.local/bin:$PATH"
cd /Users/hsmin/Documents/develop-wiki || exit 0
exec node hermes/weekly.mjs
