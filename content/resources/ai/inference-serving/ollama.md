---
name: Ollama
url: https://ollama.com
repo: https://github.com/ollama/ollama
stars: 187907
domain: ai
category: inference-serving
description: 오픈 웨이트 모델을 로컬에서 명령 한 줄로 내려받아 실행하는 도구.
pricing: oss
tags: [local, gguf]
docs: https://docs.ollama.com/
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Ollama 는 오픈 웨이트 모델을 내 컴퓨터에서 내려받아 실행하는 런타임이다. 모델 이름 하나로 다운로드·양자화된 가중치·채팅 템플릿을 한꺼번에 받아 오고, 백그라운드 서버(기본 `localhost:11434`)가 네이티브 API 와 OpenAI·Anthropic 호환 API 를 함께 연다.
GPU 가 없어도 CPU·Apple Silicon 에서 돌아가므로 로컬 실험, 오프라인 개발, 코딩 에이전트의 로컬 백엔드로 많이 쓴다.
여러 사용자의 동시 요청을 높은 처리량으로 받아야 하는 GPU 서버라면 [vLLM](/develop-wiki/ai/inference-serving/vllm/) 쪽이 맞다.

## 설치
```bash
# Linux
curl -fsSL https://ollama.com/install.sh | sh

# 특정 버전 고정
curl -fsSL https://ollama.com/install.sh | OLLAMA_VERSION=0.5.7 sh
```

- macOS·Windows: [ollama.com/download](https://ollama.com/download) 에서 앱(Windows 는 `OllamaSetup.exe`)을 받아 설치한다. Windows 는 관리자 권한 없이 사용자 폴더에 설치된다. macOS 는 `ollama.dmg` 를 열어 앱을 Applications 폴더로 옮기며, `ollama` CLI 링크(`/usr/local/bin`)를 만들 때 권한을 물을 수 있다.
- Docker 이미지와 GPU 설정은 공식 문서의 Docker·Hardware 페이지를 따른다.
- Python 클라이언트: `pip install -U ollama`, JavaScript: `ollama-js`.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 모델 태그 | `gemma4`, `gemma4:e2b` 처럼 `이름:태그` 로 크기·양자화 변형을 고른다 |
| 서버 | `ollama serve` 가 띄우는 HTTP 서버. 데스크톱 앱은 자동 실행 |
| 네이티브 API | `/api/chat`, `/api/generate`, `/api/embed` 등 |
| 호환 API | `/v1/chat/completions`, `/v1/responses`(OpenAI), `/v1/messages`(Anthropic) |
| Modelfile | `FROM`, `PARAMETER`, `SYSTEM`, `TEMPLATE` 로 기존 모델을 커스터마이즈하는 파일 |
| keep-alive | 마지막 요청 뒤 모델을 메모리에 남겨 두는 시간 (기본 5분) |
| 클라우드 모델 | 로컬 GPU 없이 ollama.com 에서 큰 모델을 실행 (`ollama signin` 필요) |

## 기본 사용법
CLI 로 모델 받고 실행하기:

```bash
ollama pull gemma4        # 다운로드
ollama run gemma4         # 대화형 실행 (/bye 로 종료)
ollama ls                 # 설치된 모델 목록
ollama ps                 # 메모리에 올라간 모델
ollama stop gemma4        # 언로드
ollama rm gemma4          # 삭제
```

OpenAI SDK 로 호출하기 — 로컬 서버는 키를 검사하지 않지만 SDK 가 값을 요구하므로 아무 문자열을 넣는다.

```python
from openai import OpenAI

client = OpenAI(base_url="http://localhost:11434/v1/", api_key="ollama")
resp = client.chat.completions.create(
    model="gemma4",
    messages=[{"role": "user", "content": "Ollama 를 한 문장으로 소개해 줘"}],
)
print(resp.choices[0].message.content)
```

네이티브 API 를 curl 로:

```bash
curl http://localhost:11434/api/chat -d '{
  "model": "gemma4",
  "messages": [{"role": "user", "content": "안녕"}],
  "stream": false
}'
```

## 자주 쓰는 패턴
- **Modelfile 로 사내용 프리셋 만들기**

  ```
  FROM gemma4
  PARAMETER temperature 0.2
  PARAMETER num_ctx 8192
  SYSTEM 너는 사내 코드 리뷰 도우미다. 한국어로 답한다.
  ```
  `ollama create reviewer -f Modelfile` 후 `ollama run reviewer`.
- **컨텍스트 늘리기**: 기본 컨텍스트가 짧으므로 긴 문서·에이전트 용도에는 `OLLAMA_CONTEXT_LENGTH=8192 ollama serve` 처럼 서버 기본값을 올리거나 요청마다 `num_ctx` 를 준다.
- **원격 접속 허용**: `OLLAMA_HOST=0.0.0.0:11434` 로 바인드 주소를 바꾼다. 인증이 없으므로 신뢰할 수 있는 네트워크·프록시 뒤에서만.
- **동시성·메모리**: `OLLAMA_NUM_PARALLEL`(모델당 동시 요청, 기본 1), `OLLAMA_MAX_LOADED_MODELS`, `OLLAMA_KEEP_ALIVE`(`-1` 이면 계속 상주)로 조절한다.
- **도구 호출**: Python 라이브러리의 `chat(model=..., messages=..., tools=[함수])` 에 파이썬 함수를 그대로 넘길 수 있다. OpenAI 호환 API 에서는 `tool_choice` 가 지원되지 않는다.
- **코딩 에이전트 백엔드**: `ollama launch claude`, `ollama launch codex` 등으로 [Claude Code](/develop-wiki/ai/coding-agent/claude-code/) 같은 도구를 로컬 모델에 연결한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 노트북에서 [Gemma 4 E4B](/develop-wiki/models/google/gemma-4-e4b-it/) 같은 소형 모델을 바로 써 볼 때, 인터넷 없이 개발할 때, 에이전트·RAG 프로토타입의 로컬 모델 백엔드.
- 피할 때(대안): 다수 동시 사용자를 받는 운영 서빙, 텐서 병렬이 필요한 대형 모델 → [vLLM](/develop-wiki/ai/inference-serving/vllm/). 서버 자체에 인증 기능이 없다는 점도 고려한다.

## 공식 문서
- [Quickstart](https://docs.ollama.com/quickstart) · [CLI 레퍼런스](https://docs.ollama.com/cli) · [Modelfile](https://docs.ollama.com/modelfile)
- [OpenAI 호환 API](https://docs.ollama.com/api/openai-compatibility) · [도구 호출](https://docs.ollama.com/capabilities/tool-calling) · [FAQ(환경 변수)](https://docs.ollama.com/faq) · [Linux 설치](https://docs.ollama.com/linux)
