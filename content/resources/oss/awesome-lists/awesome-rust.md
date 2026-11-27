---
name: Awesome Rust
url: https://github.com/rust-unofficial/awesome-rust
repo: https://github.com/rust-unofficial/awesome-rust
stars: 60869
domain: oss
category: awesome-lists
description: Rust 로 만든 애플리케이션·개발 도구·라이브러리를 분야별로 모은 큐레이션 목록. Rust 크레이트 후보나 참고할 실제 프로젝트를 찾을 때 쓴다.
pricing: oss
tags: [awesome, rust, crates, libraries]
languages: [rust]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
rust-unofficial 조직이 관리하는 Rust 생태계 목록이다. 목록이 **Applications(Rust 로 만든 프로그램) / Development tools / Libraries** 세 축으로 나뉘어, 라이브러리뿐 아니라 실제 Rust 코드베이스 예시를 찾기에도 좋다. 항목 옆에 CI·crates.io 배지가 붙은 경우가 많다. 2026-11 기준 별 약 6.1만, 라이선스 CC0-1.0. 커밋이 매우 활발하다(마지막 2026-11-18).

## 무엇이 들어 있나
| 섹션 | 내용 |
| --- | --- |
| Applications | Database, Observability, Message Queue, Security tools, System tools, Text editors, Web Servers, Virtualization 등 Rust 로 작성된 프로그램 |
| Development tools | Build system, Debugging, Deployment, FFI, Formatters, Profiling, Static analysis, Testing |
| Libraries | Asynchronous, Authentication, Caching, Cloud, Command-line, Concurrency, Cryptography, Database, Data processing, Network programming, Parsing, Web programming, Artificial Intelligence 등 |
| Registries · Resources | crates.io 같은 레지스트리, 학습 자료 링크 |

## 이렇게 활용하라
1. **Libraries 에서 용도별 크레이트를 고른다.** 예: Asynchronous 에서 런타임, Web programming 에서 HTTP 서버·클라이언트를 본다.
2. **crates.io·docs.rs 에서 확인한다.** 다운로드 수, 최신 버전, MSRV(최소 지원 Rust 버전), 문서 상태를 본다.
3. **Applications 에서 비슷한 프로그램의 코드를 읽는다.** 만들려는 것과 같은 종류(CLI, 서버, DB)의 실제 구조를 참고하기 좋다.
   ```bash
   cargo add <crate>        # Cargo.toml 에 의존성 추가
   cargo tree -d            # 중복 의존성 확인
   ```

## 주의
- 배지가 있어도 프로젝트 활동은 저장소에서 직접 확인한다.
- 한국어 번역은 없다.

## 링크
- [저장소 README](https://github.com/rust-unofficial/awesome-rust) · [기여 가이드](https://github.com/rust-unofficial/awesome-rust/blob/main/CONTRIBUTING.md)
- 이 사이트: [Rust 언어](/develop-wiki/languages/rust/)
