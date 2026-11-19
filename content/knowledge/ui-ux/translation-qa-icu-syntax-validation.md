---
title: 번역 QA 자동화 (ICU MessageFormat 구문·변수 검증)
aka: [Translation QA, ICU Syntax Lint, Placeholder Check, 번역 검수 자동화, i18n 메시지 린트]
category: ui-ux
group: writing
level: advanced
summary: 번역본 ICU 메시지를 파서로 구문 검사하고 원문과 변수·태그를 대조하며 로캘별 복수 범주 누락을 찾는 자동 검사와, 자동으로 못 잡는 의미 오류의 수동 검수 범위.
tags: [i18n, l10n, icu, messageformat, qa, lint, ci, plural]
related: [ui-ux/icu-messageformat-pseudo-localization, ui-ux/translation-workflow-xliff-tm, ui-ux/i18n-ux, ui-ux/korean-ui-writing-guide, ui-ux/ux-writing-principles, ui-ux/translation-length-truncation-testing]
sources:
  - https://unicode-org.github.io/icu/userguide/format_parse/messages/
updatedAt: 2026-11-19
---

문법 자체는 [ICU MessageFormat과 의사 번역](/develop-wiki/knowledge/ui-ux/icu-messageformat-pseudo-localization/), 번역 흐름은 [번역 워크플로](/develop-wiki/knowledge/ui-ux/translation-workflow-xliff-tm/)에 있다. 여기서는 **돌아온 번역을 머지 전에 기계로 걸러내는 검사**를 다룬다.

## 문제

번역가는 대개 ICU 를 직접 파싱하지 않는다. 흔한 사고는 다음과 같다.

- 중괄호 하나가 빠져 **런타임에 메시지 전체가 실패**한다(사용자에게는 키 이름이나 빈 문자열).
- 변수 이름을 번역해 버린다(`{folder}` → `{폴더}`).
- 복수형에서 `other` 를 빠뜨리거나, 로캘이 요구하는 범주(러시아어 `few`·`many`)를 비운다.
- `<b>…</b>` 태그가 닫히지 않거나 사라진다.
- 아포스트로피가 이스케이프 문법과 섞여 `{` 가 문자로 바뀐다.

## 해법

원문(source)과 번역(target)을 **쌍으로** 검사한다. 단계는 싸고 확실한 것부터.

| 단계 | 검사 | 실패 시 |
| --- | --- | --- |
| 1. 구문 | 파서가 통과하는가(괄호·태그 닫힘, plural 의 `other`) | 차단 |
| 2. 변수 | 원문 변수 집합 = 번역 변수 집합 | 차단 |
| 3. 태그 | 원문의 `<b>` 등이 번역에 존재 | 차단 |
| 4. 복수 범주 | 로캘의 CLDR 범주가 plural 에 모두 있는가 | 차단 또는 경고 |
| 5. 사람 검수 | 의미·톤·용어, 문맥 | 수동 |

### 구현: formatjs 파서 사용

ICU 가이드는 복합 인자를 바깥에 select·안쪽에 plural 로 두라고 설명한다. plural 의 `other` 필수는 가이드 해당 페이지에서 확인되지 않고, formatjs 파서의 동작(`requiresOtherClause`, 기본값 true)으로 직접 확인했다.

```ts
import { parse, TYPE, type MessageFormatElement } from '@formatjs/icu-messageformat-parser';

function walk(ast: MessageFormatElement[], f: (n: MessageFormatElement) => void) {
  for (const n of ast) {
    f(n);
    if (n.type === TYPE.plural || n.type === TYPE.select)
      for (const o of Object.values(n.options)) walk(o.value, f);
    if (n.type === TYPE.tag) walk(n.children, f);
  }
}
function info(msg: string) {
  const vars = new Set<string>(), tags = new Set<string>(), plurals: Record<string, string>[] = [];
  walk(parse(msg, { requiresOtherClause: true }), (n) => {
    if (n.type === TYPE.tag) tags.add(n.value);
    else if (n.type !== TYPE.literal && n.type !== TYPE.pound) vars.add((n as any).value);
    if (n.type === TYPE.plural) plurals.push(n.options);
  });
  return { vars, tags, plurals };
}
export function validate(src: string, tgt: string, locale: string) {
  let t; try { t = info(tgt); } catch (e: any) { return [`syntax: ${e.message}`]; }
  const s = info(src), out: string[] = [];
  for (const v of s.vars) if (!t.vars.has(v)) out.push(`missing var {${v}}`);
  for (const v of t.vars) if (!s.vars.has(v)) out.push(`unknown var {${v}}`);
  for (const g of s.tags) if (!t.tags.has(g)) out.push(`missing tag <${g}>`);
  const need = new Intl.PluralRules(locale).resolvedOptions().pluralCategories;
  for (const opts of t.plurals) for (const c of need) if (!(c in opts)) out.push(`plural lacks '${c}'`);
  return out;
}
```

