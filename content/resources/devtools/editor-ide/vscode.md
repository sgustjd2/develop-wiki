---
name: Visual Studio Code
url: https://code.visualstudio.com
docs: https://code.visualstudio.com/docs
repo: https://github.com/microsoft/vscode
stars: 195770
domain: devtools
category: editor-ide
description: 확장으로 언어 지원·디버거·AI 기능을 붙이는 Microsoft의 크로스 플랫폼 코드 에디터. 웹·스크립트 언어 개발의 기본 에디터로 널리 쓴다.
pricing: free
tags: [editor, extensions, debugger, lsp, remote-development]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
VS Code는 Electron 기반 에디터로, 언어 기능은 Language Server Protocol 확장, 디버깅은 Debug Adapter Protocol 확장으로 붙인다. 소스(Code - OSS)는 MIT이고 Microsoft 배포판은 무료 제품 라이선스다. 2026-11 기준 최신 안정판은 **1.146**(2026-11-11)이며, 최근 릴리스는 Copilot 채팅·에이전트 세션 기능이 큰 비중을 차지한다. 화면 메뉴는 한국어 언어 팩으로 바꿀 수 있지만 공식 문서는 영어다.

- 같은 코드 기반을 쓰는 에디터로 [Cursor](/develop-wiki/ai/coding-agent/cursor/) 등이 있고, 더 가벼운 대안은 [Zed](/develop-wiki/devtools/editor-ide/zed/)·[Neovim](/develop-wiki/devtools/editor-ide/neovim/).

## 설치
```bash
brew install --cask visual-studio-code     # macOS
winget install Microsoft.VisualStudioCode  # Windows
# Linux: .deb/.rpm 또는 snap 패키지
```
macOS에서는 명령 팔레트 → `Shell Command: Install 'code' command in PATH`로 `code` CLI를 등록한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 명령 팔레트 | `Cmd/Ctrl+Shift+P`. 모든 명령을 이름으로 실행 |
| Workspace | 연 폴더(또는 `.code-workspace` 다중 폴더). `.vscode/`에 프로젝트 설정 |
| 설정 계층 | 사용자 `settings.json` < 워크스페이스 `.vscode/settings.json` |
| 확장 | Marketplace에서 설치. 추천 목록은 `.vscode/extensions.json` |
| `launch.json` / `tasks.json` | 디버그 구성 / 빌드·테스트 작업 정의 |
| Profiles | 확장·설정 묶음을 용도별로 전환 |
| Remote Development | SSH·WSL·[Dev Containers](/develop-wiki/devtools/environment/dev-containers/) 안에서 확장을 실행 |

## 기본 사용법
| 하고 싶은 일 | 단축키 (macOS / Win·Linux) |
| --- | --- |
| 파일 빠르게 열기 | `Cmd+P` / `Ctrl+P` |
| 심볼로 이동 | `Cmd+Shift+O` / `Ctrl+Shift+O` |
| 정의로 이동 / 참조 | `F12` / `Shift+F12` |
| 이름 바꾸기 | `F2` |
| 전체 검색 | `Cmd+Shift+F` / `Ctrl+Shift+F` |
| 다중 커서 (다음 일치) | `Cmd+D` / `Ctrl+D` |
| 터미널 열기 | `` Ctrl+` `` |
| 빠른 수정 | `Cmd+.` / `Ctrl+.` |

```bash
code .                    # 현재 폴더 열기
code -d a.txt b.txt       # 두 파일 비교
code --install-extension dbaeumer.vscode-eslint
```

## 자주 쓰는 패턴
- **팀 설정 공유.** `.vscode/settings.json`에 `"editor.formatOnSave": true`와 포매터 지정, `.vscode/extensions.json`에 추천 확장을 커밋한다.
- **Node 디버깅.** `launch.json`에 `"type": "node"` 구성을 두거나 JavaScript Debug Terminal에서 스크립트를 실행하면 중단점이 걸린다.
- **원격 개발.** Remote - SSH로 서버 폴더를 로컬처럼 편집하고, 컨테이너 개발은 `devcontainer.json`을 쓴다.
- **설정 동기화.** Settings Sync로 GitHub/Microsoft 계정에 설정·확장을 동기화.

## 언제 쓰나 / 피할 때
- 쓸 때: TypeScript·Python·Go 등 대부분 언어, 확장 생태계와 원격 개발이 필요할 때.
- 피할 때(대안): Java·Kotlin 대형 프로젝트의 리팩터링·분석은 [IntelliJ IDEA](/develop-wiki/devtools/editor-ide/intellij-idea/)가 강하다. 메모리·시작 속도가 중요하면 Zed·Neovim.

## 공식 문서
- [문서](https://code.visualstudio.com/docs) · [단축키 PDF](https://code.visualstudio.com/docs/getstarted/keybindings) · [디버깅](https://code.visualstudio.com/docs/debugtest/debugging)
- [릴리스 노트](https://code.visualstudio.com/updates) · [확장 Marketplace](https://marketplace.visualstudio.com/vscode)
