---
name: Chi
url: https://go-chi.io
repo: https://github.com/go-chi/chi
stars: 23139
docs: https://go-chi.io
domain: backend
category: web-framework
description: net/http 와 완전히 호환되는 가벼운 Go HTTP 라우터. 미들웨어 체인과 서브라우터로 REST API 를 구조화한다.
pricing: oss
tags: [router, net-http, middleware, rest]
languages: [go]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
chi 는 표준 라이브러리 `net/http` 위에 얹는 라우터다. 핸들러와 미들웨어가 모두 `http.Handler` 시그니처라서 표준 생태계의 미들웨어를 그대로 쓴다. 외부 의존성이 없고 코어 라우터는 약 1000줄이다. Radix 트리 기반 매칭, `Route`/`Group`/`Mount` 로 서브라우터를 조합한다.

프레임워크가 제공하는 바인딩·검증·DB 는 없다. 편의 기능이 많은 대안은 [Gin](/develop-wiki/backend/web-framework/gin/), [Echo](/develop-wiki/backend/web-framework/echo/), [Fiber](/develop-wiki/backend/web-framework/fiber/) 다.

## 설치
```bash
go get github.com/go-chi/chi/v5
```
현재 v5.5.0(2026-10-14), `go.mod` 최소 Go 버전은 1.24 다. 최근 4개 메이저 Go 버전을 지원한다는 방침이다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `chi.NewRouter()` | 라우터(`Mux`) 생성. `http.Handler` 를 구현 |
| `Use` / `With` | 라우터 전체 / 특정 엔드포인트에 미들웨어 적용 |
| `Route` / `Group` | 경로 접두사로 서브라우터, 또는 접두사 없이 미들웨어 그룹 |
| `Mount` | 다른 `http.Handler` 를 경로 아래에 붙임 |
| `chi.URLParam` | `{id}`, 정규식 `{slug:[a-z-]+}` 파라미터 조회 |
| `middleware` 패키지 | RequestID, Logger, Recoverer, Timeout, Throttle, ClientIPFrom* 등 |

## 기본 사용법
```go
package main

import (
	"encoding/json"
	"net/http"
	"sync"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

type Todo struct {
	Title string `json:"title"`
	Done  bool   `json:"done"`
}

var (
	mu    sync.Mutex
	todos = map[string]Todo{}
)

func main() {
	r := chi.NewRouter()
	r.Use(middleware.RequestID, middleware.Logger, middleware.Recoverer)

	r.Get("/todos/{id}", func(w http.ResponseWriter, r *http.Request) {
		mu.Lock()
		t, ok := todos[chi.URLParam(r, "id")]
		mu.Unlock()
		if !ok {
			http.Error(w, "not found", http.StatusNotFound)
			return
		}
		json.NewEncoder(w).Encode(t)
	})

	r.Post("/todos/{id}", func(w http.ResponseWriter, r *http.Request) {
		var t Todo
		if err := json.NewDecoder(r.Body).Decode(&t); err != nil || t.Title == "" {
			http.Error(w, "invalid body", http.StatusBadRequest)
			return
		}
		mu.Lock()
		todos[chi.URLParam(r, "id")] = t
		mu.Unlock()
		w.WriteHeader(http.StatusCreated)
	})

	http.ListenAndServe(":3000", r)
}
```

## 자주 쓰는 패턴
- **서브라우터**: `r.Route("/articles", func(r chi.Router){ r.Get("/", list); r.Route("/{id}", ...) })` 로 리소스 단위 분리, 관리자 영역은 `r.Mount("/admin", adminRouter())`.
- **컨텍스트 미들웨어**: `{id}` 로 조회한 객체를 `context.WithValue` 로 요청 컨텍스트에 넣어 하위 핸들러가 재사용한다.
- **클라이언트 IP**: 구 `RealIP` 는 스푸핑 취약으로 deprecated 다. 프록시 구성에 맞게 `ClientIPFromRemoteAddr`, `ClientIPFromHeader`, `ClientIPFromXFF` 중 하나를 쓴다. v5.4.0 에서 관련 보안 수정이 있었다.
- **검증**: 내장 없음. `go-playground/validator` 등을 핸들러에서 호출한다. 응답 헬퍼는 별도 `go-chi/render`.
- **DB**: 표준 `database/sql` 또는 [sqlc](/develop-wiki/backend/orm-query/sqlc/), [GORM](/develop-wiki/backend/orm-query/gorm/) 을 핸들러 구조체 필드로 주입한다.
- **테스트**: `httptest.NewRecorder()` 와 `httptest.NewRequest` 로 `r.ServeHTTP(rec, req)` 를 호출한다. 서버가 필요 없다.

## 언제 쓰나 / 피할 때
- 쓸 때: 표준 라이브러리 중심의 Go API, 외부 의존성을 줄이고 `net/http` 호환 미들웨어를 재사용하려는 경우, 큰 REST 서비스를 서브라우터로 나누려는 경우.
- 피할 때(대안): 바인딩·검증·렌더링이 묶인 프레임워크를 원하면 [Gin](/develop-wiki/backend/web-framework/gin/) 이나 [Echo](/develop-wiki/backend/web-framework/echo/). Go 1.22+ 표준 `ServeMux` 의 메서드·경로 패턴으로 충분한 작은 서비스는 chi 없이도 된다.

## 공식 문서
- [go-chi.io](https://go-chi.io) · [GitHub README](https://github.com/go-chi/chi) · [middleware 패키지](https://pkg.go.dev/github.com/go-chi/chi/v5/middleware) · [예제](https://github.com/go-chi/chi/tree/master/_examples)
