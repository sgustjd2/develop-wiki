---
title: 좋아요·저장·공유·별점 UI 설계
aka: [Like, Bookmark, Save, Favorite, Share, Star Rating, Thumbs Up/Down, Reaction Actions, 반응·저장 액션]
category: ui-ux
group: patterns
level: intermediate
summary: 하트·북마크·공유·별점·추천/비추천이 각각 무엇을 뜻하는지 구분하고, 토글 상태 표현·aria-pressed·Web Share API·라디오 그룹 별점 등 구현·접근성 근거를 정리한다.
tags: [ux, like, bookmark, share, rating, toggle-button, aria-pressed, web-share]
related: [ui-ux/ui-component-lookalikes-naming, ui-ux/microinteractions, ui-ux/response-time-feedback, ui-ux/touch-target-size, ui-ux/screen-reader-accessible-name, ui-ux/toast-notification-banner, ui-ux/deceptive-design-dark-patterns, ui-ux/error-messages]
sources:
  - https://www.w3.org/WAI/ARIA/apg/patterns/button/
  - https://www.w3.org/WAI/ARIA/apg/patterns/radio/
  - https://www.w3.org/WAI/ARIA/apg/patterns/radio/examples/radio-rating/
  - https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-pressed
  - https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share
  - https://developer.apple.com/design/human-interface-guidelines/toggles
  - https://developer.apple.com/design/human-interface-guidelines/activity-views
  - https://developer.apple.com/design/human-interface-guidelines/ratings-and-reviews
  - https://github.com/material-components/material-components-android/blob/master/docs/components/IconButton.md
  - https://www.nngroup.com/articles/icon-usability/
  - https://www.nngroup.com/articles/wishlist-or-cart/
  - https://pair.withgoogle.com/chapter/feedback-controls/
updatedAt: 2026-11-23
---

## 문제

하트, 북마크, 별, 화살표 모양 아이콘은 모양이 비슷한 만큼 뜻이 섞여 쓰인다.

- 하트가 "좋아요"(남에게 보이는 반응)일 수도, "내 목록에 저장"일 수도 있다.
- 별이 "즐겨찾기"인지 "별점"인지 모양만으로 알 수 없다.
- 눌렀는지 아닌지가 색 하나로만 표시돼 구분이 안 된다.
- 낭독기는 "좋아요" 버튼을 눌렀는지 못 눌렀는지 알려 주지 못한다.

NN/g 의 아이콘 사용성 글(Harley, 2014)은 하트와 별이 즐겨찾기·북마크·추천·평점에 두루 쓰여 사이트마다 뜻이 달라진다고 하고, 아이콘 옆에 늘 보이는 글자 라벨을 두라고 권한다. 같은 하트가 한 사이트에서는 "마음에 듦"만 표시하고 다른 사이트에서는 목록에 저장한다는 예를 든다.

## 의미 구분

아래 그림은 하트(좋아요), 북마크(저장), 별점(평가)을 나란히 그린 것이다. 이름은 그림 밑 글자와 같다.

