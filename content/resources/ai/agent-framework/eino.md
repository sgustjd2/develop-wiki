---
name: Eino
url: https://www.cloudwego.io/docs/eino/
repo: https://github.com/cloudwego/eino
stars: 13713
domain: ai
category: agent-framework
description: CloudWeGo(ByteDance)의 Go용 LLM 앱·에이전트 프레임워크. 컴포넌트 추상화와 그래프 오케스트레이션으로 Go 서비스에 에이전트를 넣을 때 쓴다.
pricing: oss
tags: [agent, workflow, graph]
languages: [go]
docs: https://www.cloudwego.io/docs/eino/
addedAt: 2026-11-18
verifiedAt: 2026-11-19
---

## 개요
Eino 는 CloudWeGo(ByteDance)가 만든 [Go](/develop-wiki/languages/go/)용 LLM 애플리케이션·에이전트 프레임워크다. ChatModel·Tool·Retriever·Embedding·ChatTemplate 같은 **컴포넌트** 인터페이스를 정의하고, 이를 Chain·Graph·Workflow 로 엮는 **오케스트레이션** 계층, 그 위에 에이전트를 위한 **ADK**(ChatModelAgent, Runner, 사람 개입·재개, 멀티 에이전트)를 둔다.
Go 의 타입 시스템을 살려 노드 입출력 타입을 컴파일 시점에 맞추고, 스트리밍을 기본 개념으로 다룬다. 모델 공급자·벡터 DB 구현체는 별도 저장소 `eino-ext` 에 있다.
2026-11 기준 `github.com/cloudwego/eino` v0.9.23 (아직 v1 이전이라 마이너 버전 사이에 API 가 바뀔 수 있다).

## 설치
```bash
go get github.com/cloudwego/eino@latest
go get github.com/cloudwego/eino-ext/components/model/openai@latest   # OpenAI 호환 모델 구현
```

공식 예제 저장소 `cloudwego/eino-examples` 의 `quickstart/chatwitheino` 가 장별 튜토리얼 코드를 담고 있다(`OPENAI_API_KEY`, `OPENAI_MODEL` 환경 변수 사용).

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 컴포넌트 | `ChatModel`, `Tool`, `Retriever`, `Embedding`, `ChatTemplate`, `Indexer` 등 교체 가능한 인터페이스 |
| `schema.Message` | 역할·내용·도구 호출을 담는 공통 메시지 타입 |
| Chain | `compose.NewChain[I, O]()` — 노드를 순서대로 잇는 단순 파이프라인 |
| Graph | `compose.NewGraph[I, O]()` — 분기·루프가 있는 방향 그래프 |
| Workflow | `compose.NewWorkflow[I, O]()` — 필드 단위로 데이터 흐름을 연결하는 그래프 |
| `utils.InferTool` | Go 함수와 입력 구조체에서 도구 스키마를 추론해 도구 생성 |
| ADK `ChatModelAgent` | 모델 + 도구로 ReAct 루프를 도는 에이전트 |
| `Runner` | 에이전트 실행기. 이벤트 이터레이터를 돌려주고 체크포인트 저장소로 중단·재개 지원 |
| 콜백 | 노드 실행 전후 훅으로 로깅·트레이싱 연결 |

## 기본 사용법
도구 하나를 가진 에이전트 (오류 처리 일부 생략):

