---
title: 사회연결망 분석(SNA) — 중심성·커뮤니티 탐지
aka: [Social Network Analysis, SNA, Centrality, Degree Centrality, Closeness, Betweenness, Eigenvector Centrality, PageRank, Louvain, Modularity]
category: machine-learning
group: unstructured
level: intermediate
summary: 노드·엣지로 관계를 표현하는 그래프 용어와 연결·근접·매개·고유벡터·PageRank 중심성, 모듈성과 Louvain 커뮤니티 탐지를 정의 식과 작은 그래프의 손계산·networkx 일치 검증으로 정리한다.
tags: [sna, graph, centrality, pagerank, community-detection, louvain, modularity, networkx]
related: [machine-learning/text-mining-tfidf-tokenization, machine-learning/clustering-kmeans-hierarchical-dbscan, machine-learning/association-rules-apriori-fp-growth, algorithms/graph-representation, algorithms/shortest-path]
sources:
  - https://networkx.org/documentation/stable/reference/algorithms/generated/networkx.algorithms.centrality.degree_centrality.html
  - https://networkx.org/documentation/stable/reference/algorithms/generated/networkx.algorithms.centrality.closeness_centrality.html
  - https://networkx.org/documentation/stable/reference/algorithms/generated/networkx.algorithms.centrality.betweenness_centrality.html
  - https://networkx.org/documentation/stable/reference/algorithms/generated/networkx.algorithms.centrality.eigenvector_centrality.html
  - https://networkx.org/documentation/stable/reference/algorithms/generated/networkx.algorithms.link_analysis.pagerank_alg.pagerank.html
  - https://networkx.org/documentation/stable/reference/algorithms/generated/networkx.algorithms.community.quality.modularity.html
  - https://networkx.org/documentation/stable/reference/algorithms/generated/networkx.algorithms.community.louvain.louvain_communities.html
  - https://networkx.org/documentation/stable/reference/algorithms/generated/networkx.algorithms.cluster.clustering.html
  - https://networkx.org/documentation/stable/reference/generated/networkx.classes.function.density.html
  - https://arxiv.org/abs/0803.0476
  - https://research.google/pubs/the-anatomy-of-a-large-scale-hypertextual-web-search-engine/
updatedAt: 2026-11-23
---

## 개요

사회연결망 분석(SNA)은 사람·기관·문서 같은 대상(노드)과 그 관계(엣지)를 그래프로 놓고 구조를 수치로 읽는 방법이다. 누가 연결의 중심인가(중심성), 어떤 덩어리로 뭉쳐 있는가(커뮤니티)를 묻는다. SNS 팔로우, 공저, 거래, 웹 링크 분석에 쓴다. "중심"이라는 말이 여러 뜻이어서 **어떤 중심성을 쓸지가 곧 질문의 정의**다.

## 시험 범위 대응

ADP 데이터분석 "비정형 데이터 마이닝 → 사회연결망 분석" 에 대응한다. 빅데이터분석기사 공식 범위에는 SNA 항목이 직접 없다(관련: 2과목 "비정형 데이터 탐색"). 그래프 자료구조는 [그래프 표현](/develop-wiki/knowledge/algorithms/graph-representation/), 최단 경로는 [최단 경로](/develop-wiki/knowledge/algorithms/shortest-path/) 참고.

## 핵심 용어

| 한국어 | 영어 | 정의 |
| --- | --- | --- |
| 노드(정점) | node, vertex | 분석 대상 개체 |
| 엣지(간선, 링크) | edge, link | 노드 사이의 관계 |
| 방향·무방향 | directed / undirected | 관계에 방향이 있는지(팔로우 vs 친구) |
| 가중치 | weight | 엣지의 강도(거래액, 횟수) |
| 차수 | degree | 노드에 붙은 엣지 수. 방향 그래프는 진입 차수·진출 차수로 나뉜다 |
| 밀도 | density | 가능한 엣지 대비 실제 엣지 비율. 무방향 `2m/(n(n−1))`, 방향 `m/(n(n−1))`(networkx) |
| 경로·최단 경로 | path, shortest path | 노드를 잇는 엣지 열 / 그중 가장 짧은 것 |
| 지름 | diameter | 모든 노드 쌍 최단 거리 중 최댓값 |
| 군집 계수 | clustering coefficient | 노드의 이웃끼리 서로 연결된 비율. 무방향 비가중에서 `2T(u) / (deg(u)(deg(u)−1))`, T 는 u 를 지나는 삼각형 수. 차수 2 미만은 0(networkx) |
| 중심성 | centrality | 노드가 구조에서 차지하는 중요도 지표 |
| 커뮤니티 | community | 내부 연결이 외부보다 조밀한 노드 묶음 |
| 모듈성 | modularity | 분할의 커뮤니티 내부 연결이 무작위 기대보다 얼마나 많은지 |

