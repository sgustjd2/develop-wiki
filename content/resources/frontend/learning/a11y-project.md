---
name: The A11Y Project
url: https://www.a11yproject.com
docs: https://www.a11yproject.com/checklist/
repo: https://github.com/a11yproject/a11yproject.com
stars: 3914
domain: frontend
category: learning
description: 커뮤니티가 운영하는 오픈소스 웹 접근성 학습 사이트. WCAG 2.2 기준에 연결된 체크리스트와 실무 글, 도구·자료 목록을 제공해 접근성 입문과 출시 전 점검에 쓴다.
pricing: oss
tags: [accessibility, checklist, wcag, community]
languages: []
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
The A11Y Project는 웹 접근성을 쉽게 설명하려는 커뮤니티 프로젝트다. 가장 많이 쓰이는 것은 [체크리스트](https://www.a11yproject.com/checklist/)로, 항목마다 관련 WCAG 성공 기준(2.2 문서) 링크가 붙어 있다. 사이트 콘텐츠와 코드는 Apache-2.0 라이선스로 GitHub에서 관리되며 2026-11에도 커밋이 이어지고 있다.

## 체크리스트 구성
Content, Global code, Keyboard, Images, Headings, Lists, Controls, Tables, Forms, Media, Video, Audio, Appearance, Animation, Color contrast, Mobile and touch 영역으로 나뉜다.

## 활용법
- **PR 체크리스트로.** 새 화면을 만들 때 Keyboard·Headings·Forms 항목을 PR 템플릿에 옮겨 리뷰 항목으로 쓴다.
- **입문 학습.** Posts 섹션의 짧은 글로 개념을 익히고, Resources 섹션에서 도구·서적 목록을 찾는다.
- **근거 확인.** 체크리스트 항목의 WCAG 링크를 따라 [How to Meet WCAG](/develop-wiki/frontend/learning/wcag-quick-reference/)에서 기법과 실패 사례를 확인한다.

## 언제 쓰나
- 접근성 담당자가 없는 팀이 최소한의 점검 기준을 정할 때. 체크리스트를 모두 통과해도 WCAG 준수가 보장되지는 않으므로, 자동 검사([axe-core](/develop-wiki/frontend/performance-a11y/axe-core/))와 스크린 리더 수동 테스트를 함께 한다.

## 공식 자료
- [Checklist](https://www.a11yproject.com/checklist/) · [GitHub](https://github.com/a11yproject/a11yproject.com)
