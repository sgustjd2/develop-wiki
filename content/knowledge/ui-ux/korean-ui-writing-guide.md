---
title: 한국어 UI 표기 가이드 (외래어·조사·숫자 단위)
aka: [Korean UI Writing, 한국어 UX 라이팅, 외래어 표기, 조사 처리, 은/는 이/가, Korean Number Format]
category: ui-ux
group: writing
level: intermediate
summary: 화면 문구에서 외래어 표기, 변수 뒤 조사 선택, 숫자·단위·날짜 표기를 일관되게 하는 방법과 문자열 이어 붙이기가 만드는 문법 오류를 피하는 구현.
tags: [ux-writing, korean, i18n, localization, intl, josa]
related: [ui-ux/ux-writing-principles, ui-ux/i18n-ux, ui-ux/error-messages, ui-ux/icu-messageformat-pseudo-localization, ui-ux/typography-scale-rhythm]
sources:
  - https://korean.go.kr/kornorms/regltn/regltnView.do?regltn_code=0003
  - https://korean.go.kr/kornorms/regltn/regltnView.do?regltn_code=0001
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat
  - https://cldr.unicode.org/index/cldr-spec/plural-rules
updatedAt: 2026-11-19
---

## 문제

- "{name}을(를) 삭제했습니다" 같은 어색한 표기, 같은 개념의 다른 표기(서버/서비/써버, 사용자/유저), 만 단위 없는 큰 숫자, 날짜·금액 형식 혼재가 신뢰를 깎는다.
- 영어 문장 구조에 맞춘 번역투와 변수 이어 붙이기(`'Delete ' + name`)는 한국어에서 어순·조사가 맞지 않는다.

## 해법

### 1. 외래어·용어

- 외래어는 국립국어원 **외래어 표기법**을 기준으로 한다. 기본 원칙 중 하나는 이미 굳어진 외래어는 관용을 존중한다는 것이다(제3장 이후 세칙·용례 중 IT 용어 상세는 이 노트에서 전부 확인하지 못했다). 용례는 표준국어대사전과 국립국어원 용어 검색에서 확인한다.
- **용어집(glossary)** 을 두고 한 개념 = 한 표기로 고정한다: 로그인(≠ 로그온), 사용자 vs 유저, 계정, 비밀번호(≠ 패스워드), 설정, 내려받기/다운로드 중 하나. 제품 내부 합의가 외부 규범보다 일관성에 중요하다.
- 영문 병기가 필요한 전문 용어는 처음 한 번만 "서버(server)" 식으로, UI 라벨에서는 한 가지로 통일한다.
- 한글 맞춤법상 조사는 앞말에 붙여 쓰고(국립국어원 한글 맞춤법 해설), 숫자 뒤 단위 명사는 원칙적으로 띄어 쓰되 아라비아 숫자와 쓰일 때 붙여 쓰는 것도 허용된다는 규정이 있다(제43항; 이 노트에서는 조항 원문을 직접 확인하지 못했다). 화면에서는 `3개`, `5MB`, `2026년 11월` 처럼 **붙여 쓰는 형태로 통일**하는 제품이 많다.

### 2. 조사 처리

받침 유무로 갈리는 조사: 이/가, 은/는, 을/를, 와/과, 으로/로(받침 ㄹ 은 "로"), 이다/다.

| 전략 | 방법 | 평가 |
| --- | --- | --- |
| 조사 회피 | 문장 구조를 바꿔 변수 뒤 조사를 없앤다: "삭제된 파일: {name}" | 가장 안전. 문구가 딱딱해질 수 있다 |
| 병기 | "{name}을(를)" | 어색하지만 오류는 없다. 사용자 노출 문구에는 지양 |
| 함수 | 코드로 받침을 판별해 선택 | 한글로 끝나는 값에만 가능. 숫자·영문·기호는 별도 규칙 필요 |
| 번역 키 분리 | 값별 문구를 따로 둔다(열거형 한정) | 값 집합이 작을 때 |

