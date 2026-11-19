---
title: ICU MessageFormat과 의사 번역
aka: [ICU MessageFormat, Pseudo-localization, Plural Rules, CLDR, FormatJS, intl-messageformat, i18n Message Syntax]
category: ui-ux
group: writing
level: intermediate
summary: 복수형·성별·변수를 번역 가능한 한 문장으로 표현하는 ICU 메시지 문법과, 번역 전에 문자열 하드코딩·텍스트 확장·잘림을 찾아내는 의사 번역(pseudo-localization) 기법.
tags: [i18n, l10n, icu, messageformat, formatjs, ux-writing]
related: [ui-ux/i18n-ux, ui-ux/korean-ui-writing-guide, ui-ux/ux-writing-principles, ui-ux/data-table-density, ui-ux/responsive-adaptive-container-queries, ui-ux/translation-length-truncation-testing]
sources:
  - https://unicode-org.github.io/icu/userguide/format_parse/messages/
  - https://formatjs.github.io/docs/intl-messageformat/
  - https://cldr.unicode.org/index/cldr-spec/plural-rules
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/PluralRules
updatedAt: 2026-11-19
---

## 문제

- `count + ' file' + (count === 1 ? '' : 's')` 같은 조립은 번역자가 어순·복수형을 바꿀 수 없다. 러시아어·아랍어는 복수 범주가 여럿이다.
- 번역이 도착한 뒤에야 문자열이 잘리고 하드코딩이 발견된다.

## 해법

### 1. ICU 메시지 문법 (ICU User Guide·FormatJS 문서 요지)

- 한 메시지 = **한 문장 전체**를 번역 단위로 두고, 변수는 `{name}` 자리표시자로.
- `plural`: 숫자에 따라 가지를 고르고 `#` 는 형식화된 숫자. **`other` 는 필수**. `=0` 처럼 정확한 값도 쓸 수 있다.
- `select`: 키워드(성별 등)로 분기. ICU 가이드는 복합 인자를 메시지 최상위(바깥)에 두라고 권한다. 즉 select 바깥, plural 안쪽 중첩.
- `selectordinal`: 서수. 날짜·숫자·통화 스켈레톤(`{n, number, ::currency/KRW}`)과 `<b>…</b>` 같은 리치 텍스트 태그도 FormatJS 에서 지원한다.
- **작은따옴표(`'`)는 이스케이프 문자**다. `{`·`}` 앞 작은따옴표로 리터럴을 만들고, 일반 문장의 아포스트로피는 `''` 또는 타이포그래피 `’`(U+2019)를 쓴다.

### 2. 언어마다 복수 범주가 다르다 (CLDR)

범주는 `zero · one · two · few · many · other` 중 언어가 쓰는 것만. `other` 는 항상 존재한다. `Intl.PluralRules(locale).select(n)` 으로 확인한 결과(node 24):

| 로캘 | n = 0, 1, 2, 5, 21 |
| --- | --- |
| ko | other, other, other, other, other |
| en | other, one, other, other, other |
| ru | many, one, few, many, one |

```ts
import { IntlMessageFormat } from 'intl-messageformat';

const ko = '{n, plural, =0 {파일이 없습니다} other {파일 #개}}';
new IntlMessageFormat(ko, 'ko').format({ n: 0 });     // '파일이 없습니다'
new IntlMessageFormat(ko, 'ko').format({ n: 1234 });  // '파일 1,234개'

const en = '{n, plural, one {# file} other {# files}}';
new IntlMessageFormat(en, 'en').format({ n: 1 });     // '1 file'

new IntlMessageFormat("It''s '{'literal'}'", 'en').format(); // "It's {literal}"
```

- 위 결과는 `intl-messageformat` 으로 실행해 확인했다. 한국어는 `other` 만 있으므로 `=0` 같은 정확한 값 가지로 0 건 문구를 따로 쓴다. 번역자가 각 로캘에 필요한 범주를 채우도록 도구(번역 관리 시스템)가 언어별 범주를 안내해야 한다.
- 메시지 안에 HTML 문자열을 넣지 말고 리치 텍스트 태그로 요소를 주입한다. 사용자 입력이 섞인 값은 이스케이프 책임을 호출 측이 진다.

### 3. 의사 번역 (pseudo-localization)

