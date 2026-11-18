---
name: write-knowledge
description: 디자인 패턴, 아키텍처, 설계 원칙, 분산 시스템, DB 설계, 테스트, 보안, 성능, 협업 관행, AI 엔지니어링 패턴 같은 개발 지식 노트 1건을 dev.hub 에 작성한다.
---

# 지식 노트 작성

## 1. 위치·분류
- `content/knowledge/<category>/<kebab-id>.md`, category 는 `KNOWLEDGE` 키.
- group 이 정의된 category(디자인 패턴: creational/structural/behavioral 등)는 group 필수로 취급.
- 중복 확인: `grep -ril "<개념명|영문명>" content/knowledge`

## 2. frontmatter
```yaml
---
title: 한국어 표준 명칭
aka: [English Name, 별칭]
category: design-patterns
group: behavioral
level: beginner | intermediate | advanced
summary: 한 문장 정의 (160자 이내)
tags: [gof, oop]
related: [principles/solid]   # 실제로 존재하는 노트 id 만
sources:
  - https://원전-또는-정평-있는-자료
updatedAt: YYYY-MM-DD
---
```

## 3. 본문 구조 (필요한 절만)
1. `## 문제` — 어떤 상황에서 무엇이 아픈가
2. `## 해법` — 핵심 구조, 짧은 코드 예시(TypeScript 기본, 30줄 이내, 직접 작성)
3. `## 언제 쓰나`
4. `## 주의` 또는 `## 비용` — 과설계 신호, 트레이드오프
5. `## 비교` — 헷갈리는 이웃 개념과의 차이 (표 권장)

## 4. 문체
- 짧은 문장, 개조식 우선. 원전 문장 번역·복사 금지.
- 한 노트 = 한 개념. 길어지면 쪼개고 related 로 잇는다.
