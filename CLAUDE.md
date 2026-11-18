# dev.hub — 개발자 레퍼런스 허브

프론트엔드·백엔드·AI 기술, 오픈 웨이트 모델, 개발 지식(디자인 패턴·아키텍처 등)을 **조사 → 분류 → 검증 → 게시**하는 저장소.
Astro 정적 사이트로 빌드해 GitHub Pages(https://sgustjd2.github.io/develop-wiki/)에 배포한다.

## 저장소 지도

| 경로 | 내용 |
| --- | --- |
| `src/taxonomy.ts` | **분류 체계의 단일 원천.** 도메인·카테고리·언어·모델 type·지식 분류 |
| `src/content.config.ts` | 콘텐츠 스키마(Zod). 분류 체계를 벗어난 데이터는 빌드가 실패한다 |
| `content/resources/<domain>/<category>/<id>.md` | 도구·라이브러리·DB. frontmatter=메타데이터, 본문=백과사전(개요·설치·사용법) |
| `content/models/<org>/<id>.md` | 오픈 웨이트 모델 |
| `content/knowledge/<category>/<id>.md` | 개발 지식 노트 (디자인 패턴·아키텍처 …) |
| `content/advisories/<domain>/<category>/<id>.md` | 버전별 변경·보안 권고 (resources 와 같은 경로, 구조화 frontmatter). Hermes 가 매일 5개씩 갱신 |
| `content/languages/<id>.md` | 개발 언어 백과사전 (id = taxonomy LANGUAGES 키) |
| `src/pages/` | 사이트. 도메인→카테고리→항목 페이지, `models/type/*`, `new/`, `data/*.json`, `search-index.json` |
| `hermes/` | 매일 업데이트 스크립트(daily, advisories, candidates, summarize, lint, publish) |
| `research/` | 조사 로그·백로그·제외 목록 (사이트에는 안 나감) |
| `.claude/agents/` | 서브에이전트 정의 |
| `.claude/skills/` | 작업 절차(스킬) |
| `.mcp.json` | MCP 서버 (huggingface, context7, playwright) |

## 하네스 구성

```
              ┌──────────── 메인 세션(오케스트레이터) ────────────┐
              │  /survey-category, /refresh-hub 로 작업 분배     │
              └───┬──────────┬──────────┬──────────┬────────────┘
   조사·작성      frontend-   backend-   ai-tech-   model-       knowledge-
                 researcher  researcher researcher researcher   writer
                      │          │          │          │            │
   분류 검토            └──────────┴──────────┴─── model-taxonomist ─┘
   사실 검증                         fact-checker (읽기 전용, 보고만)
   게시                     npm run validate → npm run build → PR/커밋
   사이트 UI                         site-builder
```

| 에이전트 | 맡는 일 |
| --- | --- |
| `frontend-researcher` | 프론트엔드 도구 조사 → resources/frontend |
| `backend-researcher` | 백엔드·인프라 도구 조사 → resources/backend |
| `ai-tech-researcher` | AI 엔지니어링 도구 조사 → resources/ai |
| `model-researcher` | 오픈 웨이트 모델 조사 → models |
| `model-taxonomist` | 모델 type/thinking/모달리티 분류 판정과 일관성 점검 |
| `knowledge-writer` | 디자인 패턴·아키텍처·원칙 등 지식 노트 작성 → knowledge |
| `encyclopedia-writer` | 공식 문서 기반 백과사전 본문(사용법·DB별 사용법·언어 개요) 작성 |
| `fact-checker` | 출처·라이선스·수치·링크 독립 검증 (수정하지 않고 보고) |
| `site-builder` | 페이지·컴포넌트·스타일 작업, 브라우저로 확인 |

| 스킬 | 언제 |
| --- | --- |
| `survey-category` | 카테고리 하나를 조사해 신규·변경·폐기 항목을 반영 (주력 업데이트 루틴) |
| `refresh-hub` | 여러 카테고리를 병렬로 survey 하는 정기 업데이트 |
| `add-resource` | 도구·라이브러리 1건 추가 |
| `add-model` | 오픈 웨이트 모델 1건 조사·추가 |
| `classify-model` | 모델 type 판정 결정 트리 |
| `write-knowledge` | 지식 노트 1건 작성 |
| `write-encyclopedia` | 라이브러리·DB·언어 백과사전 본문 작성 (템플릿 A/B/C) |
| `validate-hub` | 스키마·타입·빌드·링크 검증 |

## 반드시 지킬 규칙

1. **정확성 우선.** 수치(파라미터, 컨텍스트, 공개일)·라이선스는 1차 출처(모델 카드, 공식 문서·블로그, 논문, `huggingface.co/api/models/<id>`)로 확인한 것만 적는다. 확인 못 한 필드는 **비워 두거나** `korean: unknown` 처럼 미확인 값을 쓴다. 추측으로 채우지 않는다.
2. **기억에 의존하지 않는다.** 지식 컷오프 이후 릴리스가 계속 나온다. 최신 여부는 반드시 웹/HF/GitHub로 확인한다.
3. **분류는 `src/taxonomy.ts` 만 따른다.** 새 카테고리가 필요하면 데이터에 임의 값을 넣지 말고 taxonomy.ts 를 먼저 고치고(`/taxonomy` 페이지는 자동 반영), 그 이유를 커밋 메시지에 남긴다.
4. **한국어 서술 스타일.** 설명은 1~2문장, "무엇이고 언제 쓰는지". 홍보 문구·최상급 표현("최고의", "혁신적인") 금지. 고유명사·코드는 원문 그대로.
5. **중복 금지.** 추가 전 `Grep` 으로 이름·URL·HF id 를 검색한다. `research/excluded.md` 에 있는 항목은 사유가 바뀌지 않는 한 다시 넣지 않는다.
6. **파일 id 규칙.** 소문자 kebab-case, 확장자 제외 파일명이 URL 이 된다. 모델은 HF 저장소명 기준(`qwen3-30b-a3b.yaml`).
7. 데이터 파일을 고치면 훅이 `astro sync` 로 스키마를 검증한다. 실패 메시지를 읽고 고친다.
8. `verifiedAt`/`updatedAt` 은 실제로 출처를 확인한 날짜로만 갱신한다.

## 명령

```bash
npm run dev        # 로컬 개발 서버 (http://localhost:4321/develop-wiki/)
npm run validate   # 스키마 + 타입 검사
npm run build      # 정적 빌드 → dist/
```

## 매일 자동 업데이트 (Hermes, 에이전트 없이 스크립트)

Hermes cron(매일 03:00, `--no-agent`)이 `hermes/run.sh` → `hermes/daily.mjs` 를 실행한다. **로컬 모델은 도구를 쓰는 에이전트가 아니라 "릴리스 노트 한 문장 요약 함수"로만 쓰인다**(파일은 스크립트가 쓴다). 이전에 로컬 모델이 파일을 직접 편집하게 했을 때 frontmatter 손상·규칙 위반이 반복돼 이 구조로 바꿨다.
- 버전·보안 이슈: 저장소 5개의 GitHub Releases·Security Advisories 를 `content/advisories/` 에 병합(보안 권고 제목은 원문 그대로, 릴리스 요약만 한국어 한 문장).
- 재검증: 저장소가 정상(archived 아님)이면 `verifiedAt` 만 갱신. archived·조회 실패는 로그에만.
- 신규 모델·라이브러리: **항목을 만들지 않고** `research/backlog.md` 에 후보로 적립. 실제 추가는 Claude Code `/refresh-hub`(또는 `/add-model`, `/add-resource`)가 검증 후 수행.
- `hermes/publish.sh` 가 변경 범위(`content/`, `research/`) → `hermes/lint.mjs` → `npm run validate` → 빌드를 통과해야만 main 에 push(→ Pages 자동 배포). 실패하면 변경을 `hermes/.failed/<날짜>/` 에 보관하고 작업 트리를 되돌린다.
- 로컬 모델 요약은 오류 가능성이 있어, `/refresh-hub` 때 `research/log/*-hermes.md` 의 변경 파일을 `fact-checker` 로 재검증한다.
- 수동 실행: `node hermes/daily.mjs --dry` (배포 없이 결과 확인) / `hermes cron run dc7a7670bbb3`.

main 브랜치에 push 하면 `.github/workflows/deploy.yml` 이 Pages 로 배포한다.
