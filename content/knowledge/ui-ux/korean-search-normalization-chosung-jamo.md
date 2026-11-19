---
title: 한글 검색 정규화 — 초성 검색·영타 변환·NFC/NFD·자모 분해
aka: [Korean Search Normalization, Chosung Search, Initial Consonant Search, Hangul Syllable Decomposition, Dubeolsik Key Mapping, Unicode Normalization NFC NFD, 초성 검색, 한영 자판 변환, 자모 분해]
category: ui-ux
group: interaction
level: intermediate
summary: 한글 검색에서 초성만 친 쿼리, 한/영 전환을 잊고 친 영타 쿼리, NFC/NFD 정규화 차이로 놓치는 결과를 Unicode 3.12 음절 분해 공식과 두벌식 키 매핑으로 처리하는 방법과 오탐 주의점.
tags: [ux, search, korean, hangul, unicode, normalization, nfc, ime, i18n]
related: [ui-ux/search-synonyms-typo-correction-ux, ui-ux/search-quality-metrics-mrr-ndcg, ui-ux/korean-ime-composition-input, ui-ux/combobox-autocomplete, ui-ux/search-query-log-analysis-zero-results, ui-ux/i18n-ux, algorithms/trie]
sources:
  - https://www.unicode.org/versions/Unicode18.0.0/core-spec/chapter-3/
  - https://unicode.org/reports/tr15/
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize
  - https://developer.apple.com/library/archive/technotes/tn/tn1150.html
  - https://ko.wikipedia.org/wiki/두벌식_자판
updatedAt: 2026-11-19
---

## 문제

한글 검색에서 0결과가 나는 흔한 원인 셋. 일반 동의어·오타 교정([동의어·오타 교정](/develop-wiki/knowledge/ui-ux/search-synonyms-typo-correction-ux/))으로는 안 잡힌다.

1. **초성 쿼리.** 연락처·메뉴에서 "ㄷㅎㅁㄱ" 으로 "대한민국"을 찾는 습관. 문자열 포함 검사로는 매치되지 않는다.
2. **영타 쿼리.** 한/영 전환을 잊고 "한글"을 치면 "gksrmf" 가 들어간다.
3. **정규화 불일치.** 화면에는 같은 "한글"이지만 한쪽은 음절 2자(NFC), 다른 쪽은 자모 6자(NFD)라 `===`·`includes` 가 실패한다.

## 해법

### 1. 음절 분해 공식 (Unicode 3.12)

현대 한글 음절 11,172자(U+AC00~U+D7A3)는 초성 19 × 중성 21 × 종성 28(없음 포함)의 조합 순서대로 배열돼 있다. 표준 3.12절의 상수와 식:

- `SBase=AC00`, `LBase=1100`, `VBase=1161`, `TBase=11A7`, `LCount=19`, `VCount=21`, `TCount=28`, `NCount=588`, `SCount=11172`
- `SIndex = s − SBase`
- `LIndex = SIndex div NCount`, `VIndex = (SIndex mod NCount) div TCount`, `TIndex = SIndex mod TCount` (0 이면 종성 없음)
- 합성은 역순: `s = SBase + (LIndex × VCount + VIndex) × TCount + TIndex`

표준의 예 U+D4DB(퓛)를 직접 계산하면 SIndex 10459 → (17, 16, 15) → U+1111, U+1171, U+11B6 으로 표준과 같다.

### 2. 초성 검색

```ts
const SBase = 0xac00, NCount = 588, SCount = 11172;
const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'; // LIndex 순서

const chosung = (s: string) =>
  [...s.normalize('NFC')].map((ch) => {
    const i = ch.codePointAt(0)! - SBase;
    return i >= 0 && i < SCount ? CHO[Math.floor(i / NCount)] : ch;
  }).join('');

const isChosungQuery = (q: string) => /^[ㄱ-ㅎ]+$/.test(q); // 호환 자모 자음만
const matches = (title: string, q: string) =>
  isChosungQuery(q) ? chosung(title).includes(q) : title.normalize('NFC').includes(q.normalize('NFC'));
```

- Node 실행: `chosung('한글 검색')` → `ㅎㄱ ㄱㅅ`, "대한민국"에 `ㄷㅎ`·`ㅎㅁ` 은 매치, `ㄷㅁ` 은 불일치.
- 사용자가 치는 초성은 **호환 자모**(U+3131~)다. 결합용 자모(U+1100~)와 다른 코드 포인트라 위 표처럼 호환 자모 문자열로 비교한다.
- 함정: 호환 자모에 NFKC 를 적용하면 결합용 자모로 바뀐다(Node 확인: U+3131 → U+1100). 쿼리 전체에 NFKC 를 거는 파이프라인이면 초성 판별 전에 하지 않는다.
- 색인 시 제목의 초성 문자열을 별도 필드로 미리 만들어 둔다. 매 검색마다 전체를 분해하지 않는다. 접두 검색이면 [트라이](/develop-wiki/knowledge/algorithms/trie/)에 초성 키를 넣는다.

### 3. 영타 → 한글 변환 (두벌식)

