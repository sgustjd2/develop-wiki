---
title: 리서치 윤리·동의·참가자 모집·스크리닝
aka: [Research Ethics, Informed Consent, Participant Recruiting, Screener, Professional Testers, Incentives, Belmont Report, 연구 윤리]
category: ui-ux
group: research
level: intermediate
summary: 참가자에게 목적·데이터 처리·철회 권리를 알리고 동의를 받는 절차, 그리고 목적을 드러내지 않으면서 맞는 사람을 거르는 스크리너 작성과 모집 시 편향·사례비 주의점.
tags: [ux, research, ethics, consent, recruiting, screener, privacy]
related: [ui-ux/ux-research-method-selection, ui-ux/usability-testing-sample-size, ui-ux/usability-test-tasks-think-aloud, ui-ux/contextual-inquiry-diary-study, ui-ux/survey-design-response-bias, ui-ux/personas-jobs-to-be-done]
sources:
  - https://www.nngroup.com/articles/informed-consent/
  - https://www.nngroup.com/articles/screening-questions-select-research-participants/
  - https://www.nngroup.com/articles/screening-participants/
  - https://www.hhs.gov/ohrp/regulations-and-policy/belmont-report/index.html
updatedAt: 2026-11-19
---

## 문제

- "고객 인터뷰"라며 통화를 녹음하고 나중에 발표 자료에 실명을 쓴다. 참가자는 사적인 대화라고 생각했다.
- 스크리너가 "온라인 쇼핑 하시나요? 예/아니오"라서, 사례비를 노린 사람이 전부 통과한다. 결과는 쓸모없다.
- 연구 대상이 어린이·취약 집단인데 보호자 동의 없이 진행한다.

## 해법

### 1. 윤리의 틀

- 인간 대상 연구 윤리의 고전은 Belmont Report(1979)다. 존중(자율), 선행(해악 최소화), 정의(부담·혜택의 공정한 분배) 세 원칙에서 동의·위험/이익 평가·대상 선정 기준을 끌어낸다. 이 세 원칙과 세 적용은 널리 알려진 구조로 적었고, 원문은 직접 확인하지 못했다(아래 주의 참고).
- 제품 UX 리서치는 대개 IRB 심사 대상이 아니지만, 같은 원칙을 가볍게 적용한다. 법적 요건(개인정보 보호법·GDPR 등)은 별개이며 이 노트가 다루지 않는다. 조직 법무에 확인한다.

### 2. 동의서에 담을 것 (NN/g)

| 항목 | 내용 |
| --- | --- |
| 목적 | 구체적이되 가설을 드러내 행동을 바꾸지 않는 수준 |
| 형식·시간 | 활동, 데이터 수집 방식, 종료 시점 |
| 자발성 | 언제든 중단·철회 가능 |
| 데이터 | 익명화 여부, 사용·보관·접근·공개, 원본 삭제 시점, 삭제 요청 가능 여부 |
| 동의 | 한 번에 전체 동의가 아니라 항목별(녹음·녹화·공개 사용 등) 체크 |

- 녹음·녹화는 참여 동의와 **분리**한다. 녹화를 거절해도 참여할 수 있게 하면 참여가 늘어난다.
- 목적을 자세히 쓰면 행동이 바뀐다(priming). 세션 후 설명 시트(debrief)로 보완한다.
- 어린이·인지 장애·낮은 문해력 등은 본인 동의만으로 부족할 수 있다. 보호자 서명란이 필요하다. 수감자는 자발성 자체가 문제이며 추가 요건이 있다(NN/g).

### 3. 모집과 스크리너

- 스크리너의 목표: **목적을 숨기고** 맞는 사람을 거른다(NN/g).
- 예/아니오 질문은 정답이 뻔해 피한다. 개방형으로 경험을 묘사하게 하거나, 그럴듯한 오답(distractor)을 섞은 객관식을 쓴다.
- 복수 선택에서 보기를 전부 고른 사람은 걸러 낸다.
- 대상: 현재 고객뿐 아니라 잠재 사용자, 그리고 행동이 평균과 크게 다른 고동기 사용자도 목적에 따라 포함.
- 자동화 플랫폼은 "프로 참가자" 위험이 크고, 자사 패널은 브랜드에 익숙한 사람으로 쏠린다(NN/g).

```ts
// 스크리너 점수 예: 정답 조합 + 전부 선택 탈락 (이 노트의 예시)
function pass(selected: string[], options: string[], target: string[]) {
  if (selected.length === options.length) return false; // 전부 선택
  return target.every((t) => selected.includes(t));
}
```

### 4. 사례비

- 성과·긍정 의견에 연동하지 않는다. 참가자가 디자인이 아니라 자신이 평가받는다고 느낀다(NN/g).

## 언제 쓰나

- 모든 인터뷰·사용성 테스트·일지 연구 시작 전. 특히 녹화·제3자 공유·민감 주제·취약 집단일 때는 필수로 본다.

## 체크리스트

- [ ] 동의서에 목적·데이터 처리·철회·삭제 시점이 있다
- [ ] 녹음/녹화/외부 공유가 개별 체크박스다
- [ ] 보호자 동의 필요 여부를 확인했다
- [ ] 스크리너에 예/아니오만 있는 핵심 문항이 없다
- [ ] 목적을 드러내는 질문 순서·보기를 피했다
- [ ] 사례비 지급이 성과에 연동되지 않는다
- [ ] 원본 녹화·로그를 지울 날짜와 접근 권한이 정해져 있다

## 흔한 실수·주의

- **포괄 동의.** 현재·미래 모든 연구에 쓰겠다는 문구는 구체성이 없어 남용 위험이 있다(NN/g).
- **"우리 고객을 알고 싶다" 정도의 모호한 목적.**
- **서명했으니 윤리적이라는 착각.** 서류가 연구 설계의 질을 보장하지 않는다.
- **지나친 스크리닝으로 대표성을 잃음.** 모집 편향은 결과 해석에 적어 둔다.
- 동의서에 법적 문구를 직접 만들지 않는다. 템플릿은 법무·IRB 담당과 맞춘다.
- NN/g 모집 관련 글(`screening-participants`)은 검색 요약만 확인하고 본문은 읽지 못했다. 사례비 금액 기준은 출처를 확인하지 못해 적지 않았다. Belmont Report 원문은 접근이 막혀(HHS 하위 페이지 403) 직접 읽지 못했다.