<figure class="fig" role="group" aria-label="비슷한 아이콘, 다른 의미. 직접 그린 도식이며 실제 제품 화면이 아니다."><div class="fig-grid"><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="좋아요(반응)"><path d="M60 52 C30 34 40 16 60 28 C80 16 90 34 60 52 z" class="f-fill-red"/><text x="60" y="70" class="f-muted" text-anchor="middle" font-size="7">좋아요</text></svg><span>좋아요(반응)</span></div><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="저장(북마크)"><path d="M48 16 h24 v38 l-12 -9 l-12 9 z" class="f-fill-blue"/><text x="60" y="70" class="f-muted" text-anchor="middle" font-size="7">저장</text></svg><span>저장(북마크)</span></div><div class="fig-item"><svg viewBox="0 0 120 80" role="img" aria-label="별점(평가)"><path d="M24 28 l2.6 5.4 l6 .8 l-4.4 4.2 l1.1 5.9 l-5.3 -2.9 l-5.3 2.9 l1.1 -5.9 l-4.4 -4.2 l6 -.8 z" class="f-fill-amber"/><path d="M42 28 l2.6 5.4 l6 .8 l-4.4 4.2 l1.1 5.9 l-5.3 -2.9 l-5.3 2.9 l1.1 -5.9 l-4.4 -4.2 l6 -.8 z" class="f-fill-amber"/><path d="M60 28 l2.6 5.4 l6 .8 l-4.4 4.2 l1.1 5.9 l-5.3 -2.9 l-5.3 2.9 l1.1 -5.9 l-4.4 -4.2 l6 -.8 z" class="f-fill-amber"/><path d="M78 28 l2.6 5.4 l6 .8 l-4.4 4.2 l1.1 5.9 l-5.3 -2.9 l-5.3 2.9 l1.1 -5.9 l-4.4 -4.2 l6 -.8 z" class="f-fill-amber"/><path d="M96 28 l2.6 5.4 l6 .8 l-4.4 4.2 l1.1 5.9 l-5.3 -2.9 l-5.3 2.9 l1.1 -5.9 l-4.4 -4.2 l6 -.8 z" class="f-outline"/><text x="60" y="62" class="f-muted" text-anchor="middle" font-size="7">4 / 5</text></svg><span>별점(평가)</span></div></div><figcaption>비슷한 아이콘, 다른 의미. 직접 그린 도식이며 실제 제품 화면이 아니다.</figcaption></figure>

| 액션 | 누구를 위한 것인가 | 사용자가 기대하는 결과 |
| --- | --- | --- |
| 좋아요·반응 | 대개 상대·커뮤니티에 보이는 표현 | 작성자에게 알림·집계, 추천 신호 |
| 저장·북마크·찜 | 나 자신, 나중에 다시 보기 | 내 목록에 추가, 다른 사람에게는 안 보임 |
| 공유 | 다른 사람이나 앱에 보내기 | 외부 대상 선택 UI |
| 별점·평가 | 대상의 품질 평가, 점수 척도 | 평균 점수에 반영 |
| 추천/비추천(엄지) | 이 결과·콘텐츠가 도움이 됐는지 | 정렬·학습 신호(제품에 따라) |

구분의 근거는 출처 서술 그대로이고, 위 표의 열 구성은 필자 정리다.

- Google PAIR 가이드북은 공개 "좋아요"를 다른 사람과 소통하는 명시적 신호이면서 동시에 추천 모델을 조정하는 암묵적 신호이기도 하다고 설명한다. 그래서 한 번의 클릭에 의미가 둘이다.
- 같은 가이드북은 사용자가 피드백하는 동기 중 하나로 "개인 효용"을 들며 나중을 위한 북마크를 예로 든다. 저장은 나를 위한 행동이라는 구분과 맞는다.
- NN/g 의 위시리스트 연구(Laubheimer, 2018)는 사용자가 목록은 "확실히 원한다"는 뜻, 장바구니는 "원할 수도 있다"는 뜻으로 받아들인다고 보고한다. 또 "Wishlist"라는 이름이 선물 공유를 연상시켜 "Favorites"·"My List" 같은 이름이 거부감이 덜했지만 번거로운 가입·설정을 연상시키기도 했다고 한다. 이 연구는 이커머스 맥락이다.
- 같은 글은 이커머스 장바구니의 "나중에 저장"을 로그인·가입 뒤에 두지 말라고 권고한다(쇼핑객이 가입을 피하고, 저장한 항목이 사라졌다고 오해해 떠난 사례를 든다).

### 별점과 추천/비추천

- PAIR 는 모델에 쓸 명시적 피드백이면 선택지가 서로 겹치지 않고 모든 의견을 덮게 하라고 한다. 엄지 올림/내림이 그 예다("괜찮음"은 덮지 못한다).
- 별점은 5점 척도라면 점수가 평가 대상의 무엇을 뜻하는지 정해 두어야 한다. 별 모양만으로는 척도 설명이 안 된다(필자 정리).
- 사용자에게 앱 평가를 요청할 때 HIG 는 첫 실행·온보딩 중이 아니라 의미 있는 순간 뒤에 하고, 작업을 끊지 말고, 반복해서 조르지 말고, 시스템 프롬프트를 쓰라고 한다. 평가·반응을 압박하는 방식은 [기만적 디자인](/develop-wiki/knowledge/ui-ux/deceptive-design-dark-patterns/)과 겹칠 수 있다(필자 정리).

