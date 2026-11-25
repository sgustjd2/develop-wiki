---
name: ripgrep
url: https://github.com/BurntSushi/ripgrep
docs: https://github.com/BurntSushi/ripgrep/blob/master/GUIDE.md
repo: https://github.com/BurntSushi/ripgrep
stars: 70331
domain: devtools
category: terminal
description: .gitignore를 존중하며 디렉터리를 재귀적으로 정규식 검색하는 Rust 명령줄 검색 도구(rg). 코드베이스 전체에서 문자열·패턴을 빠르게 찾을 때 쓴다.
pricing: oss
tags: [cli, search, grep, regex, rust]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
ripgrep(`rg`)은 기본적으로 현재 디렉터리를 재귀 검색하면서 `.gitignore`·숨김 파일·바이너리를 자동으로 건너뛴다. Rust 정규식 엔진과 병렬 디렉터리 순회로 큰 저장소에서도 빠르다. 이 문서는 **15.x** 기준(2026-07 릴리스 15.2.0, MIT/Unlicense 이중 라이선스). VS Code의 전체 검색도 내부적으로 ripgrep을 쓴다.

## 설치
```bash
brew install ripgrep
sudo apt install ripgrep
winget install BurntSushi.ripgrep.MSVC
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 자동 필터 | `.gitignore`/`.ignore`/`.rgignore`, 숨김 파일, 바이너리 제외 |
| `-u` 단계 | `-u` ignore 무시, `-uu` +숨김, `-uuu` +바이너리 |
| 파일 타입 | `-t py`(포함), `-T js`(제외). `rg --type-list`로 목록 |
| 글롭 | `-g '*.ts'`, `-g '!dist/**'` |
| 정규식 | 기본 Rust regex. `-P`로 PCRE2(전후방 탐색) |

## 자주 쓰는 옵션
| 하고 싶은 일 | 명령 |
| --- | --- |
| 기본 검색 | `rg useState` |
| 대소문자 무시 / 스마트 | `rg -i foo` / `rg -S foo` |
| 단어 단위 / 고정 문자열 | `rg -w id` / `rg -F 'a.b(c)'` |
| 파일 이름만 | `rg -l FIXME` |
| 개수 | `rg -c FIXME` |
| 앞뒤 문맥 | `rg -C 3 panic` |
| 특정 타입만 | `rg -t go 'func main'` |
| 경로 제외 | `rg foo -g '!**/vendor/**'` |
| 숨김 파일까지 | `rg --hidden foo` |
| 파일 목록 출력 | `rg --files` |
| 여러 줄 패턴 | `rg -U 'struct \w+ \{\n\s+id'` |
| 치환 미리보기 | `rg 'v1' -r 'v2'` (파일은 수정하지 않음) |
| JSON 출력 | `rg --json foo` |

## 기본 사용법
```bash
# TypeScript 파일에서 fetch 호출 찾기, 테스트 제외
rg -t ts 'fetch\(' -g '!**/*.test.ts'

# 함수 정의 위치와 줄 번호
rg -n '^export (async )?function \w+' src/

# 찾은 파일들 일괄 치환 (macOS sed 기준)
rg -l 'oldName' | xargs sed -i '' 's/oldName/newName/g'
```

## 자주 쓰는 패턴
- **기본 옵션 고정.** `RIPGREP_CONFIG_PATH=~/.ripgreprc`에 `--smart-case`, `--hidden`, `--glob=!.git/*`처럼 한 줄에 하나씩 적는다.
- **fzf와 조합.** [fzf](/develop-wiki/devtools/terminal/fzf/)의 `FZF_DEFAULT_COMMAND='rg --files'`로 gitignore를 존중하는 파일 선택기.
- **에디터 검색 백엔드.** Neovim Telescope·`:grep`의 `grepprg`로 지정.
- **압축 파일.** `-z`로 gzip 등 압축 파일 안까지 검색.

## 언제 쓰나 / 피할 때
- 쓸 때: 저장소 전체 텍스트 검색, 스크립트에서 패턴이 있는 파일 목록 뽑기.
- 피할 때(대안): POSIX 호환이 필요한 이식성 스크립트는 `grep`. 문법 구조(AST) 기반 검색·치환은 ast-grep 같은 도구가 맞다.

## 공식 문서
- [사용자 가이드](https://github.com/BurntSushi/ripgrep/blob/master/GUIDE.md) · [FAQ](https://github.com/BurntSushi/ripgrep/blob/master/FAQ.md) · [릴리스](https://github.com/BurntSushi/ripgrep/releases)
