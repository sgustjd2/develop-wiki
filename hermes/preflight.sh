#!/bin/bash
# Hermes cron 사전 단계: 저장소를 최신으로 맞추고 오늘의 작업 목록을 출력한다 (stdout → 에이전트 프롬프트).
set -u
REPO="/Users/hsmin/Documents/develop-wiki"
cd "$REPO" || { echo "REPO: FAIL — $REPO 없음"; exit 0; }
if [ -n "$(git status --porcelain)" ]; then
  echo "REPO: 작업 트리에 커밋 안 된 변경이 있음 → 오늘은 파일을 고치지 말고 '변경 있음으로 건너뜀'만 보고할 것"
  git status --short | head -20
  exit 0
fi
git pull --ff-only -q origin main 2>&1 | tail -2
[ -d node_modules ] || npm ci --silent >/dev/null 2>&1
echo "REPO: ok ($(git rev-parse --short HEAD))"
node hermes/collect.mjs
node hermes/advisories.mjs 5