## 토글 상태 표현

좋아요·저장은 켜고 끄는 버튼이다.

### 시각

- Material 문서(IconButton)는 토글 아이콘 버튼이 선택 시 채운 아이콘, 해제 시 윤곽 아이콘을 쓰라고 한다.
- HIG 는 상태 차이를 분명히 하고 색만으로 상태를 전달하지 말라고 한다. 예: 채움 유무, 배경 도형, 체크 같은 내부 표시.
- HIG 는 토글처럼 동작하는 버튼에서 아이콘으로 목적을 알리고 배경 변화로 상태를 보이게 하라고 한다.
- 터치 영역 크기는 [터치 타깃 크기](/develop-wiki/knowledge/ui-ux/touch-target-size/)를 따른다.

### 접근성: 토글 버튼

```html
<!-- 이름은 고정, 상태만 aria-pressed 가 바꾼다 -->
<button type="button" aria-pressed="false" id="like">좋아요</button>
```

```ts
const btn = document.querySelector<HTMLButtonElement>('#like')!;
btn.addEventListener('click', () => {
  const on = btn.getAttribute('aria-pressed') !== 'true';
  btn.setAttribute('aria-pressed', String(on)); // 라벨은 그대로
});
```

- APG 버튼 패턴: 토글 버튼은 `aria-pressed` 로 켜짐/꺼짐을 노출하고, 상태가 바뀌어도 **라벨은 바꾸지 않는다**. 예시는 "Mute" 가 그대로이고 pressed 만 true 가 되는 경우다.
- 반대로 라벨 자체를 "저장" → "저장됨"처럼 바꾸면 `aria-pressed` 는 필요 없다. MDN 도 같은 이야기를 한다. 둘을 같이 쓰면 상태가 이중으로 읽히는 문제가 생길 수 있다(필자 주의).
- 아이콘만 있는 버튼은 접근 가능한 이름이 필요하다([접근 가능한 이름](/develop-wiki/knowledge/ui-ux/screen-reader-accessible-name/)). NN/g 는 시각 라벨을 항상 보이게 하라고 한다.
- 개수("좋아요 128")를 같이 보이면 버튼 이름과 개수가 어떻게 낭독되는지 직접 확인한다. 이 노트에서는 낭독기를 실행해 보지 않았다.

### 지연·실패

- 좋아요 클릭은 서버 응답을 기다리지 말고 즉시 표시하는 낙관적 갱신이 흔하다. 실패하면 되돌리고 알려야 한다. [낙관적 UI](/develop-wiki/knowledge/mobile-dev/optimistic-ui-eventual-consistency/), [오류 메시지](/develop-wiki/knowledge/ui-ux/error-messages/).
- 저장은 확인용 토스트에 "목록 보기" 같은 동작을 줄 수 있다([토스트·알림 배너](/develop-wiki/knowledge/ui-ux/toast-notification-banner/)). 성공이 화면에 이미 보이면 토스트가 필요 없다.
- 반응 애니메이션은 [마이크로인터랙션](/develop-wiki/knowledge/ui-ux/microinteractions/)과 [응답 시간 피드백](/develop-wiki/knowledge/ui-ux/response-time-feedback/)을 따른다.

## 공유

