---
name: classify-model
description: 오픈 웨이트 모델의 주 분류(type)와 thinking·modalities·capabilities 를 정하는 결정 트리. 모델 추가·분류 검토 때 사용.
---

# 모델 분류 결정 트리

모델 하나에 **type 은 하나**. 위에서부터 처음 맞는 규칙을 적용한다.

```
1. 출력이 이미지/영상/음악인가?                 → generation: image-gen | video-gen | audio-gen
2. 입력이 음성이고 출력이 텍스트(전사)인가?      → speech: asr
   출력이 음성(텍스트→음성)인가?                 → speech: tts
   (음성 입·출력을 대화로 다루는 범용 모델이면 7번 omni)
3. 출력이 벡터인가?                              → retrieval: embedding
4. (질의, 문서) 쌍을 점수화하는가?               → retrieval: reranker
5. 생성 목적이 아니라 판정이 목적인가? (decision)
   - 안전/정책 위반 판정                          → decision: guard
   - 응답 품질 점수, 쌍 비교, 프로세스 보상(PRM)  → decision: reward
   - 의도·주제 분류, 라우팅, NLI, 감성 분석       → decision: classifier
6. 화면을 보고 클릭·타이핑 액션을 내는가?        → multimodal: gui-agent
7. 음성 상호작용이 주 목적인 모델인가?          → multimodal: omni
   (오디오 입력 + 음성 출력, 또는 실시간 음성 대화를 내세움. 영상·오디오 입력만으로는 해당 안 됨)
8. 문서 파싱·OCR 이 주 목적인가?                 → multimodal: ocr-document
9. 시각 이해가 주 목적인가?                      → multimodal: vlm
   (-VL/-Vision 계열, 텍스트 전용 형제가 따로 있는 비전 변형, 시각 벤치마크 중심 소개)
10. 코드 전용으로 학습·튜닝됐는가?               → language: code-llm
11. 항상 사고하고(끌 수 없음) 추론 특화로 공개됐는가? → language: reasoning-llm
   (수학·과학·논리 추론이 주 목적이거나, 범용 Instruct 와 별도로 나온 Thinking/R 변형)
12. 그 외 텍스트 생성                            → language: text-llm
   (항상 사고하는 범용·에이전트 모델도 여기, thinking: native)
```

## 애매한 경우
- **네이티브 멀티모달 범용 모델**(한 체크포인트가 텍스트·이미지·영상·오디오를 처리하지만 범용/코딩 플래그십): type 은 text-llm/code-llm, 받는 입력은 modalities.input 에 모두 기록. "멀티모달 모델"이라는 공식 표현만으로 vlm/omni 로 보내지 않는다. 사이트의 "이미지 입력"/"음성 입력" 필터가 이를 드러낸다.
- **항상 사고하는 범용 모델**(effort 조절만 가능한 범용·에이전트 모델): text-llm + thinking: native. reasoning-llm 은 추론 특화 모델만.
- **같은 패밀리에서 일부 크기만 오디오 입력**: type 은 같게 두고 modalities 로 구분.
- **architecture**: MoE 가 있으면 moe 우선(SSM·선형 어텐션 혼합이어도). hybrid 는 MoE 없는 SSM/선형 어텐션 혼합 모델.
- **하이브리드 추론**(thinking 온/오프): type 은 text-llm/code-llm, `thinking: hybrid`.
- **LLM-as-judge 전용 파인튜닝 모델**: reward. 범용 LLM 을 저지로 쓰는 것은 해당 안 됨.
- **임베딩 + 리랭크 겸용**: 모델 카드의 주 사용법 기준.
- **같은 패밀리 다른 크기**: type 은 같아야 한다. 다르면 근거를 명시.

## thinking
- `native`: 항상 사고 토큰을 낸다
- `hybrid`: 플래그·프롬프트로 켜고 끈다
- `none`: 사고 모드 없음

## capabilities (해당할 때만)
`tool-calling`(공식 툴 호출 포맷), `long-context`(128K 토큰 이상 공식 지원), `multilingual`(다국어 공식 지원), `structured-output`(JSON 등 구조화 출력 학습), `fim`(코드 중간 채우기), `grounding`(이미지 좌표 출력)

## 새 type 이 필요해 보일 때
기존 type 에 억지로 넣지 말고 가장 가까운 type 으로 두되, `model-taxonomist` 보고서에 "새 type 후보"로 남긴다. 같은 성격의 모델이 3개 이상 쌓이면 taxonomy.ts 에 추가를 제안한다.