두벌식(KS X 5002)은 자음을 왼손, 모음을 오른손 쪽에 둔다. 키 매핑을 표로 두고, 자모열을 음절로 조합한다.

| 줄 | 키 → 자모 |
| --- | --- |
| 윗줄 | q ㅂ, w ㅈ, e ㄷ, r ㄱ, t ㅅ, y ㅛ, u ㅕ, i ㅑ, o ㅐ, p ㅔ |
| 가운데 | a ㅁ, s ㄴ, d ㅇ, f ㄹ, g ㅎ, h ㅗ, j ㅓ, k ㅏ, l ㅣ |
| 아랫줄 | z ㅋ, x ㅌ, c ㅊ, v ㅍ, b ㅠ, n ㅜ, m ㅡ |
| Shift | Q ㅃ, W ㅉ, E ㄸ, R ㄲ, T ㅆ, O ㅒ, P ㅖ |

조합 규칙(이 노트의 구현 기준):

- 자음 뒤 모음 → 음절 시작. 모음 뒤 자음 → 받침 후보.
- 복합 모음: ㅗ+ㅏ=ㅘ, ㅗ+ㅐ=ㅙ, ㅗ+ㅣ=ㅚ, ㅜ+ㅓ=ㅝ, ㅜ+ㅔ=ㅞ, ㅜ+ㅣ=ㅟ, ㅡ+ㅣ=ㅢ.
- 겹받침: ㄳ ㄵ ㄶ ㄺ ㄻ ㄼ ㄽ ㄾ ㄿ ㅀ ㅄ. ㄸ·ㅃ·ㅉ 은 받침이 될 수 없다.
- **받침 뒤 모음이 오면 받침이 다음 음절 초성으로 이동**한다. 겹받침이면 뒤 자음만 이동(ㄺ+ㅣ → ㄹ / 기).

```ts
const KEY: Record<string, string> = { q:'ㅂ',w:'ㅈ',e:'ㄷ',r:'ㄱ',t:'ㅅ',y:'ㅛ',u:'ㅕ',i:'ㅑ',o:'ㅐ',p:'ㅔ',a:'ㅁ',s:'ㄴ',d:'ㅇ',f:'ㄹ',g:'ㅎ',h:'ㅗ',j:'ㅓ',k:'ㅏ',l:'ㅣ',z:'ㅋ',x:'ㅌ',c:'ㅊ',v:'ㅍ',b:'ㅠ',n:'ㅜ',m:'ㅡ',Q:'ㅃ',W:'ㅉ',E:'ㄸ',R:'ㄲ',T:'ㅆ',O:'ㅒ',P:'ㅖ' };
const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ', JUNG = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ';
const JONG = ['', ...'ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ'];
const V2: Record<string, string> = { ㅗㅏ:'ㅘ',ㅗㅐ:'ㅙ',ㅗㅣ:'ㅚ',ㅜㅓ:'ㅝ',ㅜㅔ:'ㅞ',ㅜㅣ:'ㅟ',ㅡㅣ:'ㅢ' };
const T2: Record<string, string> = { ㄱㅅ:'ㄳ',ㄴㅈ:'ㄵ',ㄴㅎ:'ㄶ',ㄹㄱ:'ㄺ',ㄹㅁ:'ㄻ',ㄹㅂ:'ㄼ',ㄹㅅ:'ㄽ',ㄹㅌ:'ㄾ',ㄹㅍ:'ㄿ',ㄹㅎ:'ㅀ',ㅂㅅ:'ㅄ' };
const SPLIT = Object.fromEntries(Object.entries(T2).map(([k, v]) => [v, [...k]]));

function en2ko(input: string): string {
  let out = '', c = '', v = '', t = ''; // 조합 중인 음절의 초·중·종
  const flush = () => {
    out += c && v ? String.fromCharCode(0xac00 + (CHO.indexOf(c) * 21 + JUNG.indexOf(v)) * 28 + JONG.indexOf(t)) : c + v;
    c = v = t = '';
  };
  for (const ch of input) {
    const j = KEY[ch] ?? KEY[ch.toLowerCase()];
    if (!j) { flush(); out += ch; continue; }
    if (JUNG.includes(j)) {
      if (t) { const [keep, move] = SPLIT[t] ?? ['', t]; t = keep; flush(); c = move; v = j; } // 받침 이동
      else if (v && V2[v + j]) v = V2[v + j];
      else if (v || !c) { flush(); v = j; }
      else v = j;
    } else if (c && v && !t && JONG.includes(j)) t = j;
    else if (t && T2[t + j]) t = T2[t + j];
    else { flush(); c = j; }
  }
  flush();
  return out;
}
```

위 코드를 Node 로 돌린 결과: `dkssudgktpdy` → 안녕하세요, `ekfr` → 닭, `ekfrdl` → 닭이, `ekfrl` → 달기, `rkqt` → 값, `qhRdma` → 볶음, `Rhc` → 꽃, `dmlwk` → 의자. 기대값을 적은 15개 사례 모두 일치.

UX 적용:

