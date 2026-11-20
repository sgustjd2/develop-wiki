---
name: Oh My Zsh
url: https://ohmyz.sh
docs: https://github.com/ohmyzsh/ohmyzsh/wiki
repo: https://github.com/ohmyzsh/ohmyzsh
stars: 190708
domain: devtools
category: terminal
description: zsh 설정을 플러그인·테마 단위로 관리하는 커뮤니티 프레임워크. macOS 기본 셸인 zsh에 Git 별칭·자동 완성을 빠르게 갖출 때 쓴다.
pricing: oss
tags: [zsh, shell, plugins, dotfiles, fish]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
zsh는 macOS(Catalina 이후)의 기본 로그인 셸이며, 강력한 자동 완성과 글로빙을 제공한다(최신 5.9.x). Oh My Zsh는 그 위에서 `~/.zshrc` 몇 줄로 300개 이상의 플러그인과 테마를 켜고 끄게 해 주는 설정 프레임워크다(MIT). 별도 릴리스 버전 없이 `omz update`로 저장소를 갱신한다.

- 대안: 설정 없이 자동 제안·문법 강조가 기본인 **fish** 셸(최신 4.9.x, Rust로 재작성됨). 다만 fish는 POSIX 문법과 다르다. 프롬프트만 바꾸려면 [Starship](/develop-wiki/devtools/terminal/starship/).

## 설치
```bash
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
```
기존 `~/.zshrc`는 `~/.zshrc.pre-oh-my-zsh`로 백업된다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `$ZSH` | 설치 위치(`~/.oh-my-zsh`) |
| `plugins=(...)` | `~/.zshrc`에서 켤 플러그인 목록 |
| `ZSH_THEME` | 프롬프트 테마 이름 (`robbyrussell` 기본, `""`이면 끔) |
| `$ZSH_CUSTOM` | 직접 만든·외부 플러그인과 테마 위치(`custom/`) |
| `omz` 명령 | `omz update`, `omz plugin list`, `omz reload` |

## 기본 사용법
`~/.zshrc`:

```zsh
export ZSH="$HOME/.oh-my-zsh"
ZSH_THEME="robbyrussell"
plugins=(git fzf docker kubectl zsh-autosuggestions)
source $ZSH/oh-my-zsh.sh

# 개인 별칭
alias ll='ls -lah'
```

외부 플러그인(자동 제안) 설치:

```bash
git clone https://github.com/zsh-users/zsh-autosuggestions \
  ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
exec zsh
```

## 자주 쓰는 패턴
- **git 플러그인 별칭.** `gst`(status), `gco`(checkout), `gcmsg`(commit -m), `gp`(push), `gl`(pull). 전체 목록은 `alias | grep git`.
- **시작 속도 관리.** 플러그인을 많이 켤수록 셸 시작이 느려진다. `time zsh -i -c exit`로 측정하고 쓰지 않는 플러그인을 뺀다.
- **프롬프트 분리.** `ZSH_THEME=""`로 두고 Starship을 써서 셸이 바뀌어도 같은 프롬프트를 유지.
- **dotfiles 관리.** `~/.zshrc`와 `$ZSH_CUSTOM`을 Git 저장소로 관리하면 새 기기 설정이 빠르다.

## 언제 쓰나 / 피할 때
- 쓸 때: zsh 기본 상태에서 빠르게 쓸 만한 환경을 만들고 싶을 때.
- 피할 때(대안): 시작 속도를 중시하면 플러그인 매니저(antidote, zinit)로 필요한 것만 로드하거나, 설정 없이 쓰는 fish를 검토.

## 공식 문서
- [Oh My Zsh 위키](https://github.com/ohmyzsh/ohmyzsh/wiki) · [플러그인 목록](https://github.com/ohmyzsh/ohmyzsh/wiki/Plugins) · [테마](https://github.com/ohmyzsh/ohmyzsh/wiki/Themes)
- [zsh 매뉴얼](https://zsh.sourceforge.io/Doc/) · [fish 문서](https://fishshell.com/docs/current/)
