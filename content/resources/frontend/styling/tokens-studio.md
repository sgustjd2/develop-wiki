---
name: Tokens Studio for Figma
url: https://tokens.studio
docs: https://docs.tokens.studio/
repo: https://github.com/tokens-studio/figma-plugin
stars: 1631
domain: frontend
category: styling
description: Figma 안에서 디자인 토큰을 정의·적용하고 GitHub 등 저장소와 JSON으로 동기화하는 플러그인. 디자이너가 관리한 토큰을 Style Dictionary 로 코드에 넘기는 워크플로에 쓴다.
pricing: freemium
tags: [design-tokens, figma, design-system, dtcg, handoff]
languages: []
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Tokens Studio for Figma는 Figma 플러그인으로, 색·간격·반경·타이포그래피·그림자 같은 값을 **토큰**으로 만들어 레이어에 적용하고, 토큰을 바꾸면 문서 전체에 반영한다. 토큰은 JSON으로 저장되며 GitHub·GitLab·Bitbucket·Azure DevOps 같은 원격 저장소와 동기화할 수 있어, 개발 쪽에서는 이 JSON을 [Style Dictionary](/develop-wiki/frontend/styling/style-dictionary/)로 빌드한다. 플러그인 저장소는 MIT 라이선스이고 최신 릴리스는 2.13.4(2026-11-17).

- **요금(2026-11 기준):** 무료 플랜과 유료 Team(€39/월, 연간 결제)·Organization(€499/월)·Enterprise 가 있다. 테마(Themes), 테마별 내보내기, 멀티 파일 동기화, 브랜치 전환 등은 유료(Team 이상, 이전 Pro) 기능이다([요금](https://tokens.studio/pricing)).
- Figma 자체 Variables 로 내보내기·가져오기를 지원해 Figma 네이티브 기능과 함께 쓸 수 있다.

## 시작하기
1. Figma Community에서 "Tokens Studio for Figma" 플러그인을 실행한다.
2. 토큰 세트(예: `core`, `semantic`)를 만들고 색·간격 토큰을 추가한다.
3. Settings → Sync 에서 GitHub 등 저장소와 브랜치, 파일 경로를 지정해 토큰 JSON을 커밋·풀한다.
4. 코드 쪽에서 변환 패키지를 쓴다.

```bash
npm install -D style-dictionary @tokens-studio/sd-transforms
```

```js
import StyleDictionary from 'style-dictionary';
import { register } from '@tokens-studio/sd-transforms';

register(StyleDictionary);   // Tokens Studio 전용 transform 등록
const sd = new StyleDictionary({
  source: ['tokens/**/*.json'],
  preprocessors: ['tokens-studio'],
  platforms: {
    css: {
      transformGroup: 'tokens-studio',
      transforms: ['name/kebab'],   // 토큰 이름을 kebab-case 로 (기본은 camel)
      buildPath: 'dist/',
      files: [{ destination: 'variables.css', format: 'css/variables' }],
    },
  },
});
await sd.buildAllPlatforms();
```

## 핵심 사용법
- **토큰 참조.** `{color.blue.500}` 처럼 기본 토큰을 참조하는 시맨틱 토큰(`color.bg.primary`)을 만들어 테마 전환에 대비한다.
- **테마(유료).** 토큰 세트 조합(라이트/다크, 브랜드 A/B)을 테마로 묶어 Figma와 코드에 동시에 적용한다.
- **Variables 내보내기.** 토큰을 Figma Variables·Styles 로 내보내 Dev Mode 등 Figma 기능에서도 같은 값을 보게 한다.

## 언제 쓰나
- 쓸 때: 디자이너가 토큰의 원천을 관리하고, 변경을 PR로 개발팀에 넘기는 디자인 시스템 운영.
- 피할 때(대안): 토큰 수가 적고 테마가 하나라면 Figma Variables 만으로 충분할 수 있다. 오픈소스 디자인 도구를 쓴다면 [Penpot](/develop-wiki/oss/self-hosted/penpot/)의 디자인 토큰 기능을 본다.

## 공식 문서
- [문서](https://docs.tokens.studio/) · [요금](https://tokens.studio/pricing) · [sd-transforms](https://github.com/tokens-studio/sd-transforms)
