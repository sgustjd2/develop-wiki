---
title: 문자열 검색 (KMP)
aka: [KMP, Knuth-Morris-Pratt, Prefix Function, Failure Function, String Matching, 접두사 함수, 실패 함수]
category: algorithms
group: algorithm
level: advanced
summary: 텍스트에서 패턴을 찾을 때 이미 비교한 정보를 버리지 않아 O(n+m)을 보장하는 알고리즘. 패턴의 접두사 함수(실패 함수)로 불일치 시 어디서 다시 비교할지 미리 계산한다.
tags: [string, kmp, prefix-function, pattern-matching, text-search]
related: [algorithms/trie, algorithms/two-pointers-sliding-window, algorithms/dynamic-programming, algorithms/big-o-complexity]
sources:
  - https://cp-algorithms.com/string/prefix-function.html
  - https://cp-algorithms.com/string/rabin-karp.html
  - https://en.wikipedia.org/wiki/Knuth%E2%80%93Morris%E2%80%93Pratt_algorithm
  - https://en.wikipedia.org/wiki/Boyer%E2%80%93Moore_string-search_algorithm
  - https://en.wikipedia.org/wiki/Aho%E2%80%93Corasick_algorithm
updatedAt: 2026-11-18
---

## 문제

길이 n 텍스트에서 길이 m 패턴을 찾는 단순한 방법은 각 시작 위치마다 패턴을 처음부터 비교한다. `aaaa…ab` 안에서 `aaab` 를 찾듯 거의 맞다가 끝에서 틀리는 입력이면 O(nm) 이다. 불일치가 나면 **이미 맞춰 본 글자 정보**를 버리고 처음부터 다시 하기 때문이다.

## 해법

Knuth·Pratt 와, 독립적으로 Morris 가 고안해 1977년 함께 발표했다.

### 접두사 함수 π

`π[i]` = 패턴의 `p[0..i]` 에서 **진부분 접두사이면서 접미사인 가장 긴 길이**.

예: `abcabcd` → `[0, 0, 0, 1, 2, 3, 0]`. `abcabc` 의 끝 `abc` 가 앞의 `abc` 와 같으므로 π[5] = 3.

불일치가 나면 이미 맞은 `j` 글자 중 **접두사=접미사**인 `π[j-1]` 글자는 다시 맞춰 볼 필요가 없다. 그 위치부터 비교를 이어 간다. 텍스트 포인터는 **절대 뒤로 가지 않는다.**

```ts
function prefixFunction(p: string): number[] {
  const pi = new Array<number>(p.length).fill(0);
  for (let i = 1, k = 0; i < p.length; i++) {
    while (k > 0 && p[i] !== p[k]) k = pi[k - 1]; // 더 짧은 경계로 후퇴
    if (p[i] === p[k]) k++;
    pi[i] = k;
  }
  return pi;
}

// text 안의 pattern 시작 위치를 모두 반환
function kmpSearch(text: string, pattern: string): number[] {
  if (pattern.length === 0) return [];
  const pi = prefixFunction(pattern);
  const hits: number[] = [];
  for (let i = 0, j = 0; i < text.length; i++) {
    while (j > 0 && text[i] !== pattern[j]) j = pi[j - 1];
    if (text[i] === pattern[j]) j++;
    if (j === pattern.length) {
      hits.push(i - j + 1);
      j = pi[j - 1]; // 겹치는 다음 일치도 찾는다
    }
  }
  return hits;
}

console.log(prefixFunction("abcabcd"));      // [0, 0, 0, 1, 2, 3, 0]
console.log(kmpSearch("abababca", "abab")); // [0, 2]
```

`while` 이 들어 있지만 `j` 는 매 반복 최대 1 늘고, 줄어드는 총량은 늘어난 총량을 넘을 수 없으므로 전체 O(n) 이다([상각 분석](/develop-wiki/knowledge/algorithms/amortized-analysis/)).

## 문자열 검색 알고리즘 비교

| 알고리즘 | 전처리 | 검색 (최악) | 검색 (평균·실제) | 특징 |
| --- | --- | --- | --- | --- |
| 단순 비교 | 없음 | O(nm) | 대개 O(n) | 짧은 패턴이면 충분히 빠름 |
| KMP | O(m) | **O(n)** | O(n) | 최악 보장, 텍스트를 한 방향 스트리밍 |
| Boyer–Moore(-Horspool) | O(m + σ) | O(nm)(기본형) | **부선형** O(n/m) 가능 | 패턴 끝부터 비교, 크게 건너뜀. 긴 패턴·큰 알파벳에 강함 |
| Rabin–Karp | O(m) | O(nm) | O(n + m) 기대 | 롤링 해시. 여러 패턴·표절 탐지에 유리 |
| Z 알고리즘 | O(n + m) | O(n + m) | | KMP 와 같은 용도, 구현 취향 차이 |
| Aho–Corasick | O(Σ패턴 길이) | O(n + 출력) | | 여러 패턴 동시 → [트라이](/develop-wiki/knowledge/algorithms/trie/) |

## 언제 쓰나

- 최악 시간 보장이 필요할 때: 악의적 입력이 들어올 수 있는 서버 측 검색, 실시간 스트림 매칭.
- 텍스트를 되돌아 읽을 수 없는 스트리밍 입력(네트워크 패킷, 로그 파이프).
- 접두사 함수 자체의 응용: 문자열의 최소 주기 찾기(`n - π[n-1]`), 접두사 등장 횟수 세기.

## 주의

- **직접 구현하기 전에 표준 라이브러리를 쓴다.** `String.prototype.indexOf`/`includes`, Java `String.indexOf`, Python `in` 은 엔진이 최적화한 구현이며 일반 용도에선 대부분 더 빠르다.
- 실제 평균 성능은 Boyer–Moore 계열이 KMP 보다 좋은 경우가 많다. KMP 의 강점은 최악 보장과 스트리밍이다.
- 유니코드: JS 문자열 인덱스는 UTF-16 코드 유닛이다. 서로게이트 쌍·정규화(NFC/NFD) 차이로 "같아 보이는" 문자열이 매칭되지 않을 수 있다. 대소문자 무시·로케일 비교는 별도 처리가 필요하다.
- 패턴이 많으면 KMP 를 패턴마다 돌리지 말고 Aho–Corasick 이나 정규식 엔진(선형 시간 엔진 권장)을 쓴다.

## 실무에서

- 원조 Unix `fgrep` 은 여러 고정 문자열을 한 번에 찾는 Aho–Corasick 알고리즘을 기반으로 했다(KMP 의 다중 패턴 일반화).
- GNU grep 은 Boyer–Moore 알고리즘을 쓴다(Wikipedia, 개발자 Mike Haertel 의 "why GNU grep is fast" 메일 인용).
- 생물정보학의 염기 서열 검색, 편집기 "찾기", 로그 스트림의 키워드 감지.

> 참고: CLRS 4판 32장 "String Matching". Knuth, Morris, Pratt, "Fast Pattern Matching in Strings", SIAM J. Computing 6(2), 1977.
