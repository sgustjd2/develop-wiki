---
title: 트리 테스트·퍼스트 클릭 테스트·비진행형 원격 테스트 운영
aka: [Tree Testing Practice, First Click Testing, Unmoderated Remote Usability Test, Treejack, Click Test, 비진행형 원격 테스트]
category: ui-ux
group: interaction
level: intermediate
summary: 화면 없이 메뉴 구조만 검증하는 트리 테스트의 과업 설계·지표 읽기, 첫 클릭 정확도 측정, 진행자 없이 돌리는 원격 테스트의 설계 요령과 한계를 정리한다.
tags: [ux, tree-testing, first-click, unmoderated, remote-testing, findability, information-architecture]
related: [ui-ux/information-architecture-card-sorting, ui-ux/usability-test-tasks-think-aloud, ui-ux/usability-testing-sample-size, ui-ux/information-scent-foraging, ui-ux/navigation-patterns, ui-ux/quantitative-usability-confidence-intervals]
sources:
  - https://www.nngroup.com/articles/tree-testing/
  - https://www.nngroup.com/articles/remote-usability-tests/
  - https://measuringu.com/first-click/
updatedAt: 2026-11-19
---

## 문제

- 정보 구조를 카드 소팅으로 만들었는데 실제로 사람들이 찾아가는지 모른다. 디자인까지 입힌 뒤에 알면 늦다.
- 사용성 테스트를 진행자가 매번 붙으면 일정이 밀려, 아예 테스트를 건너뛴다.
- 개념(카드 소팅 → 트리 테스트)은 [정보 구조](/develop-wiki/knowledge/ui-ux/information-architecture-card-sorting/) 노트에 있다. 여기서는 과업 설계와 결과 읽기, 그리고 비진행형 운영을 다룬다.

## 해법

### 1. 트리 테스트 설계 (NN/g)

- 준비물: 정답이 들어 있는 깊이까지 펼친 텍스트 트리, 그리고 과업마다 하나 이상의 정답 위치. 스프레드시트에서 홈을 A열 맨 위에 두고 행=카테고리, 오른쪽 열=하위로 쓰는 식으로 만든다.
- 과업 종류: 자원 찾기, 상위 카테고리의 정보 향기를 시험하는 과업, 문제가 의심되는 영역, 레이블·위치 비교, 그리고 쉬운 **워밍업** 과업(부주의한 비진행형 참가자를 거르는 용도).
- 문구: 레이블 단어를 그대로 쓰지 않는다. 짧게 쓴다.
- 구조 후보가 둘이면 참가자 간(between-subjects)으로 나눠 학습 효과를 막는다.
- 지표: 정답 도달, 선택한 다른 카테고리, 시간, **직접성**(바로 갔나 왔다 갔다 했나).
- 정성: 소수·진행형으로 초기 반복. 정량: 구조 비교·벤치마크에는 더 큰 표본. 구체 인원은 NN/g 글에 없다.

```ts
// 결과 분류: 성공/실패 × 직접/우회 4칸으로 과업을 진단 (이 노트의 예시)
type R = { success: boolean; direct: boolean };
function bucket(rs: R[]) {
  const n = rs.length;
  const c = (f: (r: R) => boolean) => rs.filter(f).length / n;
  return {
    directSuccess: c((r) => r.success && r.direct),
    indirectSuccess: c((r) => r.success && !r.direct), // 레이블 의심
    directFail: c((r) => !r.success && r.direct),      // 오해를 부르는 레이블
    indirectFail: c((r) => !r.success && !r.direct),   // 길을 잃음
  };
}
```

### 2. 퍼스트 클릭 테스트

- 과업을 주고 **첫 클릭이 어디인가**를 본다. 화면(와이어프레임·스크린샷)이 있을 때 적합하고 트리 테스트와 달리 시각 맥락(메가메뉴 등)을 포함한다.
- 첫 클릭이 맞으면 이후 성공 확률이 높다는 통계가 자주 인용된다(맞으면 약 87%, 틀리면 약 46%). MeasuringU 는 이 수치를 외부 연구로 인용하며 표본·방법을 제시하지 않는다. **이 노트는 원출처를 확인하지 못했다.** 상관이지 인과가 아니며 "첫 클릭이 맞아도 이후 실패할 수 있다".
- 측정: 첫 클릭 위치 분포, 첫 클릭까지 시간, 확신도·난이도 자기 보고(MeasuringU 의 예는 7점 척도).
- 도구를 쓰는 방법과 별개로, 첫 클릭은 "정답 영역"을 사전에 정의해 두어야 집계된다.

### 3. 비진행형 원격 테스트 (NN/g)

- 참가자가 혼자, 자기 일정에, 자기 환경에서 진행하고 기록을 나중에 본다.
- 장점: 병렬 진행으로 빠르다, 특정 요소(위젯·작은 변경)를 보는 연구에 맞는다.
- 한계: 실시간 도움·후속 질문이 없다(질문은 모두에게 같음), 생각 소리 내기가 줄 수 있다, 세션이 끝나야 문제를 안다.
- 요령: 과업·지시를 파일럿으로 점검해 모호함을 없앤다, 외부 사람으로 접속·링크 같은 기술을 시험한다, 연락 가능한 창구를 연다, **예상보다 몇 명 더 모집**한다(불참·불량 세션).

## 언제 쓰나

- 트리 테스트: 메뉴·분류 구조를 바꾸기 전후, 디자인 전 단계.
- 퍼스트 클릭: 랜딩·홈·내비게이션 화면 후보 비교.
- 비진행형: 일정·예산이 빠듯하거나 표본이 필요한 정량 비교. 문제의 "왜"가 필요하면 진행형을 병행.

## 체크리스트

- [ ] 과업마다 정답 위치(들)를 사전에 정의했다
- [ ] 과업 문구에 메뉴 레이블이 없다
- [ ] 워밍업 과업으로 불량 응답을 걸렀다
- [ ] 파일럿(진행형)으로 문구·기술을 확인했다
- [ ] 결과를 성공률만이 아니라 직접성과 오답 위치로 읽었다
- [ ] 후속 설문으로 비진행형의 "왜" 공백을 보완했다

## 흔한 실수·주의

- **카드 소팅 결과를 트리 테스트 없이 확정.** 카드 소팅은 생성이며 최종 구조가 아니다(NN/g).
- **트리 테스트에서 중간 카테고리를 정답으로 두려 함.** 도구는 보통 말단 항목만 정답으로 허용한다.
- **트리 테스트 결과를 최종 UI 성과로 일반화.** 시각 맥락이 빠져 있다.
- **정성 표본의 성공률을 퍼센트로 보고.** 정량 보고는 신뢰구간을 붙인다. → [신뢰구간](/develop-wiki/knowledge/ui-ux/quantitative-usability-confidence-intervals/)
- **비진행형을 전부로 대체.** 맥락·행동 이유가 사라진다.
- 퍼스트 클릭에 대해 NN/g 전용 글은 찾지 못했다(검색 결과에 없음). 위 설명은 MeasuringU 한 글과 검색 요약에 의존한다.
