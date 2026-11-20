---
name: Awesome Python
url: https://awesome-python.com/
repo: https://github.com/vinta/awesome-python
stars: 336026
domain: oss
category: awesome-lists
description: Python 프레임워크·라이브러리·도구를 용도별로 고른 큐레이션 목록. 웹, 데이터, AI, CLI 등에서 쓸 Python 패키지 후보를 찾을 때 쓴다.
pricing: oss
tags: [awesome, python, libraries, packages]
languages: [python]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
vinta 가 관리하는 "opinionated" Python 패키지 목록이다. 카테고리마다 대표 라이브러리를 한 줄 설명과 함께 나열하며, 웹사이트(awesome-python.com)에서 검색·필터를 제공한다. 2026-11 기준 별 약 33.6만, 라이선스 CC BY 4.0. 커밋이 꾸준히 이어진다(마지막 2026-11-17).

## 무엇이 들어 있나
| 영역 | 대표 카테고리 |
| --- | --- |
| AI·데이터 | AI and Agents, Deep Learning, Machine Learning, NLP, Computer Vision, Data Analysis, Data Validation, Data Visualization |
| 웹 | Web Frameworks, Web APIs, Web Servers, WebSocket, Authentication, Admin Panels, HTTP Clients, Web Scraping |
| 데이터 저장 | ORM, Database Drivers, Database, Caching, Search, Serialization |
| 개발 도구 | Code Analysis, Testing, Debugging Tools, Build Tools, Documentation, Package Management, Environment Management |
| 운영·비동기 | DevOps Tools, Distributed Computing, Task Queues, Messaging, Job Schedulers, Logging, Asynchronous Programming |
| CLI·기타 | CLI Development, GUI Development, Image/Audio/Video Processing, Cryptography, Web Security |
| Resources | 뉴스레터, 팟캐스트 |

## 이렇게 활용하라
1. **카테고리에서 후보 2~3개를 고른다.** 예: Task Queues 에서 Celery 와 대안들을 본다.
2. **PyPI·GitHub 에서 상태를 확인한다.** 최근 릴리스, 지원 Python 버전, 타입 힌트 제공 여부를 본다.
3. **이 사이트의 항목과 대조한다.** [FastAPI](/develop-wiki/backend/web-framework/fastapi/), [Django](/develop-wiki/backend/web-framework/django/), [Celery](/develop-wiki/backend/messaging/celery/), [PyTorch](/develop-wiki/data-ml/ml/pytorch/) 처럼 이미 정리된 도구는 사용법까지 이어서 본다.
4. **가상 환경에서 바로 시험한다.**
   ```bash
   uv venv && uv pip install <패키지>   # 또는 python -m venv .venv && pip install <패키지>
   ```
5. **웹사이트 검색을 쓴다.** README 가 길어 키워드 검색이 빠르다.

## 주의
- 큐레이터의 선택이 반영된 목록이라 모든 대안이 있지는 않다.
- README 상단에 후원 영역이 있다. 본문 목록과 구분해서 본다.
- 한국어 번역은 없다.

## 링크
- [웹사이트](https://awesome-python.com/) · [저장소 README](https://github.com/vinta/awesome-python) · [기여 가이드](https://github.com/vinta/awesome-python/blob/master/CONTRIBUTING.md)
- 이 사이트: [Python 언어](/develop-wiki/languages/python/) · [Awesome Machine Learning](/develop-wiki/oss/awesome-lists/awesome-machine-learning/)
