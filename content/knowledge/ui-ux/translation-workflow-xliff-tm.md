---
title: 번역 워크플로 (XLIFF·문맥·번역 메모리)
aka: [Localization Workflow, XLIFF, Translation Memory, TM, 번역 문맥 제공, 번역 파이프라인, i18n 번역 운영]
category: ui-ux
group: writing
level: intermediate
summary: UI 문자열을 추출해 XLIFF 로 번역가에게 넘기고, 문맥·글자수 제한·번역 메모리·QA 를 붙여 되돌려 받는 번역 운영 흐름과 그 함정.
tags: [i18n, l10n, xliff, translation-memory, workflow, context, qa]
related: [ui-ux/icu-messageformat-pseudo-localization, ui-ux/i18n-ux, ui-ux/korean-ui-writing-guide, ui-ux/ux-writing-principles, ui-ux/cjk-typography-line-breaking, ui-ux/data-table-density]
sources:
  - https://docs.oasis-open.org/xliff/xliff-core/v2.1/os/xliff-core-v2.1-os.html
updatedAt: 2026-11-19
---

## 문제

- 번역가가 "Save" 한 단어만 받아 버튼인지 명사인지 모른 채 번역한다.
- 같은 문장을 화면마다 다르게 번역해 용어가 흔들린다.
- 번역 도중 원문이 바뀌어도 번역이 "완료"로 남아 낡은 번역이 배포된다.
- 복수형·변수(`{count}`)를 번역가가 지우거나 순서를 깨뜨린다.

문자열 형식 자체(복수·성별 규칙, 가상 번역 테스트)는 [ICU MessageFormat·의사 현지화](/develop-wiki/knowledge/ui-ux/icu-messageformat-pseudo-localization/)를 본다. 이 노트는 **문자열이 번역가를 거쳐 돌아오는 과정**이다.

## 해법

### 1. 흐름

```
개발: 키+원문 추출 → (컨텍스트 첨부) → XLIFF 내보내기
번역: 번역 메모리(TM) 사전 채움 → 사람 번역·검수 → 상태 갱신
검증: 플레이스홀더·길이·용어 자동 QA → 화면 확인(의사/실제 렌더)
배포: 승인된 번역만 병합 → TM 에 승인 쌍 환류
```

### 2. XLIFF 2.1 핵심 구조 (OASIS 표준에서 확인한 범위)

- `<xliff version srcLang trgLang>` 아래 `<file>` → `<unit>`(번역 단위, id) → `<segment>` → `<source>`/`<target>`.
- `<notes><note>` 로 번역가에게 설명을 붙인다. 문맥 전달의 표준 자리.
- `segment` 의 `state`: `initial` → `translated` → `reviewed` → `final` (기본 `initial`). `target` 이 없는 세그먼트를 `initial` 위로 올리지 않는다.
- `translate="no"` 는 번역 제외(브랜드명 등). 하위가 상속한다.
- 선택 모듈: Translation Candidates(`mtc:match`: `similarity` 0~100, `matchQuality`), Glossary(`gls:glossEntry`: `term`, `translation`, 선택 `definition`).
- 확인하지 못한 범위: 사양 약 50만 자 중 앞쪽 200,000자(핵심 구조, 일부 모듈)만 읽었다. 인라인 요소(`<ph>`, `<pc>`)·매칭/병합 규칙·1.2 와의 변환은 읽지 않았다. 도구 연동 전 해당 절을 직접 확인한다.

```xml
<unit id="cart.checkout">
  <notes><note category="context">장바구니 하단 결제 진행 버튼. 12자 이내</note></notes>
  <segment state="initial"><source>Proceed to checkout</source></segment>
</unit>
```

### 3. 문맥 제공: 번역가가 묻지 않아도 되게

| 항목 | 예 |
| --- | --- |
| 쓰임 | 버튼 / 제목 / 오류 메시지 / 툴팁 |
| 공간 제한 | 최대 글자 수, 한 줄 여부 ([표 헤더 등](/develop-wiki/knowledge/ui-ux/data-table-density/)) |
| 변수 의미 | `{count}` 는 장바구니 상품 수 |
| 화면 위치 | 스크린샷 또는 스토리 링크 |
| 용어 | 용어집 링크, 번역 금지 항목 |

- 키 이름(`cart.checkout.button`)에 의미를 담으면 약식 문맥이 된다. 키에 문장을 쓰면 원문 수정 때 키가 어긋난다.
- 한국어 문체·존댓말 규칙은 [한국어 UI 라이팅](/develop-wiki/knowledge/ui-ux/korean-ui-writing-guide/)에 맞춘다.

### 4. 번역 메모리(TM)

