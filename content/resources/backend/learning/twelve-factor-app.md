---
name: The Twelve-Factor App
url: https://12factor.net
docs: https://12factor.net/ko/
repo: https://github.com/twelve-factor/twelve-factor
stars: 2873
domain: backend
category: learning
description: 클라우드에 배포하는 웹 서비스가 지켜야 할 12가지 원칙(설정은 환경 변수, 무상태 프로세스, 로그는 스트림 등)을 정리한 문서. 배포·운영하기 쉬운 서비스 구조를 잡을 때 기준으로 쓴다.
pricing: oss
tags: [twelve-factor, cloud-native, architecture, deployment, principles]
languages: []
koreanDocs: true
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
The Twelve-Factor App 은 Heroku 엔지니어들이 2011년 무렵 정리한, SaaS 형태의 웹 애플리케이션을 만들고 배포하는 방법론이다. 특정 언어나 프레임워크와 무관하게 "코드·설정·실행 환경을 어떻게 나눌 것인가"를 12개 항목으로 설명한다. 컨테이너·Kubernetes·PaaS 에서 당연하게 여기는 관행(환경 변수 설정, 무상태 프로세스, stdout 로그)의 상당수가 이 문서에서 정리됐다.

2024년 Heroku 가 문서를 오픈소스로 공개하고 커뮤니티 거버넌스(메인테이너 그룹)로 옮겼다. 개정판 원고는 `twelve-factor/twelve-factor` 저장소(CC BY 4.0)에서 작업하며, 완성되면 12factor.net 의 기존 본문을 대체할 예정이다. 2026-11 기준 12factor.net 에 보이는 것은 여전히 기존 판이고(사이트 소스는 `heroku/12factor`, MIT), 개정 저장소의 마지막 커밋은 2025-07 이라 진행이 느린 편이다.

## 구성
| # | 항목 | 핵심 |
| --- | --- | --- |
| I | Codebase | 앱 하나 = 저장소 하나, 여러 환경에 같은 코드를 배포 |
| II | Dependencies | 의존성을 명시적으로 선언하고 격리(lock 파일, 가상 환경) |
| III | Config | 환경마다 바뀌는 값은 코드가 아니라 환경 변수에 |
| IV | Backing services | DB·큐·캐시를 URL 로 붙였다 떼는 리소스로 취급 |
| V | Build, release, run | 빌드 → 릴리스(빌드 + 설정) → 실행 단계를 분리 |
| VI | Processes | 무상태 프로세스. 공유 상태는 백킹 서비스에 저장 |
| VII | Port binding | 앱이 스스로 포트를 열어 HTTP 를 서비스 |
| VIII | Concurrency | 프로세스 종류별로 수평 확장(web, worker …) |
| IX | Disposability | 빠른 시작, SIGTERM 에 안전하게 종료 |
| X | Dev/prod parity | 개발·운영 환경의 시간·사람·도구 차이를 줄인다 |
| XI | Logs | 로그는 파일이 아닌 stdout 이벤트 스트림으로 |
| XII | Admin processes | 마이그레이션 같은 일회성 작업도 같은 코드·환경에서 실행 |

개정판 저장소는 각 항목을 `content/*.md` 로 나눠 다시 쓰고 있으며, 비전 문서(VISION.md)와 FAQ(UPDATE_FAQ.md)에 무엇을 바꾸려는지가 정리돼 있다.

## 활용법
1. **한국어판으로 한 번 통독**한다(12factor.net/ko). 항목당 한 페이지 분량이라 한두 시간이면 끝난다.
2. **현재 서비스를 체크리스트로 점검**한다. 아래처럼 표를 만들어 "지킴 / 부분 / 안 지킴"을 표시하면 개선 우선순위가 보인다.
   ```text
   III Config    : DB 비밀번호가 application.yml 에 있음 → 환경 변수로 이동
   VI  Processes : 업로드 파일을 로컬 디스크에 저장 → 객체 스토리지로
   XI  Logs      : /var/log/app.log 로 기록 → stdout 으로 바꾸고 수집기에서 수집
   ```
3. **설정 분리부터 적용**한다. 가장 효과가 크고 바꾸기 쉽다.
   ```bash
   # 같은 이미지를 환경 변수만 바꿔 여러 환경에 실행
   docker run -e DATABASE_URL=postgres://db:5432/app -e LOG_LEVEL=info my-api:1.4.0
   ```
4. **종료 처리(IX)를 확인**한다. SIGTERM 을 받으면 새 요청을 거절하고 진행 중인 요청·작업을 마친 뒤 종료하는지 테스트한다.
5. **개정판 논의를 따라간다.** 원 문서는 2011년 기준이라 비밀 관리, 관측성, 컨테이너 이미지 같은 주제가 약하다. 개정 저장소의 이슈·PR 에서 현대적 해석을 볼 수 있다.

## 함께 보면 좋은 자료
- [OpenTelemetry](/develop-wiki/backend/observability/opentelemetry/) — XI(Logs)를 넘어 트레이스·메트릭까지 다루는 관측성 표준.
- [멱등성](/develop-wiki/knowledge/distributed-systems/idempotency/) — 프로세스가 언제든 재시작·재실행될 수 있다는 IX 의 전제와 연결된다.
- Kubernetes·PaaS 의 설정(ConfigMap·Secret, 환경 변수 주입) 문서 — 이 원칙이 플랫폼 기능으로 구현된 모습.

## 언제 쓰나
- 쓸 때: 새 서비스의 구조를 정할 때, 레거시 앱을 컨테이너·클라우드로 옮기기 전 점검표가 필요할 때, 팀 내 배포 관행을 맞출 때.
- 한계: 무상태 웹 서비스를 전제로 한 원칙이라 DB 서버, 상태 저장 스트림 처리, 데스크톱 앱에는 그대로 맞지 않는다. 보안·관측성은 별도 자료로 보완한다.

## 공식 문서
- [12factor.net (한국어)](https://12factor.net/ko/) · [개정판 저장소](https://github.com/twelve-factor/twelve-factor) · [기존 사이트 소스](https://github.com/heroku/12factor)
