---
name: Material for MkDocs
url: https://squidfunk.github.io/mkdocs-material/
docs: https://squidfunk.github.io/mkdocs-material/getting-started/
repo: https://github.com/squidfunk/mkdocs-material
stars: 27629
domain: devtools
category: docs
description: Python 정적 사이트 생성기 MkDocs용 문서 테마. 2027년 5월 지원 종료가 예정되어 후속 도구 Zensical로 이전 중이며, 기존 Python 프로젝트 문서에 쓴다.
pricing: oss
tags: [documentation, mkdocs, python, static-site, zensical]
languages: [python]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Material for MkDocs는 MkDocs의 테마이자 플러그인 모음으로, `mkdocs.yml` 하나와 Markdown 파일로 검색·다크 모드·탭·주석(admonition)·코드 복사 버튼이 있는 문서 사이트를 만든다. FastAPI·Pydantic 등 많은 Python 프로젝트가 사용했다. 2026-11 기준 **9.8.1**(MIT). **공식 사이트는 2027-05-05에 지원 종료(EOL)를 예고**했고, 그때까지는 중요한 수정만 하며 같은 팀이 기존 MkDocs 프로젝트와 호환되는 후속 도구 **Zensical**을 개발 중이다.

- 신규 프로젝트는 Zensical 또는 [Docusaurus](/develop-wiki/devtools/docs/docusaurus/)·[Starlight](/develop-wiki/devtools/docs/starlight/) 등을 함께 검토한다.

## 설치
```bash
pip install mkdocs-material      # MkDocs 포함 설치
mkdocs new my-docs && cd my-docs
mkdocs serve                     # http://127.0.0.1:8000
mkdocs build                     # site/
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `mkdocs.yml` | 사이트 이름, `theme`, `nav`, `plugins`, `markdown_extensions` |
| `docs/` | Markdown 원본. `nav`를 생략하면 폴더 구조로 메뉴 생성 |
| `theme.features` | `navigation.tabs`, `content.code.copy`, `search.suggest` 등 기능 플래그 |
| Admonitions | `!!! note "제목"` 형태 강조 블록 |
| pymdownx | 탭, 코드 하이라이트, superfences 등 Markdown 확장 |
| 플러그인 | `search`(기본), `blog`, `tags`, 소셜 카드 등 |

## 기본 사용법
`mkdocs.yml`:

```yaml
site_name: My Project
theme:
  name: material
  language: ko
  features:
    - navigation.tabs
    - content.code.copy
  palette:
    - scheme: default
      toggle: { icon: material/brightness-7, name: 다크 모드 }
    - scheme: slate
      toggle: { icon: material/brightness-4, name: 라이트 모드 }
markdown_extensions:
  - admonition
  - pymdownx.superfences
  - pymdownx.tabbed:
      alternate_style: true
nav:
  - 소개: index.md
  - 설치: install.md
```

## 자주 쓰는 패턴
- **GitHub Pages 배포.** `mkdocs gh-deploy --force`로 `gh-pages` 브랜치에 바로 배포하거나 Actions에서 실행.
- **API 문서 자동화.** mkdocstrings 플러그인으로 Python docstring에서 레퍼런스 생성.
- **다이어그램.** superfences의 custom fence로 [Mermaid](/develop-wiki/devtools/docs/mermaid/) 블록 렌더링.
- **이전 계획.** EOL 전에 Zensical 호환성 안내를 확인하고, 커스텀 테마 오버라이드를 최소화해 둔다.

## 언제 쓰나 / 피할 때
- 쓸 때: 이미 운영 중인 MkDocs 문서 유지, Python 중심 팀의 내부 문서.
- 피할 때(대안): 2027-05 이후까지 장기 운영할 신규 사이트는 Zensical이나 다른 생성기를 검토한다.

## 공식 문서
- [시작하기](https://squidfunk.github.io/mkdocs-material/getting-started/) · [설정](https://squidfunk.github.io/mkdocs-material/setup/) · [레퍼런스](https://squidfunk.github.io/mkdocs-material/reference/)
- [MkDocs](https://www.mkdocs.org/) · [Zensical](https://zensical.org/)
