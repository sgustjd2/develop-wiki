---
title: 국제화 UX (텍스트 확장·RTL·날짜·숫자 형식·한국어 표기)
aka: [Internationalization UX, i18n, l10n, Localization, Text Expansion, RTL, Bidirectional Text, Intl API, CSS Logical Properties, 현지화]
category: ui-ux
group: writing
level: intermediate
summary: 번역해도 깨지지 않는 화면을 위해 텍스트 확장 여유, 오른쪽→왼쪽 언어 대응, 로캘별 날짜·숫자·복수형 처리, 한국어 UI 표기 관례를 설계 단계에서 반영하는 방법.
tags: [ux, i18n, l10n, rtl, intl, typography, korean]
related: [ui-ux/ux-writing-principles, ui-ux/data-table-density, ui-ux/screen-reader-accessible-name, ui-ux/wcag-22-overview, ui-ux/typography-scale-rhythm]
sources:
  - https://www.w3.org/International/articles/article-text-size
  - https://www.w3.org/International/questions/qa-html-dir
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl
  - https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_logical_properties_and_values
  - https://www.w3.org/WAI/WCAG22/Understanding/language-of-page.html
  - https://www.mcst.go.kr/kor/s_notice/press/pressView.jsp?pSeq=13842
updatedAt: 2026-11-19
---

## 문제

- 영어로 딱 맞춘 버튼이 독일어로 바뀌자 글자가 잘리거나 두 줄이 된다.
- 아랍어·히브리어 사용자에게 화살표·여백·아이콘 방향이 모두 거꾸로다.
- `11/12/2026` 이 11월 12일인지 12월 11일인지 사용자마다 다르게 읽는다.
- "1 items", "{count}개의 파일이(가)" 같은 문장 조립이 언어마다 틀린다.

## 해법

### 1. 텍스트 확장 여유

W3C i18n 문서는 IBM 지침을 인용해 영어에서 유럽 언어로 번역할 때 **짧은 문자열일수록 더 많이 늘어난다**고 정리한다(10자 이하 약 200~300%, 70자 초과 약 130%).

- 고정 폭 버튼·탭·라벨을 피하고 내용에 따라 늘어나는 레이아웃(`min-inline-size`, 줄바꿈 허용)을 쓴다.
- 짧은 레이블이 가장 위험하다: 탭, 배지, 표 머리글, 아이콘 옆 라벨.
- 한·중·일 문자는 글자 수는 적어도 글자 폭이 넓고, 줄 간격을 더 필요로 한다. 세로 여유도 둔다.
- 반대로 훨씬 짧아지는 번역도 있어 빈 공간이 어색해질 수 있다.
- 디자인 검수 때 의사 번역(pseudo-localization: 늘린 문자열, 악센트 문자)을 적용해 본다.

### 2. RTL(오른쪽 → 왼쪽)

- 방향은 CSS 가 아니라 **마크업**에: `<html lang="ar" dir="rtl">`. `lang` 은 방향을 정하지 않는다.
- 레이아웃은 **논리 속성**으로: `margin-inline-start`, `padding-inline-end`, `inset-inline-start`, `text-align: start`. 그러면 `dir` 만 바꿔도 뒤집힌다.
- 사용자 입력·DB 문자열처럼 방향을 모르는 텍스트는 `dir="auto"`, 문장 속에 끼워 넣는 이름은 `<bdi>` 로 격리.
- 아이콘: "뒤로/앞으로", 진행 방향 화살표는 뒤집고, 시계·재생 버튼·로고·체크 표시는 뒤집지 않는다.

```css
.card { padding-inline: 16px; border-inline-start: 4px solid var(--accent); }
.back-icon:dir(rtl) { transform: scaleX(-1); }
```

### 3. 날짜·숫자·통화·복수형은 `Intl` 로

