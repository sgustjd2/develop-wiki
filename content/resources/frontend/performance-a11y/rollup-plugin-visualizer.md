---
name: rollup-plugin-visualizer
url: https://github.com/btd/rollup-plugin-visualizer
docs: https://github.com/btd/rollup-plugin-visualizer#readme
repo: https://github.com/btd/rollup-plugin-visualizer
domain: frontend
category: performance-a11y
description: Rollup·Vite·Rolldown 빌드 결과에서 어떤 모듈이 번들 용량을 차지하는지 트리맵 등으로 시각화하는 플러그인.
pricing: oss
tags: [bundle-analysis, performance, vite, rollup]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
rollup-plugin-visualizer는 빌드가 끝난 뒤 번들에 포함된 모듈과 각 크기를 분석해 HTML 보고서(트리맵, 선버스트, 네트워크 그래프 등)로 만들어 주는 플러그인이다. Rollup 플러그인 인터페이스를 따르므로 Vite와 Rolldown에서도 그대로 쓴다. 큰 의존성, 중복 포함된 패키지, 트리 셰이킹되지 않은 코드를 찾아 JavaScript 전송량을 줄이는 데 쓴다. 이 문서는 npm `rollup-plugin-visualizer` `latest` 7.1.3 기준이다(MIT, Node.js 22 이상).

- webpack 프로젝트에는 같은 역할의 `webpack-bundle-analyzer`가 있다.

## 설치
```bash
npm install -D rollup-plugin-visualizer
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `visualizer(options)` | 플러그인 생성. 다른 플러그인 뒤, 목록 마지막에 둔다 |
| `template` | `treemap`(기본), `sunburst`, `flamegraph`, `network`, `list`, `markdown`, `raw-data` 등 |
| `filename` | 보고서 파일 경로 (기본 `stats.html` 등 템플릿에 맞는 확장자) |
| `gzipSize` / `brotliSize` | 압축 후 크기도 계산 — 실제 전송량 판단에 유용 |
| `open` | 빌드 후 브라우저로 보고서 열기 |
| 색 구분 | 파란색은 프로젝트 파일, 초록색은 `node_modules` 의존성 |
| `network` 템플릿 | "이 모듈이 왜 포함됐나" — 가져오는 쪽 경로 추적 |
| CLI | `raw-data` JSON 여러 개를 합쳐 하나의 차트로 (`rollup-plugin-visualizer stats1.json stats2.json`) |

## 기본 사용법
```ts
// vite.config.ts
import { defineConfig, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({ filename: 'dist/stats.html', template: 'treemap', gzipSize: true, brotliSize: true }) as PluginOption,
  ],
});
```

`npm run build` 후 `dist/stats.html`을 연다. 보고서에는 소스 코드 내용이 아니라 파일 경로·크기 같은 메타데이터만 들어간다.

## 자주 쓰는 패턴
- **분석 전용 모드.** 평소 빌드를 느리게 하지 않도록 `process.env.ANALYZE && visualizer({ open: true })`처럼 환경 변수로 켠다.
- **큰 의존성 교체.** 트리맵에서 큰 초록 블록(예: 날짜·유틸 라이브러리 전체 import)을 찾아 부분 import·가벼운 대안·동적 `import()`로 바꾼다.
- **중복 탐지.** 같은 패키지의 여러 버전이 보이면 패키지 매니저의 중복 제거(`npm dedupe` 등)를 검토한다.
- **청크 확인.** 라우트별 코드 분할이 의도대로 나뉘었는지 청크별 구성을 본다.
- **압축 크기 기준으로 판단.** 원본 크기보다 gzip·Brotli 크기가 실제 다운로드 비용에 가깝다.

## 언제 쓰나 / 피할 때
- 쓸 때: Vite·Rollup·Rolldown 앱의 번들이 커져 LCP·INP가 나빠질 때, 의존성 추가 전후 영향을 비교할 때.
- 피할 때(대안): webpack 빌드는 `webpack-bundle-analyzer`. 런타임 성능 자체는 [Lighthouse](/develop-wiki/frontend/performance-a11y/lighthouse/)와 [web-vitals](/develop-wiki/frontend/performance-a11y/web-vitals/)로 측정한다.

## 공식 문서
- [README(설치·옵션·템플릿)](https://github.com/btd/rollup-plugin-visualizer#readme) · [CHANGELOG](https://github.com/btd/rollup-plugin-visualizer/blob/master/CHANGELOG.md)
