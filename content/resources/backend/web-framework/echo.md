---
name: Echo
url: https://echo.labstack.com
docs: https://echo.labstack.com/guide/quickstart/
repo: https://github.com/labstack/echo
stars: 32834
domain: backend
category: web-framework
description: net/http 위에 라디스 트리 라우터·바인딩·중앙 에러 처리를 얹은 Go 웹 프레임워크. 핸들러가 error 를 반환하는 구조로 REST API를 만들 때 쓴다.
pricing: oss
tags: [rest, middleware, router, net-http]
languages: [go]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Echo 는 LabStack 이 관리하는 [Go](/develop-wiki/languages/go/) 웹 프레임워크로, 표준 `net/http` 위에 라디스 트리 라우터, 요청 바인딩, 미들웨어, 템플릿 렌더링, 중앙 에러 처리(`HTTPErrorHandler`)를 제공한다. 핸들러 시그니처가 `func(c *echo.Context) error` 라서 에러를 반환하면 한곳에서 응답으로 바뀐다. `echo.WrapHandler`·`echo.WrapMiddleware` 로 표준 핸들러와 섞어 쓸 수 있다.

현재 메이저는 **v5**(2026-01-18 출시, 최신 v5.4.x)다. v4 대비 `Context` 가 인터페이스에서 구조체 포인터(`*echo.Context`)로 바뀌었고, 로거가 `log/slog` 로 교체됐으며, 테스트 헬퍼 패키지 `echotest` 가 추가됐다. v4 는 2026-12-31 까지 버그 수정, 2027-12-31 까지 보안 수정만 받는다. v5 는 최근 Go 릴리스 3개를 지원한다.

같은 위치의 [Gin](/develop-wiki/backend/web-framework/gin/) 과 비교하면 에러 반환형 핸들러와 내장 미들웨어 묶음이 차이점이다.

## 설치
```bash
go mod init example.com/todo
go get github.com/labstack/echo/v5
go run .
```
v4 코드를 옮길 때는 저장소의 `API_CHANGES_V5.md` 를 기준으로 핸들러 시그니처·로거·바인더 변경을 반영한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `echo.New()` | 라우터 겸 서버 인스턴스. `Binder`·`Validator`·`HTTPErrorHandler`·`Logger` 필드로 동작을 바꾼다 |
| `*echo.Context` | 요청 값(`Param`, `QueryParam`, `Bind`)과 응답(`JSON`, `String`, `NoContent`)을 다루는 구조체 |
| `e.Pre` / `e.Use` | `Pre` 는 라우팅 전(경로 재작성 등), `Use` 는 라우팅 후 실행되는 미들웨어 |
| 그룹 | `e.Group("/api", mw...)` 로 접두사·미들웨어 공유 |
| 바인딩 | `c.Bind(&v)` 가 path → query(GET·DELETE) → body 순으로 채운다. 태그는 `param`·`query`·`json`·`form` 등 |
| 검증 | `e.Validator` 에 `Validate(i any) error` 구현을 등록하고 `c.Validate(&v)` 호출 |
| `echo.NewHTTPError` | `NewHTTPError(code, message)` 로 상태 코드가 있는 에러 반환 |

## 기본 사용법
```go
package main

import (
	"net/http"
	"strconv"

	"github.com/labstack/echo/v5"
	"github.com/labstack/echo/v5/middleware"
)

type Todo struct {
	ID    int    `json:"id"`
	Title string `json:"title"`
}

var todos = map[string]Todo{}

func main() {
	e := echo.New()
	e.Use(middleware.RequestLogger(), middleware.Recover())

	e.GET("/todos/:id", func(c *echo.Context) error {
		t, ok := todos[c.Param("id")]
		if !ok {
			return echo.NewHTTPError(http.StatusNotFound, "not found")
		}
		return c.JSON(http.StatusOK, t)
	})
	e.POST("/todos", func(c *echo.Context) error {
		var t Todo
		if err := c.Bind(&t); err != nil || t.Title == "" {
			return echo.NewHTTPError(http.StatusBadRequest, "title is required")
		}
		t.ID = len(todos) + 1
		todos[strconv.Itoa(t.ID)] = t
		return c.JSON(http.StatusCreated, t)
	})
	e.Start(":8080") // Ctrl+C 시 graceful shutdown
}
```
예제의 맵은 동시 접근에 안전하지 않으므로 실제로는 DB 나 `sync.Mutex` 를 쓴다.

## 자주 쓰는 패턴
- **그룹과 인증**: `api := e.Group("/api/v1")` 아래 리소스를 등록하고, 보호 구간에만 `labstack/echo-jwt` 나 `middleware.KeyAuth` 를 건다.
- **내장 미들웨어**: `middleware.CORS("https://example.com")`, `middleware.RequestID()`, `middleware.BodyLimit(1 << 20)`, `middleware.RateLimiter(store)`, `middleware.Gzip()` 등이 본체에 포함돼 있다. OpenTelemetry·Prometheus 는 `echo-otel`·`echo-prometheus` 공식 저장소.
- **검증**: `go-playground/validator/v10` 를 감싼 타입을 `e.Validator` 에 넣고, 핸들러에서 `c.Bind(&t)` 다음 `c.Validate(&t)` 를 호출한다. 실패 시 `echo.NewHTTPError(400, ...)` 로 변환한다.
- **DB 연동**: `database/sql`·pgx·[GORM](/develop-wiki/backend/orm-query/gorm/) 커넥션을 핸들러를 메서드로 가진 struct 에 주입하고, 쿼리에는 `c.Request().Context()` 를 넘겨 요청 취소를 전파한다.
- **테스트**: 표준 `httptest` 로 컨텍스트를 만들거나 v5 의 `echotest` 헬퍼를 쓴다.
  ```go
  req := httptest.NewRequest(http.MethodGet, "/", nil)
  rec := httptest.NewRecorder()
  c := e.NewContext(req, rec)
  c.SetPathValues(echo.PathValues{{Name: "id", Value: "1"}})
  err := h.getTodo(c) // rec.Code, rec.Body 로 검증
  ```

## 언제 쓰나 / 피할 때
- 쓸 때: Go 로 만드는 REST API 에서 에러를 반환값으로 다루고 한곳에서 응답 형식을 통일하고 싶을 때, CORS·레이트 리밋 등 기본 미들웨어를 본체에서 바로 쓰고 싶을 때.
- 피할 때(대안): 레퍼런스·서드파티 미들웨어 수가 우선이면 [Gin](/develop-wiki/backend/web-framework/gin/), 의존성을 최소화하려면 Go 1.22+ 표준 `net/http` 라우팅, Express 식 API 와 fasthttp 기반 처리량을 원하면 [Fiber](/develop-wiki/backend/web-framework/fiber/). v4 에 머문 서드파티 미들웨어는 v5 호환 여부를 먼저 확인한다.

## 공식 문서
- [Quick start](https://echo.labstack.com/guide/quickstart/) · [Binding](https://echo.labstack.com/guide/binding/) · [Testing](https://echo.labstack.com/guide/testing/) · [Middleware](https://echo.labstack.com/middleware/) · [v5 API 변경점](https://github.com/labstack/echo/blob/master/API_CHANGES_V5.md) · [pkg.go.dev](https://pkg.go.dev/github.com/labstack/echo/v5)
