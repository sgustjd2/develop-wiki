---
name: dotLottie Web
url: https://lottiefiles.com/dotlottie
docs: https://developers.lottiefiles.com/docs/dotlottie-player/dotlottie-web/
repo: https://github.com/LottieFiles/dotlottie-web
stars: 953
domain: frontend
category: animation
description: After Effects 등에서 만든 Lottie(.json)·dotLottie(.lottie) 벡터 애니메이션을 캔버스에 재생하는 LottieFiles 공식 웹 플레이어. React·Vue 래퍼가 있다.
pricing: oss
tags: [lottie, animation, vector, canvas]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Lottie는 디자이너가 After Effects(Bodymovin 플러그인)나 LottieFiles 도구로 만든 벡터 애니메이션을 JSON으로 내보내 앱·웹에서 재생하는 포맷이다. dotLottie(`.lottie`)는 하나 이상의 Lottie 애니메이션과 이미지 등 에셋을 ZIP으로 묶은 파일 포맷으로, 테마와 상태 머신 기반 인터랙션도 담을 수 있다. `@lottiefiles/dotlottie-web`은 두 포맷을 `<canvas>`에 그리는 LottieFiles의 공식 플레이어로, WASM 렌더링 엔진을 쓴다. 이 문서는 npm `@lottiefiles/dotlottie-web` `latest` 0.83.2(아직 0.x), React 래퍼 `@lottiefiles/dotlottie-react` 0.22.3 기준이다.

- 오래 쓰이던 `airbnb/lottie-web`은 마지막 릴리스가 2025년 5월(5.13.0)로 1년 넘게 갱신이 없다. 새 프로젝트는 이 플레이어를 기준으로 한다.

## 설치
```bash
npm install @lottiefiles/dotlottie-web
npm install @lottiefiles/dotlottie-react   # React 컴포넌트
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `new DotLottie({ canvas, src, autoplay, loop })` | 캔버스에 플레이어 생성. `src`는 `.lottie`·`.json` URL, `data`로 직접 전달도 가능 |
| 재생 제어 | `play()`, `pause()`, `stop()`, `setFrame(n)`, `setSpeed(x)`, `setLoop(bool)` |
| 이벤트 | `addEventListener('load' \| 'complete' \| 'frame' \| 'loadError', fn)` |
| 마커·세그먼트 | 애니메이션 안의 이름 붙은 구간만 재생 |
| 테마 | dotLottie 파일에 정의된 색상 테마 적용 |
| 상태 머신 | 클릭·hover 등에 반응하는 인터랙션을 파일에 정의해 재생 |
| `destroy()` | WASM 리소스 해제. 컴포넌트 제거 시 호출 |
| WASM 로딩 | 첫 플레이어 생성 시 엔진(압축 약 500KB)을 CDN에서 받음. `DotLottie.preload()`·`setWasmUrl()`로 조절 |

## 기본 사용법
```ts
import { DotLottie } from '@lottiefiles/dotlottie-web';

const canvas = document.querySelector<HTMLCanvasElement>('#loader')!;
const player = new DotLottie({ canvas, src: '/animations/loading.lottie', autoplay: true, loop: true });

player.addEventListener('load', () => console.log('로드 완료'));
document.querySelector('#stop')?.addEventListener('click', () => player.pause());
```

```tsx
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

export const Success = () => <DotLottieReact src="/animations/success.lottie" autoplay style={{ width: 160, height: 160 }} />;
```

## 자주 쓰는 패턴
- **`.lottie`로 배포.** 같은 애니메이션도 JSON보다 압축된 `.lottie`가 작고, 이미지 에셋을 한 파일에 담을 수 있다.
- **첫 프레임 지연 줄이기.** 앱 진입 시 `DotLottie.preload()`를 호출하거나 WASM 파일을 `<link rel="preload">`로 미리 받는다(설치 버전과 URL 버전이 같아야 재사용됨).
- **엄격한 CSP·자체 호스팅.** CDN을 쓸 수 없으면 WASM 파일을 직접 서빙하고 `setWasmUrl()`로 지정한다.
- **동작 줄이기 대응.** `prefers-reduced-motion`이면 `autoplay`를 끄고 정지 프레임만 보여 준다.

## 언제 쓰나 / 피할 때
- 쓸 때: 디자이너가 만든 아이콘 애니메이션·로딩·성공 표시·온보딩 일러스트를 코드로 다시 만들지 않고 그대로 재생할 때.
- 피할 때(대안): 데이터에 따라 동적으로 바뀌는 UI 전환은 [Motion](/develop-wiki/frontend/animation/motion/)·[GSAP](/develop-wiki/frontend/animation/gsap/)로 직접 만드는 편이 낫다. 단순 회전·페이드는 CSS로 충분하다.

## 공식 문서
- [dotlottie-web 문서](https://developers.lottiefiles.com/docs/dotlottie-player/dotlottie-web/) · [dotlottie-react 문서](https://developers.lottiefiles.com/docs/dotlottie-player/dotlottie-react/)
- [dotLottie 포맷 소개](https://lottiefiles.com/dotlottie) · [GitHub 저장소](https://github.com/LottieFiles/dotlottie-web)
