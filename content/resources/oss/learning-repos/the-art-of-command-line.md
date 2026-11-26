---
name: The Art of Command Line
url: https://github.com/jlevy/the-art-of-command-line
repo: https://github.com/jlevy/the-art-of-command-line
stars: 162846
domain: oss
category: learning-repos
description: Linux·Bash 커맨드라인 사용 요령을 한 페이지에 압축한 가이드. 터미널 작업(파일 처리, 디버깅, 원라이너)을 빠르게 익히고 싶을 때 쓴다.
pricing: oss
tags: [command-line, bash, linux, shell, cheatsheet]
languages: []
koreanDocs: true
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Joshua Levy 가 만든 한 페이지짜리 커맨드라인 가이드다. 범위(중요한 것 전부), 구체성(가장 흔한 경우의 예), 간결함을 목표로, 각 줄이 "이런 명령이 있고 이렇게 쓴다"는 짧은 팁이다. Linux 의 대화형 Bash 기준이며 macOS·Windows 전용 절이 따로 있다. 2026-11 기준 별 약 16.3만, 라이선스 CC BY-SA 4.0(README 표기).

**유지보수 상태:** archived 는 아니지만 마지막 커밋이 2023-07 이다. 한국어 번역(README-ko.md)이 있으나 역시 2023-06 이후 갱신이 없다. 기본 Unix 도구 팁은 지금도 유효하지만 최근 대체 도구는 빠져 있다.

## 무엇이 들어 있나
| 섹션 | 내용 |
| --- | --- |
| Meta | 범위와 읽는 법(Explainshell 활용 등) |
| Basics | man, 리다이렉션·파이프, 글롭, 작업 제어, ssh, 기본 편집기 |
| Everyday use | 탭 완성, 히스토리 검색, `xargs`, `pstree`, `lsof`, `screen`/`tmux`, 별칭 |
| Processing files and data | `find`, `grep`, `sort`/`uniq`, `cut`/`paste`/`join`, `jq`, `awk`/`sed`, 인코딩 |
| System debugging | `top`/`htop`, `iostat`, `netstat`/`ss`, `strace`, `ldd`, `dmesg`, 메모리·디스크 확인 |
| One-liners | 집합 연산, 로그 집계 등 짧은 조합 예 |
| Obscure but useful | 잘 알려지지 않은 유용한 명령 모음 |
| macOS only · Windows only | 플랫폼별 팁(Homebrew, WSL/Cygwin 등) |
| More resources | 추가 학습 자료 |

## 이렇게 활용하라
1. **Basics 와 Everyday use 를 먼저 읽는다.** 이 두 절의 팁만 습관이 돼도 터미널 작업 속도가 크게 달라진다.
2. **모르는 명령은 바로 실행해 본다.** 낯선 옵션 조합은 Explainshell 로 분해해 본다.
   ```bash
   # 문서의 예: 두 파일의 교집합·차집합을 sort/uniq 로 구하기
   sort a b | uniq        # 합집합
   sort a b | uniq -d     # 교집합
   sort a b b | uniq -u   # 차집합 a - b
   ```
3. **Processing files and data 를 실무 로그에 적용한다.** `grep`·`sort | uniq -c | sort -rn` 조합으로 로그를 집계해 본다.
4. **최신 대체 도구는 따로 보완한다.** 예: `rg`(ripgrep), `fd`, `bat`, `fzf` 같은 도구는 이 사이트의 [터미널 도구](/develop-wiki/devtools/terminal/) 카테고리를 본다.

## 주의
- 2023 년 이후 갱신이 멈춰 있다. 명령 자체는 안정적이지만 일부 링크·도구 설명은 오래됐다.
- 한국어 번역은 영어판과 거의 같은 시점까지 반영돼 있어 지금 읽어도 무방하다.

## 링크
- [저장소 README](https://github.com/jlevy/the-art-of-command-line) · [한국어 번역](https://github.com/jlevy/the-art-of-command-line/blob/master/README-ko.md) · [Explainshell](https://explainshell.com/)
- 이 사이트: [시스템 콜·사용자/커널 모드](/develop-wiki/knowledge/cs-fundamentals/system-calls-user-kernel-mode/) · [I/O 모델](/develop-wiki/knowledge/cs-fundamentals/io-models/)
