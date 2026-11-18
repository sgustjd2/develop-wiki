# dev.hub — 개발자 레퍼런스 허브

프론트엔드·백엔드·AI 기술, 오픈 웨이트 모델, 개발 지식(디자인 패턴·아키텍처 등)을 **조사 → 분류 → 검증 → 게시**하는 저장소.
Astro 정적 사이트로 빌드해 GitHub Pages(https://sgustjd2.github.io/develop-wiki/)에 배포한다.

## 저장소 지도

| 경로 | 내용 |
| --- | --- |
| `src/taxonomy.ts` | **분류 체계의 단일 원천.** 도메인·카테고리·언어·모델 type·지식 분류 |
| `src/content.config.ts` | 콘텐츠 스키마(Zod). 분류 체계를 벗어난 데이터는 빌드가 실패한다 |
| `src/content/resources/<domain>/<id>.yaml` | 도구·라이브러리·서비스 링크 (frontend / backend / ai) |
| `src/content/models/<org>/<id>.yaml` | 오픈 웨이트 모델 |
| `src/content/knowledge/<category>/<id>.md` | 개발 지식 노트 |
| `src/pages/` | 사이트 페이지. `[domain]`, `languages/`, `models/`, `knowledge/`, `taxonomy/` |
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

main 브랜치에 push 하면 `.github/workflows/deploy.yml` 이 Pages 로 배포한다.
