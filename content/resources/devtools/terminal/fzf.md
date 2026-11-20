---
name: fzf
url: https://junegunn.github.io/fzf/
docs: https://junegunn.github.io/fzf/
repo: https://github.com/junegunn/fzf
stars: 84309
domain: devtools
category: terminal
description: 표준 입력으로 받은 목록을 퍼지 검색해 고른 항목을 출력하는 명령줄 필터. 파일·히스토리·브랜치 선택을 셸에서 빠르게 할 때 쓴다.
pricing: oss
tags: [cli, fuzzy-finder, shell, productivity]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
fzf는 입력 줄 목록을 받아 대화형으로 퍼지 매칭하고 선택한 줄을 표준 출력으로 내보내는 Go 프로그램이다. 어떤 명령의 출력이든 파이프로 넘길 수 있어 다른 CLI와 조합하기 쉽고, 셸 통합을 켜면 `Ctrl+R`(히스토리), `Ctrl+T`(파일), `Alt+C`(디렉터리 이동)가 생긴다. 이 문서는 **0.75** 기준(2026-11 최신 v0.75.0, MIT).

## 설치
```bash
brew install fzf
```
셸 통합 (0.48 이후 방식) — 설정 파일 끝에 추가:

```bash
# ~/.zshrc
source <(fzf --zsh)
# ~/.bashrc
eval "$(fzf --bash)"
# ~/.config/fish/config.fish
fzf --fish | source
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 입력 / 출력 | 표준 입력 목록 → 선택 결과를 표준 출력 |
| 검색 문법 | `abc`(퍼지), `'abc`(정확), `^abc`(접두), `abc$`(접미), `!abc`(제외), 공백=AND, `\|`=OR |
| `--multi` | `Tab`으로 여러 개 선택 |
| `--preview` | 선택 중인 항목을 `{}`로 받아 명령 실행 결과를 옆에 표시 |
| `FZF_DEFAULT_COMMAND` | 입력 없이 실행할 때 쓸 파일 목록 명령 |
| `--bind` | 키에 동작을 연결 (`ctrl-y:execute(...)` 등) |

## 기본 사용법
| 하고 싶은 일 | 명령 |
| --- | --- |
| 명령 히스토리 검색 | `Ctrl+R` |
| 파일 경로 넣기 | `Ctrl+T` |
| 하위 디렉터리로 이동 | `Alt+C` |
| 인자 자리에서 완성 | `vim **<Tab>`, `cd **<Tab>`, `kill -9 **<Tab>` |
| 미리보기와 함께 파일 열기 | `nvim "$(fzf --preview 'cat {}')"` |

```bash
# Git 브랜치 골라서 전환
git switch "$(git branch --format='%(refname:short)' | fzf)"

# ripgrep 로 파일 목록을 만들도록 (gitignore 존중)
export FZF_DEFAULT_COMMAND='rg --files --hidden --glob "!.git"'
export FZF_CTRL_T_COMMAND="$FZF_DEFAULT_COMMAND"
```

## 자주 쓰는 패턴
- **검색 결과에서 바로 열기.** `rg -n FIXME | fzf --delimiter : --preview 'bat --color=always {1} --highlight-line {2}'`처럼 파일·줄 번호로 미리보기.
- **화면 배치.** `export FZF_DEFAULT_OPTS='--height 40% --layout reverse --border'`.
- **함수로 묶기.** 자주 쓰는 선택(프로세스 종료, 컨테이너 접속)을 셸 함수로 만들어 둔다.
- **에디터 연동.** Neovim에서는 fzf-lua, Vim에서는 fzf.vim 플러그인.

## 언제 쓰나 / 피할 때
- 쓸 때: 긴 목록에서 하나를 고르는 모든 셸 작업.
- 피할 때(대안): 비대화형 스크립트에서는 `grep`·[ripgrep](/develop-wiki/devtools/terminal/ripgrep/)으로 충분하다. 디렉터리 점프만 원하면 zoxide.

## 공식 문서
- [공식 사이트](https://junegunn.github.io/fzf/) · [셸 통합](https://junegunn.github.io/fzf/shell-integration/) · [README](https://github.com/junegunn/fzf#readme)
- [예시 모음 (위키)](https://github.com/junegunn/fzf/wiki/examples) · [릴리스](https://github.com/junegunn/fzf/releases)
