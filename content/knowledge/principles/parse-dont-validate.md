---
title: Parse, Don't Validate
aka: [파싱 대 검증, Shotgun Parsing, Make Illegal States Unrepresentable, Type-Driven Design, Smart Constructor]
category: principles
level: intermediate
summary: 입력을 검사하고 버리는 대신, 검사 결과를 더 정확한 타입으로 바꿔 경계에서 한 번만 확인하고 이후 코드가 그 보장을 타입으로 믿게 하는 원칙.
tags: [type-driven, validation, parsing, invariants, input-handling, security]
related: [principles/result-option-error-handling, principles/coupling-and-cohesion, principles/dry-kiss-yagni, testing-practice/property-based-testing, architecture/aggregate-domain-events, mobile-dev/deep-link-security, security/sql-injection]
sources:
  - https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/
updatedAt: 2026-11-19
---

원 글은 Alexis King 의 2019년 글이고 예시는 Haskell 이다. 여기서는 TypeScript 로 옮겼다.

## 문제

```ts
function validateEmail(s: string): void { if (!s.includes('@')) throw new Error(); }

function register(email: string) {
  validateEmail(email);        // 검사만 하고 결과는 버림
  sendWelcome(email);          // 여기선 또 그냥 string
}
```

- 검증 함수는 "통과했다"는 사실을 어디에도 남기지 않는다. 다음 함수는 여전히 `string` 이라 **다시 검사하거나, 검사됐다고 믿어야** 한다.
- 믿음은 코드가 바뀌면 조용히 깨진다. 호출 경로 하나에서 검증이 빠져도 컴파일러는 모른다.
- 검사를 처리 중간에 흩뿌리면(원문의 shotgun parsing) 입력 일부를 이미 처리한 뒤에야 나머지가 틀렸음을 알게 되어, 되돌리기 어려운 부분 처리가 남는다.

## 해법

검증 대신 **파싱**한다. 같은 검사를 하되 결과로 더 좁은 타입을 돌려준다.

```ts
type Email = string & { readonly __brand: 'Email' };

function parseEmail(s: string): Email | null {          // 실패 가능성을 반환 타입에 드러냄
  return /^[^@\s]+@[^@\s]+$/.test(s) ? (s as Email) : null;
}

function register(email: Email) { sendWelcome(email); } // 검사됐음이 시그니처에 있음

// 경계(컨트롤러, 링크 파서)에서 한 번
const email = parseEmail(input);
if (!email) return badRequest();
register(email);
```

- 원문의 대표 예: "첫 원소를 꺼내는 함수"가 빈 목록에서 실패하는 문제를 반환 타입을 `Maybe` 로 약화하는 대신, 입력 타입을 `NonEmpty` 로 **강화**한다. 비어 있지 않음 확인은 경계에서 한 번이고, 그 확인을 지우면 컴파일이 깨진다.
- **불가능한 상태를 표현 불가능하게** 만든다. 키 중복이 없어야 하면 쌍의 리스트 대신 Map 을 쓰는 식이다.
- 증명의 부담을 시스템 경계 쪽으로 밀되, 필요한 만큼까지만 민다. 경계에서 파싱하고 안쪽은 파싱된 타입만 받는다. 데이터 타입이 코드를 이끌게 한다.
- 파싱 실패는 값으로 돌려준다. [Result·Option 오류 처리](/develop-wiki/knowledge/principles/result-option-error-handling/)와 맞물린다.
- 언어가 표현하기 어려운 불변식은 스마트 생성자(검사를 통과해야만 만들 수 있는 타입)로 흉내 낸다. 원문도 이를 대안으로 든다.

## 언제 쓰나

- HTTP 요청, 설정 파일, 메시지, 딥링크처럼 **신뢰 경계를 넘어 들어오는 모든 입력**. 예: 링크 문자열을 `Route` 로 파싱([딥링크 보안](/develop-wiki/knowledge/mobile-dev/deep-link-security/)).
- ID·금액·이메일 같은 값 객체, 집합체의 불변식 생성([집합체](/develop-wiki/knowledge/architecture/aggregate-domain-events/)).

## 주의·비용

- 원문이 스스로 밝히듯 파싱과 검증의 경계는 모호하고, 이 원칙은 지켜야 할 규칙이 아니라 **지향점**이다.
- 모든 불변식을 타입으로 올릴 수는 없다. 인코딩 비용이 이득보다 크면 런타임 검사와 문서로 둔다. 원문도 제거하려고 복잡한 기법까지 쓸 가치는 없다고 한다.
- TypeScript 의 브랜드 타입은 `as` 단언 한 번으로 우회된다. 단언은 파서 안에만 두고 코드 리뷰로 지킨다. 언어별 보장 강도가 다르다.
- 타입이 늘면 변환 코드와 모델이 늘어난다(요청 DTO, 파싱된 타입, 영속 모델). 작은 코드에서는 과설계일 수 있다. [DRY·KISS·YAGNI](/develop-wiki/knowledge/principles/dry-kiss-yagni/).
- 권한 확인은 파싱보다 먼저 해야 할 수 있다(원문: DoS 방지 관점). 또 파싱을 통과한 값이라도 SQL·HTML 로 쓸 때는 출력 맥락별 인코딩이 따로 필요하다. [SQL 인젝션](/develop-wiki/knowledge/security/sql-injection/).
- 속성 기반 테스트로 "파싱 후 직렬화하면 원래 값"같은 성질을 검증하면 좋다. [속성 기반 테스트](/develop-wiki/knowledge/testing-practice/property-based-testing/).
