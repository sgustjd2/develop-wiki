---
name: Scientific Agent Skills
url: https://github.com/K-Dense-AI/scientific-agent-skills
docs: https://github.com/K-Dense-AI/scientific-agent-skills/blob/main/docs/skills.md
repo: https://github.com/K-Dense-AI/scientific-agent-skills
stars: 58684
domain: oss
category: agent-skills
description: 생물정보·화학·의학·재료·금융 데이터 분석용 스킬 177개를 담은 K-Dense 의 Agent Skills 모음. 과학 라이브러리와 공공 DB 사용법을 코딩 에이전트에 붙일 때 쓴다.
pricing: oss
tags: [agent-skills, science, bioinformatics, cheminformatics, claude-code, codex]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Scientific Agent Skills(옛 이름 claude-scientific-skills)는 K-Dense AI 가 관리하는 **과학 연구용 스킬 라이브러리**다. Scanpy·Biopython·RDKit·PyDESeq2 같은 분석 패키지 사용법, PubChem·ChEMBL·UniProt·ClinicalTrials.gov·FRED 같은 데이터베이스 조회 절차를 스킬 단위로 정리했다. Agent Skills 표준을 따르고, 루트 `plugin.json` 을 둬 Agent Plugins 형식 패키지로도 읽힌다.
**2026-11 기준**: 별 약 5.8만, 마지막 푸시 2026-11-16, MIT. 2.72.0 에서 Anthropic 문서 스킬(docx·pdf·pptx·xlsx) 동봉을 중단해 스킬 수가 177개가 됐다.

## 무엇이 들어 있나
| 스킬 예 | 하는 일 |
| --- | --- |
| `database-lookup` | 80개 공공·등록제·유료 DB 의 엔드포인트 선택, 페이지네이션, 출처 기록 |
| `scanpy` · `pydeseq2` · `bulk-rnaseq` | 단일 세포·벌크 RNA-seq 분석 |
| `pathway-enrichment` | 경로 농축 분석 |
| `primer-design` · `flowkit` · `cellprofiler` | 실험 설계·유세포 분석·현미경 이미지 |
| `pybamm` · `cantera` · `pycalphad` | 배터리·연소·합금 상평형 시뮬레이션 |
| `scientific-slides` · `generate-image` | 발표 자료, 이미지 생성(OpenRouter API) |

전체 목록은 [docs/skills.md](https://github.com/K-Dense-AI/scientific-agent-skills/blob/main/docs/skills.md)와 그림 가이드에 있다.

## 설치·사용법
```bash
# Agent Skills 지원 에이전트에 일괄 설치
npx skills add K-Dense-AI/scientific-agent-skills

# GitHub CLI 2.90+ — 스킬 하나, 대상 에이전트 지정, 릴리스 태그 고정
gh skill install K-Dense-AI/scientific-agent-skills scanpy --agent claude-code
gh skill install K-Dense-AI/scientific-agent-skills --pin v2.71.0
```

필요한 분야만 골라 설치하는 편이 낫다. 설치 후 "이 h5ad 파일로 클러스터링하고 마커 유전자를 뽑아 줘"처럼 요청하면 관련 스킬이 불린다. 대부분의 스킬은 Python 패키지 설치를 전제로 하므로 `uv`·가상 환경을 먼저 준비한다.

## 언제 쓰나 / 주의
- 쓸 때: 연구·데이터 분석에서 에이전트가 과학 라이브러리 API 나 DB 쿼리 규칙을 틀리게 쓰는 문제를 줄이고 싶을 때.
- 주의: 일부 DB 는 등록·라이선스가 필요하다. 스킬이 안내하는 접근 조건을 지키고, 환자·임상 데이터처럼 민감한 데이터를 에이전트에 넘기기 전에 기관 규정을 확인한다.
- 주의: 저장소에 보안 스캔·스킬 테스트 CI 가 있지만, 스킬이 패키지를 설치하고 스크립트를 실행하므로 격리된 환경에서 먼저 돌려 본다. 분석 결과는 사람이 검증해야 한다.
- 관련: 스킬 형식은 [Agent Skills 명세](/develop-wiki/oss/agent-skills/agent-skills-spec/), 설치 도구는 [skills CLI](/develop-wiki/oss/agent-skills/skills-cli/).

## 링크
- [저장소](https://github.com/K-Dense-AI/scientific-agent-skills) · [전체 스킬 목록](https://github.com/K-Dense-AI/scientific-agent-skills/blob/main/docs/skills.md) · [릴리스](https://github.com/K-Dense-AI/scientific-agent-skills/releases)