번역 전 빌드에서 원문을 **읽을 수 있는 가짜 번역**으로 바꿔 문제를 미리 드러낸다.

| 변환 | 찾아내는 문제 |
| --- | --- |
| 악센트 문자 치환(`a → á`) | 하드코딩된 영문(변환되지 않은 문자열), 폰트의 문자 지원 |
| 길이 확장(`~` 패딩 30~40%) | 잘림·넘침·줄바꿈 붕괴([텍스트 확장](/develop-wiki/knowledge/ui-ux/i18n-ux/), 짧은 문자열일수록 더 늘리는 방법은 [번역 길이·잘림 검사](/develop-wiki/knowledge/ui-ux/translation-length-truncation-testing/)) |
| 괄호 `[ … ]` 감싸기 | 문자열이 중간에 잘렸는지 |
| 긴 단어·RTL 변종 | 줄바꿈·방향 문제 |

```ts
const map: Record<string, string> = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú' };
export function pseudo(s: string, expand = 0.3) {
  let out = '', depth = 0;
  for (const ch of s) {
    if (ch === '{') depth++;
    out += depth ? ch : (map[ch.toLowerCase()] && ch === ch.toLowerCase() ? map[ch] : ch); // {…} 안은 보존
    if (ch === '}') depth--;
  }
  return `[${out}${'~'.repeat(Math.ceil(s.length * expand))}]`;
}
```

- 핵심: **`{…}` 구문은 변환하지 않는다.** 확인: `You have {n, plural, one {# file} other {# files}}` → 변환된 문자열에서 괄호·꼬리 패딩을 제거해 다시 포맷하면 `Yóú hávé 2 files` 로 정상 동작했다(포맷 구문이 깨지지 않음). 위 코드는 소문자만 치환하는 단순 예시다. 영어 ICU 키워드(`plural`, `one`, `other`)는 중괄호 안이라 건드리지 않는다.
- 빌드 플래그(`--pseudo`)나 로캘 `en-XA` 로 켜는 방식이 일반적이다. 로캘 코드 관례는 팀 합의에 따른다.
- 확장률은 원문 길이에 따라 다르게 잡는 것이 현실적이다(짧은 문자열일수록 확장 비율이 크다는 W3C i18n 설명이 있다; [국제화 UX](/develop-wiki/knowledge/ui-ux/i18n-ux/) 참조).

## 언제 쓰나

- 둘 이상 언어를 지원하거나 지원할 가능성이 있는 제품. 복수형·성별 분기가 하나라도 있으면 ICU 형식을 처음부터 쓰는 편이 싸다.
- 의사 번역은 디자인 시스템 컴포넌트 시각 테스트([시각 회귀](/develop-wiki/knowledge/ui-ux/visual-regression-testing/))의 로캘 변형으로도 쓴다.

## 주의·비용

- 번역 파일 형식·도구가 ICU 문법을 지원하는지 확인한다(XLIFF·JSON·PO 변환 시 이스케이프가 깨지기 쉽다).
- 번역자에게 문맥(스크린샷, 설명, 변수 의미)을 제공하지 않으면 문법만 맞고 의미가 틀린다.
- 복잡한 중첩 plural+select 는 번역자에게 어렵다. 메시지를 쪼개되 **문장을 쪼개지는 않는다**.
- 서버·모바일(Android, iOS)이 같은 ICU 문법을 쓰는지는 플랫폼별로 다르다. 공유 시 확인한다.

## 체크리스트

- [ ] 모든 사용자 노출 문자열이 메시지 키로 관리된다
- [ ] 복수·성별은 ICU 로 표현하고 `other` 가 있다
- [ ] 조립(`+`)된 문장이 없다
- [ ] 의사 번역 빌드에서 잘림·미번역 문자열을 점검했다
- [ ] 날짜·숫자·통화는 로캘 API(`Intl`)로 포맷한다

## 흔한 실수

- `{count} item(s)` 로 복수 회피.
- 영어 `one`/`other` 만 정의하고 다른 로캘 번역에 범주를 비워 둔다.
- 변수 안에 이미 번역된 조각을 넣어 문법 조합이 깨진다.
- 사용자에게 보이는 아포스트로피를 이스케이프하지 않아 구문 오류가 난다.
