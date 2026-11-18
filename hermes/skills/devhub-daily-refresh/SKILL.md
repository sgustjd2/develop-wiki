---
name: devhub-daily-refresh
description: dev.hub(개발자 백과사전) 저장소를 매일 조사·갱신한다. 사전 점검이 준 작업 목록(A 신규 모델, B 신규 라이브러리, C 재검증, D 백과사전 본문) 범위 안에서만 파일을 고치고 publish.sh 로 배포한다.
version: 1.0.0
author: dev.hub
license: UNLICENSED
platforms: [macos]
metadata:
  hermes:
    tags: [dev-wiki, daily-update, research]
---

# dev.hub 일일 갱신

저장소: `/Users/hsmin/Documents/develop-wiki` (작업 디렉터리). 사용할 도구: `file`, `terminal`, `web`.
규칙 원문은 저장소의 `CLAUDE.md` 다. 작업 전에 반드시 읽는다. 아래는 그 요약과 오늘 작업 순서다.

## 절대 규칙
1. **사전 점검 출력이 "REPO: ok" 가 아니면 아무 파일도 고치지 않고** 그 사유만 보고하고 끝낸다.
2. 고쳐도 되는 곳은 `content/` 와 `research/` 뿐이다. 그 밖의 파일(`src/`, `.claude/`, `hermes/`, 설정)은 절대 수정하지 않는다.
3. **모든 수치·날짜·라이선스는 오늘 직접 연 1차 출처**(Hugging Face 모델 카드·API, GitHub, 공식 문서)에서 확인한 것만 쓴다. 기억이나 추측으로 채우지 않는다. 확인 못 한 선택 필드는 비운다.
4. 분류 값은 `src/taxonomy.ts` 에 있는 값만 쓴다. 모델 분류는 `.claude/skills/classify-model/SKILL.md` 결정 트리를 따른다.
5. 설명은 한국어, 1~2문장, 홍보 문구·최상급 표현 금지.
6. 하루 상한: 신규 모델 **1개**, 신규 라이브러리 **1개**, 백과사전 본문 1개, 버전·보안 이슈 파일 5개(E, TODO 채우기만). 기준에 맞는 후보가 없으면 0개로 끝낸다 — 억지로 채우지 않는다. 확신이 없으면 추가하지 말고 `research/backlog.md` 에 한 줄 남긴다.
7. 파일을 지우지 않는다. 폐기 후보는 로그에만 적는다.

## 작업 순서

### A. 신규 모델 (최대 1개)
- 후보 중 **원 제작사가 직접 공개한 원본 가중치**만 대상. 양자화·재배포·파생 파인튜닝(다른 조직 이름이 붙은 것)은 제외.
- 모델 카드를 `web` 으로 열어 확인: 용도, 파라미터(MoE면 활성 파라미터), 컨텍스트, 라이선스, thinking 끄기 가능 여부, 입력/출력 모달리티.
- 공개일은 HF `createdAt` 이 아니라 공식 발표일 또는 `.../commits/main` 의 공개 직전 커밋 날짜.
- **카드에 적힌 것만 쓴다.** 카드에 없는 기능·수치를 만들지 않는다(예: 존재하지 않는 "브러시 기능"). 불확실한 필드는 비우고 limitations 에 "카드에 명시 없음"이라고 쓴다.
- type 은 사전 점검의 분류 힌트와 classify-model 을 따른다. 이미지·영상·음성·임베딩 계열은 `thinking: none`, `contextLength` 는 쓰지 않는다.
- 라이선스가 Apache-2.0/MIT/BSD 가 아니면 `commercialUse: restricted`(원문에서 조건을 확인하기 전까지). 커스텀 라이선스를 allowed 로 올리지 않는다.
- 파일: `content/models/<조직-소문자>/<저장소명-소문자>.md`. **기존 파일 `content/models/qwen/qwen3-30b-a3b.md` 를 열어 같은 형식으로** 작성한다(--- 로 감싼 YAML frontmatter). 필수 필드를 빠뜨리지 않는다.
- `.claude/skills/add-model/SKILL.md` 의 라이선스 → commercialUse 기준을 따른다.

