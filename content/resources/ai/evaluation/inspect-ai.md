---
name: Inspect AI
url: https://inspect.aisi.org.uk/
docs: https://inspect.aisi.org.uk/
repo: https://github.com/UKGovernmentBEIS/inspect_ai
stars: 3328
domain: ai
category: evaluation
description: 영국 AI Security Institute가 만든 LLM·에이전트 평가 프레임워크. 데이터셋·솔버·스코어러로 평가를 코드로 정의하고, Docker 샌드박스에서 도구 쓰는 에이전트까지 벤치마크할 때 쓴다.
pricing: oss
tags: [evals, benchmark, agent-eval, sandbox, python]
languages: [python]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-24
---

## 개요
Inspect 는 UK AI Security Institute(AISI)와 Meridian Labs 가 개발하는 오픈소스 LLM 평가 프레임워크다. 평가 하나를 **Task = 데이터셋 + 솔버 + 스코어러** 로 정의하고, CLI(`inspect eval`)로 여러 모델에 같은 평가를 돌린 뒤 로그 뷰어(`inspect view`)로 샘플별 대화·도구 호출·점수를 살펴본다. 단순 Q&A 채점부터 셸·브라우저 도구를 쓰는 에이전트(CTF, 코딩 과제)를 Docker 샌드박스에서 실행하는 평가까지 같은 구조로 다룬다.
2026-11-18 기준 최신 버전은 **0.3.291**(2026-11-17, MIT, Python 3.11+)이며 주 2~3회 릴리스된다. 버전이 0.x 라 API 가 계속 바뀔 수 있다. 공개 벤치마크 구현 모음은 별도 저장소 [inspect_evals](https://github.com/UKGovernmentBEIS/inspect_evals)에 있다.
[promptfoo](/develop-wiki/ai/evaluation/promptfoo/)가 YAML 중심 프롬프트 회귀 테스트, [DeepEval](/develop-wiki/ai/evaluation/deepeval/)이 앱 단위 테스트 지표라면, Inspect 는 **모델·에이전트 능력과 안전성 벤치마크**에 무게가 있다.

## 설치
```bash
pip install inspect-ai
pip install openai             # 사용할 공급자 SDK 를 함께 설치
export OPENAI_API_KEY="..."    # 키는 환경 변수로
```
VS Code 확장(Inspect AI)을 쓰면 태스크 실행·로그 보기가 편하다(선택).

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `Task` / `@task` | 데이터셋·솔버·스코어러를 묶은 평가 단위. `@task` 함수로 등록하면 CLI 가 찾는다 |
| Dataset | `Sample(input, target)` 목록, `json_dataset`, `csv_dataset`, `hf_dataset`(Hugging Face) |
| Solver | 샘플을 처리하는 단계. `generate()`, `system_message()`, `chain_of_thought()`, `multiple_choice()`, `self_critique()` |
| Scorer | 채점. `match()`, `includes()`, `exact()`, `f1()`, `choice()`, `model_graded_qa()`/`model_graded_fact()`(LLM 채점) |
| Agent | `react()` 같은 내장 에이전트, `handoff()`/`as_tool()` 멀티 에이전트, 외부 에이전트를 붙이는 Agent Bridge |
| Tools | `bash()`, `python()` 등 도구. 실제 실행은 샌드박스에서 |
| Sandbox | `sandbox="docker"` 로 Dockerfile·compose 기반 격리 환경에서 도구 실행 |
| 로그 | 모든 실행이 `logs/` 에 남고 `inspect view` 로 웹 뷰어에서 확인 |
| `eval_set` | 여러 태스크·모델 조합을 재시도·재개 가능하게 일괄 실행 |

## 기본 사용법
작은 Q&A 평가를 정의하고 실행:

```python
# capitals.py
from inspect_ai import Task, task
from inspect_ai.dataset import Sample
from inspect_ai.scorer import includes
from inspect_ai.solver import generate, system_message

@task
def capitals():
    return Task(
        dataset=[
            Sample(input="대한민국의 수도는?", target="서울"),
            Sample(input="일본의 수도는?", target="도쿄"),
        ],
        solver=[system_message("한 단어로 답한다."), generate()],
        scorer=includes(),
    )
```
```bash
inspect eval capitals.py --model openai/<모델 id>    # 모델은 provider/model 형식
inspect view                                         # 결과 로그 보기
```

## 자주 쓰는 패턴
- **에이전트 평가**: `Task(..., solver=react(tools=[bash()]), sandbox="docker")` — 모델이 컨테이너 안에서 명령을 실행하며 과제를 푼다.
- **LLM 채점**: 정답 문자열이 아닌 서술형 답은 `model_graded_qa()` 로 채점 모델을 따로 둔다.
- **Python 에서 실행**: `from inspect_ai import eval; eval(capitals(), model="anthropic/<모델 id>")` — 노트북·CI 에서 결과 객체를 바로 다룬다.
- **공개 벤치마크 재사용**: `inspect_evals` 패키지의 구현(수백 개)을 그대로 돌려 모델을 비교한다.
- **반복 실행**: `--epochs` 로 같은 샘플을 여러 번 돌려 점수 분산을 줄인다.

## 언제 쓰나 / 피할 때
- 쓸 때: 여러 모델의 능력·안전성 벤치마크, 도구를 쓰는 에이전트를 격리 환경에서 재현 가능하게 평가할 때, 연구·레드팀 평가 결과를 로그로 남겨 검토할 때.
- 피할 때(대안): 운영 중인 앱의 트레이싱·프롬프트 관리가 목적이면 [Langfuse](/develop-wiki/ai/evaluation/langfuse/)·[LangSmith](/develop-wiki/ai/evaluation/langsmith/), RAG 품질 지표는 [Ragas](/develop-wiki/ai/evaluation/ragas/), 설정 파일만으로 프롬프트 회귀 테스트를 하려면 [promptfoo](/develop-wiki/ai/evaluation/promptfoo/).

## 공식 문서
- [문서 홈](https://inspect.aisi.org.uk/) · [튜토리얼](https://inspect.aisi.org.uk/tutorial.html) · [Tasks](https://inspect.aisi.org.uk/tasks.html) · [Solvers](https://inspect.aisi.org.uk/solvers.html) · [Scorers](https://inspect.aisi.org.uk/scorers.html)
- [Agents](https://inspect.aisi.org.uk/agents.html) · [Sandboxing](https://inspect.aisi.org.uk/sandboxing.html) · [Log Viewer](https://inspect.aisi.org.uk/log-viewer.html) · [inspect_evals](https://github.com/UKGovernmentBEIS/inspect_evals)
