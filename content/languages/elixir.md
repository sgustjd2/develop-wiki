---
name: Elixir
summary: Erlang VM(BEAM) 위에서 도는 함수형 언어. 경량 프로세스와 감독 트리로 동시성·장애 복구에 강하고, v1.20부터 점진적 타입 검사를 한다. 실시간 웹·메시징 서버에 쓴다.
paradigms: [함수형, 동시성(액터 모델)]
typing: gradual
execution: vm
firstAppeared: 2012
officialSite: https://elixir-lang.org/
docs: https://hexdocs.pm/elixir/
useCases: [실시간 웹·WebSocket(Phoenix), 메시징·채팅 백엔드, 분산·고가용성 서비스, 데이터 파이프라인]
sources:
  - https://elixir-lang.org/install/
  - https://elixir-lang.org/blog/
  - https://hexdocs.pm/elixir/introduction.html
  - https://hexdocs.pm/mix/Mix.html
updatedAt: 2026-11-18
---

## 개요
Elixir는 José Valim이 2012년 공개한 언어로, 통신 시스템용으로 수십 년 검증된 **Erlang/OTP** 런타임(BEAM VM)을 그대로 쓰면서 Ruby에 영향을 받은 문법, 매크로, 현대적 빌드 도구(Mix)를 더했다. Erlang 라이브러리를 비용 없이 호출할 수 있다. 이 글 작성 시점 최신 버전은 **Elixir 1.20.5** 이며 Erlang/OTP 27 이상이 필요하다.

## 언어의 특징
- **타입 시스템:** 원래 동적 타입이지만, **v1.20(2026-06)부터 모든 프로그램을 점진적(gradual) 타입 검사**해 명백한 타입 오류를 컴파일 시 경고한다. 집합론적 타입(set-theoretic types) 기반으로 기존 코드를 추론하며, 그래서 `typing: gradual` 로 분류했다. 그 이전부터 쓰이던 `@spec` + Dialyzer 분석도 여전히 쓸 수 있다.
- **불변 데이터:** 모든 값은 불변이고, 변수는 재바인딩만 된다. 반복은 재귀와 `Enum`/`Stream` 으로 한다.
- **패턴 매칭:** `=` 은 대입이 아니라 매칭이다. 함수 절(clause)·`case`·`with` 에서 분기 수단으로 쓴다.
- **동시성:** BEAM의 경량 프로세스(OS 스레드가 아님, 수십만 개 생성 가능)가 메시지로만 통신한다. 프로세스마다 힙이 분리돼 GC가 프로세스 단위로 일어난다.
- **장애 처리:** "그냥 죽게 두라(let it crash)". 오류는 Supervisor가 프로세스를 재시작해 복구한다. 예외보다 `{:ok, value}` / `{:error, reason}` 튜플 반환이 관례.

## 개발 환경 시작하기
```bash
# macOS
brew install elixir            # Erlang/OTP 도 함께 설치됨

# macOS/Linux/Windows(bash) — 공식 설치 스크립트 (버전 지정)
curl -fsSO https://elixir-lang.org/install.sh
sh install.sh elixir@1.20.5 otp@29.1
# 이후 안내대로 ~/.elixir-install/installs 아래 bin 경로를 PATH 에 추가

# 여러 버전을 오가야 하면 asdf 또는 mise 로 erlang·elixir 를 설치
elixir --version
iex                             # 대화형 셸
```

빌드 도구는 **Mix**, 패키지 저장소는 **Hex**([hex.pm](https://hex.pm/))다.
```bash
mix new my_app --sup     # 감독 트리가 포함된 프로젝트
cd my_app
# mix.exs 의 deps 함수에 {:패키지명, "~> 버전"} 추가 후
mix deps.get
mix test
iex -S mix               # 프로젝트를 로드한 셸
```

## 문법 한눈에 보기
```elixir
defmodule User do
  defstruct [:name, age: nil]

  def parse_age(text) do
    case Integer.parse(text) do
      {n, ""} when n >= 0 -> {:ok, n}
      _ -> {:error, "invalid age: #{text}"}
    end
  end

  def label(%User{name: name, age: nil}), do: "#{name} (나이 미상)"
  def label(%User{name: name, age: age}), do: "#{name} #{age}"
end

users = [%User{name: "kim", age: 30}, %User{name: "lee"}]

users
|> Enum.map(&User.label/1)
|> Enum.each(&IO.puts/1)

with {:ok, age} <- User.parse_age("41") do
  IO.puts("parsed #{age}")
end

{:error, msg} = User.parse_age("abc")
IO.puts(msg)

# 프로세스와 메시지
parent = self()
spawn(fn -> send(parent, {:done, 42}) end)
receive do
  {:done, n} -> IO.puts("got #{n}")
end
```

## 생태계
| 분야 | 대표 도구 |
| --- | --- |
| 웹 프레임워크 | Phoenix, Phoenix LiveView(서버 주도 실시간 UI) |
| DB | Ecto(쿼리·마이그레이션) |
| 백그라운드 작업 | Oban |
| 데이터·ML | Nx, Explorer, Livebook, Broadway |
| 임베디드 | Nerves |
| 테스트·품질 | ExUnit(내장), Credo, Dialyxir |

이 사이트에는 아직 Elixir 전용 항목이 없다.

## 언제 쓰나 / 약점
- **쓸 때:** 동시 접속이 많은 실시간 서비스(채팅, 알림, WebSocket), 장애가 나도 부분적으로 복구되며 계속 돌아야 하는 서버, 분산 노드 간 메시지 처리.
- **약점:** 숫자 연산 같은 CPU 바운드 작업은 네이티브 언어보다 느리다(필요하면 NIF나 Nx로 보완). 채용 시장과 라이브러리 수가 주류 언어보다 작다. 함수형·OTP 개념(프로세스, GenServer, Supervisor)의 학습 비용이 있다.
- **대안:** 일반 웹 백엔드는 [Ruby](/develop-wiki/languages/ruby/)나 [Go](/develop-wiki/languages/go/).

## 공식 문서·학습 자료
- [Elixir 시작하기 가이드](https://hexdocs.pm/elixir/introduction.html) · [표준 라이브러리 문서](https://hexdocs.pm/elixir/)
- [설치](https://elixir-lang.org/install/) · [공식 블로그(릴리스 공지)](https://elixir-lang.org/blog/)
- [Mix](https://hexdocs.pm/mix/Mix.html) · [Hex](https://hex.pm/) · [Phoenix 문서](https://hexdocs.pm/phoenix/)
- [Elixir School](https://elixirschool.com/) — 커뮤니티 학습 자료
