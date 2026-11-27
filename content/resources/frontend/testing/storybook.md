---
name: Storybook
url: https://storybook.js.org
docs: https://storybook.js.org/docs
repo: https://github.com/storybookjs/storybook
stars: 91746
domain: frontend
category: testing
description: UI 컴포넌트를 앱과 분리해 상태별 "스토리"로 개발·문서화하고, 그 스토리를 상호작용·접근성·시각 테스트로 재사용하는 도구.
pricing: oss
tags: [component-test, ui-docs, visual-test, design-system]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Storybook은 컴포넌트를 앱 밖의 독립 환경(워크숍)에서 렌더링하고, 각 상태(기본, 로딩, 오류, 긴 텍스트 등)를 **스토리**로 기록하는 도구다. 스토리는 Component Story Format(CSF)이라는 표준 ES 모듈로 쓰며, 자동 문서(Autodocs), props를 바꿔 보는 Controls, 그리고 같은 스토리를 테스트로 실행하는 기능을 제공한다. React·Vue·Angular·Svelte·Web Components 등을 지원한다. 이 문서는 **Storybook 10** 기준이다(npm `storybook` `latest` 10.6.7). v10은 ESM 전용 배포이며 Node.js 20.19+ 또는 22.12+가 필요하고, `.storybook/main.ts`가 유효한 ESM이어야 한다.

- 테스트 측면에서는 Vitest 애드온이 스토리를 Vitest Browser Mode의 컴포넌트 테스트로 바꿔 실행한다. 시각 회귀 테스트는 별도 서비스(Chromatic, 유료)와 연동한다.

## 설치
프로젝트 루트에서 실행하면 프레임워크를 감지해 설정과 예제 스토리를 만든다.

```bash
npm create storybook@latest
npm create storybook@latest -- --features docs test a11y   # 문서·테스트·접근성 기능 포함
npm run storybook          # 개발 서버 (기본 6006 포트)
npm run build-storybook    # 정적 사이트 빌드 → 배포해 팀과 공유
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `*.stories.tsx` | 기본 export(meta)가 컴포넌트 정보, 이름 있는 export가 각 스토리 |
| CSF 3 | `Meta<typeof C>` / `StoryObj<typeof meta>` 객체로 스토리 정의. v10에는 타입 안전성을 높인 CSF Next가 프리뷰로 있다 |
| args | 컴포넌트 입력(props). Controls 패널에서 실시간 편집 |
| decorators | 스토리를 감싸는 래퍼(테마, 라우터, Provider) |
| play 함수 | 스토리 렌더링 후 실행되는 상호작용 스크립트. 클릭·입력·단언 |
| `storybook/test` | `expect`, `fn`, `userEvent` 등 테스트 유틸 |
| tags | `autodocs`, `!test` 등으로 문서 생성·테스트 포함 여부 제어 |
| 애드온 | Vitest(컴포넌트 테스트), a11y(axe 기반 접근성 검사), Docs 등 |

## 기본 사용법
```tsx
// Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { Button } from './Button';

const meta = {
  component: Button,
  args: { label: '저장', onClick: fn() },
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = { args: { variant: 'primary' } };
export const Disabled: Story = { args: { disabled: true } };

export const Clicked: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: '저장' }));
    await expect(args.onClick).toHaveBeenCalled();
  },
};
```

## 자주 쓰는 패턴
- **경계 상태를 스토리로.** 빈 목록, 매우 긴 텍스트, 오류, 로딩 같은 상태를 스토리로 남겨 두면 디자인 리뷰와 회귀 확인이 쉬워진다.
- **스토리 = 테스트.** `npx storybook add @storybook/addon-vitest`로 Vitest 애드온을 붙이면 모든 스토리가 렌더링 테스트가 되고, play 함수가 있으면 상호작용 테스트가 된다.
- **접근성 검사.** a11y 애드온이 각 스토리를 axe로 검사해 위반 사항을 패널에 보여 준다.
- **API 모킹.** 데이터를 가져오는 컴포넌트는 [MSW](/develop-wiki/frontend/testing/msw/) 연동 애드온이나 decorators로 응답을 고정한다.
- **디자인 시스템 문서.** `tags: ['autodocs']`로 props 표와 예시가 있는 문서 페이지를 자동 생성하고 정적 빌드를 배포한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 디자인 시스템·공용 컴포넌트 라이브러리, 디자이너·QA와 컴포넌트 상태를 공유해야 하는 팀.
- 피할 때(대안): 컴포넌트 수가 적은 작은 앱에는 설정·유지 비용이 클 수 있다. 로직 테스트만 필요하면 [Vitest](/develop-wiki/frontend/testing/vitest/)+[Testing Library](/develop-wiki/frontend/testing/testing-library/).

## 공식 문서
- [설치](https://storybook.js.org/docs/get-started/install) · [스토리 작성](https://storybook.js.org/docs/writing-stories) · [play 함수](https://storybook.js.org/docs/writing-stories/play-function)
- [Vitest 애드온](https://storybook.js.org/docs/writing-tests/integrations/vitest-addon) · [Storybook 10 마이그레이션](https://storybook.js.org/docs/releases/migration-guide)
