---
title: 속성 기반 테스트
aka: [Property-Based Testing, PBT, QuickCheck, fast-check, Hypothesis, Generative Testing]
category: testing-practice
level: intermediate
summary: 입력 예시 몇 개 대신 "모든 입력에서 성립해야 하는 성질"을 적고, 도구가 무작위 입력 수백 개를 만들어 반례를 찾고 최소 형태로 줄여 주는 테스트 기법.
tags: [testing, property-based, fast-check, fuzzing, shrinking]
related: [testing-practice/tdd, testing-practice/test-pyramid-trophy, distributed-systems/idempotency]
sources:
  - https://fast-check.dev/docs/introduction/
  - https://fast-check.dev/docs/introduction/what-is-property-based-testing/
  - https://hypothesis.readthedocs.io/en/latest/
updatedAt: 2026-11-18
---

Haskell 의 QuickCheck(Koen Claessen·John Hughes, 2000)에서 시작해 지금은 대부분 언어에 구현이 있다. TypeScript 는 fast-check, Python 은 Hypothesis, JVM 은 jqwik 등.

## 문제

예시 기반 테스트는 **내가 떠올린 입력**만 검사한다. 빈 문자열, 유니코드 조합 문자, 음수, 중복 원소, 아주 긴 배열 같은 경계값은 생각나지 않으면 빠진다. 버그는 대개 거기 있다.

## 해법

1. **성질(property)**: 입력과 출력 사이에 항상 성립해야 하는 관계를 함수로 적는다.
2. **생성기(arbitrary)**: 입력 타입별로 무작위 값을 만드는 정의. 조합해서 복잡한 구조도 만든다.
3. **실행**: 도구가 입력을 수백 개(fast-check 기본 100개) 만들어 성질을 검사한다.
4. **축소(shrinking)**: 실패하면 반례를 여전히 실패하는 가장 작은 형태로 줄여 보여 준다.
5. **재현**: 실패 시 시드를 출력하므로 같은 입력으로 다시 돌릴 수 있다.

```ts
import fc from 'fast-check';

// 왕복(round-trip): 인코딩 후 디코딩하면 원래대로
test('encode/decode 왕복', () => {
  fc.assert(fc.property(fc.string(), (s) => decode(encode(s)) === s));
});

// 불변식: 정렬 결과는 길이가 같고, 비내림차순
test('sort 불변식', () => {
  fc.assert(fc.property(fc.array(fc.integer()), (xs) => {
    const ys = mySort(xs);
    return ys.length === xs.length && ys.every((v, i) => i === 0 || ys[i - 1] <= v);
  }));
});
```

## 성질을 찾는 요령

| 유형 | 예 |
| --- | --- |
| 왕복 | `parse(format(x)) == x`, 직렬화·압축·암호화 |
| 불변식 | 정렬 후 길이 동일, 이체 후 총액 보존 |
| 멱등 | `f(f(x)) == f(x)` — 정규화, 중복 제거, [멱등 API](/develop-wiki/knowledge/distributed-systems/idempotency/) |
| 기준 구현과 비교(오라클) | 최적화한 함수 vs 느리지만 확실한 함수 |
| 교환·결합 | 머지 순서와 무관한 결과 (CRDT, 집계) |
| 상태 기계 모델 | 명령 시퀀스를 무작위로 만들어 실제 시스템과 단순 모델을 비교 |

## 언제 쓰나

- 파서, 직렬화, 인코딩, 날짜·금액 계산, 자료구조, 동시성 없는 핵심 알고리즘.
- 기존 예시 테스트가 많은데도 경계값 버그가 계속 나올 때.

## 주의 (비용)

- **좋은 성질을 찾는 것이 어렵다.** 구현을 그대로 다시 쓴 성질은 아무것도 검증하지 않는다.
- 무작위라 매 실행 입력이 달라진다. CI 에서 실패하면 출력된 시드로 재현하고, 찾은 반례는 예시 테스트로 고정해 둔다.
- 생성기가 실제 분포와 다르면(예: 대부분 짧은 문자열) 깊은 버그를 못 찾는다. 생성기를 도메인에 맞게 좁히거나 넓힌다.
- 실행 횟수만큼 느려진다. I/O 가 있는 코드보다 순수 함수에 쓴다.
- 예시 테스트를 대체하지 않는다. 예시는 문서 역할을 하고, 성질은 빈틈을 찾는다.
