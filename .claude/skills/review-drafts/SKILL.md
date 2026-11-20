---
name: review-drafts
description: Hermes 주간 조사가 로컬 모델로 만든 research/drafts/ 초안을 원문과 대조해 고치고 content/knowledge 로 옮겨 공개한다. "초안 검토", "주간 조사 반영", "드래프트 올려줘" 요청에 사용.
---

# 로컬 모델 초안 검토·공개

Hermes 주간 조사(`hermes/weekly.mjs`, 일요일 04:00)는 `research/backlog.md` 의 knowledge 주제를 골라 원문을 내려받고, 로컬 모델이 뽑은 사실 중 **원문 인용이 그대로 확인된 것만** 써서 초안을 `research/drafts/<category>/<id>.md` 에 둔다. 사이트에는 나가지 않는다.

스크립트가 보장하는 것: 인용문이 내려받은 원문에 있다, 문단의 숫자가 인용한 근거 안에 있다, frontmatter 형식.
보장하지 **않는** 것: 번역·해석 오류, MUST/SHOULD 강도, 출처가 최신판인지, 빠진 핵심 내용, related, 중복.

## 1. 대상
- `research/drafts/README.md`(또는 `index.json`)에서 상태가 "초안"인 것.
- "중복 의심"은 기존 노트를 열어 정말 겹치는지 판단: 겹치면 기존 노트 보강 또는 `rejected`, 아니면 직접 작성.
- "출처 부족"은 로컬 모델이 출처를 못 찾은 주제다. 필요하면 `write-knowledge` 로 직접 쓴다.

## 2. 검토 (초안마다)
1. 초안의 "검토용 근거" 인용과 sources 원문을 연다. `knowledge-writer` 또는 직접 원문 대조로:
   - 번역이 원문과 같은 뜻인지(용어: authorization server = 인가 서버 등), MUST/SHOULD 강도가 원문 그대로인지.
   - 출처가 1차 출처이고 최신판인지(RFC 대체, 초안 버전, 문서 버전).
   - 빠진 핵심 내용, 주의점, "언제 쓰나"를 원문 근거로 보강.
2. `write-knowledge` 형식으로 다듬는다: `related`(존재하는 id), 링크, "검증 범위" 절.
3. 초안 전용 블록을 지운다: 맨 위 ⚠ 인용 블록, "검토용 근거", "근거 검증에서 뺀 문장", "형식 문제", 문단 끝 "(근거 n)".
4. `content/knowledge/<category>/<id>.md` 로 옮기고 `updatedAt` 을 실제 확인한 날짜로.

## 3. 검증·공개
- 옮긴 노트 전체를 `fact-checker` 로 독립 검증 → 반영.
- `node hermes/lint.mjs <파일>` → `npm run validate` → `npm run build` → 링크 검사.
- `research/drafts/index.json` 에서 해당 주제 status 를 `published`(파일 경로 갱신) 또는 `rejected`(사유)로 바꾸고 초안 파일은 삭제. `README.md` 표도 맞춘다.
- `research/backlog.md` 에서 처리한 주제를 지운다.
- 로그: `research/log/YYYY-MM-DD-drafts.md` (공개·버림·정정 내역).
- 사용자가 요청하면 커밋·push(→ Pages 배포). 작업 트리를 깨끗하게 남겨야 Hermes 일일·주간 실행이 건너뛰지 않는다.
