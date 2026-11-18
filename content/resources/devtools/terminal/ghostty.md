---
name: Ghostty
url: https://ghostty.org
docs: https://ghostty.org/docs
repo: https://github.com/ghostty-org/ghostty
domain: devtools
category: terminal
description: Zig로 작성하고 GPU로 렌더링하며 플랫폼 네이티브 UI를 쓰는 터미널 에뮬레이터. 설정 없이 바로 쓰는 빠른 터미널이 필요할 때 쓴다.
pricing: oss
tags: [terminal-emulator, gpu, zig, macos, linux]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Ghostty는 macOS에서는 Swift/AppKit, Linux에서는 GTK로 네이티브 창·탭·분할을 그리고, 터미널 처리와 렌더링은 Zig 코어와 GPU(Metal/OpenGL)로 하는 터미널 에뮬레이터다(MIT). 기본값만으로 쓸 수 있게 설계되어 설정 파일이 없어도 동작하고, 수백 개의 내장 테마와 라이트/다크 자동 전환을 지원한다. 2026-11 기준 최신 앱 태그는 **v1.4.0**이며, 공식 지원 플랫폼은 macOS와 Linux다.

- 대안: **WezTerm**(Lua 설정, 내장 멀티플렉서, Windows 지원, 마지막 정식 릴리스는 2024-02), **iTerm2**(macOS 전용, 오래된 기능 풍부한 터미널), Alacritty·Kitty.

## 설치
```bash
brew install --cask ghostty      # macOS
# Linux: 배포판 패키지 또는 소스 빌드 (공식 문서의 설치 안내 참고)
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 설정 파일 | `~/.config/ghostty/config.ghostty` (1.2.3 이전 이름은 `config`). macOS는 `~/Library/Application Support/com.mitchellh.ghostty/`도 읽음 |
| 문법 | 한 줄에 `key = value`, `#` 주석, 같은 키를 여러 번 쓰면 뒤가 우선 |
| keybind | `keybind = 트리거=액션` |
| 테마 | `theme = light:이름,dark:이름`으로 시스템 모드 따라 전환 |
| 설정 다시 읽기 | macOS `Cmd+Shift+,`, Linux `Ctrl+Shift+,` |

## 기본 사용법
`~/.config/ghostty/config.ghostty`:

```ini
font-family = JetBrains Mono
font-size = 14
theme = light:Catppuccin Latte,dark:Catppuccin Mocha
window-padding-x = 8
macos-option-as-alt = true
keybind = cmd+d=new_split:right
keybind = cmd+shift+d=new_split:down
```

```bash
ghostty +list-themes                       # 테마 미리보기
ghostty +list-fonts                        # 사용 가능한 글꼴
ghostty +show-config --default --docs | less   # 모든 옵션과 설명
```

## 자주 쓰는 패턴
- **옵션 찾기.** 온라인 대신 `+show-config --default --docs`로 설치된 버전의 옵션을 확인.
- **Option 키를 Alt로.** macOS에서 셸 단축키(`Alt+C` 등, [fzf](/develop-wiki/devtools/terminal/fzf/))를 쓰려면 `macos-option-as-alt = true`.
- **세션 유지가 필요하면.** 분할·탭은 앱을 닫으면 사라지므로 원격·장기 작업은 [tmux](/develop-wiki/devtools/terminal/tmux/)와 함께 쓴다.
- **SSH 원격의 terminfo.** 원격 서버에 Ghostty terminfo가 없으면 키 입력이 이상할 수 있다. 공식 문서의 terminfo 안내를 따르거나 `TERM=xterm-256color`로 접속.

## 언제 쓰나 / 피할 때
- 쓸 때: macOS·Linux에서 설정 부담 없이 빠르고 네이티브한 터미널을 원할 때.
- 피할 때(대안): Windows가 필요하면 WezTerm·Windows Terminal. 스크립트로 세밀하게 제어하려면 WezTerm(Lua). macOS 전용 고급 기능(트리거, tmux 통합 모드)은 iTerm2.

## 공식 문서
- [문서](https://ghostty.org/docs) · [설정](https://ghostty.org/docs/config) · [설정 레퍼런스](https://ghostty.org/docs/config/reference)
- [WezTerm](https://wezterm.org/) · [iTerm2](https://iterm2.com/documentation.html)
