---
title: 접근성 사용성 테스트와 보조기술 사용자 모집
aka: [Accessibility Usability Testing, Recruiting Participants with Disabilities, Assistive Technology Users, Screen Reader User Testing, 보조기술 사용자 테스트]
category: ui-ux
group: accessibility
level: intermediate
summary: 장애가 있는 참가자와 보조기술(스크린 리더·확대기·스위치 등) 사용자를 기능적 필요 기준으로 모집·스크리닝하고, 세션 환경·시간·해석 범위를 준비하는 방법.
tags: [accessibility, a11y, usability-testing, recruiting, assistive-technology, screen-reader, research-ethics]
related: [ui-ux/a11y-testing-strategy, ui-ux/research-ethics-consent-recruiting, ui-ux/usability-test-tasks-think-aloud, ui-ux/usability-testing-sample-size, ui-ux/wcag-22-overview, ui-ux/screen-reader-accessible-name, ui-ux/cognitive-accessibility]
sources:
  - https://www.w3.org/WAI/test-evaluate/involving-users/
  - https://www.section508.gov/test/usability-testing-with-people-with-disabilities/
updatedAt: 2026-11-19
---

## 문제

- 자동 검사와 체크리스트를 통과해도, 실제 낭독기 사용자가 과업을 못 끝내는 일이 있다. 검사는 코드 규칙이고 사용성은 사람이 끝내는 과업이다 → [접근성 테스트 전략](/develop-wiki/knowledge/ui-ux/a11y-testing-strategy/)
- 일반 모집 업체 명단에는 보조기술 사용자가 거의 없을 수 있다.
- 한두 명 결과를 "시각장애인은 이렇다"로 일반화하기 쉽다.

## 해법

### 1. 언제 하나 (W3C WAI)

- 종료 직전 한 번이 아니라 개발 단계마다 가벼운 점검을 넣는 편이 효과적이다.
- 먼저 전문가 검토로 큰 장벽을 없애고, 사용자 세션은 우려가 큰 영역에 집중한다.
- 형태는 초안 표에서 데이터를 찾아 보게 하는 짧은 비공식 세션부터 정식 사용성 연구까지 다양하다.

### 2. 모집·스크리닝

- 진단명이 아니라 **기능적 필요**와 **쓰는 도구**로 거른다: 시각, 청각, 발화, 손 조작, 이동, 인지. 스크리너에 사용하는 보조기술 종류·버전·숙련도를 묻는다(Section 508 가이드 요약).
- 제품 대상에 맞게 기술 숙련도를 고른다. WAI 는 전문 내부 도구엔 숙련 사용자, 공공 서비스엔 초심자를 예로 든다.
- 한 가지 장애 안에서도 경험이 다양하다. 같은 낭독기 사용자만 모으지 말고 도구·브라우저 조합을 섞는다.
- 모집 경로: 장애인 단체, 접근성 전문 업체·패널, 모집 업체(경험 확인). 일반 스크리너 작성은 [리서치 윤리·모집](/develop-wiki/knowledge/ui-ux/research-ethics-consent-recruiting/)을 따른다.
- 인원: 두 출처 모두 고정 숫자를 주지 않는다. 소규모 연구는 문제 발견용이며 일반화·통계적 유의성을 주장할 수 없다고 WAI 는 적는다. 12명 또는 그룹당 3~5명 같은 수치는 검색에서 확인된 실무 가이드 의견이며 이 노트에서는 채택하지 않는다.

### 3. 우연에 맡기면 드문 도구 사용자는 안 온다 (계산)

모집단 중 어떤 도구 사용자 비율을 `p` 라 하고 무작위 n 명을 뽑을 때 그 도구 사용자가 한 명 이상일 확률 `1−(1−p)^n`:

| p \ n | 5 | 10 | 20 | 50 |
| --- | --- | --- | --- | --- |
| 5% | 0.226 | 0.401 | 0.642 | 0.923 |
| 2% | 0.096 | 0.183 | 0.332 | 0.636 |

- p 는 예시값이다(실제 비율은 확인하지 않았다). 우연에 맡기면 드문 도구 사용자는 10명 중에서도 안 나온다. 그래서 **쿼터를 정해 의도적으로 모집**한다.

### 4. 세션 준비

- 참가자 본인의 기기·설정을 쓰게 하거나, 쓰기 전에 테스트 환경과 보조기술 호환을 미리 점검한다(WAI, Section 508).
- 시간: 설정·이동 때문에 평소보다 약 25% 여유를 둔다(Section 508 가이드 권고).
- 접근 가능한 장소·자료, 방문 전 안내(경로·편의 시설), 안내견 등 동반 동물을 배려한다.
- 낭독기 사용자와 말이 겹치지 않게 한다. 진행자는 참가자를 자기 경험의 전문가로 대한다.
- 기법: think-aloud 와 적극 진행. 데이터는 시간·만족도보다 **접근성 오류** 중심(WAI). 낭독기 사용자는 말하는 소리와 낭독이 겹치므로 회고적 질문을 병행하는 게 낫다(필자 제안, 출처 없음) → [과업·think-aloud](/develop-wiki/knowledge/ui-ux/usability-test-tasks-think-aloud/)
- 사전 파일럿으로 과업 문구와 환경을 점검한다.

### 5. 결과 해석

- 문제의 원인은 페이지 코드, 브라우저·플레이어, 보조기술, 사용자의 숙련도, 일반 디자인 중 어디일 수도 있다. 하나로 단정하지 않고 분리해 적는다(WAI).
- 접근성 문제와 일반 사용성 문제를 구분해 보고한다.
- 보고서에 범위·참가자 특성·한계를 적는다. 일부 장애만 포함한 소규모 연구를 "접근성 적합"의 증거로 제시하지 않는다(WAI).

## 언제 쓰나

- 핵심 흐름(가입·결제·신청)의 출시 전, 새 위젯(콤보박스·데이터 그리드) 도입 시.
- WCAG 적합성 심사와 별개로 "실제로 쓸 수 있는가"를 확인할 때. WCAG 는 [WCAG 2.2](/develop-wiki/knowledge/ui-ux/wcag-22-overview/) 참고.

## 주의·비용

- 모집 리드타임이 길다. 한 가이드(실무자 글, 직접 확인 못 함)는 단체 접촉을 6~8주 전에 시작하라고 한다.
- 사례비·동의서 접근성: 동의서와 사전 서류도 접근 가능한 형식으로 준비해야 한다. 두 출처 모두 세부를 다루지 않아 이 노트는 구체 금액·양식을 적지 않는다.
- 장애 정보는 민감 정보다. 필요 이상으로 수집·기록하지 않는다.
- 전문 테스터 반복 참여 편향: 같은 참가자만 쓰면 일반 사용자 대표성이 낮다.
- 이 테스트는 자동·수동 검사를 대체하지 않는다.

## 체크리스트

- [ ] 스크리너에 보조기술 종류·버전·숙련도 문항
- [ ] 도구·장애 유형별 쿼터와 후보군 경로 확보
- [ ] 세션 환경·자료·동의서의 접근성 사전 점검
- [ ] 일정에 여유 시간과 파일럿 포함
- [ ] 보고서에 참가자 특성·한계·원인 분리 기록
