---
name: Go
summary: Google이 만든 단순한 문법의 정적 타입 컴파일 언어. 고루틴 기반 동시성과 단일 바이너리 배포 덕분에 서버·클라우드 인프라·CLI 도구에 많이 쓴다.
paradigms: [명령형, 절차적, 동시성, 구조적 타입 인터페이스]
typing: static
execution: compiled
firstAppeared: 2009
officialSite: https://go.dev/
docs: https://go.dev/doc/
useCases: [백엔드 API·마이크로서비스, 클라우드·인프라 도구, CLI 도구, 네트워크 서버, DevOps 자동화]
sources:
  - https://go.dev/doc/devel/release
  - https://go.dev/doc/tutorial/getting-started
  - https://go.dev/doc/install
  - https://go.dev/doc/
updatedAt: 2026-11-18
---

## 개요
Go(golang)는 Google에서 Robert Griesemer, Rob Pike, Ken Thompson이 설계해 2009년 공개한 언어다. 문법 요소를 의도적으로 적게 두고, 빠른 컴파일·정적 링크된 단일 실행 파일·내장 동시성을 핵심으로 삼는다. Docker, Kubernetes, Terraform 같은 클라우드 인프라 도구가 Go로 작성되었다.

- 2026-11 기준 최신 메이저 릴리스는 **Go 1.27**(2026-08-19). 6개월마다(2월·8월) 새 버전이 나오고 최근 두 메이저 버전이 지원된다.
- Go 1 호환성 약속에 따라 1.x 사이에서는 기존 코드가 대체로 그대로 빌드된다.

## 언어의 특징
| 항목 | 내용 |
| --- | --- |
| 타입 시스템 | 정적·강한 타입, 타입 추론(`:=`), 제네릭(1.18+). 인터페이스는 선언 없이 메서드만 맞으면 충족(암묵적 구현) |
| 메모리 관리 | 가비지 컬렉션. 포인터는 있지만 포인터 연산은 없음 |
| 동시성 | 고루틴(가벼운 사용자 스레드) + 채널, `select`, `sync`·`context` 패키지 |
| 에러 처리 | 예외 대신 `error` 값을 반환하고 호출자가 확인. 복구 불가 상황만 `panic` |
| 실행 | 네이티브 기계어로 AOT 컴파일, 런타임이 포함된 정적 바이너리. 크로스 컴파일이 쉬움(`GOOS`/`GOARCH`) |
| 도구 | `go` 명령 하나에 빌드·테스트·포맷(`gofmt`)·모듈 관리·벤치마크·프로파일링 포함 |

## 개발 환경 시작하기
1. [go.dev/dl](https://go.dev/dl/) 에서 OS 별 설치 파일을 받아 설치한다. 설치 후 `go version` 으로 확인.
2. 의존성은 **Go 모듈**(`go.mod`)로 관리한다. 별도 패키지 매니저가 필요 없다.

```bash
mkdir hello && cd hello
go mod init example.com/hello     # go.mod 생성 (인자는 모듈 경로)
```

```go
// main.go
package main

import "fmt"

func main() {
	fmt.Println("Hello, Go")
}
```

```bash
go run .                 # 컴파일 후 실행
go get github.com/gin-gonic/gin   # 의존성 추가
go mod tidy              # import 기준으로 go.mod/go.sum 정리
go build -o app .        # 실행 파일 생성
go test ./...            # 전체 테스트
```

## 문법 한눈에 보기
```go
package main

import (
	"errors"
	"fmt"
)

// 구조체와 메서드
type User struct {
	ID   int
	Name string
}

func (u User) Greet() string { return "안녕하세요, " + u.Name }

// 인터페이스: Greet() 만 있으면 자동으로 충족
type Greeter interface{ Greet() string }

// 에러를 값으로 반환
var ErrNotFound = errors.New("not found")

func find(users []User, id int) (User, error) {
	for _, u := range users {
		if u.ID == id {
			return u, nil
		}
	}
	return User{}, fmt.Errorf("user %d: %w", id, ErrNotFound)
}

// 제네릭
func Map[T, U any](xs []T, f func(T) U) []U {
	out := make([]U, 0, len(xs))
	for _, x := range xs {
		out = append(out, f(x))
	}
	return out
}
```

```go
// 고루틴과 채널
func main() {
	results := make(chan int)
	for i := 1; i <= 3; i++ {
		go func(n int) { results <- n * n }(i)
	}
	sum := 0
	for range 3 {
		sum += <-results
	}
	fmt.Println(sum) // 14

	if _, err := find(nil, 1); errors.Is(err, ErrNotFound) {
		fmt.Println("없음:", err)
	}
}
```

## 생태계
**웹·백엔드**
- [Gin](/develop-wiki/backend/web-framework/gin/) — 가장 널리 쓰이는 HTTP 웹 프레임워크. 표준 `net/http` 만으로도 서버 작성이 충분히 가능하다.
- 관측성: [OpenTelemetry](/develop-wiki/backend/observability/opentelemetry/)

**AI**
- 에이전트: [Eino](/develop-wiki/ai/agent-framework/eino/)(ByteDance/CloudWeGo) · [Google ADK](/develop-wiki/ai/agent-framework/google-adk/) · [Microsoft Agent Framework](/develop-wiki/ai/agent-framework/microsoft-agent-framework/)
- 도구 연동: [Model Context Protocol](/develop-wiki/ai/mcp-tooling/model-context-protocol/) Go SDK
- 로컬 모델 실행 도구 [Ollama](/develop-wiki/ai/inference-serving/ollama/) 도 Go로 작성되었다.

**인프라**: Docker, Kubernetes, Terraform, Prometheus 등 클라우드 네이티브 도구 다수. 패키지 검색은 [pkg.go.dev](https://pkg.go.dev/).

## 언제 쓰나 / 약점
- **쓸 때**
  - 동시 연결이 많은 API 서버·프록시·게이트웨이.
  - 배포가 단순해야 하는 CLI·에이전트·사이드카(의존성 없는 단일 바이너리).
  - 팀 규모가 크고 코드 스타일을 균일하게 유지하고 싶을 때(`gofmt`, 적은 문법).
- **약점**
  - `if err != nil` 반복 등 장황한 에러 처리.
  - 표현력이 의도적으로 제한됨(합 타입·패턴 매칭 없음, 제네릭 기능도 보수적).
  - GC 가 있어 Rust·C++ 수준의 지연 시간 예측성이나 메모리 제어는 어렵다.
  - GUI·모바일·데이터 과학 생태계는 약하다.

## 공식 문서·학습 자료
- [Go 문서](https://go.dev/doc/) · [설치 안내](https://go.dev/doc/install) · [시작하기 튜토리얼](https://go.dev/doc/tutorial/getting-started)
- [A Tour of Go](https://go.dev/tour/) · [Effective Go](https://go.dev/doc/effective_go) · [언어 명세](https://go.dev/ref/spec)
- [릴리스 이력](https://go.dev/doc/devel/release) · [Go 1.27 릴리스 노트](https://go.dev/doc/go1.27)
- [표준 라이브러리·패키지 검색](https://pkg.go.dev/)
