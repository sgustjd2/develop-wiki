---
name: Gin
url: https://gin-gonic.com
repo: https://github.com/gin-gonic/gin
stars: 89540
docs: https://gin-gonic.com/en/docs/
domain: backend
category: web-framework
description: net/http 위에 라우팅·미들웨어·바인딩을 얹은 Go HTTP 웹 프레임워크. Go로 REST API나 마이크로서비스를 만들 때 쓴다.
pricing: oss
tags: [rest, middleware, router]
languages: [go]
koreanDocs: true
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Gin 은 Go 표준 `net/http` 위에 트리 기반 라우터, 미들웨어 체인, 요청 바인딩·검증, JSON 렌더링을 얹은 웹 프레임워크다. 핸들러는 `func(c *gin.Context)` 하나의 형태로 통일되고, `gin.Context` 가 요청 파싱과 응답 작성을 모두 맡는다. 검증은 `go-playground/validator/v10` 의 struct 태그를 사용한다.

표준 라이브러리만으로도 HTTP 서버를 만들 수 있지만, 라우트 그룹·바인딩·미들웨어를 반복 구현하고 싶지 않을 때 Gin 을 쓴다. 현재 릴리스는 v1.12 계열이며 Go 1.25 이상이 필요하다.

## 설치
```bash
go mod init example.com/todo
go get -u github.com/gin-gonic/gin
go run .
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `gin.Engine` | 라우터 겸 서버. `gin.Default()` 는 Logger·Recovery 미들웨어 포함, `gin.New()` 는 빈 엔진 |
| `gin.Context` | 요청 값(`Param`, `Query`, `ShouldBind*`)과 응답(`JSON`, `String`, `AbortWithStatusJSON`)을 다룬다 |
| `gin.H` | `map[string]any` 를 바탕으로 정의한 타입(`type H map[string]any`). 즉석 JSON 응답에 쓴다 |
| 라우트 그룹 | `r.Group("/v1")` 로 공통 접두사·미들웨어를 묶는다. 중첩 가능 |
| 미들웨어 | `gin.HandlerFunc`. `c.Next()` 로 다음 단계를 실행하고 `c.Abort()` 로 중단 |
| 바인딩 | `ShouldBindJSON`, `ShouldBindQuery`, `ShouldBindUri` 가 struct 로 매핑하고 검증 |
| 검증 태그 | `binding:"required"`, `binding:"min=1"` 등 validator v10 문법 |

## 기본 사용법
```go
package main

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type Todo struct {
	ID    int    `json:"id"`
	Title string `json:"title" binding:"required"`
}

var todos = map[string]Todo{}

func main() {
	r := gin.Default()
	r.GET("/todos/:id", func(c *gin.Context) {
		t, ok := todos[c.Param("id")]
		if !ok {
			c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
			return
		}
		c.JSON(http.StatusOK, t)
	})
	r.POST("/todos", func(c *gin.Context) {
		var t Todo
		if err := c.ShouldBindJSON(&t); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		t.ID = len(todos) + 1
		todos[strconv.Itoa(t.ID)] = t
		c.JSON(http.StatusCreated, t)
	})
	r.Run(":8080")
}
```
예제의 맵은 동시 접근에 안전하지 않다. 실제 서비스에서는 DB 나 `sync.Mutex` 를 쓴다.

## 자주 쓰는 패턴
- **라우트 그룹**: `api := r.Group("/api/v1")` 아래에 리소스별 라우트를 등록하고, 인증이 필요한 그룹에만 `admin.Use(AuthRequired())` 를 건다.
- **커스텀 미들웨어**:
  ```go
  func Timing() gin.HandlerFunc {
  	return func(c *gin.Context) {
  		start := time.Now()
  		c.Next()
  		log.Printf("%s %s %v", c.Request.Method, c.FullPath(), time.Since(start))
  	}
  }
  ```
- **검증**: `ShouldBind*` 는 에러를 돌려주고 응답은 핸들러가 정한다. `Bind*`(Must 계열)는 실패 시 400 으로 자동 중단한다. 중첩 struct 는 각 필드에 태그를 따로 단다.
- **DB 연동**: `database/sql`·pgx·GORM 등으로 만든 커넥션 풀을 핸들러 struct 필드나 클로저로 주입한다. 요청 취소를 전파하려면 `c.Request.Context()` 를 쿼리에 넘긴다.
- **테스트**: 표준 `net/http/httptest` 로 엔진을 직접 호출한다.
  ```go
  w := httptest.NewRecorder()
  req := httptest.NewRequest("GET", "/todos/1", nil)
  router.ServeHTTP(w, req)
  // w.Code, w.Body 로 검증
  ```
- **운영**: 배포 시 `GIN_MODE=release`(또는 `gin.SetMode(gin.ReleaseMode)`)로 디버그 로그를 끈다. graceful shutdown 은 `http.Server` 에 엔진을 넣고 `Shutdown(ctx)` 을 호출한다.

## 언제 쓰나 / 피할 때
- 쓸 때: Go 로 만드는 REST API·마이크로서비스, 레퍼런스와 미들웨어가 많은 검증된 선택지가 필요할 때.
- 피할 때(대안): 의존성을 최소화하려면 Go 1.22+ 표준 `net/http` 의 메서드·와일드카드 라우팅으로 충분한 경우가 많다. Rust 비동기 스택이라면 [Axum](/develop-wiki/backend/web-framework/axum/).

## 공식 문서
- [빠른 시작](https://gin-gonic.com/en/docs/quickstart/) · [바인딩과 검증](https://gin-gonic.com/en/docs/binding/binding-and-validation/) · [라우트 그룹](https://gin-gonic.com/en/docs/routing/grouping-routes/) · [pkg.go.dev API](https://pkg.go.dev/github.com/gin-gonic/gin)
