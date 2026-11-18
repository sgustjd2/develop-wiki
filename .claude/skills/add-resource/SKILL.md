---
name: add-resource
description: 프론트엔드·백엔드·AI 도구, 라이브러리, 서비스, 레퍼런스 1건을 dev.hub 에 추가하거나 갱신한다. "○○ 추가해줘" 요청이나 리서처 에이전트의 항목 작성 절차.
---

# 리소스 추가

## 1. 중복 확인
```bash
grep -ril "<이름 또는 도메인>" src/content/resources research/excluded.md
```

## 2. 분류
- `domain`: frontend | backend | ai — 사용자가 **어디서** 쓰는가로 정한다. (예: Playwright → frontend/testing, pgvector → ai/vector-db 보다는 backend/database 확장이지만 주 용도가 벡터 검색이면 ai/vector-db)
- `category`: `src/taxonomy.ts` 의 해당 domain categories 중 하나. 두 곳에 걸치면 **주 용도** 하나만.
- `languages`: 그 도구를 쓰는 코드의 언어 (`LANGUAGES` 키). 언어 무관(DB 서버, 표준, SaaS, 순수 CSS)이면 비운다. 공식 SDK 가 여러 언어면 공식 지원 언어만.
- `pricing`: oss(오픈소스 라이선스) / free(무료지만 비공개) / freemium / paid. 오픈소스 + 유료 클라우드면 oss.

## 3. 사실 확인
- 공식 사이트 URL 과 저장소 URL 이 실제로 열리는지 확인.
- GitHub 이면 `gh api repos/<owner>/<repo> --jq '{archived, pushed_at, license: .license.spdx_id}'`.
- 한국어 공식 문서나 공식 번역이 있고 **시작하기 등 핵심 가이드까지 번역돼 있으면** `koreanDocs: true`. 소개 페이지 몇 개만 번역된 부분 번역은 false.

## 4. 파일 작성 — `src/content/resources/<domain>/<kebab-id>.yaml`
```yaml
name: 공식 표기 그대로
url: https://공식-사이트
repo: https://github.com/owner/repo   # 있으면
domain: backend
category: web-framework
description: 무엇인지 + 언제 쓰는지, 1~2문장(160자 이내). 홍보 문구 금지.
pricing: oss
tags: [소문자, 키워드]
languages: [go]
koreanDocs: false
addedAt: YYYY-MM-DD      # 처음 추가한 날
verifiedAt: YYYY-MM-DD   # 위 3단계를 실제로 확인한 날
```

## 5. 검증
저장하면 훅이 `astro sync` 로 스키마를 검사한다. 실패하면 메시지대로 고친다.