```go
package main

import (
	"context"
	"fmt"
	"os"

	"github.com/cloudwego/eino-ext/components/model/openai"
	"github.com/cloudwego/eino/adk"
	"github.com/cloudwego/eino/components/tool"
	"github.com/cloudwego/eino/components/tool/utils"
	"github.com/cloudwego/eino/compose"
)

type AddInput struct {
	A int `json:"a"`
	B int `json:"b"`
}

func main() {
	ctx := context.Background()
	cm, _ := openai.NewChatModel(ctx, &openai.ChatModelConfig{
		APIKey: os.Getenv("OPENAI_API_KEY"), Model: os.Getenv("OPENAI_MODEL"),
	})
	add, _ := utils.InferTool("add", "두 정수를 더한다",
		func(ctx context.Context, in AddInput) (int, error) { return in.A + in.B, nil })

	agent, _ := adk.NewChatModelAgent(ctx, &adk.ChatModelAgentConfig{
		Name: "calc", Description: "계산 도우미", Instruction: "계산은 add 도구로 한다.",
		Model:       cm,
		ToolsConfig: adk.ToolsConfig{ToolsNodeConfig: compose.ToolsNodeConfig{Tools: []tool.BaseTool{add}}},
	})
	runner := adk.NewRunner(ctx, adk.RunnerConfig{Agent: agent})

	iter := runner.Query(ctx, "12 더하기 30은?")
	for ev, ok := iter.Next(); ok; ev, ok = iter.Next() {
		if msg, _, err := adk.GetMessage(ev); err == nil && msg != nil {
			fmt.Println(msg.Content)
		}
	}
}
```

이벤트에는 도구 호출 메시지와 최종 답이 차례로 들어오며, 오류는 `ev.Err` 로 확인한다.

## 자주 쓰는 패턴
- **스트리밍**: `adk.RunnerConfig{Agent: agent, EnableStreaming: true}` 로 토큰 단위 이벤트를 받는다. 컴포넌트 수준에서는 `cm.Stream(ctx, msgs)` 가 `StreamReader` 를 돌려준다.
- **결정적 파이프라인**: 프롬프트 템플릿 → 모델 → 후처리처럼 고정된 흐름은 ADK 대신 `compose.NewChain` 이나 `NewGraph` 로 짜고 `Compile` 후 `Invoke`/`Stream` 한다.
- **사람 개입·재개**: Runner 에 `CheckPointStore` 를 주면 도구 실행 전 인터럽트로 멈췄다가 `Resume` 계열 메서드로 이어 갈 수 있다.
- **공급자 교체**: `eino-ext` 의 다른 모델 구현(Ark, Ollama 등)으로 바꿔도 에이전트 코드는 그대로다. OpenAI 호환 서버([vLLM](/develop-wiki/ai/inference-serving/vllm/) 등)는 `BaseURL` 만 지정한다.
- **멀티 에이전트**: 하위 에이전트를 도구로 감싸 상위 ChatModelAgent 에 넘기거나, Plan-Execute·DeepAgents 같은 기성 구현을 쓴다.

## 언제 쓰나 / 피할 때
- 쓸 때: Go 로 작성된 백엔드([Gin](/develop-wiki/backend/web-framework/gin/) 등)에 에이전트·RAG 를 넣을 때, 정적 타입과 스트리밍을 중시할 때, 별도 Python 서비스를 두지 않고 하나의 바이너리로 배포하고 싶을 때.
- 피할 때(대안): 예제·통합 수가 중요하면 Python 의 [LangGraph](/develop-wiki/ai/agent-framework/langgraph/)·[LangChain](/develop-wiki/ai/agent-framework/langchain/). Go 에서 Gemini·Google Cloud 중심이면 [Google ADK](/develop-wiki/ai/agent-framework/google-adk/) Go SDK 도 후보다.

## 공식 문서
- [문서 홈](https://www.cloudwego.io/docs/eino/) · [Quick Start](https://www.cloudwego.io/docs/eino/quick_start/) · [컴포넌트](https://www.cloudwego.io/docs/eino/core_modules/components/)
- [Chain·Graph 오케스트레이션](https://www.cloudwego.io/docs/eino/core_modules/chain_and_graph_orchestration/) · [Eino ADK](https://www.cloudwego.io/docs/eino/core_modules/eino_adk/) · [GitHub](https://github.com/cloudwego/eino) · [eino-ext](https://github.com/cloudwego/eino-ext)
