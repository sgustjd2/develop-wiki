---
name: Starship
url: https://starship.rs
docs: https://starship.rs/guide/
repo: https://github.com/starship/starship
stars: 60964
domain: devtools
category: terminal
description: 셸 종류와 무관하게 같은 설정으로 Git 상태·언어 버전·실행 시간 등을 보여 주는 크로스 셸 프롬프트. 프롬프트를 TOML 하나로 관리할 때 쓴다.
pricing: oss
tags: [prompt, shell, zsh, fish, rust]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Starship은 Rust로 작성한 프롬프트 프로그램으로, bash·zsh·fish·PowerShell·Nushell 등에서 같은 `starship.toml` 설정을 공유한다. 현재 디렉터리를 보고 Git 브랜치, Node·Python·Rust 버전, 클라우드 컨텍스트 같은 "모듈"을 필요할 때만 표시한다. 이 문서는 **v1.27** 기준(2026-10 릴리스 v1.27.0, ISC). 아이콘 표시에는 Nerd Font 계열 글꼴이 필요하다.

## 설치
```bash
brew install starship        # 또는 curl -sS https://starship.rs/install.sh | sh
```
셸 설정 끝에 초기화 줄 추가:

```bash
# ~/.zshrc
eval "$(starship init zsh)"
# ~/.bashrc
eval "$(starship init bash)"
# ~/.config/fish/config.fish
starship init fish | source
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `~/.config/starship.toml` | 설정 파일 (`STARSHIP_CONFIG`로 경로 변경) |
| 모듈 | `[git_branch]`, `[nodejs]`, `[python]`, `[cmd_duration]` 등 표시 단위 |
| `format` | 모듈 배치 순서와 문자열 |
| `disabled` | 모듈 끄기 |
| 프리셋 | `starship preset <이름>`으로 미리 만든 설정 적용 |

## 기본 사용법
`~/.config/starship.toml`:

```toml
add_newline = false

[character]
success_symbol = "[❯](bold green)"
error_symbol = "[❯](bold red)"

[directory]
truncation_length = 3

[cmd_duration]
min_time = 2_000   # 2초 넘는 명령만 시간 표시

[gcloud]
disabled = true
```

```bash
starship preset nerd-font-symbols -o ~/.config/starship.toml   # 프리셋 적용
starship explain     # 지금 프롬프트에 나온 모듈 설명
starship timings     # 모듈별 소요 시간 (느린 프롬프트 진단)
```

## 자주 쓰는 패턴
- **여러 셸·기기에서 같은 프롬프트.** `starship.toml`을 dotfiles 저장소에 넣는다.
- **느린 모듈 끄기.** 큰 저장소에서 git 상태가 느리면 `starship timings`로 확인 후 `[git_status] disabled = true` 등.
- **Oh My Zsh와 함께.** [Oh My Zsh](/develop-wiki/devtools/terminal/oh-my-zsh/)의 `ZSH_THEME=""`로 테마를 끄고 플러그인만 쓴다.
- **런타임 버전 확인.** [mise](/develop-wiki/devtools/environment/mise/) 등으로 바꾼 Node·Python 버전이 프롬프트에 바로 보인다.

## 언제 쓰나 / 피할 때
- 쓸 때: 여러 셸을 오가거나, 프롬프트 설정을 셸 스크립트 대신 선언형으로 관리하고 싶을 때.
- 피할 때(대안): zsh 전용으로 최대한 빠른 프롬프트가 필요하면 Powerlevel10k 같은 zsh 테마도 선택지다.

## 공식 문서
- [가이드](https://starship.rs/guide/) · [설정 레퍼런스](https://starship.rs/config/) · [프리셋](https://starship.rs/presets/)
- [릴리스](https://github.com/starship/starship/releases)
