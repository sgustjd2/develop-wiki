---
title: 정보 냄새(Information Scent)와 정보 탐색 이론
aka: [Information Scent, Information Foraging, Scent Trail, Link Label, 정보 단서, 정보 포리징]
category: ui-ux
group: interaction
level: intermediate
summary: 사용자가 링크·검색 결과의 단서로 "여기서 답을 얻을 가능성과 드는 노력"을 추정해 이동한다는 정보 탐색 이론과, 링크 레이블·스니펫·랜딩 설계에 주는 함의.
tags: [ux, information-scent, information-foraging, navigation, search, link-label, nngroup]
related: [ui-ux/search-filter-sort, ui-ux/information-architecture-card-sorting, ui-ux/navigation-patterns, ui-ux/cognitive-load-progressive-disclosure, ui-ux/ux-writing-principles]
sources:
  - https://www.nngroup.com/articles/information-foraging/
updatedAt: 2026-11-19
---

## 문제

- "자료실", "더 알아보기", "솔루션" 같은 레이블은 다음에 무엇이 있는지 알려 주지 않아 사용자가 클릭해 보고 되돌아오는 비용을 치른다.
- 메뉴 구조가 논리적이어도 레이블이 사용자의 목표와 안 맞으면 길을 잃는다.

## 해법

### 이론의 요지 (NN/g)

사용자는 다음 이동을 고를 때 두 가지를 추정한다고 본다. 그 페이지가 답을 줄 가능성, 그리고 답에 이르는 노력. 이 "방문 전 가치 추정"이 **정보 냄새**다. 목표에 상대적이라 같은 "음식" 링크가 어떤 사람에겐 유망하고 어떤 사람에겐 무용하다.

냄새의 출처:

- **보이는 것**: 링크 레이블(가장 중요), 옆의 스니펫·썸네일, 주변 맥락, 위치.
- **이미 아는 것**: 브랜드 신뢰, 분야 친숙도, 과거 경험, 타인 추천·평점.

### 설계 함의

- 링크는 구체적이고 쉬운 말로. 전문용어·브랜드 용어·"더 알아보기" 회피.
- 요약은 레이블을 반복하지 말고 정보를 더한다.
- 이미지는 장식이 아니라 범주를 대표하게.
- 맥락이 작은 화면에서 숨을 수 있으니 레이블 자체를 구체적으로.
- 랜딩 첫 화면에 "제대로 왔다"는 맥락을 준다.
- 낚시성 제목은 클릭을 얻어도 신뢰를 잃어 다음 클릭 확률을 낮춘다.

```ts
// 링크 레이블 린트: 모호한 문구 탐지 (휴리스틱)
const vague = ["더 알아보기", "자세히", "여기", "클릭", "Learn more", "Click here"];
const weak = (label: string) => vague.some((v) => label.trim().toLowerCase() === v.toLowerCase());
```

### 검색 UX 와의 연결

검색 결과의 제목·스니펫이 곧 냄새다. 결과 0건·필터 적용 방식은 [검색·필터·정렬 UX](/develop-wiki/knowledge/ui-ux/search-filter-sort/), 정보 구조 검증은 [카드 소팅](/develop-wiki/knowledge/ui-ux/information-architecture-card-sorting/), 메뉴 패턴은 [내비게이션 패턴](/develop-wiki/knowledge/ui-ux/navigation-patterns/)에 있다.

## 언제 쓰나

- 내비게이션·검색 결과·카드 목록의 레이블 점검, 탐색 시 뒤로 가기가 많은 구간 분석.
- 사용성 테스트 과업을 "어디를 클릭하겠는가" 관점으로 관찰할 때.

## 체크리스트

- [ ] 핵심 링크 레이블이 목표 언어와 맞다(사용자 말로 쓴다)
- [ ] 같은 화면에서 레이블이 겹치거나 모호하지 않다
- [ ] 결과 스니펫이 레이블에 정보를 더한다
- [ ] 랜딩 첫 화면에서 현재 위치와 다음 단계가 보인다

## 흔한 실수·주의

- **내부 조직·제품 용어로 이름 붙인다.** 사용자 어휘를 카드 소팅·로그로 확인한다.
- **냄새 강화를 위해 낚시성 문구를 쓴다.** 단기 클릭, 장기 신뢰 하락.
- **정보 포리징 이론의 patch·diet 등 세부 개념과 원 논문(Pirolli & Card, 1999)은 읽지 못했다.** NN/g 해당 글은 이를 다루지 않으며, 이 노트는 NN/g 글에 쓰인 범위만 담는다.
