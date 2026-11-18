# dev.hub — 개발자 백과사전

프론트엔드·백엔드·AI 기술, 오픈 웨이트 모델, 개발 언어, 디자인 패턴 같은 개발 지식을 공식 문서 기반으로 정리하는 개발자 백과사전.
→ https://sgustjd2.github.io/develop-wiki/

## 자료 구조 (Markdown 원본 + JSON)

```
content/
├── resources/<도메인>/<카테고리>/<id>.md   # 라이브러리·프레임워크·DB — 본문은 사용법 가이드
├── models/<조직>/<id>.md                    # 오픈 웨이트 모델
├── languages/<id>.md                        # 개발 언어
└── knowledge/<분류>/<id>.md                 # 디자인 패턴·아키텍처·원칙·분산 시스템 …
research/                                    # 조사 로그·백로그·제외 목록
```

- 각 `.md` 는 frontmatter(YAML)에 메타데이터, 본문에 백과사전 내용을 담는다.
- 같은 내용을 JSON 으로: `/data/resources.json`, `/data/models.json`, `/data/languages.json`, `/data/knowledge.json`
- 분류 체계는 [src/taxonomy.ts](src/taxonomy.ts) 하나가 기준이고, 빌드 때 스키마로 검증된다.

## 갱신 방식

| 누가 | 언제 | 무엇을 |
| --- | --- | --- |
| Hermes cron + 로컬 gemma4 (스크립트) | 매일 03:00 | 버전·보안 이슈 갱신, 저장소 재검증, 신규 모델·라이브러리 후보 적립 → 검사 통과 시 자동 배포 ([hermes/](hermes/)) |
| Claude Code 하네스 (`.claude/`) | 필요할 때 | 카테고리 survey, 팩트체크, 분류 일관성 점검, 대량 작성 |

Claude Code 에서:

```
/refresh-hub                        # 오래된 카테고리부터 골라 병렬 업데이트 + Hermes 결과 재검증
/survey-category backend/database   # 카테고리 하나 조사·반영
/write-encyclopedia Redis           # 사용법 본문 작성
/add-model Qwen/Qwen3-VL-8B-Instruct
```

## 로컬 실행

```bash
npm install
npm run dev        # http://localhost:4321/develop-wiki/
npm run validate   # 스키마 + 타입 검사
```
