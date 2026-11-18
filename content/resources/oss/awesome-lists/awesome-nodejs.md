---
name: Awesome Node.js
url: https://github.com/sindresorhus/awesome-nodejs
repo: https://github.com/sindresorhus/awesome-nodejs
stars: 67545
domain: oss
category: awesome-lists
description: Node.js 패키지와 학습 자료를 용도별로 엄선한 목록. 서버·CLI·빌드 스크립트에 쓸 npm 패키지 후보를 찾을 때 쓴다.
pricing: oss
tags: [awesome, nodejs, npm, javascript, packages]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Sindre Sorhus 가 직접 관리하는 Node.js 목록이다. 항목 수를 늘리기보다 용도별로 골라 담는 편이라 목록이 짧고, 관리자 본인이 만든 작은 유틸리티 패키지가 많이 섞여 있다. 2026-11 기준 별 약 6.8만, 라이선스 CC0-1.0.

archived 는 아니지만 **최근 6개월 커밋이 1건**(2026-09)뿐이다. 새 패키지 반영이 느리므로 최신 도구(예: Bun·Deno 호환 라이브러리, 최신 테스트 러너)는 다른 경로로 보완한다.

## 무엇이 들어 있나
| 섹션 | 내용 |
| --- | --- |
| Official | Node.js 공식 사이트·문서·저장소 |
| Packages | Command-line apps/utilities, HTTP, Web frameworks, Database, Testing, Logging, Debugging/Profiling, Build tools, Job queues, Authentication, Data validation, Streams, Filesystem, Date, Image, Security 등 50여 분류 |
| Package Manager | npm, pnpm, Yarn 등 |
| Resources | Tutorials, Articles, Newsletters, Videos, Books, Blogs, Courses, Cheatsheets, Community |
| Related lists | 다른 JavaScript 관련 awesome 리스트 |

## 이렇게 활용하라
1. **Packages 의 용도별 분류로 후보를 찾는다.** 예: Job queues 에서 큐 라이브러리를 보고 이 사이트의 [BullMQ](/develop-wiki/backend/messaging/bullmq/) 와 비교한다.
2. **npm 에서 상태를 확인한다.** 주간 다운로드, 마지막 배포일, ESM/CJS 지원, 타입 정의(`types` 필드) 여부를 본다.
3. **작은 유틸리티는 내장 API 로 대체 가능한지 본다.** 최근 Node.js 는 `fetch`, `node:test`, `util.parseArgs`, `fs.glob` 등 기능을 내장했다.
   ```bash
   npm view <패키지> version time.modified type   # 버전·최근 배포·모듈 형식 확인
   ```
4. **Resources 는 입문용으로만 쓴다.** 글·강의 링크는 오래된 것이 많아 공식 문서와 병행한다.

## 주의
- 갱신 빈도가 낮다. 링크된 패키지 상당수가 관리자 개인 패키지이고, 일부는 ESM 전용이라 CJS 프로젝트에서 바로 못 쓸 수 있다.
- 한국어 번역은 없다.

## 링크
- [저장소 README](https://github.com/sindresorhus/awesome-nodejs) · [기여 가이드](https://github.com/sindresorhus/awesome-nodejs/blob/main/contributing.md)
- 이 사이트: [Node.js](/develop-wiki/backend/runtime-language/nodejs/) · [Express](/develop-wiki/backend/web-framework/express/) · [Awesome JavaScript](/develop-wiki/oss/awesome-lists/awesome-javascript/)