```ts
// 한글 음절 받침 판별 (유니코드 가-힣: (코드 - 0xAC00) % 28 === 0 이면 받침 없음)
const hasBatchim = (w: string) => {
  const c = w.trim().slice(-1).charCodeAt(0);
  return c >= 0xac00 && c <= 0xd7a3 ? (c - 0xac00) % 28 !== 0 : null; // 한글이 아니면 null
};
const isRieul = (w: string) => (w.trim().slice(-1).charCodeAt(0) - 0xac00) % 28 === 8;

export function josa(w: string, k: '이/가' | '은/는' | '을/를' | '으로/로') {
  const b = hasBatchim(w);
  if (b === null) return `${w}(${k})`;            // 영문·숫자 끝: 안전한 병기로 후퇴
  if (k === '으로/로') return w + (b && !isRieul(w) ? '으로' : '로');
  const [a, c] = k.split('/');
  return w + (b ? a : c);
}
```

- node 로 실행해 확인: `파일을/폴더를/서울을`, `서울로`(ㄹ 받침), `부산으로`, `폴더가`, `사진은`, `Wi-Fi(을/를)`(영문 끝은 병기로 후퇴). 영어 이름·숫자 끝은 발음에 따라 달라 코드만으로 확정하기 어렵다("Wi-Fi", "A4").

### 3. 숫자·단위·날짜

`Intl` 에 맡기고 직접 포맷하지 않는다. node 24 에서 확인한 출력:

| 코드 | 결과 |
| --- | --- |
| `new Intl.NumberFormat('ko', { notation: 'compact' }).format(12345)` | `1.2만` |
| 같은 옵션, 123456789 | `1.2억` |
| `new Intl.NumberFormat('ko', { style: 'currency', currency: 'KRW' }).format(12000)` | `₩12,000` |
| `new Intl.NumberFormat('ko', { style: 'unit', unit: 'kilobyte' }).format(512)` | `512kB` |
| `new Intl.RelativeTimeFormat('ko').format(-3, 'day')` | `3일 전` |
| `new Intl.DateTimeFormat('ko-KR', { dateStyle: 'full' })` | `2026년 1월 31일 토요일` |
| `new Intl.ListFormat('ko', { type: 'conjunction' }).format(['사과','배','감'])` | `사과, 배 및 감` |

- 출력은 ICU/CLDR 버전과 런타임에 따라 달라질 수 있다. 중요한 화면은 스냅샷 테스트로 고정한다. 금액에 `원` 을 쓸지 `₩` 를 쓸지는 제품 용어집으로 정한다(`currencyDisplay: 'name'` 도 있다).
- 한국어의 복수형은 없다. `Intl.PluralRules('ko').select(n)` 은 모든 n 에 `other` 를 돌려준다(확인). 그러나 영어 원문과 키를 공유하면 "1 files" 문제가 번역 쪽에서 발생하지 않도록 ICU 메시지로 관리한다([ICU MessageFormat](/develop-wiki/knowledge/ui-ux/icu-messageformat-pseudo-localization/)).

### 4. 문체

- 존댓말 수준을 정한다. 서비스 UI 는 대개 합쇼체("~합니다") 또는 해요체("~해요") 중 하나로 통일하고, 버튼은 명사형·간결한 동사형("저장", "삭제하기") 으로 통일한다. 어느 쪽이 맞다는 규범은 없고 브랜드 보이스의 문제다([UX 라이팅](/develop-wiki/knowledge/ui-ux/ux-writing-principles/)).
- 번역투 점검: "~을 하다" → 동사 자체로, "~에 대한" → 생략, "~되어집니다" 이중 피동 금지.

## 언제 쓰나

- 제품 문구 전수 정리, 용어집·스타일 가이드 작성, 번역·로컬라이제이션 파이프라인을 만들 때.
- 조사 함수는 사용자 이름·파일명이 끼는 알림·토스트가 많은 서비스에서 가치가 크다.

## 체크리스트

- [ ] 용어집이 있고 코드·디자인·고객센터가 같은 표기를 쓴다
- [ ] 변수 뒤 조사를 회피하거나 처리했다("을(를)" 노출 없음)
- [ ] 숫자·날짜·금액이 `Intl` 기반이다
- [ ] 존댓말 수준·버튼 문형이 통일되어 있다
- [ ] 영문·숫자로 끝나는 변수 조사를 테스트했다

## 흔한 실수

- 문자열을 코드에서 이어 붙인다 → 번역 불가, 조사 오류.
- 이름 끝이 영문/숫자인데 한글 규칙을 적용한다.
- 같은 화면에서 "취소/닫기/나중에" 를 구분 없이 섞는다.
- 3자리 쉼표만 쓰고 큰 수의 단위(만·억)를 읽기 쉬운 곳에서 쓰지 않는다. 금융 정밀 값은 쉼표 전체 표기가 낫다.
