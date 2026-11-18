---
name: Amazon Bedrock
url: https://aws.amazon.com/bedrock/
docs: https://docs.aws.amazon.com/bedrock/latest/userguide/
domain: ai
category: model-platform
description: 여러 회사의 기반 모델을 AWS 계정·IAM 안에서 호출하는 관리형 서비스. Converse API 와 OpenAI 호환 엔드포인트를 제공한다.
pricing: paid
tags: [llm-api, aws, managed, guardrails]
languages: [python, typescript, java, go, csharp, kotlin, rust, php, ruby, cpp, swift]
koreanDocs: true
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Amazon Bedrock 은 Anthropic Claude, OpenAI, Meta, Mistral, Amazon Nova 등 여러 회사의 모델을 AWS 서비스로 호출하게 해 준다. 인증·권한은 IAM, 로깅은 CloudWatch, 네트워크는 VPC 엔드포인트처럼 기존 AWS 운영 체계를 그대로 쓴다는 점이 공급자 API 를 직접 쓰는 것과의 차이다.
호출 방식은 세 갈래다. ① 모델 공통 형식인 **Converse API**(`bedrock-runtime`), ② 모델 고유 페이로드를 그대로 보내는 InvokeModel, ③ OpenAI SDK 로 부르는 **OpenAI 호환 엔드포인트**(Responses·Chat Completions; `bedrock-runtime` 의 `/openai/v1` 권장, 일부 기능은 `bedrock-mantle`).
Guardrails(입출력 필터), Knowledge Bases(관리형 RAG), Agents, 모델 커스터마이징 같은 부가 기능이 붙어 있다.

## 설치
AWS SDK 가 언어별로 있다(Python `boto3` 1.44.5, 2026-11 기준). 자격 증명은 일반 AWS 방식(IAM 역할, `AWS_PROFILE`, SSO) 또는 Bedrock API 키.

```bash
pip install boto3
aws configure sso          # 또는 IAM 역할·환경 변수
```

OpenAI SDK 경로를 쓸 때는 Bedrock API 키를 발급해 다음처럼 설정한다.

```bash
export OPENAI_BASE_URL="https://bedrock-runtime.us-east-1.amazonaws.com/openai/v1"
export OPENAI_API_KEY="<Bedrock API key>"   # OpenAI 키가 아니다
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 모델 ID | `공급자.모델` 형식(예 `openai.gpt-oss-120b`). 정확한 값은 콘솔 모델 카드에서 확인 |
| 추론 프로필 | `us.`, `global.` 같은 접두사가 붙은 교차 리전 프로필(예 `global.openai.gpt-5.6-sol`). 일부 모델은 프로필로만 호출된다 |
| Converse / ConverseStream | 모델에 상관없이 같은 `messages` 형식. 도구 호출·가드레일도 같은 형식 |
| InvokeModel | 모델 공급자 고유 JSON 을 그대로 보내는 저수준 API |
| OpenAI 호환 | Responses·Chat Completions. `bedrock-runtime` 은 항상 동기, `bedrock-mantle` 은 백그라운드 추론·서버 측 도구 지원 |
| IAM 권한 | `bedrock:InvokeModel`, `bedrock:InvokeModelWithResponseStream` 등 |
| Guardrails | 유해 콘텐츠·개인정보 필터를 API 호출에 붙인다 |

## 기본 사용법
1) Converse API (boto3)

```python
import os
import boto3

client = boto3.client("bedrock-runtime", region_name="us-east-1")
resp = client.converse(
    modelId=os.environ["BEDROCK_MODEL_ID"],   # 모델 카드의 ID 또는 추론 프로필 ID
    messages=[{"role": "user", "content": [{"text": "Bedrock 을 한 문장으로"}]}],
    inferenceConfig={"maxTokens": 512},
)
print(resp["output"]["message"]["content"][0]["text"])
```

2) OpenAI SDK 로 Responses API 호출 (위 환경 변수 설정 후)

```python
from openai import OpenAI

client = OpenAI()   # OPENAI_BASE_URL·OPENAI_API_KEY 를 Bedrock 값으로
resp = client.responses.create(
    model="global.openai.gpt-5.6-sol",
    input="IAM 과 API 키 인증의 차이는?",
)
print(resp.output_text)
```

Claude 를 Bedrock 에서 쓸 때는 Anthropic SDK 의 Bedrock 전용 클라이언트를 쓰는 방법도 있다([Claude API](/develop-wiki/ai/model-platform/anthropic-api/) 참고).

## 자주 쓰는 패턴
- **모델 교체 비용 줄이기**: Converse API 로 작성하면 `modelId` 만 바꿔 다른 회사 모델로 갈아탈 수 있다.
- **데이터 상주 요건**: 교차 리전 `global.` 프로필은 다른 리전에서 처리될 수 있으므로, 거주 요건이 있으면 지역(`us.` 등) 프로필이나 리전 내 호출을 쓴다.
- **응답 저장 끄기**: OpenAI 호환 Responses API 는 기본적으로 응답을 30일 저장한다. 원치 않으면 요청마다 `store=False`.
- **관리형 RAG**: Knowledge Bases 로 S3 문서를 벡터 저장소에 색인하고 검색까지 맡긴다. 직접 구성하려면 [LlamaIndex](/develop-wiki/ai/rag-retrieval/llamaindex/)·[Haystack](/develop-wiki/ai/rag-retrieval/haystack/) 의 Bedrock 연동을 쓴다.
- **오픈 웨이트 모델**: [gpt-oss-120b](/develop-wiki/models/openai/gpt-oss-120b/) 같은 공개 모델도 관리형으로 호출할 수 있다.

## 요금 구조
- 기본은 온디맨드 토큰 과금이며 모델·리전별로 단가가 다르다. Claude 등 파트너 모델은 공급자 직판과 별도의 Bedrock 가격표를 따른다.
- 대량 비동기 작업용 배치 추론, 처리량을 예약하는 프로비저닝 처리량, 캐싱 등 다른 과금 방식이 있다.
- 무료 등급은 상시 제공되지 않는다. 금액은 [Bedrock 가격 페이지](https://aws.amazon.com/bedrock/pricing/)에서 확인한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 회사 표준이 AWS 이고 IAM·VPC·감사 로그 안에서 LLM 을 써야 할 때, 여러 회사 모델을 한 계약·청구서로 쓰고 싶을 때.
- 피할 때(대안): 최신 기능(신규 베타 파라미터 등)을 가장 빨리 쓰려면 공급자 API 를 직접 쓴다. AWS 종속 없이 여러 모델을 쓰려면 [OpenRouter](/develop-wiki/ai/model-platform/openrouter/).

## 공식 문서
- [사용자 가이드](https://docs.aws.amazon.com/bedrock/latest/userguide/) · [Converse API](https://docs.aws.amazon.com/bedrock/latest/userguide/conversation-inference.html) · [OpenAI 호환 Responses API](https://docs.aws.amazon.com/bedrock/latest/userguide/bedrock-mantle.html)
- [가격](https://aws.amazon.com/bedrock/pricing/) · [boto3 bedrock-runtime](https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/bedrock-runtime.html)
