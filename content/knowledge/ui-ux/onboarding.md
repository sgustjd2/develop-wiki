---
title: 온보딩 (첫 사용 경험)
aka: [Onboarding, First-run Experience, Product Tour, Coach Marks, Tutorial, Contextual Tips, 튜토리얼, 제품 투어]
category: ui-ux
group: patterns
level: beginner
summary: 새 사용자가 첫 가치에 빨리 닿게 하는 첫 사용 경험 설계. 기능 홍보·개인화·사용법 안내 중 무엇을 넣을지, 튜토리얼보다 맥락 속 도움이 나은 이유를 정리한다.
tags: [ux, onboarding, tutorial, first-run, mobile, nngroup]
related: [ui-ux/empty-states, ui-ux/cognitive-accessibility, ui-ux/ux-writing-principles, ui-ux/form-inline-validation, mobile-dev/permissions-privacy]
sources:
  - https://www.nngroup.com/articles/mobile-app-onboarding/
  - https://www.nngroup.com/articles/empty-state-interface-design/
  - https://developer.apple.com/design/human-interface-guidelines/onboarding
updatedAt: 2026-11-23
---

## 문제

- 앱을 열자마자 넘겨야 하는 카드 5장이 기능을 자랑한다. 사용자는 이미 그 기능 때문에 설치했다.
- 첫 화면에서 권한·알림·로그인·테마 선택을 연달아 요구해 가치를 보기도 전에 떠난다.
- 튜토리얼 카드에서 본 제스처를 실제로 쓸 때는 기억하지 못한다.

## 해법

### 1. 온보딩의 세 구성 요소 (NN/g, Kendrick 2020)

| 구성 | 내용 | 판단 |
| --- | --- | --- |
| **기능 홍보** | 앱이 무엇을 할 수 있는지 | 첫 실행에는 대체로 불필요. 스토어 페이지나 기능을 쓸 시점의 맥락 도움으로. **진짜 새 기능**은 기존 사용자에게 소개할 가치가 있음 |
| **개인화** | 관심사·언어·목표 수집 | 콘텐츠를 바꾸는 정보(학습 언어 등)는 온보딩에 둘 만함. 테마·색 같은 시각 설정은 써 보기 전에 판단할 수 없어 기본값으로 |
| **사용법 안내** | 카드형 튜토리얼, 오버레이, 대화형 안내 | 짧게, 건너뛸 수 있게, 꼭 필요한 것만 |

NN/g 는 카드형(deck-of-cards) 튜토리얼이 단순한 앱을 더 복잡해 보이게 하고 기억 부담을 주며, 과업 수행을 개선하지 못했다고 보고한다. 쓰더라도 눈에 띄는 건너뛰기, 적은 장수, 카드당 개념 하나.

### 2. 더 나은 대안

- **온보딩 없이 시작 → 막히는 곳 확인 → 그 화면을 고친다.** 설명이 필요하다는 것은 대개 인터페이스 문제다.
- **맥락 속 도움(Just-in-time)**: 기능을 처음 만날 때 한 줄 팁. 닫을 수 있고 다시 볼 수 있게.
- **빈 상태 활용**: 처음 비어 있는 화면에서 기능 설명 + 첫 행동 버튼. → [빈 상태](/develop-wiki/knowledge/ui-ux/empty-states/)
- **샘플 데이터·체험 모드**: 실제 데이터를 넣기 전에 가치를 보여 준다.
- **권한은 기능을 처음 쓰는 시점에** 이유와 함께 요청. 앱이 권한 없이는 동작하지 않으면 온보딩 안에서 요청해도 된다(HIG). → [권한·프라이버시](/develop-wiki/knowledge/mobile-dev/permissions-privacy/)
- **가입은 가치를 본 뒤**(필자 지침): 둘러보기를 허용하고, 저장·구매 시점에 계정을 요구.

아래 그림은 NN/g 가 문제 삼은 카드형 튜토리얼과 위 대안 중 맥락 속 도움, 빈 상태 활용을 나란히 놓은 것이다.

