---
name: Phoenix
url: https://www.phoenixframework.org
docs: https://phoenix.hexdocs.pm/overview.html
repo: https://github.com/phoenixframework/phoenix
stars: 23234
domain: backend
category: web-framework
description: Erlang VM(BEAM) 위에서 동작하는 Elixir 웹 프레임워크. 동시 접속이 많은 실시간 웹 앱·API를 LiveView·Channels로 만들 때 쓴다.
pricing: oss
tags: [beam, liveview, websocket, mvc, realtime]
languages: [elixir]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Phoenix 는 [Elixir](/develop-wiki/languages/elixir/) 웹 프레임워크로, Erlang VM(BEAM)의 경량 프로세스와 감독 트리(supervision tree) 위에서 요청·WebSocket 연결을 각각 독립 프로세스로 처리한다. 요청 처리는 Plug(`conn` 을 받아 `conn` 을 돌려주는 함수/모듈)의 파이프라인으로 구성되고, DB 계층은 Ecto(스키마·체인지셋·쿼리)를 쓴다. 서버 렌더링 UI 를 WebSocket 으로 갱신하는 LiveView, Pub/Sub 기반 Channels 가 함께 제공된다.

현재 버전은 1.8.x(최신 1.8.16)이며 Elixir 1.17 이상, Erlang/OTP 25 이상이 필요하다. 기본 DB 설정은 [PostgreSQL](/develop-wiki/backend/database/postgresql/) 이다. 같은 풀스택 관례형 프레임워크인 [Ruby on Rails](/develop-wiki/backend/web-framework/rails/) 와 구조가 비슷하지만 동시성 모델이 다르다.

## 설치
```bash
mix archive.install hex phx_new
mix phx.new todo --no-html --no-assets     # JSON API 용. 풀스택은 옵션 없이
cd todo
mix ecto.create
mix phx.server                              # http://localhost:4000
```
대화형 셸과 함께 띄우려면 `iex -S mix phx.server`.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Endpoint | 모든 요청의 진입점. 정적 파일·파서·세션 등 공통 Plug 를 거쳐 Router 로 전달 |
| Router | `pipeline :api do plug :accepts, ["json"] end` 로 Plug 묶음을 정의하고 `scope` 에서 `pipe_through` |
| Plug | `conn` 변환 함수. 인증·헤더 처리 등 미들웨어 역할 |
| Controller | 액션 함수 `def show(conn, params)`. `render`, `json`, `put_status` |
| JSON 모듈 | `TodoJSON.show/1` 처럼 데이터를 맵으로 바꾸는 렌더링 모듈(1.7+ 방식) |
| Context | `Todos.create_todo/1` 같은 도메인 API 모듈. 컨트롤러는 Repo 를 직접 쓰지 않는다 |
| Ecto 체인지셋 | `cast` → `validate_required` 등으로 입력을 필터링·검증. 실패 시 `{:error, changeset}` |
| LiveView / Channels | 서버 상태 기반 실시간 UI / 토픽 기반 양방향 메시징 |

## 기본 사용법
`mix phx.gen.json Todos Todo todos title:string` 가 컨텍스트·스키마·마이그레이션·컨트롤러·JSON 모듈·테스트를 만든다. 핵심 부분은 다음과 같다.
```elixir
# lib/todo_web/router.ex
scope "/api", TodoWeb do
  pipe_through :api
  resources "/todos", TodoController, only: [:show, :create]
end

# lib/todo_web/controllers/todo_controller.ex
defmodule TodoWeb.TodoController do
  use TodoWeb, :controller
  alias Todo.Todos

  action_fallback TodoWeb.FallbackController

  def show(conn, %{"id" => id}) do
    render(conn, :show, todo: Todos.get_todo!(id))   # 없으면 404
  end

  def create(conn, %{"todo" => params}) do
    with {:ok, todo} <- Todos.create_todo(params) do
      conn |> put_status(:created) |> render(:show, todo: todo)
    end
  end
end
```
`create_todo/1` 이 `{:error, changeset}` 을 돌려주면 `with` 를 빠져나가 `FallbackController` 가 422 와 오류 맵을 응답한다. 검증 규칙은 스키마의 `changeset/2` 에 `validate_required([:title])` 로 둔다. 마이그레이션은 `mix ecto.migrate`.

## 자주 쓰는 패턴
- **파이프라인**: 인증이 필요한 구간은 `pipeline :auth do plug TodoWeb.Plugs.RequireToken end` 를 만들어 `pipe_through [:api, :auth]` 로 건다. 커스텀 Plug 는 `init/1`·`call/2` 를 구현한 모듈이다.
- **검증**: Ecto 체인지셋에서 `validate_length(:title, max: 100)`, `unique_constraint(:slug)` 처럼 규칙을 선언하고, 컨트롤러는 `with` + `action_fallback` 으로 에러 응답을 한곳에 모은다.
- **DB**: `Repo.all(from t in Todo, where: t.done == false)` 같은 Ecto 쿼리, 연관 로딩은 `Repo.preload/2`. 여러 쓰기를 묶을 때는 `Ecto.Multi` 와 `Repo.transaction`.
- **인증 골격**: `mix phx.gen.auth Accounts User users` 가 로그인·세션·토큰 코드를 생성한다. 1.8 에서는 생성된 코드가 scope(`current_scope`) 를 통해 데이터 접근을 사용자 단위로 제한한다.
- **실시간**: 서버 이벤트는 `Phoenix.PubSub.broadcast` 로 내보내고 LiveView·Channel 에서 구독한다.
- **테스트**: 생성된 `ConnCase` 로 엔드포인트를 통째로 호출한다. 테스트마다 DB 샌드박스가 롤백된다(`mix test`).
  ```elixir
  test "creates todo", %{conn: conn} do
    conn = post(conn, ~p"/api/todos", todo: %{title: "a"})
    assert %{"id" => _} = json_response(conn, 201)["data"]
  end
  ```

## 언제 쓰나 / 피할 때
- 쓸 때: 채팅·알림·협업·대시보드처럼 장시간 연결과 실시간 갱신이 많은 서비스, JavaScript 를 최소화한 서버 주도 UI(LiveView), 장애 격리·자동 재시작이 중요한 백엔드.
- 피할 때(대안): 팀에 Elixir 경험이 없고 채용·생태계 폭이 우선이면 [Ruby on Rails](/develop-wiki/backend/web-framework/rails/)·[Django](/develop-wiki/backend/web-framework/django/)·[Spring Boot](/develop-wiki/backend/web-framework/spring-boot/). CPU 집약 계산이 핵심이면 BEAM 보다 컴파일 언어 쪽이 유리하다.

## 공식 문서
- [Overview](https://phoenix.hexdocs.pm/overview.html) · [Installation](https://phoenix.hexdocs.pm/installation.html) · [Routing](https://phoenix.hexdocs.pm/routing.html) · [JSON and APIs](https://phoenix.hexdocs.pm/json_and_apis.html) · [Testing Controllers](https://phoenix.hexdocs.pm/testing_controllers.html) · [Ecto 문서](https://ecto.hexdocs.pm/)
