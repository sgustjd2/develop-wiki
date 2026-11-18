---
name: add-model
description: 오픈 웨이트 모델 1건을 조사해 dev.hub 에 추가·갱신한다. Hugging Face 메타데이터, 모델 카드, 공식 발표를 근거로 분류·용도·라이선스를 채운다.
---

# 모델 추가

## 1. 중복·대상 확인
`grep -ril "<hf repo id 또는 모델명>" content/models research/excluded.md`
가중치가 공개되지 않은 모델은 제외.

## 2. 메타데이터 수집
```bash
curl -s https://huggingface.co/api/models/<org>/<repo> | python3 -I -c "import sys,json;d=json.load(sys.stdin);c=d.get('cardData') or {};print(c.get('license'), (d.get('safetensors') or {}).get('total'), d.get('createdAt'), d.get('pipeline_tag'), d.get('tags'))"
```
- `paramsB`: safetensors.total ÷ 1e9 (소수 1자리, 1B 미만은 3자리). 공식 발표 수치와 다르면(예: MTP 모듈 포함) 공식 수치를 쓰고 이유를 limitations 가 아닌 로그에 남긴다.
- MoE 면 `activeParamsB` 필수. 카드·보고서 수치를 우선하고, 모델명(A3B 등)에서만 알 수 있으면 그 값을 쓰되 limitations 에 "모델명 기준"이라고 적는다.
- `contextLength`: config.json 의 `max_position_embeddings` 가 아니라 **모델 카드가 공식 지원한다고 밝힌 길이**. 확장(YaRN 등) 전제면 기본값을 적고 확장은 strengths 에.
- `releaseDate`: 공식 발표일(블로그·모델 카드·GitHub 공지). HF `createdAt` 은 비공개 저장소 생성일인 경우가 많아 쓰지 않는다. 공식 날짜가 없으면 `huggingface.co/api/models/<repo>/commits/main` 에서 공개 직전 커밋 날짜를 쓴다.

## 3. 분류
`.claude/skills/classify-model/SKILL.md` 결정 트리로 type·thinking·modalities·capabilities 를 정한다.

## 4. 라이선스 → commercialUse
- Apache-2.0, MIT, BSD → allowed
- 허용형 커스텀 라이선스(고지 유지·소송 시 종료·수출 규정 준수만 요구) → allowed
- 사용자 수·매출 기준, 사전 승인·심사, 사용 정책 위반 시 종료 조항이 있는 커스텀 라이선스 → restricted
- CC-BY-NC, 연구용 전용 → not-allowed

## 5. 한국어(korean)
- `good`: 한국어 벤치마크 수치(KMMLU, KoBEST, MTEB-ko 등)가 카드·논문에 공개돼 있다.
- `basic`: 카드 본문이 한국어 지원을 명시하거나, HF 언어 메타데이터(`language`)에 `ko` 가 있다. 근거가 메타데이터뿐이면 limitations 에 "한국어 성능 수치 없음"을 적는다.
- `none`: 카드가 지원 언어를 나열했는데 한국어가 없거나, 비영어에 다른 모델을 쓰라고 안내한다.
- `unknown`: 위 근거를 찾지 못했다.
## 6. 파일 작성 — `content/models/<org-slug>/<repo-slug>.md`
스키마는 `src/content.config.ts` 의 models. 기존 파일(`content/models/qwen/qwen3-30b-a3b.md`)을 본보기로.
`sources` 에는 실제로 수치를 확인한 URL 만.

## 7. 검증
훅의 스키마 검사 통과 → 추가한 모델 목록을 `fact-checker` 에 넘긴다.
