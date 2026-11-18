---
name: validate-hub
description: dev.hub 의 스키마·타입·빌드를 검사하고 외부 링크 생존 여부를 점검한다. 커밋·배포 전, 대량 업데이트 후에 사용.
---

# 허브 검증

```bash
npm run validate   # astro sync(콘텐츠 스키마) + astro check(타입)
npm run build      # 정적 빌드
```

## 링크 점검 (대량 업데이트 후)
```bash
grep -rhoE 'https?://[^ ]+' src/content | sort -u | while read u; do
  c=$(curl -sIL -o /dev/null -m 10 -w '%{http_code}' "$u"); [ "$c" != 200 ] && echo "$c $u"
done
```
403/429 는 봇 차단일 수 있으니 브라우저로 한 번 더 확인하고, 404 만 실제 깨진 링크로 본다.

## 분류 점검
- 항목이 0개인 카테고리는 사이트에서 숨겨진다 — survey 대상으로 보고.
- 모델 분류 일관성은 `model-taxonomist` 에 위임.
