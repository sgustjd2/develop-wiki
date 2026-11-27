---
name: Awesome LLM Apps
url: https://github.com/Shubhamsaboo/awesome-llm-apps
repo: https://github.com/Shubhamsaboo/awesome-llm-apps
stars: 145936
domain: oss
category: awesome-lists
description: 링크 목록이 아니라 실행 가능한 AI 에이전트·RAG·멀티에이전트·MCP 앱 예제 코드 100여 개를 담은 저장소. LLM 앱 구조를 코드로 배우거나 시작 템플릿을 찾을 때 쓴다.
pricing: oss
tags: [awesome, llm-apps, agents, rag, mcp, examples, templates]
languages: [python]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
이름은 `awesome-*` 이지만 다른 Awesome 목록과 달리 **외부 링크 모음이 아니라 직접 작성한 예제 코드 모음**이다. 폴더마다 독립된 앱이 있고 `pip install -r requirements.txt` 후 Streamlit 같은 UI 로 실행하는 형태가 많다. 이 사이트가 이 저장소를 Awesome 리스트 카테고리에 두는 이유는 "LLM 앱 예제 큐레이션 허브" 역할 때문이며, 라이브러리가 아니므로 `import` 해서 쓰는 대상이 아니다.
**2026-11 기준**: 별 144,996, 마지막 푸시 2026-11-18, 라이선스 Apache-2.0. 같은 주제의 튜토리얼은 저자의 뉴스레터 Unwind AI 에 연결된다.

## 무엇이 들어 있나
| 폴더 | 내용 |
| --- | --- |
| `agent_skills/` | 코딩 에이전트용 스킬(예: Project Graveyard, Commit Archaeologist, Dependency Doctor). CI 의 보안·평가 게이트를 통과한다고 README 가 밝힘 |
| `starter_ai_agents/` | API 키만 있으면 도는 단일 파일 에이전트(여행 계획, 데이터 분석, 웹 스크래핑 등) |
| `advanced_ai_agents/` · `always_on_agents/` | 도구·메모리·다단계 추론을 쓰는 에이전트, 상시 실행 에이전트 |
| 멀티에이전트 팀 · `voice_ai_agents/` | 에이전트 팀 협업, 음성 에이전트 |
| `mcp_ai_agents/` | MCP 서버를 쓰는 에이전트 |
| `rag_tutorials/` | Agentic RAG, Corrective RAG, 로컬 모델 RAG, 출처 인용 RAG 등 |
| `ai_agent_framework_crash_course/` | 에이전트 프레임워크 입문 코스 |
| 메모리 앱 · Chat with X · LLM 튜닝 | 장기 기억 앱, 문서·사이트와 대화, 파인튜닝 예제 |

## 이렇게 활용하라
1. 만들려는 유형(RAG, 멀티에이전트, MCP)의 폴더를 찾아 `README.md` 와 `requirements.txt` 를 읽는다.
2. 새 가상환경에서 실행한다.

```bash
git clone https://github.com/Shubhamsaboo/awesome-llm-apps.git
cd awesome-llm-apps/starter_ai_agents/ai_travel_agent
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
streamlit run travel_agent.py
```

3. 구조(프롬프트, 도구 정의, 검색 파이프라인)만 참고해 자기 프로젝트에 맞게 다시 쓴다. 에이전트 설계 패턴 자체는 지식 노트가 더 체계적이다.

## 주의
- 앱마다 **서로 다른 프레임워크와 모델 API 키**(OpenAI, Gemini, xAI 등)를 쓰고 의존성이 폴더별로 달라 한 환경에 모두 설치할 수 없다. 폴더 단위로 가상환경을 만든다.
- 예제는 교육용이라 인증, 속도 제한, 오류 처리, 비용 한도가 빠져 있다. 그대로 운영에 올리지 않는다. 일부는 결제·지갑(x402)이나 의료 영상·재무 분석을 흉내 내므로 실제 판단에 쓰지 않는다.
- 항목 수가 많고 빠르게 늘어 일부 의존 라이브러리 버전이 낡을 수 있다. 푸시는 매일 있지만 폴더별 유지 수준은 다르다.
- README 의 일부 모델·서비스 이름은 이 사이트에서 확인하지 않았다. 필요한 모델은 각 공식 문서에서 다시 확인한다.

## 링크
- [저장소](https://github.com/Shubhamsaboo/awesome-llm-apps) · [Unwind AI 튜토리얼](https://www.theunwindai.com)
- 이 사이트: [Awesome Machine Learning](/develop-wiki/oss/awesome-lists/awesome-machine-learning/) · [Generative AI for Beginners](/develop-wiki/oss/learning-repos/generative-ai-for-beginners/)
