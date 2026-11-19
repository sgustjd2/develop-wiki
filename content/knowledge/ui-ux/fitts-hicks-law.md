---
title: Fitts 법칙과 Hick 법칙
aka: [Fitts's Law, Hick's Law, Hick-Hyman Law, 피츠의 법칙, 힉의 법칙, 타깃 크기]
category: ui-ux
group: principles
level: intermediate
summary: Fitts 법칙은 목표까지 거리와 크기로 포인팅 시간을, Hick 법칙은 선택지 수로 결정 시간을 예측한다. 버튼 크기·배치와 메뉴 구성의 근거로 쓴다.
tags: [ux, fitts-law, hicks-law, hci, target-size, menu]
related: [ui-ux/gestalt-principles, ui-ux/cognitive-load-progressive-disclosure, ui-ux/navigation-patterns, mobile-dev/mobile-accessibility-basics, graphics-xr/hand-eye-tracking-interaction, ui-ux/touch-target-size]
sources:
  - https://www.nngroup.com/articles/fitts-law/
  - https://en.wikipedia.org/wiki/Hick%27s_law
updatedAt: 2026-11-19
---

## 문제

- 작은 아이콘만 클릭되고 옆 레이블은 클릭이 안 되면, 사용자는 속도를 늦춰 정확히 조준해야 한다.
- 폼 제출 버튼이 마지막 필드에서 멀리 떨어져 있으면 매번 커서를 크게 옮긴다.
- 메뉴에 항목을 계속 추가하면 "선택이 많을수록 느려진다"는 말이 나오지만, 그게 항상 맞는지는 상황에 따라 다르다.

## 해법

### Fitts 법칙 (Paul Fitts, 1954)

NN/g 가 소개하는 형태는 `T = a + b · log2(2D / W)` 이다. `D` 는 목표까지 거리, `W` 는 이동 방향의 목표 폭, `a·b` 는 입력 장치마다 다른 상수다.

- 로그이므로 거리를 두 배로 해도 시간은 두 배가 되지 않는다. **크기를 키우는 것**과 **가깝게 두는 것**이 둘 다 효과가 있다.
- 마우스에서는 화면 가장자리가 커서를 멈춰 주므로 가장자리 목표가 사실상 무한히 크다(macOS 상단 메뉴바). **터치에서는 이 이점이 없다**. NN/g 는 터치에서 가장자리 목표가 오히려 느렸다는 연구를 인용한다.

```tsx
// 아이콘이 아니라 레이블까지 포함한 행 전체를 클릭 영역으로
<label className="row">            {/* 패딩이 곧 Fitts 의 W */}
  <input type="checkbox" checked={on} onChange={toggle} />
  <span>알림 받기</span>
</label>
```

### Hick 법칙 (Hick 1952, Hyman 1953)

같은 확률의 선택지 `n` 개에서 반응 시간은 대략 `T = b · log2(n + 1)` 로 늘어난다. 선택지를 반씩 걸러 내는 식으로 고른다는 설명이 붙는다.

- **적용 조건이 좁다.** 선택지가 동등한 확률이고, 사용자가 무엇을 고를지 알고 있으며, 목록이 정렬돼 있어 나눠서 찾을 수 있을 때 맞는다.
- 처음 보는 무작위 순서 목록은 하나씩 읽어야 하므로 **선형 탐색**이 되고 Hick 법칙이 적용되지 않는다.

## 언제 쓰나

- 버튼·링크·체크박스 클릭 영역 크기, 주 행동 버튼 위치를 정할 때(Fitts).
- 자주 쓰는 항목을 메뉴 앞에 두고 드문 항목을 접을지 결정할 때(Hick + 빈도).
- 터치 목표 크기 가이드(Android 48dp, Apple 44pt 등)를 적용할 때. 수치는 각 플랫폼 문서를 확인한다.

## 체크리스트

- [ ] 아이콘 버튼의 실제 히트 영역이 보이는 아이콘보다 크다
- [ ] 레이블 클릭으로도 체크박스·라디오가 토글된다
- [ ] 제출 버튼이 마지막 입력 근처에 있다
- [ ] 위험 동작(삭제)은 자주 쓰는 동작 바로 옆에 붙어 있지 않다
- [ ] 메뉴 항목은 빈도나 사용자가 예측 가능한 순서(가나다, 시간순)로 정렬돼 있다

## 흔한 실수·주의

- **"Hick 법칙이니 선택지는 무조건 줄여라."** 탐색형 목록에는 맞지 않고, 숨기면 클릭 수와 탐색 비용이 늘어난다. 선택지를 줄이는 것과 묶어서 정렬하는 것을 구분한다.
- **보이지 않는 패딩만 늘린다.** 히트 영역이 커도 사용자가 그걸 모르면 여전히 보이는 경계를 조준하느라 느려진다(NN/g).
- **목표를 너무 촘촘히 붙인다.** 크기만 키우고 간격을 없애면 이웃을 잘못 누르는 오류가 늘어난다.
- Hick 법칙 원 논문은 직접 읽지 못했다. 식과 예외(익숙한 자극에 대한 언어 반응 등)는 Wikipedia 를 기준으로 했고, 해당 문서에 인용 부족 표시가 있다.
