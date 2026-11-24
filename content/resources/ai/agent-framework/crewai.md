---
name: CrewAI
url: https://docs.crewai.com/
repo: https://github.com/crewAIInc/crewAI
stars: 61229
domain: ai
category: agent-framework
description: 역할과 작업을 가진 에이전트 팀(Crew)과 이벤트 기반 Flow로 멀티 에이전트 작업을 구성하는 Python 프레임워크. 역할 분담형 협업 에이전트를 만들 때 쓴다.
pricing: oss
tags: [agent, multi-agent, workflow]
languages: [python]
docs: https://docs.crewai.com/
addedAt: 2026-11-18
verifiedAt: 2026-11-19
---

## 개요
CrewAI 는 "역할(role)·목표(goal)·배경(backstory)"을 가진 에이전트들이 작업(Task)을 나눠 맡는 **Crew** 와, 상태와 실행 순서를 코드로 관리하는 **Flow** 두 축으로 멀티 에이전트 앱을 만드는 Python 프레임워크다.
사람 팀처럼 "조사원 → 작성자 → 검토자" 로 역할을 나누는 문제를 짧은 코드로 표현하는 데 강하고, 공식 문서는 운영용 앱의 뼈대를 Flow 로 잡고 그 안의 단계에서 Crew 를 돌리는 구조를 권장한다.
2026-11 기준 `crewai` 1.15.41, Python 3.10 이상 3.14 미만.

## 설치
```bash
uv tool install crewai              # CLI 설치 (uv 필요)
crewai create flow my_flow          # Flow 프로젝트 생성
crewai create crew my_crew          # Crew 프로젝트 (JSONC 설정이 기본)
crewai create crew my_crew --classic   # 예전 YAML + @CrewBase 구조
cd my_flow && crewai install && crewai run
```

라이브러리로만 쓸 때는 프로젝트에 `uv add crewai` 를 하고, 내장 도구 모음이 필요하면 `crewai[tools]` 를 설치한다. 모델 공급자 키는 `.env` 나 환경 변수로 둔다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `Agent` | `role`, `goal`, `backstory`, `tools`, `llm` 을 가진 작업자 |
| `Task` | `description`, `expected_output`, 담당 `agent`. 결과가 다음 작업의 맥락이 됨 |
| `Crew` | 에이전트·작업 묶음. `crew.kickoff(inputs={...})` 로 실행 |
| `Process` | `sequential`(순서대로) 또는 `hierarchical`(매니저가 위임·검증, `manager_llm` 필요) |
| `Flow` | `@start`, `@listen`, `@router` 로 이벤트 기반 실행 순서를 정의하고 Pydantic 상태를 관리 |
| 도구 | `@tool("이름")` 데코레이터 또는 `BaseTool` 상속으로 정의 |
| `LLM` | `"openai/..."`, `"openrouter/..."` 처럼 `공급자/모델` 문자열이나 `LLM(model=...)` 객체 |
| 설정 파일 | 새 Crew 는 `crew.jsonc`·`agents/*.jsonc`, 클래식은 `agents.yaml`·`tasks.yaml` |

## 기본 사용법
코드만으로 도구 하나를 가진 2인 Crew:

```python
import os
from crewai import Agent, Crew, Process, Task
from crewai.tools import tool

@tool("word_count")
def word_count(text: str) -> str:
    """텍스트의 단어 수를 센다."""
    return str(len(text.split()))

writer = Agent(role="작가", goal="주제에 대한 짧은 소개글 작성",
               backstory="기술 블로그 필자", llm=os.environ["CREW_LLM"])  # 예: "openai/<모델명>"
editor = Agent(role="편집자", goal="글을 50단어 이내로 다듬기",
               backstory="꼼꼼한 편집자", tools=[word_count], llm=os.environ["CREW_LLM"])

draft = Task(description="{topic} 소개글을 써라", expected_output="한 단락", agent=writer)
edit = Task(description="초안을 50단어 이내로 줄여라", expected_output="최종 단락", agent=editor)

crew = Crew(agents=[writer, editor], tasks=[draft, edit], process=Process.sequential)
print(crew.kickoff(inputs={"topic": "벡터 데이터베이스"}))
```

`{topic}` 같은 자리표시자는 `kickoff(inputs=...)` 값으로 채워진다.

## 자주 쓰는 패턴
- **Flow 로 뼈대 잡기**: `class MyFlow(Flow[MyState])` 에서 `@start()` 메서드가 입력을 준비하고, `@listen(prepare)` 메서드에서 Crew 를 실행한다. `@router` 로 결과에 따라 분기한다.
- **상태 영속화**: Flow 에 `@persist` 를 붙이면 상태가 기본적으로 SQLite 에 저장돼 중단 후 이어 갈 수 있다.
- **사람 검토**: `@human_feedback` (1.8.0+)으로 Flow 를 멈추고 사람의 피드백을 받는다.
- **매니저형 팀**: `Process.hierarchical` + `manager_llm` 으로 매니저 에이전트가 작업을 배분·검증하게 한다.
- **단일 에이전트 호출**: Crew 없이 `agent.kickoff("질문")` 으로 에이전트 하나만 바로 실행할 수 있다.
- **로컬 모델**: `llm` 에 OpenAI 호환 엔드포인트나 [Ollama](/develop-wiki/ai/inference-serving/ollama/) 모델을 지정해 비용 없이 실험한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 조사·작성·검토처럼 역할 분담이 자연스러운 콘텐츠·리서치 자동화, 비개발자도 읽을 수 있는 설정 파일로 에이전트를 관리하고 싶을 때, 빠른 멀티 에이전트 프로토타입.
- 피할 때(대안): 단계별 체크포인트·세밀한 그래프 제어가 핵심이면 [LangGraph](/develop-wiki/ai/agent-framework/langgraph/), 에이전트 하나 + 도구 몇 개면 [OpenAI Agents SDK](/develop-wiki/ai/agent-framework/openai-agents-sdk/)나 [LangChain](/develop-wiki/ai/agent-framework/langchain/) 이 더 가볍다. Python 외 언어는 지원하지 않는다.

## 공식 문서
- [문서 홈](https://docs.crewai.com/) · [설치](https://docs.crewai.com/en/installation) · [Quickstart](https://docs.crewai.com/en/quickstart)
- [Agents](https://docs.crewai.com/en/concepts/agents) · [Crews](https://docs.crewai.com/en/concepts/crews) · [Flows](https://docs.crewai.com/en/concepts/flows) · [Tools](https://docs.crewai.com/en/concepts/tools)
