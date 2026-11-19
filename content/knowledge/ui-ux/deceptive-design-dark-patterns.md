---
title: 다크 패턴 (기만적 설계)
aka: [Dark Patterns, Deceptive Design, Deceptive Patterns, Confirmshaming, Roach Motel, Hard to Cancel]
category: ui-ux
group: principles
level: intermediate
summary: 사용자가 원하지 않는 구매·가입·정보 제공을 하도록 화면 구조로 속이거나 압박하는 설계. EU DSA·미국 FTC 등에서 규제 대상이며 신뢰와 법적 위험을 함께 키운다.
tags: [ux, ethics, dark-patterns, deceptive-design, regulation, privacy, subscription]
related: [ui-ux/nielsen-usability-heuristics, ui-ux/ux-metrics-sus-heart-ab-test, ui-ux/cognitive-load-progressive-disclosure, mobile-dev/permissions-privacy, mobile-dev/in-app-purchase-subscription-design]
sources:
  - https://www.deceptive.design/types
  - https://arxiv.org/abs/1907.07032
  - https://eur-lex.europa.eu/eli/reg/2022/2065/oj
  - https://www.ftc.gov/reports/bringing-dark-patterns-light
  - https://en.wikipedia.org/wiki/Dark_pattern
updatedAt: 2026-11-19
---

## 문제

- 전환율 목표만 보면 "해지 버튼을 깊숙이 숨기기", "동의 쪽만 크게 칠하기", "남은 재고 2개(사실 아님)" 같은 변경이 A/B 테스트에서 이기기 쉽다.
- 단기 지표는 오르지만 환불·고객센터 문의·이탈·규제 위반이 뒤따른다. 개발자는 요구사항대로 구현했을 뿐이라도 결과물에 책임이 남는다.

## 해법

### 이름을 알아야 막을 수 있다

"dark pattern" 은 Harry Brignull 이 2010년 만든 말이다(Wikipedia). 그가 운영하던 사이트는 현재 deceptive.design 으로 옮겨 "deceptive pattern" 이라는 이름을 쓴다. 이 사이트의 유형 목록에서 웹·앱 개발에서 자주 보는 것만 추린다.

| 유형 | 모습 | 대안 |
| --- | --- | --- |
| 해지 어려움(hard to cancel) | 가입은 한 번, 해지는 전화·여러 단계 | 가입과 같은 채널·비슷한 단계로 해지 |
| 숨은 비용(hidden costs) | 결제 마지막에 수수료 추가 | 첫 가격 표시부터 총액 |
| 미리 선택(preselection) | 마케팅 수신·추가 상품 체크돼 있음 | 기본값은 꺼짐, 사용자가 켬 |
| 확인 수치심(confirmshaming) | "아니요, 저는 할인이 싫어요" | 중립적 거절 문구 |
| 가짜 긴급·희소성 | 근거 없는 타이머, 재고 수 | 실제 데이터만 표시 |
| 시각적 방해 | 거절 버튼을 회색 작은 텍스트로 | 선택지를 동등한 시각적 무게로 |
| 위장 광고 | 광고가 다운로드 버튼처럼 생김 | 광고 표시를 명확히 |
| 잔소리(nagging) | 거절해도 계속 같은 요청 | 거절을 기억하고 존중 |

Mathur 외(CSCW 2019)는 쇼핑몰 약 11,000곳을 크롤링해 1,818개 사례를 찾았다. 실험실 이야기가 아니라 흔한 실무라는 뜻이다.

### 규제 동향 (확인한 범위)

- **EU 디지털서비스법(DSA, Regulation 2022/2065)** 전문 67번 항목은 온라인 플랫폼이 인터페이스 구조로 이용자의 자율적 선택을 왜곡하는 것을 금지해야 한다고 설명한다. 예로 특정 선택지 강조, 이미 한 선택의 반복 요청, 해지를 가입보다 훨씬 번거롭게 하기, 바꾸기 어려운 기본값을 든다.
- **미국 FTC** 는 2022년 9월 보고서 "Bringing Dark Patterns to Light" 를 냈다. Wikipedia 기준으로 2021년 구독 함정 관련 정책 성명, Epic Games·Amazon 등 제재 사례가 이어졌다.

```ts
// 해지 흐름을 코드 리뷰에서 측정 가능한 규칙으로 만든다
const signupSteps = 2;
const cancelSteps = countSteps("/account/cancel");
if (cancelSteps > signupSteps + 1) {
  throw new Error(`해지 단계(${cancelSteps})가 가입(${signupSteps})보다 과도함`);
}
```

## 언제 쓰나 (점검 시점)

- 결제·구독·해지·동의(쿠키, 개인정보, 알림 권한) 화면을 만들거나 바꿀 때.
- 전환율을 목표로 한 A/B 테스트를 설계할 때: 승자 변형이 위 유형에 해당하는지 확인한다.

## 체크리스트

- [ ] 수락과 거절 버튼이 같은 크기·대비·위치 무게를 갖는다
- [ ] 선택형 동의 체크박스는 기본값이 해제 상태다
- [ ] 처음 보이는 가격과 최종 결제 금액이 같다(세금 등 예외는 미리 고지)
- [ ] 해지·탈퇴가 가입과 같은 채널에서 비슷한 단계로 끝난다
- [ ] 타이머·재고·"N명이 보는 중" 같은 표시는 실제 데이터에 연결돼 있다
- [ ] 거절한 요청을 일정 기간 다시 묻지 않는다

## 흔한 실수·주의

- **"설득적 디자인"과 경계가 모호하다고 넘어간다.** 판단 기준은 사용자가 정확한 정보를 갖고 자유롭게 선택했는가다. 정보를 숨기거나 거짓으로 압박하면 기만이다.
- **A/B 지표만 본다.** 전환은 오르고 환불·해지 문의·장기 유지율이 떨어질 수 있다. 가드레일 지표를 함께 둔다.
- **지역 규정을 한 가지로 가정한다.** 개인정보·소비자보호 규정은 지역마다 다르다. 한국 전자상거래법 등 국내 규정은 이 노트에서 확인하지 않았으니 법무 검토를 받는다.
- DSA 제25조 본문과 FTC 보고서 PDF 본문은 직접 읽지 못했다. 규제 내용은 DSA 전문 67번과 FTC 보고서 소개 페이지, Wikipedia 범위에서 적었다.
