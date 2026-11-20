---
name: shadcn/ui
url: https://ui.shadcn.com
docs: https://ui.shadcn.com/docs
repo: https://github.com/shadcn-ui/ui
stars: 128637
domain: frontend
category: ui-kit
description: npm 패키지가 아니라 CLI로 컴포넌트 소스 코드를 프로젝트에 복사해 넣는 React 컴포넌트 모음. Tailwind CSS와 헤드리스 프리미티브 위에서 직접 고쳐 쓰고 싶을 때 쓴다.
pricing: oss
tags: [react, tailwind, headless, copy-paste, registry, design-system]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
shadcn/ui는 버튼·다이얼로그·데이터 테이블 같은 컴포넌트를 라이브러리로 설치하는 대신, `shadcn` CLI가 **소스 파일을 프로젝트 안(`components/ui/`)에 생성**하는 방식이다. 생성된 코드는 내 코드이므로 마음대로 고칠 수 있고, 업데이트는 CLI의 `--diff`로 비교해 직접 반영한다. 이 문서는 **CLI v4** 기준이다(npm `shadcn` `latest` 4.23.0).

- 동작·접근성은 헤드리스 프리미티브가 맡고 스타일은 [Tailwind CSS](/develop-wiki/frontend/styling/tailwindcss/) 클래스로 입힌다. 프리미티브는 [Base UI](/develop-wiki/frontend/ui-kit/base-ui/)(2026-07부터 새 프로젝트 기본값), [Radix UI](/develop-wiki/frontend/ui-kit/radix-ui/), [React Aria](/develop-wiki/frontend/ui-kit/react-aria/) 중에서 고른다.
- 기존 프로젝트는 처음 고른 프리미티브를 그대로 유지한다. 완성형 라이브러리([MUI](/develop-wiki/frontend/ui-kit/mui/), [Mantine](/develop-wiki/frontend/ui-kit/mantine/))와 달리 버전 업그레이드로 디자인이 바뀌지 않는다.

## 설치
Node.js 20.18.1 이상. 새 프로젝트는 템플릿까지 함께 만든다.

```bash
npx shadcn@latest init -t next          # next | vite | start | react-router | astro | laravel
npx shadcn@latest init -b radix         # 프리미티브 지정: base | radix | aria
npx shadcn@latest add button dialog     # 컴포넌트 소스 추가
```

웹의 shadcn/create에서 색·폰트·반경을 고르면 프리셋 코드가 나오고, `init --preset <코드>`로 그대로 적용한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `components.json` | 스타일, Tailwind CSS 파일 경로, `baseColor`, `cssVariables`, import 별칭(`@/components/ui` 등), 레지스트리 설정. `style`·`baseColor`는 init 후 변경 불가 |
| 프리미티브 base | `base`(Base UI), `radix`, `aria`(React Aria). 같은 컴포넌트가 base별로 따로 있다 |
| 스타일·프리셋 | 테마 색·폰트·아이콘·반경 묶음. `shadcn apply <preset>`로 기존 프로젝트에 다시 적용 |
| 레지스트리 | 컴포넌트를 JSON으로 배포하는 형식. `@v0/...`, `@acme/...` 같은 네임스페이스로 외부 레지스트리 설치, `shadcn build`로 직접 만든다 |
| CSS 변수 테마 | `--background`, `--primary` 같은 시맨틱 토큰을 CSS 파일에 두고 Tailwind 유틸리티가 참조 |
| `cn()` | 조건부 클래스 결합 + Tailwind 클래스 충돌 병합 헬퍼 |

## 기본 사용법
`add` 후 생성된 컴포넌트를 일반 로컬 모듈처럼 import 한다.

```tsx
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function SearchBar() {
  return (
    <form className="flex gap-2">
      <Input name="q" placeholder="검색어" />
      <Button type="submit" variant="secondary">검색</Button>
    </form>
  );
}
```

생성된 `button.tsx`의 `variants` 정의를 고치면 프로젝트 전체 버튼 모양이 바뀐다. 이 파일은 내 저장소에 커밋된다.

## 자주 쓰는 패턴
- **추가 전 미리보기.** `npx shadcn@latest add dialog --dry-run`(쓸 파일 목록), `--diff`(로컬 수정본과 레지스트리 최신본 비교).
- **사내 디자인 시스템 배포.** `registry.json`을 만들고 `shadcn build`로 `public/r/*.json`을 생성해 정적 호스팅하면, 팀원이 `add @사내이름/컴포넌트`로 설치한다. 비공개 GitHub 저장소 레지스트리도 지원한다.
- **레지스트리 검색.** `npx shadcn@latest search @shadcn -q "date"`로 설치 가능한 항목을 찾는다.
- **마이그레이션 명령.** `shadcn migrate icons --from lucide --to phosphor`, `migrate radix`처럼 일괄 변환을 CLI가 수행한다.
- **폼.** React Hook Form·TanStack Form 연동 예제가 공식 문서에 있다. 서버 상태는 [TanStack Query](/develop-wiki/frontend/state-data/tanstack-query/)와 함께 쓴다.

## 언제 쓰나 / 피할 때
- 쓸 때: React + Tailwind 프로젝트에서 디자인을 완전히 소유하고 싶을 때, 사내 디자인 시스템의 출발점이 필요할 때.
- 피할 때(대안): 생성된 코드의 유지보수 부담을 지기 싫으면 패키지로 업데이트되는 [MUI](/develop-wiki/frontend/ui-kit/mui/)나 [Mantine](/develop-wiki/frontend/ui-kit/mantine/). React가 아니면 [Vuetify](/develop-wiki/frontend/ui-kit/vuetify/)(Vue), [Angular Material](/develop-wiki/frontend/ui-kit/angular-material/)(Angular).
- 주의: 업스트림 수정은 자동으로 들어오지 않는다. 컴포넌트를 많이 고칠수록 `--diff` 반영 비용이 커진다.

## 공식 문서
- [설치](https://ui.shadcn.com/docs/installation) · [CLI](https://ui.shadcn.com/docs/cli) · [components.json](https://ui.shadcn.com/docs/components-json)
- [레지스트리](https://ui.shadcn.com/docs/registry) · [변경 이력](https://ui.shadcn.com/docs/changelog)