### B. 신규 라이브러리 (최대 1개)
- 포함 기준: 개발자가 **자기 코드에서 가져다 쓰는** 라이브러리·프레임워크·SDK·서버·CLI 이고 `src/taxonomy.ts` 의 카테고리 중 하나에 맞는다. 최종 사용자용 앱(CAD, IDE, 다운로드 매니저, 게임, 모바일 앱 등)·개인 실험 저장소는 제외. **description 은 반드시 한국어**(영어 README 문장을 그대로 붙이지 않는다).
- 저장소 README 와 공식 문서를 열어 확인한 뒤 `content/resources/<domain>/<category>/<id>.md` 작성. 같은 카테고리의 기존 파일 하나를 열어 형식을 그대로 따른다(폴더와 frontmatter 의 domain/category 가 같아야 함).
- 기준 미달이면 `research/excluded.md` 표에 사유와 함께 한 줄 추가.

### C. 재검증
- 목록의 각 파일: `archived=false` 이고 라이선스가 frontmatter 의 pricing 과 모순이 없으면 `verifiedAt` 만 오늘 날짜로 바꾼다.
- archived=true, 라이선스 변경, 조회 실패는 **파일을 고치지 말고** 로그에 기록.

### D. 백과사전 본문 (1개)
- 지정된 파일의 frontmatter 는 그대로 두고 본문만 작성한다. 템플릿은 `.claude/skills/write-encyclopedia/SKILL.md` (DB 는 템플릿 B).
- 공식 문서를 `web` 으로 열어 확인한 내용만. 코드 예제는 짧고 문서의 현재 버전 기준. 문서 문장을 그대로 번역·복사하지 않는다.
- frontmatter 에 `docs:` 가 없으면 실제로 읽은 공식 문서 URL 로 추가해도 된다(이 필드만 예외).

### E. 버전·보안 이슈 (스크립트가 만든 파일의 TODO 만 채운다)
사전 점검의 E 절에 나온 파일들은 **스크립트가 이미 만들어 놨다**(구조, 버전, 날짜, URL, 보안 권고 ID·심각도·영향 버전은 GitHub 값 그대로). 새 파일을 만들거나 구조를 바꾸지 않는다.
- 해야 할 일은 각 파일에서 `summary: TODO` 줄을, 그 아래 목록(릴리스 노트 발췌)을 근거로 **한국어 1문장(200자 이내)** 으로 바꾸는 것뿐이다. 사용자에게 영향이 있는 변경(기능 추가·버그 수정·기본값 변경·의존성 변경)만 쓰고, CI·문서·기여자는 쓰지 않는다. 노트가 비어 있으면 `릴리스 노트 없음`.
- 릴리스 노트에 breaking/제거/기본값 변경/마이그레이션이 **명시**된 경우에만 그 항목의 `breaking: false` 를 `true` 로.
- 다른 줄(id, severity, affected, url, 날짜, title 등)은 한 글자도 고치지 않는다. 새 필드를 추가하지 않는다.
- 보안 조회가 실패했다고 표시된 파일은 건드리지 말고 로그에만 기록한다.

### F. 로그
`research/log/<오늘>-hermes.md` 를 만든다:
```
# Hermes 일일 갱신 — YYYY-MM-DD
## 추가   - 파일 — 근거 URL
## 갱신   - 파일 — 무엇을
## 보류·제외 - 항목 — 사유
## 사람 확인 필요 - 내용
```

### G. 배포
`bash hermes/publish.sh` 를 실행한다.
- `LINT: 거부` → 출력된 위반 항목만 고치고 한 번 더 실행. 고칠 근거가 없으면 그 파일만 `research/excluded.md` 에 사유를 적고 파일은 삭제하지 말고 그대로 둔 채 보고(자동 배포되지 않음).
- `PUBLISH: ok` → 끝.
- `거부 — 스키마/타입 검증 실패` → 출력된 오류 메시지대로 **내가 오늘 만든 파일만** 고치고 한 번만 다시 실행. 그래도 실패하면 고치려 하지 말고 보고.
- `거부 — 허용 범위 밖 파일 변경` → 아무것도 하지 말고 보고.

## 최종 보고 (한국어, 짧게)
추가/갱신 파일 수(이슈 파일 포함), 배포 결과(커밋 해시), 사람 확인이 필요한 항목.
