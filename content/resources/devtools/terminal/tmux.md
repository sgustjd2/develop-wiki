---
name: tmux
url: https://github.com/tmux/tmux
docs: https://github.com/tmux/tmux/wiki
repo: https://github.com/tmux/tmux
stars: 50521
domain: devtools
category: terminal
description: 한 터미널에서 여러 세션·창·분할 화면을 만들고, 접속이 끊겨도 세션을 유지하는 터미널 멀티플렉서. 원격 서버 작업과 장시간 프로세스에 쓴다.
pricing: oss
tags: [terminal, multiplexer, session, ssh]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
tmux는 서버 프로세스가 세션을 들고 있고 터미널은 거기에 붙었다 떨어지는(attach/detach) 구조라, SSH가 끊기거나 터미널을 닫아도 작업이 계속 실행된다. 한 화면을 여러 pane으로 나누고 창(window)을 탭처럼 전환한다. 이 문서는 **3.8** 기준(2026-09 릴리스, ISC 라이선스).

- 대안: GNU screen(오래된 대안), Zellij(Rust, 기본 UI에 단축키 안내). 터미널 자체의 분할 기능([Ghostty](/develop-wiki/devtools/terminal/ghostty/) 등)은 세션 유지가 안 된다.

## 설치
```bash
brew install tmux      # macOS
sudo apt install tmux  # Debian/Ubuntu
```
설정 파일: `~/.tmux.conf` 또는 `~/.config/tmux/tmux.conf`.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| session | 창 묶음. 이름을 붙여 attach/detach |
| window | 세션 안의 탭 하나 |
| pane | window 안의 분할 영역 |
| prefix | 모든 단축키의 접두 키. 기본 `Ctrl+b` |
| copy mode | 스크롤백 탐색·복사 모드 |

## 자주 쓰는 명령·키
| 하고 싶은 일 | 명령 / 키 (`prefix` = `Ctrl+b`) |
| --- | --- |
| 이름 붙여 새 세션 | `tmux new -s work` |
| 세션 목록 / 다시 붙기 | `tmux ls` / `tmux attach -t work` |
| 세션에서 떨어지기 | `prefix d` |
| 새 창 / 다음·이전 창 | `prefix c` / `prefix n` / `prefix p` |
| 창 번호로 이동 / 이름 바꾸기 | `prefix 0~9` / `prefix ,` |
| 좌우 분할 / 상하 분할 | `prefix %` / `prefix "` |
| pane 이동 / 확대 토글 | `prefix 방향키` / `prefix z` |
| pane 닫기 | `prefix x` 또는 `exit` |
| 스크롤(copy mode) | `prefix [` → `q`로 종료 |
| 세션 트리에서 고르기 | `prefix s` |
| 명령 입력 | `prefix :` |

## 기본 사용법
`~/.tmux.conf` 예시:

```tmux
set -g prefix C-a            # prefix 를 Ctrl+a 로
unbind C-b
bind C-a send-prefix
set -g mouse on              # 마우스로 pane 선택·크기 조절·스크롤
set -g base-index 1          # 창 번호 1부터
set -g history-limit 50000
bind | split-window -h -c "#{pane_current_path}"
bind - split-window -v -c "#{pane_current_path}"
bind r source-file ~/.tmux.conf \; display "reloaded"
```

## 자주 쓰는 패턴
- **원격 장시간 작업.** 서버에서 `tmux new -s deploy` 후 작업, `prefix d`로 떠났다가 다음 접속 때 `tmux attach -t deploy`.
- **프로젝트 레이아웃.** 에디터·개발 서버·로그를 pane으로 나눠 한 창에 둔다. 반복되면 셸 스크립트로 `tmux new-session -d`, `split-window`, `send-keys`를 묶는다.
- **pane 동기 입력.** `:setw synchronize-panes on`으로 여러 서버에 같은 명령 입력.
- **에디터 연동.** [Neovim](/develop-wiki/devtools/editor-ide/neovim/) 사용 시 `set -sg escape-time 10`으로 Esc 지연을 줄인다.

## 언제 쓰나 / 피할 때
- 쓸 때: SSH 원격 작업, 끊기면 안 되는 장시간 명령, 터미널 레이아웃을 키보드로 관리할 때.
- 피할 때(대안): 로컬에서 분할 화면만 필요하면 터미널 앱의 분할 기능이 더 단순하다. 단축키 학습이 부담되면 Zellij.

## 공식 문서
- [위키](https://github.com/tmux/tmux/wiki) · [Getting Started](https://github.com/tmux/tmux/wiki/Getting-Started) · [매뉴얼](https://man.openbsd.org/tmux.1)
- [릴리스](https://github.com/tmux/tmux/releases)
