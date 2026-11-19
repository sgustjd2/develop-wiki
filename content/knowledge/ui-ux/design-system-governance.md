---
title: 디자인 시스템 거버넌스와 버전 관리
aka: [Design System Governance, Contribution Model, Design System Versioning, Deprecation, Changelog, Makers and Users]
category: ui-ux
group: design-system
level: intermediate
summary: 디자인 시스템의 변경을 누가 제안·승인·배포·폐기하는지 정하고, 시맨틱 버저닝과 변경 로그·폐기 예고로 제품팀이 안전하게 따라오게 하는 운영 방식.
tags: [design-system, governance, semver, changelog, deprecation]
related: [engineering-practice/semantic-versioning, ui-ux/design-system-structure, ui-ux/design-tokens, engineering-practice/code-review]
sources:
  - https://atomicdesign.bradfrost.com/chapter-5/
  - https://semver.org/
  - https://keepachangelog.com/en/1.1.0/
  - https://www.designtokens.org/TR/2025.10/format/
updatedAt: 2026-11-19
---

## 문제

- 시스템 팀이 버튼 패딩을 바꿨더니 다음 배포에서 여러 제품의 레이아웃이 깨진다.
- 제품팀은 필요한 컴포넌트가 없어서 복사해 고쳐 쓰고, 그 복사본이 수십 개로 갈라진다.
- 오래된 컴포넌트를 지우고 싶지만 누가 쓰는지 모른다.

## 해법

### 1. 역할: 만드는 사람과 쓰는 사람

Brad Frost 는 시스템을 만들고 관리하는 **makers** 와 제품에 적용하는 **users** 를 나누고, 둘이 자주 소통해야 한다고 본다. 거버넌스 계획은 다음 질문에 답해야 한다.

- 변경은 누가 승인하나? 버그·새 요청은 누가 처리하나?
- 패턴을 폐기하는 결정은 누가 하나? 문서는 누가 유지하나?

### 2. 변경 흐름

```
요청(이슈) → 분류: 버그 / 기존 확장 / 신규 / 폐기
   → 신규라면: 여러 제품에서 반복되는 필요인가? (아니면 제품 로컬로)
   → 설계·접근성 검토 → 디자인+코드 동시 구현 → 문서·예시
   → 버전 결정 → 변경 로그 → 공지
```

Frost 는 신규 패턴은 **여러 애플리케이션에 반복되는 필요가 있을 때만** 추가해 비대화를 막으라고 한다.

### 3. 버전 관리

디자인 시스템 패키지(코드·토큰)는 [시맨틱 버저닝](/develop-wiki/knowledge/engineering-practice/semantic-versioning/)을 따른다. 무엇이 "깨지는 변경"인지 팀이 미리 정의한다.

| 변경 | 버전 |
| --- | --- |
| prop·토큰 이름 삭제/변경, 기본 동작 변경, DOM 구조 변경으로 스타일 오버라이드가 깨짐 | MAJOR |
| 새 컴포넌트·변형·토큰 추가, 기존 항목 폐기 예고 | MINOR |
| 버그 수정, 접근성 수정(동작 계약이 같을 때) | PATCH |
| 눈에 띄는 시각 변경(크기·간격) | 팀 합의 필요 — 레이아웃을 깨면 MAJOR 로 취급하는 편이 안전 |

```ts
/** @deprecated v5 에서 삭제. 대신 <Button variant="ghost"> 사용 */
export function TextButton(props: ButtonProps) {
  if (process.env.NODE_ENV !== 'production') {
    console.warn('[ds] TextButton 은 폐기 예정입니다. Button variant="ghost" 로 바꾸세요.');
  }
  return <Button {...props} variant="ghost" />;
}
```

토큰은 DTCG 포맷의 `$deprecated` 에 사유·대체 토큰을 적는다.

## 언제 쓰나

- 시스템을 쓰는 제품·팀이 둘 이상이 되는 순간부터. 한 팀 한 제품이면 가벼운 리뷰 규칙으로 충분하다.

## 체크리스트

- [ ] 기여 경로(이슈 템플릿, 오피스 아워, 채팅 채널)가 문서화돼 있다
- [ ] 무엇이 MAJOR 인지 정의한 문서가 있다
- [ ] 변경 로그는 사람이 읽는 형태로, 마이그레이션 방법 포함
- [ ] 폐기 → 경고 → 삭제까지 최소 한 MINOR 이상 유예
- [ ] 사용처 추적(코드 검색·사용 통계)으로 영향 범위를 확인한 뒤 변경
- [ ] 정기 공유(로드맵·현황) 자리가 있다

## 흔한 실수

- 시각 변경을 PATCH 로 내보내 자동 업데이트된 제품이 깨짐.
- 기여를 받는다고 해 놓고 리뷰가 몇 달씩 밀림 → 제품팀이 다시 복사본으로 돌아감.
- 폐기 공지 없이 삭제.
- 디자인 라이브러리와 코드 패키지를 따로 버전 관리해 "Figma v3 = 코드 v?" 를 아무도 모름.

## 주의 (비용)

- 거버넌스가 무거우면 시스템이 병목이 된다. 위험도에 따라 절차를 나눈다(문서 수정은 바로, 새 컴포넌트는 리뷰).
- MAJOR 를 자주 내면 제품팀이 업그레이드를 미룬다. 여러 깨지는 변경을 모아 예측 가능한 주기로 내고, 코드모드(자동 변환 스크립트)를 함께 제공하면 부담이 줄어든다.
