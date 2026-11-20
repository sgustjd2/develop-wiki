---
name: uv
url: https://docs.astral.sh/uv/
docs: https://docs.astral.sh/uv/
repo: https://github.com/astral-sh/uv
stars: 92456
domain: backend
category: runtime-language
description: Rust 로 만든 Python 패키지·프로젝트 관리자. pip, venv, pip-tools, pyenv, pipx 역할을 하나로 합쳐 Python 버전 설치부터 의존성 잠금까지 처리한다.
pricing: oss
tags: [python, package-manager, virtualenv, lockfile]
languages: [python]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
uv 는 Astral(Ruff 개발사)이 만든 Python 도구로, Python 인터프리터 설치, 가상환경 생성, 의존성 해석·잠금, CLI 도구 실행을 하나의 바이너리로 처리한다. Rust 구현과 전역 캐시 덕분에 pip 대비 설치가 빠르고, `pyproject.toml` + `uv.lock` 기반의 재현 가능한 프로젝트 관리를 제공한다. [Python](/develop-wiki/languages/python/) 백엔드([FastAPI](/develop-wiki/backend/web-framework/fastapi/), [Django](/develop-wiki/backend/web-framework/django/))의 공식 문서들도 uv 설치 명령을 함께 안내한다.

라이선스는 Apache-2.0/MIT 이중 라이선스. 2026-11 기준 최신은 **0.13.9**(아직 0.x 라 마이너 버전에서 동작 변경이 있을 수 있다).

## 설치
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh                                   # macOS·Linux
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"  # Windows
uv self update
```
`brew install uv`, `pipx install uv` 도 가능하다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 프로젝트 | `pyproject.toml` 이 있는 디렉터리. `uv init` 으로 생성 |
| `uv.lock` | 플랫폼 독립 잠금 파일. 커밋해서 팀·CI 가 같은 버전을 쓴다 |
| `.venv` | `uv sync`·`uv run` 이 자동으로 만들고 맞춰 주는 가상환경 |
| Python 관리 | `uv python install 3.13`, `.python-version` 파일로 버전 고정 |
| 도구 실행 | `uvx ruff check` (= `uv tool run`) 로 격리된 환경에서 CLI 실행 |
| pip 인터페이스 | `uv pip install`, `uv pip compile` 로 기존 requirements 흐름 유지 |

## 기본 사용법
```bash
uv init todo-api && cd todo-api
uv add "fastapi[standard]" sqlalchemy     # pyproject.toml + uv.lock 갱신
uv add --dev pytest
uv run fastapi dev main.py                # .venv 동기화 후 실행
uv run pytest
```
```python
# script.py — 인라인 메타데이터(PEP 723)로 의존성을 선언한 단일 스크립트
# /// script
# requires-python = ">=3.12"
# dependencies = ["httpx"]
# ///
import httpx

print(httpx.get("https://httpbin.org/get").status_code)
```
```bash
uv run script.py      # 임시 환경을 만들어 httpx 를 설치하고 실행
```

## 자주 쓰는 패턴
- **CI 재현성**: `uv sync --locked` 로 잠금 파일과 `pyproject.toml` 이 어긋나면 실패하게 한다.
- **Docker**: 공식 이미지 `ghcr.io/astral-sh/uv` 에서 `uv` 바이너리를 복사하고, 의존성 설치(`uv sync --no-install-project`)와 소스 복사 단계를 나눠 레이어 캐시를 살린다.
- **워크스페이스**: 모노레포에서 `[tool.uv.workspace]` 로 여러 패키지를 하나의 잠금 파일로 관리한다.
- **requirements 호환**: 기존 프로젝트는 `uv pip compile requirements.in -o requirements.txt` 로 pip-tools 를 대체하면서 점진 이전한다.
- **배포용 내보내기**: `uv export --format requirements-txt` 로 다른 도구용 목록을 만든다.

## 언제 쓰나 / 피할 때
- 쓸 때: 새 Python 프로젝트의 기본 도구, 느린 pip 설치·가상환경 관리가 번거로울 때, 여러 Python 버전을 오가는 개발.
- 피할 때(대안): 비 Python 네이티브 의존성(CUDA, GDAL 등)을 바이너리째 관리해야 하면 conda/pixi, 기존 Poetry 기반 배포 파이프라인을 당장 바꾸기 어려울 때.

## 공식 문서
- [문서](https://docs.astral.sh/uv/) · [프로젝트 가이드](https://docs.astral.sh/uv/guides/projects/) · [스크립트 실행](https://docs.astral.sh/uv/guides/scripts/) · [Docker 통합](https://docs.astral.sh/uv/guides/integration/docker/)
