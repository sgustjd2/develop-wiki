---
title: 정보 구조와 카드 소팅·트리 테스트
aka: [Information Architecture, IA, Card Sorting, Tree Testing, Reverse Card Sort, Content Inventory, Taxonomy]
category: ui-ux
group: interaction
level: intermediate
summary: 콘텐츠를 어떻게 묶고 이름 붙일지(정보 구조)를 정하고, 사용자에게 묶게 해서 후보를 만들고(카드 소팅) 그 구조에서 찾게 해서 검증하는(트리 테스트) 방법.
tags: [ux, information-architecture, card-sorting, tree-testing, navigation, taxonomy]
related: [ui-ux/navigation-patterns, ui-ux/affordance-signifier-mental-model, ui-ux/ux-research-method-selection, ui-ux/cognitive-load-progressive-disclosure, ui-ux/usability-testing-sample-size, ui-ux/personas-jobs-to-be-done]
sources:
  - https://www.nngroup.com/articles/ia-vs-navigation/
  - https://www.nngroup.com/articles/card-sorting-definition/
  - https://www.nngroup.com/articles/tree-testing/
updatedAt: 2026-11-19
---

## 문제

- 메뉴 구조가 조직도를 따라간다("사업부별 메뉴"). 사용자는 회사 내부 구조를 모른다.
- 메뉴 이름이 내부 용어("리소스 센터", "워크스페이스 관리")라 무엇이 들어 있는지 예측이 안 된다.
- 디자인 단계에서 메뉴 모양(가로 바, 햄버거, 사이드바)부터 고르면 나중에 콘텐츠가 늘었을 때 구조가 버티지 못한다.

## 해법

### 정보 구조 ≠ 내비게이션

NN/g 는 정보 구조(IA)를 **무엇이 있고 서로 어떻게 연결되는가**라는 바닥 구조로, 내비게이션을 그 위에 보이는 UI(전역 메뉴, 브레드크럼, 푸터)로 구분한다. IA 를 먼저 정하고 내비게이션을 고른다.

IA 의 요소: **조직**(묶는 방식), **레이블링**(통제 어휘), **메타데이터**(관련 링크·필터의 재료). 작업 순서는 콘텐츠 인벤토리 → 콘텐츠 감사 → 그룹핑 → 분류 체계 → 메타데이터.

### 카드 소팅: 사용자에게 묶게 한다 (생성)

| 종류 | 방식 | 용도 |
| --- | --- | --- |
| 열린(open) | 참가자가 그룹과 이름을 직접 만든다 | 사용자의 분류 방식·용어 발견. 가장 흔함 |
| 닫힌(closed) | 미리 정한 그룹에 넣는다 | 검증용이지만 보통 트리 테스트가 낫다 |
| 혼합(hybrid) | 일부만 미리 정함 | 미리 정한 그룹이 결과를 편향시켜 NN/g 는 대체로 비권장 |

- 카드 30~50장. 그 이상이면 피로해서 "기타" 더미가 생긴다.
- 참가자: 정성은 최소 15명, 정량(일반화)은 30~50명(NN/g).
- 한계: 한 단계 묶음만 나오고, 실제 화면의 맥락(이미지, 링크)은 빠진다.

### 트리 테스트: 그 구조에서 찾게 한다 (평가)

- 디자인 없이 메뉴 트리만 보여 주고 "○○를 하려면 어디로 가겠나"를 묻는다.
- 지표: **성공률**, **직접성**(헤매지 않고 바로 갔나), **시간**, **첫 클릭**(어디를 먼저 기대했나).
- 과업 문구에 정답 레이블을 쓰지 않는다. 짧게, 단어 유도 없이.

```ts
// 트리 테스트 결과 집계: 레이블 문제는 '성공은 했지만 직접성이 낮은' 과업에서 드러난다
type TreeTaskResult = { taskId: string; success: boolean; direct: boolean; firstClick: string };

function summarize(results: TreeTaskResult[]) {
  const n = results.length;
  return {
    successRate: results.filter(r => r.success).length / n,
    directness: results.filter(r => r.success && r.direct).length / n,
  };
}
```

## 언제 쓰나

- 새 사이트·앱의 메뉴 설계, 문서 사이트 재구성, 설정 화면 정리.
- 순서: 콘텐츠 인벤토리 → 열린 카드 소팅 → 구조 초안 → 트리 테스트 → 수정 → 다시 트리 테스트 → 화면 디자인.

## 체크리스트

- [ ] 메뉴가 조직도가 아니라 사용자 과업·멘탈 모델로 묶였다
- [ ] 레이블은 사용자가 카드 소팅에서 쓴 말에 가깝다
- [ ] 같은 개념에 같은 이름을 사이트 전체에서 쓴다(통제 어휘)
- [ ] 트리 테스트에서 성공률·직접성이 낮은 과업을 고쳤다
- [ ] 구조가 콘텐츠 증가를 버티는지(단계 수, 항목 수) 확인했다

## 흔한 실수·주의

- **카드 소팅 결과를 그대로 메뉴로 쓴다.** 카드 소팅은 후보를 만드는 방법이지 최종 구조가 아니다. "기타"처럼 모호한 그룹이 생기기 쉽다.
- **"기타·더 보기" 메뉴.** 사용자는 이런 범주를 피한다. 무엇이 있는지 이름으로 말한다.
- **기존 구조 평가에 카드 소팅을 쓴다.** 평가는 트리 테스트가 맞다.
- **분석 결과만 믿는다.** 많이 클릭된 메뉴가 "필요해서"인지 "헷갈려서"인지 구분해야 한다.
- 트리 테스트의 정량 표본 크기는 NN/g 글에 구체 수치가 없어 적지 않았다.
