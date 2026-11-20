---
name: Fiber
url: https://gofiber.io
docs: https://docs.gofiber.io
repo: https://github.com/gofiber/fiber
stars: 40302
domain: backend
category: web-framework
description: fasthttp 위에 Express 스타일 API를 얹은 Go 웹 프레임워크. 메모리 할당을 줄인 HTTP API 서버를 Express에 익숙한 방식으로 만들 때 쓴다.
pricing: oss
tags: [fasthttp, express-style, rest, middleware]
languages: [go]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Fiber 는 표준 `net/http` 대신 fasthttp 를 HTTP 엔진으로 쓰는 [Go](/develop-wiki/languages/go/) 웹 프레임워크다. `app.Get`, `app.Use`, `c.Next()` 처럼 [Express](/develop-wiki/backend/web-framework/express/) 와 비슷한 API 를 제공하고, 컨텍스트 객체를 재사용해 할당을 줄인다. 그 대가로 **핸들러가 반환된 뒤에는 `fiber.Ctx` 에서 얻은 값(문자열·바이트)을 들고 있으면 안 된다.** 다른 고루틴이나 캐시에 넘길 값은 복사해야 한다.

현재 메이저는 **v3**(2026-02 출시, 최신 v3.7.x)이며 Go 1.26 이상이 필요하다. v3 에서 `fiber.Ctx` 가 인터페이스가 되어 핸들러가 `func(c fiber.Ctx) error` 형태로 바뀌었고, 바인딩이 `c.Bind()` 체인으로 통합됐다. v2 도 v2.52.x 로 보안 수정이 나오며, `fiber migrate --to v3` CLI 로 코드를 옮길 수 있다. 라우터는 `net/http` 핸들러도 직접 받는다.

## 설치
```bash
go mod init example.com/todo
go get -u github.com/gofiber/fiber/v3
go run .
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `fiber.New(cfg)` | 앱 인스턴스. `fiber.Config` 로 에러 핸들러·`StructValidator`·본문 크기 제한 등 설정 |
| `fiber.Ctx` | 요청·응답 인터페이스. `Params`, `Query`, `Bind()`, `JSON`, `Status`, `Locals`, `Next` |
| 라우팅 | `app.Get("/todos/:id", h)`, 선택 파라미터 `:id?`, 와일드카드 `*`, 제약 `:id<int>` |
| `app.Use` | 접두사 기반 미들웨어·서브 앱 마운트. 모든 메서드에 매칭 |
| `app.Group` | 접두사·미들웨어 공유 그룹 |
| 바인딩 | `c.Bind().Body(&v)`(Content-Type 기준), `.JSON`, `.Query`, `.URI`, `.Header` |
| `fiber.Map` | `map[string]any` 별칭. 즉석 JSON 응답에 쓴다 |
| `fiber.NewError` | 상태 코드가 있는 에러. 기본 에러 핸들러가 응답으로 변환 |

## 기본 사용법
```go
package main

import (
	"log"
	"strconv"

	"github.com/gofiber/fiber/v3"
)

type Todo struct {
	ID    int    `json:"id"`
	Title string `json:"title"`
}

var todos = map[string]Todo{}

func main() {
	app := fiber.New()

	app.Get("/todos/:id", func(c fiber.Ctx) error {
		t, ok := todos[c.Params("id")]
		if !ok {
			return fiber.NewError(fiber.StatusNotFound, "not found")
		}
		return c.JSON(t)
	})
	app.Post("/todos", func(c fiber.Ctx) error {
		var t Todo
		if err := c.Bind().JSON(&t); err != nil || t.Title == "" {
			return fiber.NewError(fiber.StatusBadRequest, "title is required")
		}
		t.ID = len(todos) + 1
		todos[strconv.Itoa(t.ID)] = t
		return c.Status(fiber.StatusCreated).JSON(t)
	})

	log.Fatal(app.Listen(":3000"))
}
```
`c.Params("id")` 를 맵 키로 저장하지 않고 조회에만 쓰는 점에 주의한다. 저장할 때는 복사본(여기서는 `strconv.Itoa` 결과)을 쓴다.

## 자주 쓰는 패턴
- **그룹·미들웨어**: `api := app.Group("/api")` 와 `v1 := api.Group("/v1")` 로 버전을 나누고, `github.com/gofiber/fiber/v3/middleware/` 아래 `logger`·`recover`·`cors`·`limiter`·`requestid` 등을 `app.Use(logger.New())` 로 붙인다.
- **커스텀 미들웨어**: `func(c fiber.Ctx) error { start := time.Now(); err := c.Next(); log.Println(time.Since(start)); return err }`. 요청 범위 값은 `c.Locals("user", u)` 로 전달한다.
- **검증**: `Validate(out any) error` 를 구현한 타입(예: go-playground/validator 래퍼)을 `fiber.New(fiber.Config{StructValidator: v})` 에 넣으면 바인딩 직후 자동으로 검증된다. 검증 에러는 기본 핸들러에서 500 이 되므로 400 으로 바꿔 반환한다.
- **DB 연동**: pgx 풀이나 [GORM](/develop-wiki/backend/orm-query/gorm/) 을 핸들러 struct 에 주입한다. fasthttp 기반이라 요청 취소 컨텍스트는 `c.Context()` 로 얻는다.
- **테스트**: 서버를 띄우지 않고 `app.Test` 에 `*http.Request` 를 넘긴다. 기본 타임아웃은 1초다.
  ```go
  req := httptest.NewRequest("POST", "/todos", strings.NewReader(`{"title":"a"}`))
  req.Header.Set("Content-Type", "application/json")
  resp, err := app.Test(req)
  // resp.StatusCode == 201
  ```

## 언제 쓰나 / 피할 때
- 쓸 때: Express 에 익숙한 팀이 Go 로 API 를 만들 때, 요청당 할당과 지연을 줄이는 것이 우선인 게이트웨이·프록시성 서비스.
- 피할 때(대안): `net/http` 생태계(미들웨어, `http.Handler` 기반 라이브러리, HTTP/2 서버 기능)와의 완전한 호환이 필요하면 [Gin](/develop-wiki/backend/web-framework/gin/)·[Echo](/develop-wiki/backend/web-framework/echo/) 또는 표준 라이브러리. 컨텍스트 값 재사용 규칙을 팀이 지키기 어렵다면 버그 위험이 있다.

## 공식 문서
- [Welcome](https://docs.gofiber.io) · [Routing](https://docs.gofiber.io/guide/routing) · [Bind](https://docs.gofiber.io/api/bind) · [App API](https://docs.gofiber.io/api/app) · [Ctx API](https://docs.gofiber.io/api/ctx) · [v3 변경점·마이그레이션](https://docs.gofiber.io/whats_new)
