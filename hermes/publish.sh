#!/bin/bash
# Hermes 가 작업을 마친 뒤 실행: 변경 범위 확인 → 검증·빌드 → main 에 push (→ GitHub Pages 자동 배포)
set -euo pipefail
REPO="/Users/hsmin/Documents/develop-wiki"
cd "$REPO"
TODAY=$(TZ=Asia/Seoul date '+%Y-%m-%d')

changed=$(git status --porcelain | awk '{print $2}')
[ -z "$changed" ] && { echo "PUBLISH: 변경 없음"; exit 0; }

# 허용 범위: content/ 와 research/ 만
bad=$(echo "$changed" | grep -vE '^(content|research)/' || true)
if [ -n "$bad" ]; then
  echo "PUBLISH: 거부 — 허용 범위 밖 파일 변경:"; echo "$bad"
  echo "→ 이 파일들은 되돌리지 말고 그대로 둔 채 사람에게 보고"; exit 1
fi

if ! npm run validate >/tmp/devhub-validate.log 2>&1; then
  echo "PUBLISH: 거부 — 스키마/타입 검증 실패"; grep -iE "error|schema|허용|필요|Invalid|Expected" /tmp/devhub-validate.log | head -20; exit 1
fi
if ! npm run build >/tmp/devhub-build.log 2>&1; then
  echo "PUBLISH: 거부 — 빌드 실패"; tail -20 /tmp/devhub-build.log; exit 1
fi

git add content research
git commit -q -m "chore(hermes): daily refresh $TODAY" -m "Automated by Hermes Agent (local model). Needs periodic fact-check by Claude Code /refresh-hub."
git push -q origin main
echo "PUBLISH: ok — $(git rev-parse --short HEAD) pushed, Pages 배포 시작"
git show --stat --oneline HEAD | head -30
