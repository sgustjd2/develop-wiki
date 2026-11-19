---
title: 리서치 종합 (어피니티 매핑·주제 분석·사용성 문제 코딩)
aka: [Research Synthesis, Affinity Diagramming, Affinity Mapping, Thematic Analysis, Qualitative Coding, Usability Issue Coding, 어피니티 다이어그램]
category: ui-ux
group: research
level: intermediate
summary: 인터뷰·관찰 메모를 코드로 붙이고 어피니티 매핑으로 묶어 주제를 만든 뒤, 사용성 문제는 심각도와 함께 코딩해 발견 사항·권고로 보고하는 종합 절차.
tags: [ux, research, synthesis, affinity-diagram, thematic-analysis, qualitative, reporting]
related: [ui-ux/ux-research-method-selection, ui-ux/usability-test-tasks-think-aloud, ui-ux/heuristic-evaluation-severity, ui-ux/contextual-inquiry-diary-study, ui-ux/personas-jobs-to-be-done, ui-ux/journey-map-service-blueprint]
sources:
  - https://www.nngroup.com/articles/affinity-diagram/
  - https://www.nngroup.com/articles/thematic-analysis/
updatedAt: 2026-11-19
---

## 문제

- 세션 10개를 돌리고 나면 메모 수백 장이 남는다. 기억에 남는 인용구 몇 개만 골라 보고하면 팀이 "말한 것의 목록"만 받는다.
- 진행자 한 명의 인상이 결론이 되고, 모순되는 데이터는 조용히 버려진다.
- 보고서가 길어 아무도 안 읽거나, 문제는 많은데 무엇부터 고칠지 없다.

## 해법

종합은 **데이터 → 코드 → 묶음(주제) → 발견 사항 → 권고** 순으로 추상도를 올리는 일이다.

### 1. 코딩

- 코드는 데이터 조각에 붙이는 짧은 라벨이다. 서술 코드("결제 단계에서 멈춤")와 해석 코드("비용이 불확실해서 망설임")를 구분한다(NN/g).
- 코드를 먼저 정하고 붙이는 방식과, 비슷한 메모를 먼저 묶고 나중에 이름 붙이는 방식이 있다. 후자가 빠르다.
- NN/g 는 분석 시간을 최소한 데이터 수집에 쓴 시간만큼 잡으라고 권한다.

### 2. 어피니티 매핑 (NN/g 3단계)

1. **생성**: 각자 따로 메모를 쓴다(5~10분 제한). 먼저 혼자 쓰면 목소리 큰 사람에게 끌려가는 것을 줄인다.
2. **묶기**: 비슷한 것끼리 묶고 이름을 붙인다. 두 군데에 걸치면 메모를 복제한다. 작은 묶음·이상치도 버리지 않는다.
3. **우선순위**: 합의가 안 되면 점 투표. 다음 행동의 담당자를 한 명 정한다.

### 3. 주제 검증 (NN/g 주제 분석의 점검)

- 주제를 뒷받침하는 사례가 여러 개인가, 반증 사례를 찾아봤는가.
- 다른 사람이 따로 분석해도 같은 주제가 나오는가. 아니면 묶기로 돌아간다.

### 4. 사용성 문제 코딩과 보고

사용성 테스트에서는 문제를 한 줄씩 기록해 표로 만든다. 아래 열 구성은 이 노트의 제안이며 NN/g 원문이 정한 형식이 아니다.

```ts
type Issue = {
  id: string;
  task: string;           // 어떤 과업에서
  observation: string;    // 관찰 사실(해석 아님)
  participants: string[]; // 겪은 참가자
  severity: 1 | 2 | 3 | 4; // 기준은 팀이 사전에 정의 → 휴리스틱 평가 노트 참고
  heuristic?: string;
};

// 같은 문제를 세션 간 합치고 빈도·심각도로 정렬
function rank(issues: Issue[]) {
  return [...issues].sort(
    (a, b) => b.severity - a.severity || b.participants.length - a.participants.length,
  );
}
```

- 관찰(본 것)과 해석(생각한 것)을 다른 열에 둔다.
- 보고는 "문제 → 증거(참가자 수·짧은 클립) → 권고" 순. 심각도 높은 것부터 상위 몇 개만 앞에 둔다.

## 언제 쓰나

- 인터뷰·일지·현장 관찰처럼 정성 데이터가 쌓였을 때.
- 사용성 테스트 직후 팀이 같은 문제 목록을 공유해야 할 때(관찰자도 메모를 붙이게 한다).

## 체크리스트

- [ ] 시작 전에 연구 질문을 벽에 붙였다
- [ ] 메모는 관찰 단위(한 메모 = 한 사실)다
- [ ] 개인이 먼저 쓰고 나서 묶었다
- [ ] 이상치·반증 사례를 따로 표시했다
- [ ] 각 발견에 증거(몇 명, 어떤 과업)가 붙어 있다
- [ ] 보고서 상위에 권고와 우선순위가 있다

## 흔한 실수·주의

- **인상 깊은 인용구만 모음.** 빈도와 맥락이 빠진다.
- **참가자가 한 말의 나열.** 묶음에 "그래서 의미하는 것"이 없으면 종합이 아니다.
- **묶음을 억지로 맞춤.** 맞지 않는 메모는 남겨 둔다.
- **거대한 벽 하나로 끝.** 다음 행동으로 이어지지 않으면 산출물만 남는다. 토론 자체가 더 가치 있다는 것이 NN/g 의 입장이다.
- **정성 데이터에 퍼센트를 붙여 일반화.** 참가자 8명의 "75%"는 모집단 추정이 아니다. → [표본 크기](/develop-wiki/knowledge/ui-ux/usability-testing-sample-size/)
- 문제 심각도 열 구성과 `rank` 코드는 이 노트의 예시이며, 출처는 NN/g 두 글(어피니티·주제 분석)이다. 도구별(Dovetail 등) 기능은 확인하지 않았다.
