---
name: The System Design Primer
url: https://github.com/donnemartin/system-design-primer
docs: https://github.com/donnemartin/system-design-primer#index-of-system-design-topics
repo: https://github.com/donnemartin/system-design-primer
stars: 379349
domain: backend
category: learning
description: 대규모 시스템 설계의 기본 주제(확장성, CAP, 캐시, 로드 밸런서, DB 복제·샤딩)와 면접 예제 풀이를 모은 GitHub 학습 자료. 시스템 설계 입문과 면접 준비에 쓴다.
pricing: oss
tags: [system-design, scalability, interview, distributed-systems]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Donne Martin 이 만든 GitHub 저장소로, 대규모 서비스를 설계할 때 알아야 할 개념을 한 README 에 주제별로 정리하고 외부 강의·글로 연결한다. 시스템 설계 면접 대비용으로 가장 널리 알려진 자료 중 하나다(GitHub 스타 37만 이상). 라이선스는 CC BY 4.0.

2026-11 기준 저장소는 archived 가 아니고 링크 수정 위주의 커밋이 2026-03 까지 이어지지만, **본문 내용 자체는 수년째 크게 바뀌지 않았다.** 개념 설명은 여전히 유효하지만 서버리스·Kubernetes·관리형 클라우드 서비스 같은 최근 구성은 다루지 않는다는 점을 감안하고 읽는다. 공식 번역은 일본어·중국어(간체·번체)만 있다.

## 구성
| 영역 | 내용 |
| --- | --- |
| 주제 색인 | 성능 vs 확장성, 지연 vs 처리량, 가용성 vs 일관성(CAP) |
| 일관성·가용성 패턴 | 약한/최종/강한 일관성, 페일오버, 복제, 가용성 수치(9의 개수) |
| 인프라 구성 요소 | DNS, CDN(push/pull), 로드 밸런서(L4/L7), 리버스 프록시 |
| 애플리케이션 계층 | 마이크로서비스, 서비스 디스커버리 |
| 데이터베이스 | RDBMS 복제·연합·샤딩·비정규화, NoSQL 유형, SQL vs NoSQL |
| 캐시 | 캐시 위치별 분류, cache-aside·write-through·write-behind·refresh-ahead |
| 비동기·통신 | 메시지 큐, 태스크 큐, 백프레셔, TCP/UDP, RPC vs REST |
| 면접 풀이 | Pastebin, Twitter 타임라인, 웹 크롤러, Mint.com, 소셜 그래프, 판매 랭킹, AWS 에서 수백만 사용자로 확장 |
| 객체지향 설계 풀이 | 해시 맵, LRU 캐시, 콜센터, 카드 덱, 주차장 (Jupyter 노트북) |
| 부록 | 2의 거듭제곱 표, 지연 시간 숫자, 실제 아키텍처·기업 블로그 링크, Anki 플래시카드 |

## 활용법
1. **학습 가이드 이미지로 범위를 정한다.** README 의 study guide 는 준비 기간(단기·중기·장기)별로 어떤 주제를 볼지 나눠 둔다.
2. **"How to approach" 4단계를 익힌다.** 요구사항·제약 정리 → 상위 설계 → 핵심 컴포넌트 설계 → 확장. 모든 풀이가 이 순서를 따른다.
3. **개념 → 풀이 순서로 반복한다.** 예를 들어 캐시 절을 읽은 뒤 Pastebin 풀이에서 캐시가 어디에 들어가는지 확인한다.
4. **봉투 뒷면 계산을 직접 해 본다.** 부록의 지연 시간 표를 보고 트래픽·저장량을 추정한다.
   ```text
   하루 쓰기 1,000만 건 × 평균 1KB = 약 10GB/일 → 3년이면 약 11TB
   10,000,000 / 86,400초 ≈ 초당 116건 (피크는 평균의 2~3배로 가정)
   ```
5. **Anki 덱으로 복습한다.** 저장소에 시스템 설계·시스템 설계 연습·OO 설계 덱이 있다(코딩 덱은 별도 저장소 interactive-coding-challenges).
6. **최신 구성으로 보완한다.** 풀이를 읽은 뒤 "지금이라면 관리형 큐·서버리스로 어떻게 바꿀까"를 따로 적어 본다.

## 함께 보면 좋은 자료
- 이 사이트의 지식 노트: [멱등성](/develop-wiki/knowledge/distributed-systems/idempotency/) · [사가](/develop-wiki/knowledge/distributed-systems/saga/) · [트랜잭셔널 아웃박스](/develop-wiki/knowledge/distributed-systems/transactional-outbox/) · [CQRS](/develop-wiki/knowledge/architecture/cqrs/) · [이벤트 드리븐](/develop-wiki/knowledge/architecture/event-driven/)
- 구성 요소 실물: [Redis](/develop-wiki/backend/database/redis/)(캐시), [PostgreSQL](/develop-wiki/backend/database/postgresql/)(복제·파티셔닝), [Cassandra](/develop-wiki/backend/database/cassandra/)(와이드 컬럼 NoSQL)
- roadmap.sh 의 System Design 로드맵 — 같은 주제를 학습 순서로 보여 준다.

## 언제 쓰나
- 쓸 때: 시스템 설계 면접 준비, 분산 시스템 용어를 한 번에 훑고 싶을 때, 팀 스터디 교재.
- 한계: 깊이보다 폭 위주이고, 최근 클라우드 네이티브 구성은 빠져 있다. 깊이 있는 이론은 원문 링크(논문·책)나 클라우드 아키텍처 센터 자료로 이어서 본다.

## 공식 문서
- [저장소 README](https://github.com/donnemartin/system-design-primer) · [면접 풀이 폴더](https://github.com/donnemartin/system-design-primer/tree/master/solutions/system_design) · [Anki 플래시카드](https://github.com/donnemartin/system-design-primer/tree/master/resources/flash_cards) · [라이선스](https://github.com/donnemartin/system-design-primer/blob/master/LICENSE.txt)
