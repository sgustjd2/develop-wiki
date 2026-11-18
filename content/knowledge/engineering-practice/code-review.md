---
title: 코드 리뷰
aka: [Code Review, Pull Request Review, CL Review]
category: engineering-practice
level: beginner
summary: 변경을 메인라인에 합치기 전에 다른 개발자가 읽고 설계·정확성·테스트·가독성을 확인해, 코드베이스 전체 건강도가 나빠지지 않게 하는 관행.
tags: [collaboration, pull-request, quality]
related: [engineering-practice/trunk-based-vs-git-flow, engineering-practice/ci-cd-pipeline, principles/dry-kiss-yagni]
sources:
  - https://google.github.io/eng-practices/review/reviewer/standard.html
  - https://google.github.io/eng-practices/review/reviewer/looking-for.html
  - https://google.github.io/eng-practices/review/reviewer/speed.html
  - https://google.github.io/eng-practices/review/developer/small-cls.html
updatedAt: 2026-11-18
---

## 문제

- 리뷰가 "완벽할 때까지 승인 안 함"이 되면 변경이 며칠씩 묶이고, 작성자는 리뷰를 피하려 변경을 크게 뭉친다.
- 반대로 형식적인 LGTM 만 오가면 설계 문제·버그·테스트 누락이 그대로 들어간다.
- 1,000줄짜리 PR 은 아무도 제대로 읽지 못한다.

## 해법

### 승인 기준

Google 엔지니어링 관행 문서의 기준: **이 변경이 코드베이스 전체 건강도를 확실히 개선하면 완벽하지 않아도 승인한다.** 명백히 나빠지게 하는 변경은 (긴급 상황이 아니면) 받지 않는다.

- 의견보다 **기술적 사실과 데이터**가 우선한다.
- 스타일은 스타일 가이드가 최종 권위다. 가이드에 없는 취향은 강요하지 않는다.
- 동등하게 타당한 설계가 여럿이면 작성자의 선택을 존중한다.
- 사소한 지적은 `Nit:` 를 붙여 "무시해도 됨"을 표시한다.

### 무엇을 보나 (우선순위 순)

1. **설계** — 이 코드가 여기 있어야 하나, 시스템에 잘 맞나
2. **기능** — 의도대로 동작하나, 경계 조건·동시성 문제는 없나
3. **복잡도** — 필요 이상으로 어렵지 않나, 아직 필요 없는 일반화(과설계)는 없나
4. **테스트** — 코드가 깨지면 실제로 실패하는 테스트인가
5. **이름·주석** — 주석은 "무엇"이 아니라 "왜"를 설명하나
6. 스타일, 문서 갱신, 일관성

### 작게 보내기

- 변경 하나는 **한 가지 일**만 한다. 대략 100줄은 적당하고 1,000줄은 보통 너무 크다(줄 수는 지침일 뿐).
- 리팩터링과 기능 변경은 나눈다. 관련 테스트는 같은 변경에 넣는다.
- 쪼개는 방법: 앞 변경 위에 다음 변경을 쌓기(stacking), 레이어별(수평)·기능별(수직)로 나누기.

### 속도

- 요청을 받으면 **1 영업일 안에** 응답한다. 전체 완료보다 개별 응답이 빠른 게 중요하다.
- 집중 작업 중이면 끊지 말고 자연스러운 휴식 지점에 본다.
- 남은 지적이 사소하고 작성자가 반영할 것이 확실하면 "코멘트 포함 승인(LGTM with comments)"으로 왕복을 줄인다.

```ts
// 리뷰 코멘트의 좋은 형태: 문제 + 이유 + (선택) 제안
// ✗ "이거 별로네요"
// ✓ "여기서 orders 가 비어 있으면 reduce 초기값이 없어 TypeError 가 납니다.
//    초기값 0 을 주거나 빈 배열을 먼저 처리하면 어떨까요?"
const total = orders.reduce((sum, o) => sum + o.amount, 0);
```

## 언제 쓰나

- 공유 코드베이스에 들어가는 모든 사람이 작성한 변경. 지식 공유(멘토링)와 버스 팩터 감소 효과도 있다.
- 자동화(린터, 포매터, 타입 검사, 테스트)로 잡을 수 있는 것은 CI 에 맡기고, 사람은 설계와 의도에 집중한다.

## 주의 (비용)

- 리뷰 대기 시간은 팀 전체의 처리 속도를 떨어뜨린다. 느린 리뷰는 "까다로운 리뷰"보다 더 큰 불만을 만든다.
- 합의가 안 되면 오래 끌지 말고 대면 대화 → 팀/테크 리드로 올린다. 결론은 PR 에 기록한다.
- 사람에 대한 코멘트가 아니라 코드에 대한 코멘트를 쓴다. 잘한 점도 언급한다.
- 리뷰는 테스트·CI 를 대체하지 않는다. 동시성·보안 같은 영역은 리뷰만으로 놓치기 쉽다.
- 트렁크 기반 개발에서는 리뷰가 통합을 늦추지 않도록 짝 프로그래밍이나 머지 후 리뷰를 함께 고려한다.
