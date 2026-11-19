---
title: 휴리스틱 평가 진행과 심각도 산정
aka: [Heuristic Evaluation, Severity Rating, Usability Inspection, 휴리스틱 평가, 심각도 0-4]
category: ui-ux
group: research
level: intermediate
summary: 여러 평가자가 독립적으로 휴리스틱 위반을 찾고 취합한 뒤, 빈도·영향·지속성을 반영한 0~4 심각도로 수정 우선순위를 정하는 절차.
tags: [ux, heuristic-evaluation, severity, inspection, nngroup]
related: [ui-ux/nielsen-usability-heuristics, ui-ux/usability-testing-sample-size, ui-ux/usability-test-tasks-think-aloud, ui-ux/ux-research-method-selection]
sources:
  - https://www.nngroup.com/articles/how-to-conduct-a-heuristic-evaluation/
  - https://www.nngroup.com/articles/how-to-rate-the-severity-of-usability-problems/
updatedAt: 2026-11-19
---

## 문제

- 한 명이 훑어보고 의견을 적은 보고서는 그 사람의 취향과 맹점에 갇힌다.
- 문제 목록에 우선순위가 없으면 사소한 불일치부터 고치게 된다.
- 휴리스틱 10가지의 내용은 [Nielsen 사용성 휴리스틱](/develop-wiki/knowledge/ui-ux/nielsen-usability-heuristics/)에 있다. 여기서는 "어떻게 진행하고 점수를 매기나"를 다룬다.

## 해법

### 절차 (NN/g)

1. **준비**: 휴리스틱 세트 선택(Nielsen 10개 권장), 팀 교육과 단순한 화면으로 연습, 기록 방식(스프레드시트 등) 결정, 범위를 한 과업·영역·사용자 집단·기기로 축소.
2. **독립 평가**: 평가자마다 먼저 과업을 써서 익숙해진 뒤 두 번째 패스에서 위반 요소와 개선안을 기록. 1~2시간 타임박스. 서로의 결과를 보지 않는다.
3. **취합**: 유사 이슈를 묶고 합의·불일치, 중요도, 조치를 논의.

평가자는 3~5명. 경험이 많아도 누구나 일부 문제를 놓치므로 독립 평가로 관찰 범위를 넓힌다.

### 심각도

NN/g 는 심각도를 빈도(자주인가), 영향(만났을 때 넘기기 어려운가), 지속성(한 번 알면 피하는가, 계속 걸리는가) 조합으로 보고, 시장 영향(인기에 미치는 타격)도 고려 요소로 든다. 척도:

| 값 | 의미 |
| --- | --- |
| 0 | 사용성 문제로 보지 않음 |
| 1 | 외관상 문제, 여유 있을 때 수정 |
| 2 | 경미, 낮은 우선순위 |
| 3 | 중대, 높은 우선순위 |
| 4 | 치명적, 출시 전 반드시 수정 |

- 한 평가자의 심각도는 신뢰하기 어렵다. 약 3명의 평균이 실용적으로 충분하다고 한다.
- 각자 독립적으로, 보통 평가 세션 후 설문으로 매긴다(1인당 약 30분).

```ts
type Finding = { id: string; heuristic: string; ratings: number[] }; // 평가자별 0~4
const severity = (f: Finding) => f.ratings.reduce((a, b) => a + b, 0) / f.ratings.length;
const triage = (fs: Finding[]) => [...fs].sort((a, b) => severity(b) - severity(a));
```

## 언제 쓰나

- 사용자 모집 전에 싼값으로 명백한 문제를 걸러낼 때, 반복 주기 사이.
- 사용성 테스트 과업을 정할 문제 후보를 만들 때.

## 체크리스트

- [ ] 범위(과업·화면)를 정했다
- [ ] 평가자 3~5명이 독립적으로 평가했다
- [ ] 위반 휴리스틱 번호·위치·스크린샷·개선안을 같이 적었다
- [ ] 심각도는 평가자별 독립 평가 뒤 평균을 냈다
- [ ] 높은 심각도 항목은 사용자 테스트로 확인 계획을 잡았다

## 흔한 실수·주의

- **평가자가 서로 논의하며 점수를 매긴다.** 영향을 받는다. 독립 평가를 먼저 한다.
- **전문가 의견을 사용자 행동 증거로 착각한다.** 휴리스틱 평가는 사용자를 관찰하지 않는다. 실제 막힘은 사용성 테스트로 확인한다.
- **0~4 평균을 정밀 측정으로 쓴다.** 순서형 판단이다. 소수점 차이는 의미가 약하다(해석, 출처 없음).
- 평가자별 발견 비율 수치(예 약 1/3)는 이 노트에서 인용하지 않았다. 1990년 Nielsen·Molich 원 논문(CHI'90)은 본문을 읽지 못했다.