## 중심성

n 은 노드 수. networkx 문서 기준 식이다.

| 지표 | 질문 | 식·성질 |
| --- | --- | --- |
| 연결 중심성 degree | 직접 연결이 많은가 | 차수 / (n−1). 자기 루프·중복 엣지가 있으면 1 초과 가능 |
| 근접 중심성 closeness | 모두에게 가까운가 | `(n−1) / Σ d(v,u)`. 방향 그래프는 **들어오는** 거리 기준. 비연결 그래프는 Wasserman-Faust 보정(기본 켜짐) |
| 매개 중심성 betweenness | 다른 쌍의 최단 경로를 중개하는가 | `Σ σ(s,t∣v)/σ(s,t)` 를 정규화. 무방향 기본 정규화 계수 `(n−1)(n−2)/2`, 끝점 제외가 기본값 |
| 고유벡터 중심성 eigenvector | 중요한 노드와 이어졌는가 | 인접 행렬의 최대 고유값에 대한 고유벡터(방향 그래프는 진입 엣지 기준). 노름 1 로 반환 |
| PageRank | 중요한 노드가 가리키는가 | 진입 링크 구조 기반. networkx 기본 감쇠 계수 α = 0.85 |

- Freeman, "Centrality in networks: I. Conceptual clarification", *Social Networks* 1:215–239 가 연결·근접·매개의 개념 정리로 알려져 있다(networkx 는 1979 로 인용, 일부 문헌은 1978/79 로 적는다. 본문은 확인하지 못했다). networkx 문서는 매개 중심성의 원 논문으로 Freeman 1977(*Sociometry* 40:35–41)을 인용한다.
- **고유벡터 중심성**은 이웃의 점수를 이웃 점수의 합으로 정의한다. 강연결이면 Perron-Frobenius 정리로 모든 성분이 양수인 유일한 해가 있고, 아니면 0 인 성분이 생기거나 해가 여럿일 수 있다(networkx 문서).
- **PageRank** 는 고유벡터 중심성의 변형으로(일반 서술이며 networkx PageRank 문서의 문장은 아니다), 노드가 가진 점수를 진출 링크 수로 나눠 이웃에 나눠 준다. 임의 서퍼가 감쇠 확률 α 로 링크를 따라가고 `1−α` 로 무작위 점프한다는 해석이 일반적이다. 아래 식은 networkx 계산과 일치함을 검산한 형태이며, Brin & Page(1998) 논문 본문의 식은 읽지 못했다(초록만).

`PR(v) = (1−α)/N + α · Σ_{u→v} PR(u) / outdeg(u)`

- 진출 엣지가 없는 노드(dangling)는 networkx 기본에서 균등 분포(개인화 벡터)로 점프 엣지를 받는다. 무방향 그래프는 엣지마다 양방향 두 개로 변환해 계산한다.

## 커뮤니티 탐지

- **모듈성** (networkx): `Q = (1/2m) Σ_ij (A_ij − γ k_i k_j / 2m) δ(c_i, c_j)`. 해상도 γ 기본 1, 1 보다 작으면 큰 커뮤니티, 크면 작은 커뮤니티를 선호한다. 같은 식의 커뮤니티별 합 형태는 `Σ_c [L_c/m − (k_c/2m)²]` 이다(L_c 내부 엣지 수, k_c 커뮤니티 차수 합).
- **Louvain**(Blondel 등 2008): 모듈성을 탐욕적으로 최적화하는 휴리스틱. 1단계에서 각 노드를 모듈성 이득이 가장 큰 이웃 커뮤니티로 옮기고, 2단계에서 커뮤니티를 노드로 묶은 뒤 반복한다(networkx 문서). 논문은 이동통신망(고객 260만)·웹 그래프(노드 1억 1,800만, 링크 10억 초과)에 적용했다고 보고한다.
- 노드 순서를 무작위로 섞으므로 **시드에 따라 결과가 달라질 수 있다**(networkx).
- 모듈성은 해상도 한계가 있다고 알려져 있으나 이 노트에서 원문으로 확인하지 않았다.

## 헷갈리는 구분

