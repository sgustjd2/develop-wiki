---
name: Zed
url: https://zed.dev
docs: https://zed.dev/docs/
repo: https://github.com/zed-industries/zed
stars: 95421
domain: devtools
category: editor-ide
description: Rust로 작성하고 GPU로 렌더링하는 코드 에디터. 실시간 협업과 AI 에이전트 패널을 내장하며 가볍고 빠른 에디터가 필요할 때 쓴다.
pricing: oss
tags: [editor, rust, collaboration, ai, vim-mode]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Zed는 Atom 개발진이 만든 오픈소스(GPL·AGPL·Apache 혼합) 에디터로, 자체 GPU UI 프레임워크(GPUI)로 그린다. LSP·Tree-sitter 기반 언어 지원, 멀티플레이어 편집, AI 에이전트 패널, 내장 Vim 모드를 기본 제공한다. 2026-04에 1.0을 발표했고 2026-11 기준 최신은 **v1.28.1**이다. macOS·Linux·Windows를 지원한다. AI 기능은 자체 요금제 또는 외부 모델 API 키로 쓴다.

## 설치
```bash
brew install --cask zed            # macOS
curl -f https://zed.dev/install.sh | sh   # Linux
zed .                              # 현재 폴더 열기 (CLI)
```
설정: `~/.config/zed/settings.json` (명령 팔레트 `zed: open settings`).

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 명령 팔레트 | `Cmd/Ctrl+Shift+P` |
| 설정 JSON | 사용자 설정과 프로젝트 `.zed/settings.json` |
| 확장 | 언어·테마·슬래시 명령을 확장으로 추가 (WebAssembly 기반) |
| Agent Panel | 코드베이스를 읽고 편집하는 AI 에이전트 대화 창. 외부 에이전트 연결도 지원 |
| 협업 | 채널·공유 프로젝트로 다른 사람과 같은 버퍼를 동시에 편집 |
| Tasks | `tasks.json`으로 터미널 명령 실행 |

## 기본 사용법
`settings.json` 예시:

```json
{
  "vim_mode": true,
  "buffer_font_size": 15,
  "format_on_save": "on",
  "tab_size": 2,
  "languages": {
    "Python": { "language_servers": ["pyright", "ruff"] }
  }
}
```

| 하고 싶은 일 | macOS 단축키 |
| --- | --- |
| 파일 찾기 | `Cmd+P` |
| 프로젝트 검색 | `Cmd+Shift+F` |
| 심볼로 이동 | `Cmd+Shift+O` |
| 터미널 | `` Ctrl+` `` |
| 에이전트 패널 | `Cmd+?` |

## 자주 쓰는 패턴
- **Vim 사용자 전환.** `"vim_mode": true`로 모달 편집을 켜고 익숙한 키를 유지.
- **AI 모델 선택.** 설정의 언어 모델 공급자에 Anthropic·OpenAI·Ollama 등 API 키나 로컬 모델을 연결.
- **원격 개발.** SSH 원격 프로젝트를 열어 서버에서 언어 서버를 실행.
- **포매터 지정.** 언어별 `formatter`에 Prettier·외부 명령을 지정.

## 언제 쓰나 / 피할 때
- 쓸 때: 빠른 시작·반응 속도, 내장 AI·협업 기능을 함께 쓰고 싶을 때.
- 피할 때(대안): 특정 확장(디버거 어댑터, 언어 플러그인)에 의존한다면 [VS Code](/develop-wiki/devtools/editor-ide/vscode/) 생태계가 아직 넓다. JVM 대형 프로젝트는 [IntelliJ IDEA](/develop-wiki/devtools/editor-ide/intellij-idea/).

## 공식 문서
- [문서](https://zed.dev/docs/) · [설정](https://zed.dev/docs/configuring-zed) · [Vim 모드](https://zed.dev/docs/vim)
- [AI 개요](https://zed.dev/docs/ai/overview) · [블로그](https://zed.dev/blog) · [릴리스](https://github.com/zed-industries/zed/releases)