```ts
const d = new Date(Date.UTC(2026, 10, 19, 6, 5));
const fmt = (l: string) => new Intl.DateTimeFormat(l, { dateStyle: 'long', timeStyle: 'short', timeZone: 'Asia/Seoul' }).format(d);
fmt('ko-KR'); // "2026년 11월 19일 오후 3:05"
fmt('de-DE'); // "19. November 2026 um 15:05"
new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul' }).format(d); // "2026. 11. 19."
new Intl.NumberFormat('de-DE').format(1234567.891);                     // "1.234.567,891"
new Intl.NumberFormat('ko-KR', { notation: 'compact' }).format(12345678); // "1235만"
new Intl.RelativeTimeFormat('ko', { numeric: 'auto' }).format(-1, 'day'); // "어제"
new Intl.PluralRules('ar').select(3);                                    // "few" (한국어는 항상 "other")
```

(Node 24 에서 출력을 확인했다. 결과 문자열은 ICU/CLDR 데이터 버전에 따라 달라질 수 있어 테스트에서 정확한 문자열 비교는 피한다.)

- 문장 조립 금지: `"파일 " + n + "개를 삭제"` 대신 ICU MessageFormat 같은 메시지 형식으로 번역자에게 문장 전체와 변수를 넘긴다.
- 날짜 입력은 형식이 애매한 자유 입력보다 연·월·일 분리 필드나 로캘을 따르는 날짜 선택기를 쓴다. 서버에는 ISO 8601 로 저장한다.
- 시간대: 저장은 UTC, 표시는 사용자 시간대. 마감 시각처럼 기준 시간대가 중요한 값은 시간대를 함께 표시한다.

### 4. 한국어 UI 표기

- 아라비아 숫자만으로 날짜를 쓸 때는 각 단위 뒤에 마침표: **2026. 11. 19.** (한글 맞춤법 문장 부호 규정, 2014 개정·2015 시행). `ko-KR` 의 `Intl` 기본 출력과 같다. 화면 공간이 허락하면 "2026년 11월 19일"이 가장 분명하다.
- 금액은 "15,000원" 또는 "₩15,000" 중 하나로 통일. 큰 수는 "1,235만"처럼 만 단위가 읽기 쉽다.
- 조사 "을/를", "이/가"는 앞 글자 받침에 따라 달라진다. 변수 뒤 조사는 받침 판별 함수를 쓰거나 "‘{name}’ 항목을"처럼 조사가 고정되는 구조로 문장을 바꾼다. "을(를)" 표기는 최후 수단.
- 외래어는 국립국어원 표기를 기준으로 제품 용어집에 고정한다.

### 5. 접근성과 연결

- 페이지 언어 `lang`(WCAG 3.1.1), 부분 언어 `lang`(3.1.2)을 지정해야 낭독기가 올바른 발음으로 읽는다.

## 언제 쓰나

- 출시 언어가 하나라도 해외 사용자·다국어 확장 가능성이 있으면 처음부터. 나중에 고치면 레이아웃·문자열·DB 스키마 모두 손봐야 한다.
- 아랍어·히브리어·페르시아어·우르두어 지원 시 RTL 전면 점검.

## 체크리스트

- 하드코딩 문자열이 없고, 모든 문구가 메시지 키로 관리된다.
- 의사 번역(+40% 길이)에서 잘림·겹침이 없다.
- 레이아웃 CSS 에 `left`/`right` 대신 논리 속성을 쓴다.
- 날짜·숫자·통화·상대 시간·복수형을 `Intl` 또는 i18n 라이브러리로 포맷한다.
- `lang`/`dir` 이 콘텐츠 언어와 맞다.

## 흔한 실수·주의

- **국기로 언어 선택.** 국가 ≠ 언어. 언어 이름을 그 언어로 표기한다("한국어", "English", "العربية").
- **IP 로 언어 강제.** 여행자·이민자에게 맞지 않는다. 브라우저 설정을 기본으로 하되 바꿀 수 있게.
- **문자열 연결·약어로 공간 절약.** 번역 불가능해진다.
- **텍스트가 들어간 이미지.** 번역·확대·낭독이 모두 어렵다.
