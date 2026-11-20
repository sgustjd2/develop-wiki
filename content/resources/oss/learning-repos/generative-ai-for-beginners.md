---
name: Generative AI for Beginners
url: https://microsoft.github.io/generative-ai-for-beginners/
repo: https://github.com/microsoft/generative-ai-for-beginners
stars: 123914
domain: oss
category: learning-repos
description: Microsoft 의 생성형 AI 애플리케이션 입문 강의(21개 레슨). 프롬프트, 채팅·검색 앱, RAG, 함수 호출, 에이전트, 파인튜닝을 Python·TypeScript 예제로 익힐 때 쓴다.
pricing: oss
tags: [generative-ai, llm, rag, prompt-engineering, course, agents]
languages: [python, typescript]
koreanDocs: true
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Microsoft Cloud Advocates 가 만든 무료 강의로, LLM 을 **활용하는 애플리케이션 개발**에 초점을 둔다. 레슨마다 짧은 영상, README 본문, Python·TypeScript 예제 코드, 추가 자료 링크가 있다. 2026-11 기준 별 약 12.4만, 라이선스 MIT, README 표기상 Version 3. 커밋이 매우 활발하다(마지막 2026-11-17).

Co-op Translator 로 50개 이상 언어 번역을 유지하며 **한국어(translations/ko)도 2026-09 에 갱신**됐다. 자동 번역 기반이라 표현이 어색한 곳이 있다.

## 무엇이 들어 있나
| 레슨 | 주제 |
| --- | --- |
| 00 | 강의 환경 설정 |
| 01~03 | 생성형 AI·LLM 소개, LLM 비교, 책임 있는 AI |
| 04~05 | 프롬프트 엔지니어링 기초·고급 |
| 06~09 | 텍스트 생성 앱, 채팅 앱, 검색 앱과 벡터 DB, 이미지 생성 앱 |
| 10~11 | 로우코드 AI 앱, 함수 호출로 외부 앱 연동 |
| 12~14 | AI 앱 UX 설계, 보안, 생성형 AI 앱 수명 주기 |
| 15 | RAG 와 벡터 데이터베이스 |
| 16 | 오픈소스 모델과 Hugging Face |
| 17 | AI 에이전트 |
| 18~19 | LLM 파인튜닝, SLM(소형 모델) |
| 20~21 | Mistral 모델, Meta 모델 활용 |

## 이렇게 활용하라
1. **저장소를 포크하고 00 Course Setup 을 따른다.** Codespaces 나 로컬 환경 중 하나를 고른다.
2. **모델 제공처를 정한다.** 레슨 코드는 Azure OpenAI(`aoai-assignment`), OpenAI API(`oai-assignment`), Microsoft Foundry Models, 오프라인 실행용 Foundry Local 을 지원한다. README 에 따르면 GitHub Models 는 2026-07 말 종료돼 Foundry Models 로 대체됐다.
3. **번역 폴더 없이 받으려면 sparse checkout 을 쓴다.** 번역이 50개 이상이라 저장소가 크다(README 의 안내 명령 참고).
4. **01~07 로 기본기를 잡고 15(RAG)·17(에이전트)로 넘어간다.** 실무 도구는 이 사이트의 [LangChain](/develop-wiki/ai/agent-framework/langchain/), [AI 에이전트 프레임워크](/develop-wiki/ai/agent-framework/), [RAG 파이프라인](/develop-wiki/knowledge/ai-patterns/rag-pipeline/) 노트로 이어 간다.
5. **한국어로 먼저 훑고 코드는 영어판 기준으로 실행한다.** 번역 반영 시점이 영어판보다 늦을 수 있다.

## 주의
- Azure 서비스 위주 예제가 많다. 다른 제공처를 쓰려면 엔드포인트·SDK 설정을 바꿔야 한다.
- 일부 레슨은 특정 모델·서비스 이름에 묶여 있어 서비스 개편 때 내용이 낡을 수 있다.

## 링크
- [강의 사이트](https://microsoft.github.io/generative-ai-for-beginners/) · [저장소 README](https://github.com/microsoft/generative-ai-for-beginners) · [한국어 번역](https://github.com/microsoft/generative-ai-for-beginners/blob/main/translations/ko/README.md)
- 이 사이트: [LLMs-from-scratch](/develop-wiki/oss/learning-repos/llms-from-scratch/)(모델 내부 구현) · [OpenAI Cookbook](/develop-wiki/ai/learning/openai-cookbook/) · [Claude Cookbooks](/develop-wiki/ai/learning/claude-cookbooks/)
