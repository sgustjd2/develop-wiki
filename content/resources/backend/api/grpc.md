---
name: gRPC
url: https://grpc.io
docs: https://grpc.io/docs/
repo: https://github.com/grpc/grpc
stars: 45456
domain: backend
category: api
description: Protocol Buffers 로 서비스를 정의하고 HTTP/2 위에서 호출하는 RPC 프레임워크. 여러 언어로 된 마이크로서비스 간 저지연 통신과 스트리밍에 쓴다.
pricing: oss
tags: [rpc, protobuf, http2, microservices, streaming]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
gRPC 는 CNCF 프로젝트인 고성능 RPC 프레임워크다. `.proto` 파일에 서비스와 메시지를 정의하면 언어별 코드 생성기가 서버 인터페이스와 클라이언트 스텁을 만들고, 호출은 HTTP/2 위에서 Protobuf 바이너리로 직렬화된다. 단항 호출 외에 서버·클라이언트·양방향 스트리밍, 데드라인, 취소, 메타데이터, 상태 코드가 표준화돼 있다.

언어별 구현(2026-11 기준): C++ 코어 기반(grpc 1.85.x — Python `grpcio`, C#, Ruby 등), Go(`grpc-go` 1.85), Java(`grpc-java`), Node(`@grpc/grpc-js` 1.14), Rust(커뮤니티 `tonic` 0.14), .NET(`Grpc.AspNetCore`). 스키마 관리와 코드 생성은 [Buf](/develop-wiki/backend/api/buf/) 를 많이 쓴다.

## 설치
Go 기준.
```bash
go get google.golang.org/grpc
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `.proto` | `service`, `rpc`, `message` 정의. 필드 번호가 와이어 호환성의 기준 |
| 호출 유형 | Unary, Server streaming, Client streaming, Bidirectional streaming |
| 데드라인 | 클라이언트가 지정한 제한 시간. 서버 체인을 따라 전파 |
| 상태 코드 | `OK`, `NOT_FOUND`, `UNAVAILABLE`, `DEADLINE_EXCEEDED` 등 표준 코드 |
| 메타데이터 | 헤더 역할의 키-값. 인증 토큰 전달 |
| 인터셉터 | 로깅·인증·메트릭을 넣는 미들웨어 |
| 리플렉션·헬스 체크 | 표준 서비스. `grpcurl` 같은 도구와 로드밸런서가 사용 |

## 기본 사용법
```protobuf
// greeter.proto
syntax = "proto3";
package greeter.v1;
option go_package = "example.com/gen/greeterv1";

service Greeter {
  rpc SayHello(HelloRequest) returns (HelloReply);
}
message HelloRequest { string name = 1; }
message HelloReply { string message = 1; }
```
```go
// server.go — 생성 코드(greeterv1) 사용
type server struct{ greeterv1.UnimplementedGreeterServer }

func (s *server) SayHello(ctx context.Context, req *greeterv1.HelloRequest) (*greeterv1.HelloReply, error) {
	return &greeterv1.HelloReply{Message: "hello " + req.GetName()}, nil
}

func main() {
	lis, _ := net.Listen("tcp", ":50051")
	s := grpc.NewServer()
	greeterv1.RegisterGreeterServer(s, &server{})
	reflection.Register(s)
	log.Fatal(s.Serve(lis))
}
```
```bash
grpcurl -plaintext -d '{"name":"kim"}' localhost:50051 greeter.v1.Greeter/SayHello
```

## 자주 쓰는 패턴
- **하위 호환 규칙**: 필드 번호를 재사용하거나 타입을 바꾸지 않는다. 삭제한 필드는 `reserved` 로 막고, 깨지는 변경은 Buf 로 CI 에서 검사한다.
- **데드라인 필수화**: 모든 클라이언트 호출에 `context.WithTimeout` 등으로 제한 시간을 건다.
- **브라우저 지원**: 브라우저는 HTTP/2 트레일러를 직접 다루지 못하므로 gRPC-Web 프록시(Envoy)나 gRPC·HTTP JSON 을 함께 지원하는 Connect 프로토콜을 쓴다.
- **로드밸런싱**: HTTP/2 연결이 오래 유지되므로 L4 로드밸런서로는 분산이 안 된다. 클라이언트 측 LB 나 L7 프록시·서비스 메시를 쓴다.
- **관측성**: 인터셉터로 [OpenTelemetry](/develop-wiki/backend/observability/opentelemetry/) 트레이스·메트릭을 붙인다.

## 언제 쓰나 / 피할 때
- 쓸 때: 여러 언어로 된 내부 마이크로서비스, 낮은 지연·높은 처리량, 양방향 스트리밍, 엄격한 스키마 계약이 필요할 때.
- 피할 때(대안): 브라우저·외부 개발자에게 공개하는 API 는 REST + [OpenAPI](/develop-wiki/backend/api/openapi/) 나 [GraphQL](/develop-wiki/backend/api/graphql/), 비동기 이벤트 전달은 메시지 브로커.

## 공식 문서
- [문서](https://grpc.io/docs/) · [핵심 개념](https://grpc.io/docs/what-is-grpc/core-concepts/) · [Go 퀵스타트](https://grpc.io/docs/languages/go/quickstart/) · [Protobuf 언어 가이드](https://protobuf.dev/programming-guides/proto3/)
