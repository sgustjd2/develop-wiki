---
name: Homebrew
url: https://brew.sh
docs: https://docs.brew.sh/
repo: https://github.com/Homebrew/brew
domain: devtools
category: environment
description: macOS와 Linux에서 CLI 도구·라이브러리(formula)와 GUI 앱(cask)을 설치·업데이트하는 패키지 관리자. 개발 머신 초기 설정과 도구 관리에 쓴다.
pricing: oss
tags: [package-manager, macos, linux, brewfile, cli]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Homebrew는 사용자 영역 접두 경로(Apple Silicon `/opt/homebrew`, Intel macOS `/usr/local`, Linux `/home/linuxbrew/.linuxbrew`)에 패키지를 설치하는 패키지 관리자다. 대부분 미리 빌드된 바이너리(bottle)를 받아 설치가 빠르다. 2026-11 기준 **7.0.x**(BSD-2-Clause). 7.0.0(2026-09)에서 macOS 10.15 지원이 끝났고 Intel Mac은 Tier 3으로 내려갔으며, 내장 취약점 검사가 추가됐다. Linux ARM64는 5.0.0부터 공식 지원한다.

## 설치
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
# 설치 후 안내대로 shellenv 를 셸 설정에 추가 (Apple Silicon 예)
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| formula | CLI 도구·라이브러리 패키지 정의 (`brew install git`) |
| cask | macOS 앱·폰트 등 바이너리 배포물 (`brew install --cask ...`) |
| bottle | 미리 빌드된 formula 바이너리 |
| tap | 서드파티 formula 저장소 (`brew tap owner/repo`) |
| keg-only | PATH에 자동 연결하지 않는 패키지 (예: 버전 지정 formula 일부) |
| Brewfile | 설치할 패키지 목록 파일, `brew bundle`로 일괄 설치 |

## 자주 쓰는 명령
| 하고 싶은 일 | 명령 |
| --- | --- |
| 검색 / 정보 | `brew search ripgrep` / `brew info ripgrep` |
| 설치 / 삭제 | `brew install ripgrep` / `brew uninstall ripgrep` |
| 목록 갱신 후 전체 업그레이드 | `brew update && brew upgrade` |
| 오래된 패키지 확인 | `brew outdated` |
| 버전 고정 / 해제 | `brew pin node` / `brew unpin node` |
| 사용하지 않는 의존성 정리 | `brew autoremove` / `brew cleanup` |
| 서비스(DB 등) 실행 | `brew services start postgresql@17` / `brew services list` |
| 문제 진단 | `brew doctor` |
| 직접 설치한 목록 | `brew leaves` |

## 기본 사용법
팀·새 기기 설정을 `Brewfile`로:

```ruby
# Brewfile
brew "git"
brew "gh"
brew "mise"
brew "ripgrep"
brew "fzf"
cask "visual-studio-code"
cask "ghostty"
```

```bash
brew bundle dump --file=Brewfile   # 현재 설치 상태를 파일로
brew bundle install                # 파일대로 설치
brew bundle check                  # 빠진 것이 있는지 확인
```

## 자주 쓰는 패턴
- **런타임 버전은 따로.** Node·Python 등 프로젝트마다 버전이 다른 런타임은 [mise](/develop-wiki/devtools/environment/mise/)로 관리하고, Homebrew는 공용 CLI 위주로.
- **버전 지정 formula.** `postgresql@17`, `python@3.13`처럼 `@`가 붙은 formula를 쓴다.
- **자동 업데이트 조절.** 설치 때마다 갱신되는 것이 느리면 `HOMEBREW_NO_AUTO_UPDATE=1`.
- **보안 점검.** 7.0의 취약점 검사 기능으로 설치된 패키지의 알려진 취약점을 확인(명령 사용법은 공식 문서 확인).

## 언제 쓰나 / 피할 때
- 쓸 때: macOS 개발 환경 구성, Linux에서 배포판 패키지보다 새 버전 CLI가 필요할 때.
- 피할 때(대안): 재현 가능한 환경을 선언적으로 고정하려면 [Nix](/develop-wiki/devtools/environment/nix/). 서버 운영 패키지는 배포판 공식 패키지 관리자(apt, dnf)가 보안 업데이트 면에서 적합하다.

## 공식 문서
- [문서](https://docs.brew.sh/) · [설치](https://docs.brew.sh/Installation) · [Brew Bundle](https://docs.brew.sh/Brew-Bundle-and-Brewfile)
- [블로그(릴리스)](https://brew.sh/blog/) · [패키지 검색](https://formulae.brew.sh/)