- 원 쿼리가 **전부 라틴 문자이고 결과가 0건(또는 매우 적음)** 일 때만 변환해 본다. 영어 단어도 변환은 되므로(예: "is" → ㅑㄴ) 무조건 바꾸면 영어 검색을 망친다.
- 변환 쿼리 결과가 있으면 "'gksrmf' 결과가 없어 '한글' 결과를 보여 줍니다 / 'gksrmf' 로 검색" 처럼 **어떻게 바꿨는지 보이고 되돌릴 수 있게** 한다. 자동 교정·제안의 구분은 동의어·오타 교정 노트의 기준을 따른다.
- 반대 방향(한글 상태에서 "python" 을 쳐 "ㅔㅛ쇄ㅜ" 가 된 경우)도 같은 표로 역변환할 수 있다. 단, 조합 결과(쇄 = ㅅ+ㅗ+ㅐ)를 자모로 풀어 키로 되돌려야 한다.

### 4. 정규화 (NFC/NFD)

- 같은 "한" 이 NFC 에서는 U+D55C 1자, NFD 에서는 U+1112 U+1161 U+11AB 3자다. Node 에서 "한글"은 NFC 길이 2, NFD 길이 6 이고 `'한글'.normalize('NFD').includes('한')` 은 `false`.
- NFD 가 들어오는 경로의 예: HFS Plus 는 파일 이름을 완전 분해형으로 저장한다(Apple TN1150). 그 경로를 거친 파일명·업로드 메타데이터는 분해형일 수 있다.
- 규칙: **색인과 쿼리를 같은 형식으로**. 한글 검색에서는 보통 둘 다 NFC 로 저장·비교한다. 경계(입력 수신, 파일명 읽기, 외부 API 응답)에서 한 번 정규화한다.
- NFC/NFD 는 정준 동등(같은 글자)만 맞춘다. 전각 영숫자·호환 자모까지 맞추려면 NFKC 가 필요하지만 위 초성 함정처럼 의미가 바뀌는 변환이 있어 필드별로 정한다(UAX #15).

## 언제 쓰나

| 기능 | 맞는 곳 |
| --- | --- |
| 초성 검색 | 짧은 고유명사 목록: 연락처, 메뉴·설정, 지명·역명, 상품명 자동완성 |
| 영타 변환 | 0결과 복구, 자동완성 보조 |
| NFC 정규화 | 모든 한글 텍스트 색인·비교 (기본값) |

## 주의·비용

- **초성 오탐.** 초성 2자("ㄱㅅ")는 수많은 단어와 맞는다. 짧은 초성 쿼리는 결과가 넘친다. 접두 일치 우선, 자주 쓰는 항목 우선 같은 순위 규칙이 필요하다.
- **혼합 쿼리.** "대ㅎ"·"ㄷ한" 같은 혼합 입력은 위 코드로 처리되지 않는다. 지원하려면 음절별로 "완성 음절이면 일치, 초성이면 초성 비교"를 하는 별도 매처가 필요하다.
- **쌍자음.** "ㄱ" 을 친 사용자가 "까"를 기대하는지 정책을 정한다. 위 코드는 ㄱ과 ㄲ을 구분한다.
- **조합 중 입력.** 입력창 값이 조합 중이면 "ㄷ" 처럼 초성만 잠깐 보인다. 실시간 검색이 이것을 초성 쿼리로 처리해 결과가 깜박일 수 있다 → [한글 IME 조합 입력](/develop-wiki/knowledge/ui-ux/korean-ime-composition-input/)
- **옛한글·자모 조합.** 3.12 공식은 현대 한글 11,172자만 다룬다. 옛한글 자모열은 음절로 합성되지 않는다.
- **자판 변종.** 세벌식 사용자나 모바일 자판 입력은 두벌식 표로 복구되지 않는다.
- 효과 측정: 기능 도입 전후로 0결과율과 해당 쿼리 유형의 nDCG·MRR 을 나눠 본다 → [검색 품질 지표](/develop-wiki/knowledge/ui-ux/search-quality-metrics-mrr-ndcg/)

## 체크리스트

- [ ] 색인·쿼리 모두 NFC 정규화 (입력 경계에서 한 번)
- [ ] 초성 필드를 색인 시 생성, 초성 쿼리 판별은 NFKC 전
- [ ] 영타 변환은 0결과일 때만, 변환 사실과 원 쿼리 링크 표시
- [ ] 초성·영타 쿼리를 로그에서 별도 집계

## 검증 범위

- 분해 상수·식은 Unicode 18.0.0 핵심 명세 3.12절에서 확인했다. 합성 식은 분해 식의 역으로 적었고, 3.12.3절 본문 식과 글자 단위로 대조하지는 않았다.
- 두벌식 키별 배치는 KS X 5002 원문으로 확인하지 못했다(유료 표준). 한국어 위키백과에서 표준명·Shift 쌍자음과 ㅒ·ㅖ 구성만 확인했고, 키별 표는 널리 쓰이는 배치를 구현해 사례로 검산한 것이다. 위키백과는 Shift 입력이 표준의 엄격한 규정이 아니라 권고라고 적는다.
- 현재 macOS 기본 파일 시스템(APFS)의 파일명 정규화 동작은 확인하지 않았다. HFS Plus 서술만 Apple 문서로 확인했다.
