---
name: GSAP
url: https://gsap.com
docs: https://gsap.com/docs/v3/
repo: https://github.com/greensock/GSAP
stars: 31144
domain: frontend
category: animation
description: 트윈·타임라인으로 CSS·SVG·캔버스·객체 속성을 애니메이션하는 프레임워크 독립 JavaScript 라이브러리. ScrollTrigger 등 플러그인까지 무료다.
pricing: source-available
tags: [animation, timeline, scroll-animation, svg]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
GSAP(GreenSock Animation Platform)는 숫자로 표현되는 거의 모든 속성(CSS, SVG 속성, 캔버스 객체, WebGL 유니폼, 일반 JS 객체)을 시간에 따라 바꾸는 애니메이션 라이브러리다. 개별 트윈을 타임라인에 배치해 정교한 시퀀스를 만들고, 일시 정지·역재생·속도 조절을 코드로 제어한다. Webflow가 인수한 뒤 SplitText, MorphSVG 같은 예전 회원 전용(유료) 플러그인까지 모두 무료가 되었다. 이 문서는 npm `gsap` `latest` 3.15.1 기준이다.

- **라이선스:** 소스는 GitHub에 공개되어 있지만 OSI 오픈소스가 아닌 GSAP 자체 "Standard No Charge" 라이선스다. 상업적 사용도 무료지만, 코드 없이 시각적 애니메이션을 만드는 도구(Webflow와 경쟁하는 노코드 빌더)에 쓰는 것은 금지 용도로 정의되어 있다. 사용 전 [라이선스 원문](https://gsap.com/standard-license)을 확인한다.

## 설치
```bash
npm install gsap
npm install @gsap/react   # React용 useGSAP 훅
```

플러그인은 같은 패키지 안에 있으며 `gsap.registerPlugin(ScrollTrigger)`처럼 등록해서 쓴다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `gsap.to` / `from` / `fromTo` | 대상의 현재 값에서 목표 값으로 / 지정 값에서 현재 값으로 / 둘 다 지정 |
| 대상 | CSS 선택자, 요소, 배열, 일반 객체 |
| 변환 축약 | `x`, `y`, `rotation`, `scale`, `autoAlpha`(opacity + visibility) |
| `duration` / `ease` / `delay` / `stagger` | 길이, 이징(`'power2.out'` 등), 지연, 여러 대상 순차 간격 |
| `gsap.timeline()` | 트윈을 순서대로 배치. 위치 매개변수(`'<'`, `'-=0.2'`, 레이블)로 겹침 조절 |
| 제어 | `play()`, `pause()`, `reverse()`, `seek()`, `timeScale()`, `kill()` |
| ScrollTrigger | 스크롤 위치에 애니메이션 시작·진행(`scrub`)·고정(`pin`)을 연결 |
| `gsap.context()` / `useGSAP` | 생성한 애니메이션을 묶어 한 번에 정리(revert) |
| `gsap.matchMedia()` | 미디어 쿼리별 애니메이션, `prefers-reduced-motion` 대응 |

## 기본 사용법
```ts
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const tl = gsap.timeline({ defaults: { duration: 0.6, ease: 'power2.out' } });
tl.from('.hero h1', { y: 40, autoAlpha: 0 })
  .from('.hero p', { y: 20, autoAlpha: 0 }, '-=0.3')
  .from('.hero .card', { scale: 0.9, autoAlpha: 0, stagger: 0.1 });

gsap.to('.progress', {
  scaleX: 1,
  ease: 'none',
  scrollTrigger: { trigger: 'main', start: 'top top', end: 'bottom bottom', scrub: true },
});
```

## 자주 쓰는 패턴
- **React에서는 `useGSAP`.** `useGSAP(() => { gsap.from('.box', { y: 50 }) }, { scope: containerRef })`로 쓰면 언마운트 시 자동 정리되고 선택자가 컨테이너 안으로 제한된다.
- **동작 줄이기.** `gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => { ... })` 안에서만 움직임이 큰 애니메이션을 만든다.
- **ScrollTrigger 디버깅.** 개발 중 `markers: true`로 시작·끝 위치를 화면에 표시한다. 레이아웃이 바뀐 뒤에는 `ScrollTrigger.refresh()`.
- **레이아웃 대신 transform.** `top`/`left` 대신 `x`/`y`를 애니메이션해 리플로를 피한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 랜딩·마케팅 페이지의 스크롤 연출, 여러 요소가 맞물리는 타임라인, SVG 모핑·텍스트 분할 효과, 프레임워크와 무관한 애니메이션.
- 피할 때(대안): React 상태에 따른 간단한 전환·제스처는 [Motion](/develop-wiki/frontend/animation/motion/)이 더 선언적이다. OSI 라이선스가 필수인 프로젝트, 노코드 애니메이션 빌더 제품에는 쓸 수 없다.

## 공식 문서
- [문서 홈](https://gsap.com/docs/v3/) · [Timeline](https://gsap.com/docs/v3/GSAP/Timeline) · [ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)
- [React 가이드](https://gsap.com/resources/React/) · [Standard License](https://gsap.com/standard-license)