- 승인된 원문–번역 쌍을 저장하고, 새 원문과의 **유사도**로 재사용한다. 100% 는 자동 채움 후보, 그 아래(퍼지)는 번역가 검수 대상.
- 유사도 산정 방식과 임계값은 도구마다 다르다. 이 노트의 75% 는 예시일 뿐 표준값이 아니다. TM 의 일반 운영 관행은 위 두 출처가 다루지 않으므로 팀의 번역 도구 문서로 확인한다.
- 완전 일치도 **문맥이 다르면 틀릴 수 있다**("Close" 닫기/가까운). 문맥(unit id·노트) 일치를 우선 조건으로 둘 수 있다.
- 품질 낮은 번역이 TM 에 들어가면 계속 퍼진다. 검수(`reviewed` 이상)된 쌍만 환류한다.

### 5. 코드: TM 사전 채움 + 자동 QA (Node + jsdom 으로 확인)

```ts
const doc = new DOMParser().parseFromString(xml, 'application/xml');
for (const u of doc.getElementsByTagName('unit')) {
  if (u.getAttribute('translate') === 'no') continue;
  const seg = u.getElementsByTagName('segment')[0];
  const src = seg.getElementsByTagName('source')[0].textContent!;
  const best = tm.map((m) => ({ ...m, s: similarity(src, m.src) })).sort((a, b) => b.s - a.s)[0];
  if (best?.s === 100) {                   // 정확 일치만 자동 채움
    const t = doc.createElementNS(seg.namespaceURI, 'target');
    t.textContent = best.tgt; seg.appendChild(t); seg.setAttribute('state', 'translated');
  } // 퍼지는 검수 큐로, 나머지는 신규
}
// QA: 변수 이름 보존 (ICU 인자)
const vars = (s: string) => [...s.matchAll(/\{(\w+)[,}]/g)].map((m) => m[1]).sort().join();
if (vars(source) !== vars(target)) report('플레이스홀더 불일치');
```

- 확인한 동작: 4개 unit 중 정확 일치 → `translated` 로 채움, 유사도 83% 는 검수 대기, 번역 제외는 건너뜀, 복수형 메시지는 신규, 변수 이름 비교가 `{count, plural, …}` 에서 `count` 를 보존. 유사도는 레벤슈타인 기반 단순 구현이다.
- 한계: 변수 이름 비교만 한다. ICU 구문 전체 유효성, `#`·선택지 키 일치는 ICU 파서로 검사해야 한다(여기서 미구현).

### 6. 원문이 바뀔 때

- 원문 해시(또는 버전)를 같이 저장해 변경되면 해당 unit 의 `state` 를 `initial` 로 되돌리거나 "재검수 필요"로 표시한다. 번역이 이전 원문 기준임을 숨기지 않는다.
- 삭제된 키는 번역 파일에서 정리한다(고아 번역).

## 언제 쓰나

- 2개 이상 언어를 외주 번역가·번역 도구와 함께 운영할 때.
- 문자열이 수백 개 이상이거나 릴리스마다 원문이 바뀔 때.
- 한 언어(예: 한국어 단독)이고 개발자가 직접 번역한다면 XLIFF·TM 은 과하다. 키-값 파일 + 용어집 + 리뷰로 충분하다.

## 주의

- 도구가 요구하는 파일 형식(JSON·PO·XLIFF 등)에 따라 XLIFF 는 변환 단계일 수 있다. 변환 중 손실(문맥 노트, 상태)을 확인한다.
- 기계 번역 초안은 `translated` 가 아니라 검수 전 상태로 구분한다.
- 문장을 문자열 조각 이어붙이기로 만들면 어순이 다른 언어에서 깨진다. 한 문장은 한 메시지로([i18n UX](/develop-wiki/knowledge/ui-ux/i18n-ux/)).
- 번역문이 길거나 줄바꿈 규칙이 다르면 레이아웃이 깨진다([CJK 줄바꿈](/develop-wiki/knowledge/ui-ux/cjk-typography-line-breaking/)).

## 체크리스트

- [ ] 모든 문자열에 사용처·제한·변수 의미 노트가 붙는다
- [ ] 번역 금지 항목이 `translate="no"` 또는 용어집으로 표시된다
- [ ] TM 은 검수된 쌍만 받고, 정확 일치만 자동 채움한다
- [ ] 원문 변경 시 번역 상태가 되돌려진다
- [ ] 변수·복수형·길이 자동 QA 가 병합 전에 돈다
- [ ] 의사 현지화·실제 화면으로 레이아웃을 확인한다

## 흔한 실수

- "Save" 같은 한 단어를 문맥 없이 전달.
- 번역 후 원문 변경을 추적하지 않음.
- 퍼지 매치를 검수 없이 자동 승인.
- 번역 파일에 개발자가 직접 고친 뒤 TM·번역 도구에 반영하지 않아 다음 동기화에서 덮어씀.
