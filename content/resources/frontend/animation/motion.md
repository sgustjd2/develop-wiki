---
name: Motion
url: https://motion.dev
docs: https://motion.dev/docs/react
repo: https://github.com/motiondivision/motion
stars: 35329
domain: frontend
category: animation
description: 선언적 props로 React 컴포넌트에 애니메이션·제스처·레이아웃 전환을 붙이는 라이브러리(옛 Framer Motion). 바닐라 JS·Vue용 API도 있다.
pricing: oss
tags: [animation, react, gesture, layout-animation]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Motion은 `<motion.div animate={{ x: 100 }} />`처럼 요소에 목표 상태를 선언하면 전환 애니메이션을 처리해 주는 애니메이션 라이브러리다. 예전 Framer Motion이 독립 프로젝트로 바뀌며 이름이 `motion`이 되었고, `framer-motion` 패키지도 같은 버전으로 계속 배포된다. 스프링 물리, 제스처(hover·tap·drag), 화면 진입·스크롤 연동, 레이아웃 변경 자동 애니메이션, 언마운트 애니메이션을 지원한다. 이 문서는 npm `motion` `latest` 14.14.0 기준이며 React API는 `motion/react`에서 import한다(React 18·19).

- 런타임 라이브러리지만 가능한 경우 Web Animations API·CSS 하드웨어 가속을 사용한다. 타임라인 중심의 정교한 연출은 GSAP가, 컴포넌트 상태 전환은 Motion이 편한 편이다.

## 설치
```bash
npm install motion
```

```ts
import { motion, AnimatePresence } from 'motion/react'; // React
import { animate, scroll } from 'motion';               // 바닐라 JS
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `motion.<tag>` | 애니메이션 가능한 HTML·SVG 요소 (`motion.div`, `motion.path`) |
| `initial` / `animate` / `exit` | 시작 상태, 목표 상태, 제거될 때 상태 |
| `transition` | `duration`, `ease`, `type: 'spring'`, `delay`, `stiffness` 등 |
| 제스처 props | `whileHover`, `whileTap`, `whileFocus`, `drag`, `whileInView` |
| `variants` | 이름 붙인 상태 묶음. 부모에서 자식으로 전파, `delayChildren: stagger(0.05)`로 순차 실행 |
| `AnimatePresence` | 자식이 트리에서 빠질 때 `exit` 애니메이션을 끝낸 뒤 제거 |
| `layout` / `layoutId` | 크기·위치 변화를 자동 애니메이션 / 다른 컴포넌트 간 공유 요소 전환 |
| 모션 값 훅 | `useMotionValue`, `useTransform`, `useSpring`, `useScroll` — 리렌더 없이 값 갱신 |
| `MotionConfig` | 하위 트리 기본 transition, `reducedMotion` 설정 |

## 기본 사용법
```tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export function Toast() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setOpen((v) => !v)}>
        알림 토글
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div key="toast" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }} transition={{ type: 'spring', stiffness: 300, damping: 24 }}>
            저장되었습니다
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
```

## 자주 쓰는 패턴
- **목록 순차 등장.** 부모 `variants`에 `transition: { delayChildren: stagger(0.05) }`(`stagger`는 `motion/react`에서 import)를 두고 자식은 `variants`만 지정한다. 예전 `staggerChildren` 옵션은 deprecated다.
- **레이아웃 전환.** 탭 밑줄처럼 위치가 바뀌는 요소에 같은 `layoutId`를 주면 요소 간 이동이 애니메이션된다.
- **스크롤 진행 표시.** `const { scrollYProgress } = useScroll()`을 `<motion.div style={{ scaleX: scrollYProgress }} />`에 연결한다.
- **동작 줄이기 설정 존중.** `<MotionConfig reducedMotion="user">`로 OS의 "동작 줄이기" 설정 시 변형 애니메이션을 끈다.
- **번들 줄이기.** `LazyMotion` + `m` 컴포넌트로 필요한 기능만 지연 로드한다.

## 언제 쓰나 / 피할 때
- 쓸 때: [React](/develop-wiki/frontend/framework/react/) UI의 상태 전환·마이크로 인터랙션·페이지 전환·드래그를 선언적으로 만들 때.
- 피할 때(대안): 긴 타임라인·스크롤 연출·SVG 모핑 같은 복잡한 시퀀스는 [GSAP](/develop-wiki/frontend/animation/gsap/). 단순 hover 효과는 CSS transition으로 충분하다. 3D는 [Three.js](/develop-wiki/frontend/animation/threejs/).

## 공식 문서
- [React 시작하기](https://motion.dev/docs/react) · [motion 컴포넌트](https://motion.dev/docs/react-motion-component) · [AnimatePresence](https://motion.dev/docs/react-animate-presence)
- [레이아웃 애니메이션](https://motion.dev/docs/react-layout-animations) · [스크롤 애니메이션](https://motion.dev/docs/react-scroll-animations) · [업그레이드 가이드](https://motion.dev/docs/react-upgrade-guide)