<figure class="fig" role="group" aria-label="카드형 튜토리얼, 맥락 속 도움, 빈 상태 활용 비교 도식. 직접 그린 도식이며 실제 제품 화면이 아니다."><div class="fig-grid"><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="카드형 튜토리얼"><rect x="8" y="4" width="104" height="72" rx="5" class="f-screen"/><rect x="20" y="12" width="80" height="40" rx="4" class="f-card"/><text x="60" y="34" class="f-text" text-anchor="middle" font-size="7">기능 소개 1/5</text><circle cx="44" cy="60" r="1.8" class="f-fill-blue"/><circle cx="52" cy="60" r="1.8" class="f-fill-gray"/><circle cx="60" cy="60" r="1.8" class="f-fill-gray"/><circle cx="68" cy="60" r="1.8" class="f-fill-gray"/><circle cx="76" cy="60" r="1.8" class="f-fill-gray"/><text x="98" y="70" class="f-muted" text-anchor="end" font-size="5.5">건너뛰기</text></svg><span>카드형 튜토리얼</span></div><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="맥락 속 도움"><rect x="8" y="4" width="104" height="72" rx="5" class="f-screen"/><rect x="30" y="16" width="60" height="14" rx="3" class="f-dark"/><path d="M56 30 l4 5 l4 -5 z" class="f-dark"/><rect x="44" y="36" width="32" height="14" rx="7" class="f-fill-blue"/><text x="60" y="46" class="f-on" text-anchor="middle" font-size="6.5">버튼</text><text x="60" y="25.5" class="f-on" text-anchor="middle" font-size="6.5">처음이면 한 줄 팁</text></svg><span>맥락 속 도움</span></div><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="빈 상태 활용"><rect x="8" y="4" width="104" height="72" rx="5" class="f-screen"/><rect x="44" y="14" width="32" height="22" rx="4" class="f-fill-gray"/><text x="60" y="49" class="f-text" text-anchor="middle" font-size="7">아직 없어요</text><rect x="44" y="54" width="32" height="11" rx="5" class="f-fill-blue"/><text x="60" y="62" class="f-on" text-anchor="middle" font-size="6.5">시작하기</text></svg><span>빈 상태 활용</span></div></div><figcaption>카드형 튜토리얼과 대안 두 가지(맥락 속 도움, 빈 상태 활용). 카드형의 "건너뛰기"는 눈에 띄지 않게 그린 나쁜 예이며 NN/g 는 눈에 띄는 건너뛰기를 권한다. 직접 그린 도식이며 실제 제품 화면이 아니다.</figcaption></figure>

### 3. 복잡하거나 낯선 제품이라면

- 설정에 꼭 필요한 정보(조직 연결, 데이터 소스)만 단계형으로. 진행 단계 표시, 나중에 하기 허용.
- 체크리스트형 시작 가이드(“3단계 중 1단계 완료”)는 강제 투어보다 통제권을 준다.
- 이미 입력한 정보는 다시 묻지 않는다(WCAG 3.3.7). → [인지 접근성](/develop-wiki/knowledge/ui-ux/cognitive-accessibility/)

아래 그림은 위의 단계형 설정과 체크리스트형 시작 가이드를 그린 것이다.

<figure class="fig" role="group" aria-label="체크리스트형 시작 가이드와 단계형 설정 도식. 직접 그린 도식이며 실제 제품 화면이 아니다."><div class="fig-grid"><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="체크리스트형 시작 가이드"><rect x="8" y="4" width="104" height="72" rx="5" class="f-screen"/><text x="60" y="16" class="f-text" text-anchor="middle" font-size="7">시작 가이드 1/3</text><rect x="20" y="24" width="9" height="9" rx="2" class="f-fill-blue"/><path d="M22 28.5 l2 2.5 l4 -5" class="f-tick"/><line x1="36" y1="28.5" x2="70" y2="28.5" class="f-line"/><rect x="20" y="40" width="9" height="9" rx="2" class="f-box"/><line x1="36" y1="44.5" x2="96" y2="44.5" class="f-line"/><rect x="20" y="56" width="9" height="9" rx="2" class="f-box"/><line x1="36" y1="60.5" x2="96" y2="60.5" class="f-line"/></svg><span>체크리스트형 시작 가이드</span></div><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="단계형 설정"><line x1="22" y1="36" x2="98" y2="36" class="f-line"/><circle cx="22" cy="36" r="6" class="f-fill-blue"/><text x="22" y="52" class="f-muted" text-anchor="middle" font-size="7">1</text><circle cx="60" cy="36" r="6" class="f-ring-blue"/><text x="60" y="52" class="f-muted" text-anchor="middle" font-size="7">2</text><circle cx="98" cy="36" r="6" class="f-ring"/><text x="98" y="52" class="f-muted" text-anchor="middle" font-size="7">3</text><text x="60" y="20" class="f-text" text-anchor="middle" font-size="6.5">설정 단계</text></svg><span>단계형 설정</span></div></div><figcaption>복잡한 제품의 두 가지 시작 방식. 직접 그린 도식이며 실제 제품 화면이 아니다.</figcaption></figure>

## 언제 쓰나

- 첫 실행에 반드시 받아야 하는 정보가 있을 때(언어, 계정 연결).
- 업계에 없던 상호작용이나 기존 사용자에게 큰 변화가 있는 새 기능.
- 쓰지 않을 때: 단순한 앱, 표준 패턴만 쓰는 화면, "그래도 뭔가 보여 줘야 할 것 같아서".

## 체크리스트

- 온보딩 없이 사용성 테스트를 먼저 했다.
- 모든 안내는 건너뛸 수 있고, 건너뛰어도 기능을 쓰는 데 문제가 없다.
- 안내를 나중에 다시 볼 수 있다(도움말·설정).
- 첫 가치에 도달하기까지 필요한 단계 수를 측정한다(활성화 지표).
- 코치 마크·오버레이가 키보드·낭독기로도 닫히고, 포커스를 가두지 않는다.

## 흔한 실수·주의

- **온보딩으로 나쁜 UI 덮기.** 튜토리얼이 길수록 인터페이스를 고칠 신호다.
- **첫 화면에 권한 요청 묶음.** (필자 판단, 거부율 근거는 읽지 못했다)
- **개인화 질문 과다.** 이유를 설명하고 짧게. 답하지 않아도 진행되게 한다.
- **온보딩 성과를 완료율로만 측정**(필자 지침). 넘기기만 해도 완료된다. 이후 핵심 행동 수행률·유지율로 본다.
