---
name: Promptfoo
url: https://www.promptfoo.dev
docs: https://www.promptfoo.dev/docs/intro/
repo: https://github.com/promptfoo/promptfoo
stars: 27496
domain: ai
category: evaluation
description: YAML 설정으로 프롬프트·모델 조합을 테스트 케이스와 단언으로 평가하고 레드팀 취약점 점검까지 하는 CLI. CI 회귀 테스트에 쓴다.
pricing: oss
tags: [evals, red-teaming, cli, ci, prompt-testing]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Promptfoo 는 LLM 앱을 위한 테스트 러너다. `promptfooconfig.yaml` 에 프롬프트, 비교할 모델(provider), 테스트 케이스와 단언(assert)을 적고 `promptfoo eval` 을 돌리면 프롬프트×모델×케이스 행렬 결과를 터미널과 웹 뷰어로 보여 준다. 같은 도구로 탈옥·프롬프트 인젝션 같은 공격 입력을 자동 생성해 점검하는 레드팀 기능도 제공한다.
2026년 3월 OpenAI 가 인수를 발표했고, 저장소 README 는 "OpenAI 의 일부가 됐으며 MIT 라이선스 오픈소스로 유지된다"고 밝히고 있다. 평가는 로컬에서 실행되며 OpenAI 외 Anthropic·Bedrock·Ollama 등 다른 provider 도 그대로 지원한다. v0.125 기준.
코드로 테스트를 쓰고 싶으면 pytest 스타일의 [DeepEval](/develop-wiki/ai/evaluation/deepeval/), 운영 트레이스 기반 평가는 [Langfuse](/develop-wiki/ai/evaluation/langfuse/) 쪽이 맞다.

## 설치
```bash
npm install -g promptfoo        # Node.js 22.22 이상
brew install promptfoo          # 또는
npx promptfoo@latest --help     # 설치 없이 실행

promptfoo init --example getting-started   # 예제 프로젝트 생성
```

provider 키는 환경 변수로 준다(`OPENAI_API_KEY`, `ANTHROPIC_API_KEY` 등).

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `prompts` | 평가할 프롬프트 목록. `{{변수}}` 템플릿, `file://` 로 파일 참조 |
| `providers` | 비교할 모델. `openai:<모델>`, `anthropic:messages:<모델>`, `ollama:chat:<모델>`, HTTP·스크립트 provider |
| `tests` | 변수(`vars`)와 단언(`assert`) 묶음. CSV·YAML 파일에서 불러올 수 있음 |
| `assert` | 결정적 검사(`contains`, `regex`, `is-json`, `javascript`, `python`, `latency`, `cost`)와 모델 채점(`llm-rubric`, `similar`, `factuality`, `g-eval`) |
| `not-` 접두사 | 단언 반전. `not-contains`, `not-regex` |
| `defaultTest` | 모든 테스트에 공통으로 적용할 변수·단언 |
| `threshold` / `weight` | 여러 단언 점수의 가중 합격 기준 |
| redteam | 공격 입력을 생성(`redteam.yaml`)해 대상 앱을 점검하고 취약점 리포트 생성 |

## 기본 사용법
`promptfooconfig.yaml`:

```yaml
prompts:
  - '다음 문장을 한 줄로 요약해: {{text}}'
providers:
  - openai:gpt-5-mini
  - anthropic:messages:claude-sonnet-5
tests:
  - vars:
      text: 'Promptfoo 는 프롬프트를 테스트 케이스로 검증하는 CLI 다.'
    assert:
      - type: icontains
        value: 'promptfoo'
      - type: javascript
        value: output.length < 120
      - type: llm-rubric
        value: 원문에 없는 내용을 지어내지 않는다
```

```bash
promptfoo eval          # 실행 (결과는 로컬에 저장)
promptfoo view          # 웹 뷰어로 비교
```

모델 이름은 예시다. 계정에서 쓸 수 있는 모델로 바꾼다.

## 자주 쓰는 패턴
- **CSV 로 케이스 관리**: 입력 열과 `__expected`(예: `contains:서울`, `fn:output.length < 50`) 열을 둔 CSV 를 `tests: file://cases.csv` 로 불러온다.
- **공통 단언**: `defaultTest.assert` 에 "JSON 이어야 한다(`is-json`)" 같은 규칙을 한 번만 적는다.
- **PR 마다 비교**: GitHub Action `promptfoo/promptfoo-action@v1` 이 변경된 프롬프트의 전후 결과를 PR 에 남긴다. 그 밖의 CI 에서는 `promptfoo eval -o results.json` 으로 결과 파일을 남긴다.
- **레드팀**: `promptfoo redteam init --no-gui`(또는 `redteam setup` 웹 UI) → `promptfoo redteam run` → `promptfoo redteam report`. 설정의 `purpose` 에 앱 용도를 적으면 공격 입력 품질이 올라간다.
- **자체 앱을 대상으로**: HTTP provider 나 Python/JS 스크립트 provider 로 RAG·에이전트 엔드포인트 전체를 테스트한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 프롬프트·모델을 바꿀 때 회귀를 막는 테스트가 필요할 때, 여러 모델을 같은 케이스로 나란히 비교할 때, 배포 전 프롬프트 인젝션·탈옥 점검이 필요할 때.
- 피할 때(대안): 운영 트래픽의 트레이싱·모니터링이 목적이면 [Langfuse](/develop-wiki/ai/evaluation/langfuse/)·[LangSmith](/develop-wiki/ai/evaluation/langsmith/). Python 테스트 코드 안에서 RAG 지표를 계산하려면 [DeepEval](/develop-wiki/ai/evaluation/deepeval/)·[Ragas](/develop-wiki/ai/evaluation/ragas/). 레드팀 생성 단계 일부는 호스팅 서비스를 쓸 수 있으므로 외부 전송이 불가한 환경은 문서의 데이터 처리 항목을 먼저 확인한다.

## 공식 문서
- [소개](https://www.promptfoo.dev/docs/intro/) · [시작하기](https://www.promptfoo.dev/docs/getting-started/) · [단언·지표](https://www.promptfoo.dev/docs/configuration/expected-outputs/)
- [Provider 목록](https://www.promptfoo.dev/docs/providers/) · [레드팀 Quickstart](https://www.promptfoo.dev/docs/red-team/quickstart/) · [GitHub Action](https://www.promptfoo.dev/docs/integrations/github-action/)
- [OpenAI 합류 공지](https://www.promptfoo.dev/blog/promptfoo-joining-openai/)
