---
title: 정수와 부동소수점 표현
aka: [Integer Representation, Two's Complement, Overflow, IEEE 754, Floating Point, Double Precision, MAX_SAFE_INTEGER, Decimal]
category: cs-fundamentals
group: architecture
level: beginner
summary: 컴퓨터는 정수를 고정 비트의 2의 보수로, 실수를 IEEE 754 부동소수점(부호·지수·가수)으로 저장한다. 오버플로, 0.1+0.2, 2^53 넘는 ID, 돈 계산 오류가 모두 여기서 나온다.
tags: [architecture, numbers, ieee754, floating-point, javascript, overflow, money]
related: [cs-fundamentals/cpu-cache-locality, cs-fundamentals/interpreter-compiler-jit]
sources:
  - https://docs.oracle.com/cd/E19957-01/806-3568/ncg_goldberg.html
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER
updatedAt: 2026-11-18
---

## 정수: 2의 보수

n 비트 부호 있는 정수는 -2^(n-1) ~ 2^(n-1)-1 을 표현한다. 음수는 "모든 비트 뒤집고 +1"로 만든다. 덕분에 덧셈 회로 하나로 양수·음수를 다 계산한다.

| 타입 | 범위 |
| --- | --- |
| int8 | -128 ~ 127 |
| int32 | 약 ±21억 (-2,147,483,648 ~ 2,147,483,647) |
| int64 | 약 ±9.22 × 10^18 |
| uint32 | 0 ~ 약 42.9억 |

**오버플로**는 범위를 넘을 때 생긴다. 언어마다 처리가 다르다.

| 언어 | 정수 오버플로 |
| --- | --- |
| Go, Java | 조용히 감싸짐(wrap around) |
| C/C++ | 부호 있는 정수는 **정의되지 않은 동작** |
| Rust | 디버그 빌드에서 패닉, 릴리스에서 감쌈 (명시적 `checked_*` 제공) |
| Python | 임의 정밀도라 오버플로 없음 |

int32 를 쓰는 DB 의 자동 증가 PK 가 21억에서 멈추는 사고가 실제로 흔하다.

## 부동소수점: IEEE 754

MDN 기준 JavaScript `Number` 는 IEEE 754 배정밀도(64비트)다.

```
| 부호 1 | 지수 11 | 가수(유효숫자) 52 (+ 숨은 1비트 = 53비트 정밀도) |
값 = (-1)^부호 × 1.가수 × 2^(지수-1023)
```

### 0.1 이 정확하지 않은 이유

Goldberg 의 *What Every Computer Scientist Should Know About Floating-Point Arithmetic* 이 설명하듯, 0.1 은 10진수로는 유한하지만 2진수로는 무한 반복 소수다. 저장할 때 가장 가까운 값으로 반올림되고, 그 오차가 연산에서 드러난다.

```ts
0.1 + 0.2 === 0.3;                 // false (0.30000000000000004)
Math.abs(0.1 + 0.2 - 0.3) < Number.EPSILON; // 비교는 허용 오차로
```

### 안전한 정수 범위

가수가 53비트라서 **-(2^53-1) ~ 2^53-1** 까지만 모든 정수를 정확히 표현한다(`Number.MAX_SAFE_INTEGER` = 9007199254740991).

```ts
9007199254740992 === 9007199254740993; // true (!)
JSON.parse('{"id": 1234567890123456789}').id; // 1234567890123456800 로 변형
```

트위터 스노플레이크·DB `bigint` ID 를 JSON 숫자로 주면 JS 클라이언트에서 값이 바뀐다. **64비트 ID 는 문자열로 직렬화**하거나 `BigInt` 를 쓴다.

### 특수 값

| 값 | 생기는 경우 | 주의 |
| --- | --- | --- |
| `Infinity` | `1/0`, 범위 초과 | |
| `NaN` | `0/0`, `parseFloat('abc')` | `NaN !== NaN` → `Number.isNaN` 사용 |
| `-0` | `-1/Infinity` | `0 === -0` 이지만 `Object.is(0, -0)` 은 false |

## 개발자에게 왜 중요한가: 돈

```ts
// 나쁨: 부동소수점으로 금액 계산
0.1 * 3;                    // 0.30000000000000004
// 좋음 1: 최소 단위 정수 (원, 센트)
const priceCents = 1999n;   // BigInt 또는 안전 범위 안의 정수
const total = priceCents * 3n;
// 좋음 2: 10진 고정소수점 라이브러리 / DB 의 DECIMAL(NUMERIC) 타입
```

- DB 에서는 `FLOAT`/`DOUBLE` 대신 `DECIMAL(p, s)`/`NUMERIC` 을 쓴다.
- 반올림 규칙(은행가 반올림 등)과 통화별 소수 자릿수(JPY 0, KRW 0, USD 2)를 명시한다.

## 언제 무엇을

| 용도 | 타입 |
| --- | --- |
| 금액, 수량, 정확한 십진 값 | 정수 최소 단위, DECIMAL |
| 64비트 ID | int64 (서버), 문자열 (JSON/JS 경계) |
| 측정값, 그래픽, 과학 계산, ML | float64 / float32 (근사가 허용되는 곳) |
| 카운터 | 충분히 큰 정수 (int64), 오버플로 가능성 검토 |

## 주의 (비용)

- 부동소수점은 결합 법칙이 성립하지 않는다. `(a+b)+c` 와 `a+(b+c)` 가 다를 수 있어, 병렬 합계의 결과가 실행마다 미세하게 다를 수 있다.
- 부동소수점 동등 비교(`==`)는 거의 항상 버그다. 허용 오차를 둔다. 단, 허용 오차도 값의 크기에 맞게 정해야 한다(`Number.EPSILON` 은 1 근처에서만 의미 있음).
- `BigInt`·DECIMAL 은 느리고 메모리를 더 쓴다. 정확성이 필요한 곳에만 쓴다.
- 언어 간 경계(JSON, protobuf, DB 드라이버)에서 타입이 바뀌는지 확인한다. 같은 "숫자"가 다른 표현으로 변환된다.
