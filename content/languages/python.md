---
name: Python
summary: 읽기 쉬운 문법과 방대한 라이브러리를 가진 범용 동적 언어. 데이터 분석·머신러닝·AI, 웹 백엔드, 자동화 스크립트에 널리 쓴다.
paradigms: [객체지향, 명령형, 함수형, 절차적]
typing: dynamic
execution: interpreted
firstAppeared: 1991
officialSite: https://www.python.org/
docs: https://docs.python.org/3/
useCases: [머신러닝·AI, 데이터 분석·과학 계산, 웹 백엔드·API, 자동화·스크립트, 교육]
sources:
  - https://www.python.org/downloads/
  - https://docs.python.org/3/tutorial/venv.html
  - https://docs.astral.sh/uv/getting-started/installation/
  - https://docs.astral.sh/uv/guides/projects/
updatedAt: 2026-11-18
---

## 개요
Python은 Guido van Rossum이 만든 범용 언어로, 들여쓰기로 블록을 구분하는 간결한 문법이 특징이다. 표준 구현체 CPython이 소스를 바이트코드로 컴파일해 가상 머신에서 해석·실행한다.

- 2026-11 기준 최신 안정 버전은 **Python 3.15**(3.15.0 이 2026-10 출시, 최신 패치 3.15.2). 3.14 도 버그 수정 지원 중이고 3.10 은 지원 종료됐다.
- 매년 10월 새 마이너 버전이 나오고, 각 버전은 약 5년간 지원된다.

## 언어의 특징
| 항목 | 내용 |
| --- | --- |
| 타입 시스템 | 동적·강한 타입. 타입 힌트(`def f(x: int) -> str`)는 실행에 영향이 없고 mypy·Pyright 같은 외부 검사기가 활용 |
| 메모리 관리 | 참조 카운팅 + 순환 참조 수집용 가비지 컬렉터 |
| 동시성 | `asyncio`(이벤트 루프·`async`/`await`), `threading`, `multiprocessing`. 전통적으로 GIL 때문에 CPU 작업의 스레드 병렬성이 제한되며, GIL 없는 free-threaded 빌드가 별도로 제공된다 |
| 실행 | CPython 인터프리터(바이트코드 VM). PyPy 등 대안 구현체도 있음 |
| 패키지 | PyPI 저장소, `pip` 기본 설치 도구, `pyproject.toml` 로 프로젝트 메타데이터 정의 |

## 개발 환경 시작하기
1. [python.org/downloads](https://www.python.org/downloads/) 에서 OS 별 설치 파일을 받는다(macOS·Windows). Linux 는 배포판 패키지나 소스 빌드.
2. 프로젝트마다 가상 환경을 만들어 의존성을 격리한다.

**표준 도구(venv + pip)**
```bash
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
python -m pip install requests
python -m pip freeze > requirements.txt
deactivate
```

**uv (Astral 의 빠른 패키지·프로젝트 관리 도구)** — Python 설치, 가상 환경, 잠금 파일까지 한 번에 관리한다.
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh   # macOS/Linux
uv init hello-py && cd hello-py                   # pyproject.toml 생성
uv add requests                                   # 의존성 추가 + uv.lock 갱신
uv run main.py                                    # 프로젝트 환경에서 실행
```

그 밖의 도구: Poetry, PDM, Hatch(프로젝트 관리), conda(과학 계산 배포판), pipx(CLI 도구 설치).

## 문법 한눈에 보기
```python
# 변수와 자료구조
name = "dev.hub"
scores = [90, 85, 77]
user = {"id": 1, "name": "Kim"}
evens = [n for n in range(10) if n % 2 == 0]   # 리스트 컴프리헨션

# 함수 (타입 힌트는 선택)
def average(values: list[float]) -> float:
    return sum(values) / len(values) if values else 0.0

# 데이터 클래스
from dataclasses import dataclass

@dataclass
class Point:
    x: float
    y: float

    def dist(self) -> float:
        return (self.x ** 2 + self.y ** 2) ** 0.5
```

```python
# 패턴 매칭과 에러 처리
def describe(cmd: str) -> str:
    match cmd.split():
        case ["go", direction]:
            return f"{direction}로 이동"
        case ["quit"]:
            return "종료"
        case _:
            return "알 수 없는 명령"

try:
    value = int("abc")
except ValueError as e:
    print(f"변환 실패: {e}")
finally:
    print("끝")

# 비동기
import asyncio

async def main():
    await asyncio.sleep(0.1)
    print("done")

asyncio.run(main())
```

## 생태계
**웹 백엔드**
- [Django](/develop-wiki/backend/web-framework/django/) — ORM·관리자 화면까지 갖춘 풀스택 프레임워크
- [FastAPI](/develop-wiki/backend/web-framework/fastapi/) — 타입 힌트 기반 비동기 API 프레임워크
- 관측성: [OpenTelemetry](/develop-wiki/backend/observability/opentelemetry/)

**AI·LLM**
- 에이전트: [LangChain](/develop-wiki/ai/agent-framework/langchain/) · [LangGraph](/develop-wiki/ai/agent-framework/langgraph/) · [CrewAI](/develop-wiki/ai/agent-framework/crewai/) · [OpenAI Agents SDK](/develop-wiki/ai/agent-framework/openai-agents-sdk/) · [Google ADK](/develop-wiki/ai/agent-framework/google-adk/) · [Microsoft Agent Framework](/develop-wiki/ai/agent-framework/microsoft-agent-framework/)
- 추론 서빙: [vLLM](/develop-wiki/ai/inference-serving/vllm/)
- 도구 연동: [Model Context Protocol](/develop-wiki/ai/mcp-tooling/model-context-protocol/)
- 그 밖에 PyTorch, NumPy, pandas, scikit-learn, Jupyter 등 데이터·ML 스택의 중심 언어다.

**테스트·자동화**: [Playwright](/develop-wiki/frontend/testing/playwright/)(Python 바인딩), pytest.

## 언제 쓰나 / 약점
- **쓸 때**
  - 머신러닝·데이터 분석 — 주요 라이브러리와 연구 코드가 대부분 Python 우선이다.
  - 빠른 프로토타이핑, 업무 자동화, 글루 코드.
  - 관리 화면·CRUD 위주의 웹 서비스(Django), 타입 기반 API(FastAPI).
- **약점**
  - 순수 Python 코드의 실행 속도는 컴파일 언어보다 느리다. 무거운 연산은 C/Rust 확장(NumPy 등)에 기대는 구조.
  - GIL 이 있는 기본 빌드에서는 CPU 작업을 스레드로 병렬화하기 어렵다(멀티프로세스 또는 free-threaded 빌드 필요).
  - 동적 타입이라 대규모 코드베이스는 타입 힌트와 정적 검사기 도입이 사실상 필수.
  - 패키징·배포 도구가 여러 갈래(pip, uv, Poetry, conda)라 팀마다 표준을 정해야 한다.
  - 모바일·브라우저 프론트엔드에는 적합하지 않다.

## 공식 문서·학습 자료
- [Python 3 공식 문서](https://docs.python.org/3/) · [튜토리얼](https://docs.python.org/3/tutorial/) · [표준 라이브러리](https://docs.python.org/3/library/)
- [다운로드·버전별 지원 상태](https://www.python.org/downloads/)
- [가상 환경과 패키지(venv·pip)](https://docs.python.org/3/tutorial/venv.html)
- [Python Packaging User Guide](https://packaging.python.org/)
- [uv 문서](https://docs.astral.sh/uv/)
- [typing 모듈·타입 힌트](https://docs.python.org/3/library/typing.html)