| 쌍 | 구분 |
| --- | --- |
| 연결 vs 고유벡터 중심성 | 연결은 이웃 **수**, 고유벡터는 이웃의 **중요도**까지 반영 |
| 근접 vs 매개 | 근접은 모두와의 평균 거리, 매개는 남들 사이 경로를 지나는 정도(다리 역할) |
| 고유벡터 vs PageRank | PageRank 는 진출 링크로 나누고 감쇠·무작위 점프가 있다 |
| 밀도 vs 군집 계수 | 밀도는 전체 그래프 하나의 값, 군집 계수는 노드 이웃의 삼각형 비율(노드별) |
| 방향 그래프의 근접 | 들어오는 거리 기준(networkx 문서). 2.2 이하는 `distance` 지정 시 나가는 거리가 쓰이는 버그가 있어 2.3 에서 고쳐졌다. 나가는 거리가 필요하면 `G.reverse()`. 책마다 다를 수 있다는 것은 필자의 일반 서술 |
| 평균 군집 계수 vs 전이성 | 노드별 계수의 평균과 전체 삼각형 비율은 다른 값(아래 예: 0.778 vs 0.6) |

## 직접 계산

Python 3.15, networkx 3.7, numpy 2.5.5. 무방향 그래프 6 노드 7 엣지: A-B, A-C, B-C, C-D, D-E, D-F, E-F (삼각형 두 개를 C-D 다리가 잇는 모양).

- 밀도 2·7/(6·5)=0.4667, 지름 3, 평균 최단 거리 1.8.
- 연결 중심성: C·D 0.6, 나머지 0.4. 근접: C·D 0.7143(=5/7), 나머지 0.5. 손으로 BFS 거리를 합산해 networkx 와 일치.
- 매개: 모든 쌍을 나열해 센 값이 C·D 6.0, 나머지 0. 정규화(÷(n−1)(n−2)/2=10)하면 0.6 으로 networkx 와 차이 1e-16. 다리 노드만 값이 크다.
- 고유벡터: `numpy.linalg.eigh` 의 최대 고유값 2.4142, 고유벡터 C·D 0.5, 나머지 0.3536 = networkx 와 차이 6e-8.
- 군집 계수: A·B·E·F 1.0, C·D 1/3. 평균 0.7778, 전이성(transitivity) 0.6.
- PageRank: 방향 그래프 A→B, A→C, B→C, C→A, D→C 에서 α=0.85 전력 반복(200회)이 networkx 와 일치(차이 5.6e-13): A 0.3725, B 0.1958, C 0.3941, D 0.0375, 합 1. 들어오는 링크가 없는 D 는 `(1−α)/N = 0.0375` 의 최소값.
- 모듈성: 분할 {A,B,C}, {D,E,F} → 수식 `Σ[L_c/m − (k_c/2m)²]` 0.3571 = networkx. Louvain(seed 0)이 같은 분할을 반환.
- Zachary 가라테 클럽에서 Louvain 을 시드 0~4 로 돌리면 모듈성이 0.4439, 0.4439, 0.4449, 0.4439, 0.4345 로 시드마다 다르다.

## 언제 쓰나 / 주의

- 영향력 있는 노드 탐색(매개·PageRank), 확산·바이럴 분석, 조직·공저·거래 구조 파악, 이상 거래 그룹 탐지.
- 중심성 값은 그래프 정의(방향·가중치·엣지 기준)에 크게 의존한다. 엣지를 어떻게 만들었는지가 결과를 좌우한다.
- 매개 중심성은 계산 비용이 커서 큰 그래프에서는 표본 근사(networkx 의 `k`)를 쓴다. 정확 계산은 Brandes(2001) 알고리즘 기반(문서 인용).
- 비연결 그래프에서 근접 중심성 정의가 구현마다 다르다. Louvain 은 휴리스틱이라 전역 최적을 보장하지 않으며 결과 재현에 시드를 고정한다.
- 개인 간 관계 데이터는 개인정보 이슈가 있다.

## 검증 범위

- networkx 3.7 문서 9개 페이지(밀도·군집 계수·4개 중심성·PageRank·모듈성·Louvain), Blondel 등 arXiv 초록, Brin & Page 1998 의 Google Research 초록 페이지를 읽었다.
- 미확인: Freeman 의 개념 정리 논문 본문, Brin & Page 1998 의 PageRank 식 원문(스탠퍼드 서버 접속 실패), Page 등 1999 보고서, 모듈성의 해상도 한계에 관한 문헌, "6단계 분리"·약한 연결 같은 SNA 이론 용어(다루지 않음).
- 실행하지 않은 것: 대규모 그래프, 가중치 있는 그래프, 방향 그래프의 근접·매개.
