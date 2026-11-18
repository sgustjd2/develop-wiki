---
name: survey-category
description: dev.hub 의 카테고리 하나(예 frontend/state-data, backend/database, models/vlm, knowledge/design-patterns)를 조사해 신규·변경·폐기 항목을 반영한다. "카테고리 업데이트", "○○ 최신화", "새로 나온 ○○ 조사" 요청에 사용.
---

# 카테고리 survey

인자: `<영역>/<카테고리>` — 영역은 `frontend|backend|ai|models|knowledge`.
models 는 카테고리 자리에 model type(`vlm`, `embedding` …) 또는 group(`decision` …)을 쓴다.

## 1. 현황 파악
- `src/taxonomy.ts` 에서 카테고리 정의(라벨·설명)를 확인한다.
- 해당 카테고리의 기존 항목을 모두 읽고 목록화한다 (이름, verifiedAt).
- `research/log/` 에서 같은 카테고리의 이전 survey 로그를 찾아 마지막 조사일과 보류 항목을 확인한다.
- `research/excluded.md` 를 읽는다.

## 2. 담당 에이전트에 위임
| 영역 | 에이전트 |
| --- | --- |
| frontend | `frontend-researcher` |
| backend | `backend-researcher` |
| ai | `ai-tech-researcher` |
| models | `model-researcher` → 이어서 `model-taxonomist` |
| knowledge | `knowledge-writer` |

위임 프롬프트에 반드시 넣을 것: 카테고리 정의, 기존 항목 목록, 제외 목록, 이전 로그의 보류 항목, 그리고 아래 세 가지 질문.
1. **신규**: 기존 목록에 없는데 포함 기준을 충족하는 항목은? (resources 는 언어별 공백도 확인)
2. **변경**: 기존 항목 중 라이선스·이름·URL·상태가 바뀐 것은? (메이저 릴리스, 라이선스 변경, 리브랜딩)
3. **폐기**: archived, deprecated, 12개월 이상 정체된 항목은? → 파일 삭제 대신 보고만 하고, 사람이 결정한다.

한 번의 survey 에서 신규 항목은 카테고리당 **최대 8개**까지. 그 이상은 백로그로.

## 3. 검증
- 새로 만든/고친 파일 목록을 `fact-checker` 에 넘긴다 (작성 에이전트의 결론은 넘기지 않는다).
- "수정 필요" 판정은 반영하고, "확인 불가" 필드는 비운다.

## 4. 마무리
- `npm run validate && npm run build`
- `research/log/YYYY-MM-DD-<영역>-<카테고리>.md` 에 기록:
  ```md
  # <영역>/<카테고리> survey — YYYY-MM-DD
  ## 추가  - 이름 — 한 줄 사유 (출처)
  ## 수정  - 이름 — 무엇이 바뀌었나
  ## 폐기 후보 - 이름 — 근거 (사람 결정 필요)
  ## 보류/백로그 - 이름 — 사유
  ```
- 변경 요약을 사용자에게 보고한다. 커밋은 사용자가 요청할 때만.