- **웹.** `navigator.share()` 는 시스템 공유 UI 를 연다. MDN 에 따르면 보안 컨텍스트(HTTPS)와 사용자 동작(transient activation)이 필요하고, `url`·`text`·`title`·`files` 중 하나 이상을 넘긴다. 사용자가 취소하면 `AbortError` 로 거절되므로 오류 토스트를 띄울 일이 아니다(단 MDN 은 공유 대상이 없을 때도 같은 오류라고 하므로 조용히 무시하면 그 상황이 가려진다). 파일은 `navigator.canShare()` 로 먼저 확인한다. MDN 은 이 기능이 "limited availability"(일부 널리 쓰이는 브라우저에서 미지원)라고 적으므로 지원하지 않을 때의 대체(링크 복사)를 둔다.
- **iOS.** HIG 는 공유 시트(activity view)를 여는 Share 버튼은 시스템 것을 쓰고, 같은 일을 하는 다른 방법을 만들어 혼란을 주지 말라고 한다. 시스템이 제공하는 동작(예: Print)을 복제하지 말라고도 한다.
- "링크 복사"는 공유가 아니라 복사 동작이다. 완료를 낭독기에도 알리려면 [라이브 영역](/develop-wiki/knowledge/ui-ux/live-regions-announcements/).

```ts
async function share(data: ShareData) {
  if (!navigator.share) return copyLink(data.url); // 대체
  try { await navigator.share(data); }
  catch (e) { if ((e as DOMException).name !== 'AbortError') throw e; }
}
declare function copyLink(url?: string): void;
```

## 별점 입력 접근성

- APG 에는 별점 전용 패턴이 없다. 대신 라디오 그룹 패턴에 "Rating Radio Group Example"이 있고 5점 척도 입력으로 설명된다. 같은 APG 예제 페이지는 대안으로 슬라이더 방식(Rating Slider Example, `aria-valuetext`)도 언급한다. 또 HIG 는 목록 밖 토글 버튼에 목적을 설명하는 라벨을 피하라고 하고 NN/g 는 라벨을 항상 보이게 하라고 해 두 지침이 다르다. 어느 쪽이든 접근 가능한 이름(`aria-label`)은 필요하다.
- 그 예제는 `role="radiogroup"` 컨테이너에 `aria-labelledby` 로 "Rating" 라벨을 달고, 별마다 `role="radio"` 와 `aria-checked`, `aria-label`("one star", "two stars" 등)을 둔다. SVG 자체는 `role="none"` 이다.
- 키보드: Tab 으로 그룹에 들어가면 체크된 별(없으면 첫 별)에 포커스, 화살표는 이동과 동시에 체크, Space 는 체크. 래핑 있음.
- 읽기 전용 평균 별점은 입력이 아니라 "평균 4.2점, 리뷰 n개" 같은 텍스트가 필요하다(필자 정리; 이 노트는 해당 출처를 읽지 못했다).

## 언제 쓰나

- 반응·저장이 서로 다른 결과를 낸다면 아이콘과 라벨을 분리한다(하트=좋아요, 북마크=저장).
- 둘이 같은 목록을 만든다면 하나로 합치는 것이 낫다. 두 버튼이 같은 결과를 내면 사용자는 차이를 찾는다(필자 정리).
- 평가를 요청하는 시점은 HIG 4원칙(대기·방해 금지·반복 금지·시스템 프롬프트)을 따른다.

## 주의

- 아이콘만으로 의미를 맡기지 않는다(NN/g).
- 라벨을 상태에 따라 바꾸는 방식과 `aria-pressed` 를 섞지 않는다(APG·MDN).
- 로그인 벽, 반복 평가 요청, 취소하기 어려운 공유는 사용자를 압박한다.
- 반응 수가 사회적 압력이 되거나 알림이 과해지는 문제는 이 노트에서 근거 자료를 읽지 않아 다루지 않는다.

## 검증 범위

- 읽음: APG button·radio·Rating Radio Group 예제, MDN aria-pressed·Navigator.share, HIG toggles·activity views·ratings and reviews, Material IconButton 문서, NN/g Icon Usability·위시리스트 글, PAIR Feedback + Control 장.
- 못 읽음: Material 3 규격 본문(스크립트 렌더링), NN/g 별점·소셜 반응 전용 글(검색에서 못 찾음), Baymard·Smashing 의 평점 글(검색 요약만 봄, 근거로 쓰지 않음).
- 미확인: 하트/북마크가 서로 다른 기능이라는 일반 규칙(필자 정리), 낭독기별 `aria-pressed` 낭독 문구, Web Share 브라우저별 지원 현황, 평균 별점 표시 접근성 권고.
