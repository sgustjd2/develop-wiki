---
title: 검색 쿼리 로그 분석과 0결과 쿼리 개선
aka: [Search Log Analysis, Search Analytics, Zero Results Queries, Null Search, Query Reformulation, 검색 로그 분석, 무결과 검색]
category: ui-ux
group: interaction
level: intermediate
summary: 사이트 내 검색 로그에서 상위 쿼리·0결과 쿼리·재검색 흐름을 읽어 콘텐츠 공백, 용어 불일치, 철자 오류를 찾아 개선하는 절차와 집계 시 주의점.
tags: [ux, search, analytics, query-log, zero-results, findability, privacy]
related: [ui-ux/search-filter-sort, ui-ux/empty-states, ui-ux/information-scent-foraging, ui-ux/information-architecture-card-sorting, ui-ux/ux-metrics-sus-heart-ab-test, ui-ux/ux-research-method-selection]
sources:
  - https://www.nngroup.com/articles/search-log-analysis/
updatedAt: 2026-11-19
---

## 문제

- 사용자가 무엇을 찾는지 가장 직접 보여 주는 데이터가 로그에 쌓이는데 아무도 안 본다. NN/g 는 이를 UX 리서치에서 가장 크게 놓치는 기회 중 하나로 부른다.
- 검색 결과 UI 개선([검색·필터·정렬](/develop-wiki/knowledge/ui-ux/search-filter-sort/))은 했지만 어떤 쿼리가 실패하는지는 모른다.
- 결과 0건 화면 디자인은 [빈 상태](/develop-wiki/knowledge/ui-ux/empty-states/)에 있다. 이 노트는 **어떤 쿼리가 0건이 되는지 찾고 원인을 고치는** 쪽이다.

## 해법

### 1. 데이터 준비 (NN/g)

- 기간: 단기 급등(캠페인·뉴스)과 추세를 구분하려면 3~6개월. 정기 점검은 약 6개월마다.
- 세션 묶기: 사용자 식별자 + 시간순. 세션 창은 보통 15~20분. 같은 세션에서 비슷한 쿼리가 반복되면 앞선 검색이 실패했다는 신호다.
- 개인정보: IP·식별자는 민감하다. 공유 전에 제거하고, 분석 뒤 로그를 지운다.

### 2. 분석 항목

| 항목 | 보는 것 | 조치 |
| --- | --- | --- |
| 상위 쿼리 | 빈도 상위 약 1,000개 중 300개 정도에 집중, 동의어끼리 묶기 | 베스트 벳, 링크, 내비 이름 개선 |
| 상위 100개 직접 검색 | 첫 화면에 유용한 결과가 나오는지 | 랭킹·콘텐츠 보강 |
| 0결과 쿼리 | 철자 오류, 용어 불일치, 콘텐츠 없음 | 철자 교정, 동의어 사전, 콘텐츠 제작, 리디렉션 |
| 재검색 흐름 | 쿼리 → 수정 쿼리 | 실패 원인 추정 |
| 가장 긴 쿼리 | 사용자의 실제 문장 | 용어·FAQ 소재 |
| 빈 검색 | 검색 도구가 헷갈리거나 "전체 보기" 우회 | 내비 개선 |

- 몇 번 안 되는 0결과 쿼리는 무시한다(NN/g). 빈도순으로 정렬해 위쪽부터 본다.
- NN/g 예: 한 달에 "heating pads" 11,750회 검색, 구매는 13건 → 찾기 문제 신호. 같은 글의 예: 3개월간 27,840회 검색된 주제에 맞는 콘텐츠가 없음 → 콘텐츠 공백.

### 3. 0결과율 집계 예

쿼리를 소문자·공백 정규화한 뒤 세면, 같은 의도의 표기 흔들림이 합쳐진다. 아래는 장난감 로그(Node 로 실행 검증)다.

```ts
type Row = { q: string; n: number; results: number };
function zeroReport(log: Row[]) {
  const m = new Map<string, { n: number; zero: number }>();
  for (const { q, n, results } of log) {
    const k = q.trim().toLowerCase();
    const o = m.get(k) ?? { n: 0, zero: 0 };
    o.n += n;
    if (results === 0) o.zero += n;
    m.set(k, o);
  }
  const total = [...m.values()].reduce((s, o) => s + o.n, 0);
  const zero = [...m.values()].reduce((s, o) => s + o.zero, 0);
  return { zeroRate: zero / total, top: [...m].filter(([, o]) => o.zero).sort((a, b) => b[1].zero - a[1].zero) };
}
// 예: 5행(총 20회) 중 0결과 9회 → zeroRate 0.45, 'refund' 4회 전부 0건, 'hating pad' 2회 철자 오류
```

- 0결과율 하나만 보면 안 된다. "결과는 있지만 엉뚱한" 쿼리는 0결과에 안 잡힌다. 클릭률·재검색률을 같이 본다(이 노트의 제안, 출처 없음).

## 언제 쓰나

- 사이트 검색이 있고 문의·이탈이 높을 때, IA 개편 전 용어 수집, 콘텐츠 계획.

## 체크리스트

- [ ] 3~6개월 로그, 정규화(대소문자·공백·철자)했다
- [ ] 상위 쿼리와 0결과 쿼리를 빈도순으로 봤다
- [ ] 0결과 원인을 철자/용어/콘텐츠 없음/다른 곳에 있음으로 분류했다
- [ ] 다른 위치에 있는 콘텐츠는 리디렉션·베스트 벳을 건다
- [ ] 개인정보를 제거하고 보관 기간을 정했다
- [ ] 개선 후 같은 쿼리의 0결과율을 다시 쟀다

## 흔한 실수·주의

- **로그만으로 의도를 단정.** 많이 검색된 이유가 필요 때문인지 내비가 헷갈려서인지 구분한다. 사용성 테스트로 확인한다.
- **공유 IP를 한 사람으로 취급.** 회사·프록시는 여러 사람이다(NN/g).
- **이상 쿼리 무시.** 감정적인 긴 문장은 고객 문제 신호이고, 코드 같은 입력은 보안 사고일 수 있다(NN/g).
- **숫자 쿼리.** 제품 번호·전화번호 검색일 수 있어 전용 검색이 필요할 수 있다(NN/g).
- 동의어 사전·철자 교정 구현은 검색 엔진마다 다르다. 이 노트에서 다루지 않았고 Rosenfeld 의 『Search Analytics for Your Site』도 읽지 못했다.