- 확인한 동작(Node 24, `@formatjs/icu-messageformat-parser` + `Intl.PluralRules`), 원문 `You have {n, plural, one {# file} other {# files}} in <b>{folder}</b>`:
  - 정상 영어·한국어(`other` 만)는 문제 0건.
  - 러시아어 번역에 `one`/`other` 만 있으면 `few`, `many` 누락 보고(`pluralCategories` 에 따라).
  - 한국어에서 plural 에 `other` 가 없으면 `MISSING_OTHER_CLAUSE`, 닫는 `}` 가 빠지면 `EXPECT_ARGUMENT_CLOSING_BRACE`, 태그가 닫히지 않으면 `UNCLOSED_TAG`.
  - 변수 이름을 `{폴더}` 로 바꾸면 missing/unknown var 와 태그 누락이 함께 보고.
- `intl-messageformat` 으로 확인: `select` 에 `other` 가 없으면 `MISSING_OTHER_CLAUSE` 로 실패했다(이 라이브러리 동작이며, ICU 가이드 문서가 select 의 `other` 를 명시했는지는 확인하지 못했다). `It's {n}` 은 `It's 1` 로 포맷되고 `'{n}'` 은 리터럴 `{n}` 이 됐다. 즉 **`{` 앞의 작은따옴표는 의도치 않게 변수를 죽인다**.
- 한계: 최상위의 `#` 는 파서가 리터럴로 취급해 오류가 나지 않았다. 따라서 "plural 밖의 `#`" 는 이 방식으로는 못 잡는다(필요하면 별도 정규식 경고).
- 플랫폼별 파서 차이(ICU4J/ICU4C, Android, iOS)는 확인하지 않았다. 앱·서버가 다른 ICU 구현이면 그 구현으로도 검사한다.

### 운영

- 검사는 [XLIFF·JSON 가져오기](/develop-wiki/knowledge/ui-ux/translation-workflow-xliff-tm/) 직후와 CI 두 곳에 둔다.
- 오류 메시지에는 키, 로캘, 사유를 쓴다. 번역가가 읽을 수 있게 "변수 {folder} 가 없습니다" 수준으로 번역한다.
- 복수 범주 누락은 도구가 번역 단계에서 칸을 만들어 주는 편이 낫다(검사로는 사후 발견).
- 위반이 몇 개 있어도 번역 전체를 막을지, 해당 키만 원문으로 폴백할지 정책을 정한다. 폴백 시 사용자에게 섞인 언어가 보인다.

## 자동 검사가 못 잡는 것

| 영역 | 이유 | 보완 |
| --- | --- | --- |
| 오역·톤 | 구문은 맞음 | 검수자·용어집([한국어 UI 라이팅](/develop-wiki/knowledge/ui-ux/korean-ui-writing-guide/)) |
| 어순에 따른 변수 의미 | 변수는 있으나 문장이 어색 | 화면 컨텍스트 확인 |
| 길이·잘림 | 구문과 무관 | [의사 번역](/develop-wiki/knowledge/ui-ux/icu-messageformat-pseudo-localization/), 시각 회귀 |
| 성별·격 변화 | 로캘 규칙 | 번역가 지침 |
| 변수에 번역 조각 삽입 | 조합 오류 | 코드 리뷰 |

## 언제 쓰나

- 번역을 외주·번역 관리 시스템에서 받아 머지하는 모든 프로젝트. 메시지에 plural·select·태그가 하나라도 있을 때 효과가 크다.

## 주의

- 검사를 통과해도 "정확한 번역"이 아니다. 구문 안전망일 뿐이다.
- 파서 옵션(태그 허용, 날짜 스켈레톤 파싱)이 런타임 라이브러리와 다르면 CI 와 런타임 결과가 갈린다. 같은 버전·옵션을 쓴다.
- 엄격한 변수 일치는 번역가가 의도적으로 변수를 빼야 하는 언어에서 거짓 양성을 낸다. 예외 목록은 사유와 함께 둔다.

## 체크리스트

- [ ] 번역 머지 전에 구문·변수·태그·복수 범주 검사가 돈다
- [ ] 로캘별 CLDR 범주를 `Intl.PluralRules` 등으로 얻는다
- [ ] 런타임과 같은 파서 버전·옵션
- [ ] 오류 보고가 키·로캘·사유를 포함한다
- [ ] 폴백 정책(원문 폴백 vs 차단)이 정해져 있다
- [ ] 의미 검수는 사람이 한다
