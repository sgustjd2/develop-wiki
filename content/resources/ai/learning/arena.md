---
name: Arena
url: https://arena.ai
docs: https://arena.ai/blog/
domain: ai
category: learning
description: 익명의 두 모델 응답을 사용자가 비교 투표해 순위를 매기는 공개 리더보드(옛 LMArena·Chatbot Arena). 텍스트·코딩·에이전트·이미지 등 분야별 모델 선택의 참고 자료로 쓴다.
pricing: free
tags: [leaderboard, benchmark, evaluation, human-preference]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Arena 는 같은 프롬프트에 대한 두 모델의 답을 이름을 가린 채 보여 주고, 사용자가 더 나은 쪽에 투표한 결과를 모아 순위를 내는 평가 플랫폼이다. UC Berkeley 연구 프로젝트 Chatbot Arena 에서 출발해 LMArena 로 회사가 됐고, 2026년 초 이름에서 "LM" 을 빼고 **Arena**(arena.ai)로 바꿨다. lmarena.ai 는 arena.ai 로 301 리디렉션된다(2026-11-18 확인).
고정 문항 벤치마크와 달리 실제 사용자 프롬프트와 선호를 반영하므로, "사람이 체감하는 품질" 지표로 쓰인다. 반대로 스타일·길이 같은 표면 요인과 투표자 분포의 영향을 받는다는 한계가 있다.

## 시작하기
- 사이트에서 프롬프트를 입력하면 Battle 모드로 익명 두 모델의 답이 나오고, 투표하면 모델 이름이 공개된다.
- 순위는 [리더보드](https://arena.ai/leaderboard)에서 분야별로 본다. 투표·열람은 무료다.
- 방법론 변경·신규 지표 공지는 [블로그](https://arena.ai/blog/)에 올라온다.

## 구성 (2026-11 리더보드 메뉴 기준)
| 분류 | 리더보드 |
| --- | --- |
| 종합 | Overall, Agent, Alignment Index |
| Chat | Text, Vision, Document, Search |
| Code | WebDev, Image-to-WebDev |
| Image | Text to Image, Image Edit |
| Video | Text to Video, Image to Video, Video Edit |

| 개념 | 설명 |
| --- | --- |
| 쌍대 비교 투표 | 익명 두 응답 중 선호를 고르는 방식. 수많은 투표를 모아 모델별 점수로 환산 |
| 신뢰 구간 | 점수 차가 작으면 구간이 겹쳐 통계적으로 구분되지 않는다. 순위 숫자보다 구간을 본다 |
| AutoEval | 신규 모델 출시 직후, Arena 선호 데이터로 학습한 보상 모델의 대리 투표로 매기는 임시 점수. 사람 투표가 쌓이면 대체된다 |
| Agent 리더보드 | 에이전트 과제 성공률을 과제당 비용과 함께 보여 주며, 비용 대비 성능(Pareto) 뷰를 제공 |

## 기본 사용법
모델 후보를 고를 때의 읽는 순서 예시.

1. 쓰려는 분야의 리더보드(예: 코드 생성이면 WebDev, 에이전트면 Agent)를 연다. Overall 만 보지 않는다.
2. 상위권 중 점수 신뢰 구간이 겹치는 모델은 동급으로 묶는다.
3. "AutoEval" 표시가 붙은 점수는 잠정치로 본다.
4. 가격·라이선스·컨텍스트 길이로 후보를 2~3개로 줄인다(오픈 웨이트 후보는 이 사이트의 [모델 목록](/develop-wiki/models/)과 대조).
5. 마지막 판단은 자기 데이터로 하는 평가로 내린다. 리더보드는 후보를 좁히는 용도다.

## 자주 쓰는 패턴
- **분야별 리더보드 우선**: 일반 대화 순위와 코딩·문서·검색 순위는 자주 다르다.
- **비용 축과 함께 보기**: Agent 리더보드의 Pareto 뷰로 "성능이 비슷하면 더 싼 모델" 을 고른다.
- **직접 비교**: 후보 두 모델을 사이트에서 같은 실제 프롬프트로 돌려 보고 체감 차이를 확인한다(외부 서비스이므로 민감 정보·사내 코드는 넣지 않는다).
- **방법론 공지 추적**: 점수 산정 방식이 바뀌면 과거 순위와 직접 비교하지 않는다.

## 언제 쓰나 / 피할 때
- 쓸 때: 상용·오픈 모델 후보를 빠르게 좁힐 때, 신규 모델이 체감 품질에서 어디쯤인지 볼 때.
- 피할 때(대안): 특정 도메인 정확도·안전성·지연 시간 판단에는 맞지 않는다. 자체 테스트 세트로 평가하는 도구(평가·LLMOps 카테고리)를 쓰고, 최신 연구 동향은 [Hugging Face Papers](/develop-wiki/ai/learning/hugging-face-papers/) 에서 본다.

## 공식 문서
- [Arena 홈](https://arena.ai) · [리더보드](https://arena.ai/leaderboard) · [블로그](https://arena.ai/blog/) · [이름 변경 공지](https://arena.ai/blog/lmarena-is-now-arena/) · [AutoEval 소개](https://arena.ai/blog/autoeval-scores)
