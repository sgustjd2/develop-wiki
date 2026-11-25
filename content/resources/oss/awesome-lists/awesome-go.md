---
name: Awesome Go
url: https://awesome-go.com/
repo: https://github.com/avelino/awesome-go
stars: 195940
domain: oss
category: awesome-lists
description: Go 프레임워크·라이브러리·도구를 분야별로 정리한 큐레이션 목록. Go 로 서버·CLI·인프라 도구를 만들 때 쓸 패키지를 찾는 데 쓴다.
pricing: oss
tags: [awesome, go, golang, libraries]
languages: [go]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
avelino 가 시작한 Go 생태계 목록으로, 데이터 구조부터 DB 드라이버, 웹 프레임워크, 테스트, 유틸리티까지 분야가 매우 세분화돼 있다. 기여 가이드에 품질 기준(문서, 테스트 커버리지, 릴리스 태그 등)이 있어 등록 심사가 비교적 엄격하다. 2026-11 기준 별 약 19.5만, 라이선스 MIT. 커밋이 매일 수준으로 이어진다(마지막 2026-11-18).

## 무엇이 들어 있나
| 영역 | 대표 섹션 |
| --- | --- |
| 기반 | Data Structures and Algorithms, Error Handling, Goroutines, Generators, JSON, Date and Time |
| 저장소 | Database(Caches, Schema Migration, SQL Query Builders), Database Drivers(관계형·NoSQL·검색) |
| 서버 | Web Frameworks, Networking, Authentication and Authorization, Messaging, Distributed Systems |
| 도구 | Command Line(Standard CLI, Advanced Console UIs), Configuration, Logging, Testing, Code Analysis |
| 운영 | Continuous Integration, Build Automation, DevOps Tools, Job Scheduler |
| 기타 | Machine Learning, Artificial Intelligence, Natural Language Processing, Images, IoT |
| 학습 자료 | 책, 강의, 튜토리얼, 블로그, 컨퍼런스 |

## 이렇게 활용하라
1. **awesome-go.com 에서 카테고리를 연다.** 웹사이트는 카테고리별 페이지라 README 보다 가볍다.
2. **같은 문제의 대안을 비교한다.** 예: Web Frameworks 에서 [Gin](/develop-wiki/backend/web-framework/gin/) 과 다른 프레임워크를 비교하고, ORM 쪽은 [GORM](/develop-wiki/backend/orm-query/gorm/) 과 SQL Query Builders 를 함께 본다.
3. **pkg.go.dev 에서 확인한다.** 최신 버전, 임포트 수, 라이선스, `go.mod` 의 Go 버전을 본다.
4. **표준 라이브러리로 충분한지 먼저 따진다.** Go 는 `net/http`, `log/slog`, `encoding/json` 등 표준 라이브러리 비중이 커서 외부 의존을 늘리기 전에 검토할 가치가 있다.
   ```bash
   go get github.com/<owner>/<pkg>@latest && go mod tidy
   ```

## 주의
- 목록이 매우 길어 오래된 패키지도 섞여 있다. 기여 가이드에 따라 정리되지만 마지막 커밋을 직접 확인한다.
- 한국어 번역은 없다.

## 링크
- [웹사이트](https://awesome-go.com/) · [저장소 README](https://github.com/avelino/awesome-go) · [기여 가이드(품질 기준)](https://github.com/avelino/awesome-go/blob/main/CONTRIBUTING.md)
- 이 사이트: [Go 언어](/develop-wiki/languages/go/)
