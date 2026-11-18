# 전 영역 대규모 조사 — 2026-11-18

에이전트 16개 병렬 실행(Opus). 분류 체계 확장: mobile, data-ml, cloud, devtools 도메인, knowledge 에 algorithms·cs-fundamentals, ai-patterns 에 safety 그룹.

## 추가 (합계 약 400개 파일)
- frontend: meta-framework 5, ui-kit 8, build-tooling 9, styling 6, state-data 7, testing 6, animation 5, performance-a11y 5, learning 4
- backend: runtime-language 7, orm-query 7, api 6, auth 6, messaging 7, infra-devops 8, observability 5, learning 5
- ai: inference-serving 5, model-platform 6, rag-retrieval 4, vector-db 6, mcp-tooling 5, fine-tuning 6, evaluation 6, coding-agent 5, learning 5
- mobile 27, data-ml 31, cloud 18, devtools 29
- models: 판단형·검색 26, VLM·추론·코드·한국어·음성·생성 32
- knowledge: data-modeling 7, testing-practice 6, security 8, performance 7, engineering-practice 7, ai-patterns 9, design-patterns +7, architecture +1, algorithms 24, cs-fundamentals 24

## 하네스 변경
- lint: 판단형 모델 thinking 제한 해제, OpenMDW·CC-BY-4.0 허용형 인정, devtools·mobile 은 앱 키워드 규칙 제외
- pricing: (이전) source-available 추가

## 검증
- 각 에이전트가 공식 문서·gh api·레지스트리로 확인, 일부 코드 실행(알고리즘 전부 tsc --strict 실행, DB·데이터 일부)
- 위험도 높은 주장(인수·가격·라이선스·지원 종료)은 별도 fact-checker 2개로 재검증 → 반영 내역은 아래
- 대부분의 코드 예제는 실행하지 않음 (GPU·API 키·툴체인 부재) — 다음 /refresh-hub 에서 영역별 순차 검증 권장

## 위험 주장 재검증 결과 (fact-checker 2개)
- 확인됨: Promptfoo(OpenAI)·Langfuse(ClickHouse)·Better Auth(Vercel)·Bun(Anthropic) 인수, Gemini CLI→Antigravity CLI, Cursor·Copilot 가격, Terraform BSL, Sentry FSL, HunyuanVideo 한국 제외, EXAONE 4.5 NC, ingress-nginx 은퇴, Promtail·Jaeger v1 EOL, Node.js 일정 변경, llama.cpp v1, NATS, Hibernate Apache-2.0, Prisma 7/8, pnpm 12, OWASP Top 10 2025, CMP iOS stable
- 수정: GSAP(ScrollTrigger 는 원래 무료), Jotai 도메인 서술, dbt 라이선스 링크, Anthropic API "최상위" 표현, Chroma 정체 기간 수치, Knight Capital 서술(SEC 명령서 기준으로 보강), PocketBase update 명령(확인 불가 부분 삭제), Firebase Extensions 종료일
