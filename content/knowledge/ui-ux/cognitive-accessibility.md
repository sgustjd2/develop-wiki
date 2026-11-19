---
title: 인지 접근성
aka: [Cognitive Accessibility, COGA, Making Content Usable, Learning Disabilities, Accessible Authentication, 인지·학습 장애 접근성]
category: ui-ux
group: accessibility
level: intermediate
summary: 기억·주의·읽기·문제 해결에 어려움이 있는 사람도 쓸 수 있게 화면을 단순하고 예측 가능하게 만들고, 기억에 의존하는 과업을 없애는 설계 원칙.
tags: [accessibility, a11y, cognitive, coga, plain-language, wcag]
related: [ui-ux/cognitive-load-progressive-disclosure, ui-ux/wcag-22-overview, ui-ux/ux-writing-principles, ui-ux/error-messages, ui-ux/form-inline-validation, security/mfa-passkeys]
sources:
  - https://www.w3.org/TR/coga-usable/
  - https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html
  - https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry.html
  - https://www.w3.org/WAI/WCAG22/Understanding/consistent-help.html
  - https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html
updatedAt: 2026-11-19
---

## 문제

- 인지·학습 장애(난독증, ADHD, 지적 장애, 치매, 뇌손상)는 눈에 보이지 않고 범위가 넓다. 피로·스트레스·약 복용·모국어가 아닌 언어처럼 **일시적·상황적 인지 제약**은 누구에게나 생긴다.
- 전통적인 접근성 점검은 낭독기·키보드 위주라 "복잡해서 못 쓰는" 문제는 잘 잡히지 않는다. 시간 제한, 비밀번호 재입력, 바뀌는 메뉴 위치, 어려운 문장이 대표 장벽이다.

## 해법

### 1. W3C *Making Content Usable* 의 8가지 목표

W3C 인지 접근성 태스크포스(COGA)의 Working Group Note(2021)는 다음 목표로 디자인 패턴을 묶는다. WCAG 적합성 요건은 아니지만 보충 지침이다.

1. 무엇인지·어떻게 쓰는지 알 수 있게 한다
2. 필요한 것을 찾게 한다
3. 명확하고 이해하기 쉬운 콘텐츠를 쓴다
4. 실수를 피하고 고칠 수 있게 한다
5. 집중을 돕는다(방해 최소화)
6. **기억에 의존하지 않게 한다**
7. 도움과 지원을 제공한다
8. 적응·개인화를 지원한다

### 2. WCAG 2.2 에 들어온 인지 관련 기준

| SC | 수준 | 실무 해석 |
| --- | --- | --- |
| 3.3.7 Redundant Entry | A | 같은 과정에서 입력한 주소 등을 다시 묻지 말고 자동 채움 또는 "배송지와 동일" 선택 제공. 예외: 본질적인 경우, 보안(새 비밀번호 확인), 이전 값이 무효해진 경우 |
| 3.3.8 Accessible Authentication (Minimum) | AA | 비밀번호 암기·코드 전사 같은 인지 기능 시험을 유일한 방법으로 두지 않는다. 대안 방법, 비밀번호 관리자·붙여넣기 같은 보조 수단, 사물 인식, 사용자가 올린 비텍스트 개인 콘텐츠 중 하나가 있으면 통과 |
| 3.3.9 (Enhanced) | AAA | 사물 인식·개인 콘텐츠 예외도 없음 |
| 3.2.6 Consistent Help | A | 연락처·채팅·도움말 링크가 여러 페이지에 있으면 같은 상대 위치에 |

기존 기준 중에서도 2.2.1 Timing Adjustable(시간 제한 끄기·10배 조정·만료 전 경고 후 20초 이상 연장 기회 중 하나), 3.3.2 Labels or Instructions, 3.3.3 Error Suggestion, 3.2.3 Consistent Navigation 이 인지 접근성의 핵심이다.

```html
<!-- 3.3.8: 붙여넣기·자동 채움을 막지 않는다 -->
<input type="password" autocomplete="current-password">
<input inputmode="numeric" autocomplete="one-time-code">   <!-- OTP 자동 채움 허용 -->
<!-- 나쁜 예: onpaste="return false" 는 3.3.8 실패(F109 계열)로 이어진다 -->
```

비밀번호 없는 로그인(패스키, 이메일 매직 링크)은 인증 단계의 인지 부담을 없애는 대안이다. → [MFA·패스키](/develop-wiki/knowledge/security/mfa-passkeys/)

### 3. 설계 패턴 요약

- **쉬운 말**: 짧은 문장, 익숙한 단어, 한 문장에 한 생각. → [UX 라이팅 원칙](/develop-wiki/knowledge/ui-ux/ux-writing-principles/)
- **한 화면에 한 과업**: 긴 폼은 단계로 나누고 진행 위치를 보여 준다. → [인지 부하와 점진적 공개](/develop-wiki/knowledge/ui-ux/cognitive-load-progressive-disclosure/)
- **일관성**: 같은 기능은 같은 이름·아이콘·위치.
- **재인식 > 회상**: 최근 항목, 자동 완성, 기본값 제공. 이전 단계 정보를 다시 보여 준다.
- **방해 최소화**: 자동 재생, 반짝임, 팝업 남발 금지. 알림은 사용자가 통제한다.
- **실수 복구**: 실행 취소, 입력 보존, 구체적인 오류 문구. → [에러 메시지](/develop-wiki/knowledge/ui-ux/error-messages/)

## 언제 쓰나

- 가입·로그인·결제·신청서처럼 단계가 많고 실패 비용이 큰 흐름.
- 고령자·공공·의료·금융 서비스.
- 세션 타임아웃, 시간 제한 퀴즈, 자동으로 사라지는 메시지를 넣을 때.

## 체크리스트

- 로그인에서 붙여넣기·비밀번호 관리자·OTP 자동 채움이 동작한다.
- 다단계 폼에서 이미 입력한 정보를 다시 입력하게 하지 않는다.
- 세션 만료 전에 경고하고 연장할 수 있다. 만료돼도 입력 내용이 보존된다.
- 도움말·문의 링크 위치가 모든 페이지에서 같다.
- 핵심 문구를 소리 내어 읽었을 때 한 번에 이해된다.

## 흔한 실수·주의

- **"모두를 위한 단순화"를 명분으로 기능을 숨김.** 고급 기능은 점진적 공개로 남겨 둔다.
- **CAPTCHA 를 인증에 그대로 둠.** 문자 전사형은 3.3.8 에 걸리고, 사물 인식형은 AA 예외지만 W3C 도 가능하면 피하라고 한다.
- **보안을 이유로 붙여넣기 차단.** 비밀번호 관리자 사용을 막아 오히려 약한 비밀번호를 유도한다.
- 인지 접근성 지침은 측정 가능한 기준보다 권고가 많다. 사용성 테스트에 다양한 인지 특성을 가진 참여자를 포함해야 실제 효과를 확인할 수 있다.
