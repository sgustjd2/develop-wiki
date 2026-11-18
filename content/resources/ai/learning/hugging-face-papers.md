---
name: Hugging Face Papers
url: https://huggingface.co/papers
docs: https://huggingface.co/docs/hub/paper-pages
domain: ai
category: learning
description: 매일 올라오는 AI 논문과 트렌딩 논문을 모델·데이터셋·코드와 연결해 보여 주는 Hugging Face 의 논문 피드. 종료된 Papers with Code 대신 최신 연구를 훑을 때 쓴다.
pricing: free
tags: [papers, arxiv, research, trending]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Hugging Face Papers 는 arXiv 논문마다 페이지를 만들어 커뮤니티 추천(upvote)·토론·관련 Hub 자원을 모아 주는 서비스다. 커뮤니티가 고른 **Daily Papers** 와, GitHub 스타 등을 반영한 **Trending Papers**(일·주·월) 두 가지 피드가 중심이다.
Meta 가 2025년 7월 Papers with Code 를 종료한 뒤 paperswithcode.com 은 huggingface.co/papers/trending 으로 리디렉션된다(2026-11-18 확인, HTTP 302). 다만 Papers with Code 의 과제별 SOTA 리더보드는 옮겨 오지 않았다.

## 시작하기
- 계정 없이 읽을 수 있다. 추천·댓글·논문 제출·저자 인증은 무료 계정이 필요하다.
- 아무 arXiv id 를 `https://huggingface.co/papers/<arXiv id>` 로 열면 해당 논문 페이지가 나온다(예: `/papers/2106.09685` = LoRA).
- 매일 트렌딩 논문 메일 구독을 페이지에서 켤 수 있다.

## 구성
| 요소 | 설명 |
| --- | --- |
| Daily Papers | 커뮤니티가 매일 제출·추천한 논문 목록. 날짜별로 탐색 |
| Trending Papers | 최근 관심이 몰린 논문. 카드에 GitHub 저장소와 스타 수 표시 |
| 논문 페이지 | 초록, AI 요약·키워드, 토론, 이 논문을 인용한 모델·데이터셋·Space 목록 |
| arXiv 연결 | 모델 카드에 arXiv 링크가 있으면 `arxiv:<id>` 태그가 붙어 논문 페이지와 자동 연결 |
| 조직 배지 | 제출한 연구 조직(Meta, Google 등) 표시 |

## 기본 사용법
공개 API 로 오늘의 논문과 특정 논문의 연결 자원을 조회한다(인증 불필요, 2026-11-18 동작 확인).

```bash
# 오늘의 Daily Papers 상위 5개 제목
curl -s 'https://huggingface.co/api/daily_papers?limit=5' | jq -r '.[].paper.title'

# 특정 날짜
curl -s 'https://huggingface.co/api/daily_papers?date=2026-11-17' | jq -r '.[].paper | "\(.upvotes)\t\(.title)"'

# 키워드 검색
curl -s 'https://huggingface.co/api/papers/search?q=speculative%20decoding' | jq -r '.[].paper.title' | head

# 논문 하나의 메타데이터 + 연결된 모델·데이터셋·Space 수
curl -s 'https://huggingface.co/api/papers/2106.09685' | jq '{title, upvotes, numTotalModels, numTotalDatasets, numTotalSpaces}'

# 그 논문을 인용한 Hub 모델
curl -s 'https://huggingface.co/api/models?filter=arxiv:2106.09685&limit=5' | jq -r '.[].id'
```

## 자주 쓰는 패턴
- **아침 훑어보기**: Trending(주간)으로 큰 흐름을 보고, 관심 논문만 페이지에서 AI 요약 → 초록 → 본문 순으로 읽는다.
- **"코드가 있는가" 확인**: 논문 페이지의 GitHub 링크와 연결 모델 목록으로 재현 가능성을 먼저 거른다.
- **자기 모델을 논문과 연결**: 모델 카드 README 에 arXiv 링크를 넣으면 논문 페이지에 자동으로 노출된다.
- **사내 다이제스트 자동화**: 위 `daily_papers` API 를 매일 호출해 키워드로 거른 뒤 메신저로 보내는 스크립트를 둔다.

## 언제 쓰나 / 피할 때
- 쓸 때: 최신 LLM·에이전트·멀티모달 연구를 빠르게 따라갈 때, 논문과 공개 가중치·데이터셋을 한 번에 찾을 때.
- 피할 때(대안): 과제별 벤치마크 순위가 필요하면 각 벤치마크의 공식 리더보드나 [Arena](/develop-wiki/ai/learning/arena/) 같은 평가 사이트를 본다. 체계적 문헌 조사는 Google Scholar·Semantic Scholar 처럼 인용 그래프를 제공하는 도구가 낫다. 피드는 커뮤니티 추천 기반이라 화제성 편향이 있다.

## 공식 문서
- [Daily Papers](https://huggingface.co/papers) · [Trending Papers](https://huggingface.co/papers/trending) · [Paper Pages 문서](https://huggingface.co/docs/hub/paper-pages)
