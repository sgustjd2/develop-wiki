---
name: add-model
description: 오픈 웨이트 모델 1건을 조사해 dev.hub 에 추가·갱신한다. Hugging Face 메타데이터, 모델 카드, 공식 발표를 근거로 분류·용도·라이선스를 채운다.
---

# 모델 추가

## 1. 중복·대상 확인
`grep -ril "<hf repo id 또는 모델명>" src/content/models research/excluded.md`
가중치가 공개되지 않은 모델은 제외.

## 2. 메타데이터 수집
```bash
curl -s https://huggingface.co/api/models/<org>/<repo> | python3 -I -c "import sys,json;d=json.load(sys.stdin);c=d.get('cardData') or {};print(c.get('license'), (d.get('safetensors') or {}).get('total'), d.get('createdAt'), d.get('pipeline_tag'), d.get('tags'))"
```
- `paramsB`: safetensors.total ÷ 1e9 (소수 1자리, 1B 미만은 3자리). 공식 발표 수치와 다르면(예: MTP 모듈 포함) 공식 수치를 쓰고 이유를 limitations 가 아닌 로그에 남긴다.
- MoE 면 `activeParamsB` 필수.
- `contextLength`: config.json 의 `max_position_embeddings` 가 아니라 **모델 카드가 공식 지원한다고 밝힌 길이**. 확장(YaRN 등) 전제면 기본값을 적고 확장은 strengths 에.
- `releaseDate`: 공식 발표일. 없으면 HF createdAt.

## 3. 분류
`.claude/skills/classify-model/SKILL.md` 결정 트리로 type·thinking·modalities·capabilities 를 정한다.

## 4. 라이선스 → commercialUse
- Apache-2.0, MIT, BSD → allowed
- 사용자 수·용도 조건이 있는 커스텀 라이선스(Llama, Gemma 등) → restricted
- CC-BY-NC, 연구용 전용 → not-allowed

## 5. 한국어(korean)
모델 카드가 한국어 지원을 명시하거나 한국어 벤치마크 결과가 공개돼 있으면 basic/good, 명시적 미지원이면 none, 근거가 없으면 unknown.

## 6. 파일 작성 — `src/content/models/<org-slug>/<repo-slug>.yaml`
스키마는 `src/content.config.ts` 의 models. 기존 파일(`src/content/models/qwen/qwen3-30b-a3b.yaml`)을 본보기로.
`sources` 에는 실제로 수치를 확인한 URL 만.

## 7. 검증
훅의 스키마 검사 통과 → 추가한 모델 목록을 `fact-checker` 에 넘긴다.
