---
title: SQL 인젝션 방어
aka: [SQL Injection, SQLi, Parameterized Query, Prepared Statement, 파라미터 바인딩]
category: security
level: beginner
summary: 사용자 입력이 SQL 문장의 구조로 해석되어 데이터 유출·변조가 일어나는 SQL 인젝션을, 파라미터 바인딩과 식별자 허용 목록, 최소 권한으로 막는 방법.
tags: [owasp, injection, sql, database, web-security]
related: [security/owasp-top-10, security/xss, security/csrf, data-modeling/index-design]
sources:
  - https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html
  - https://top10.owasp.org/2025/A05_2025-Injection/
updatedAt: 2026-11-18
---

OWASP Top 10:2025 의 A05 Injection 에 속한다. 오래된 취약점이지만 문자열로 쿼리를 조립하는 코드가 있는 한 계속 나온다.

## 문제

```ts
// 취약: 입력이 SQL 문법의 일부가 된다
const q = `SELECT * FROM users WHERE email = '${email}' AND deleted = false`;
// email = "x' OR '1'='1' --"  → 모든 사용자 반환
```

공격자는 조건을 바꾸거나(`OR 1=1`), 다른 테이블을 붙이거나(`UNION SELECT`), 결과가 안 보여도 참/거짓·지연 시간으로 데이터를 한 글자씩 빼낸다(블라인드 인젝션). DB 계정 권한에 따라 데이터 변경·삭제까지 이어진다.

## 해법

### 1. 값은 항상 파라미터로 바인딩

SQL 구조와 데이터를 분리해 DB 에 따로 보낸다. 값은 무엇이 들어와도 값으로만 취급된다.

```ts
await db.query('SELECT * FROM users WHERE email = $1 AND deleted = false', [email]);

// ORM·쿼리 빌더도 같은 원리. 단, raw 탈출구는 조심
await prisma.$queryRaw`SELECT * FROM users WHERE email = ${email}`;      // 태그드 템플릿 → 바인딩
await prisma.$queryRawUnsafe(`SELECT * FROM users WHERE email = '${email}'`); // 위험
```

### 2. 바인딩할 수 없는 부분은 허용 목록으로

테이블 이름, 칼럼 이름, `ASC`/`DESC` 같은 키워드는 파라미터 자리에 올 수 없다. 사용자 입력을 **미리 정한 값으로 매핑**하고 나머지는 거부한다.

```ts
const SORT_COLUMNS = { newest: 'created_at', price: 'price' } as const;
const col = SORT_COLUMNS[req.query.sort as keyof typeof SORT_COLUMNS] ?? 'created_at';
const dir = req.query.dir === 'asc' ? 'ASC' : 'DESC';
await db.query(`SELECT * FROM product ORDER BY ${col} ${dir} LIMIT $1`, [limit]);
```

### 3. 저장 프로시저도 안에서 문자열 조립하면 똑같다

프로시저 호출을 바인딩해도, 프로시저 내부에서 동적 SQL 을 이어 붙이면 취약하다. 내부에서도 바인딩한다.

### 4. 피해 줄이기 (심층 방어)

- 애플리케이션 DB 계정에 **필요한 권한만**. DBA·소유자 계정 금지.
- 기능별로 계정 분리(읽기 전용 보고용 계정 등), 필요하면 뷰로 칼럼·행 제한.
- DB 프로세스는 제한된 OS 계정으로.

## 언제 쓰나

- 모든 SQL. 예외 없음. "내부 관리자 화면이라서", "숫자만 들어와서"는 이유가 되지 않는다.

## 주의 (비용)

- **수동 이스케이프에 의존하지 않는다.** OWASP 는 이를 강하게 말린다. DB·설정·문자셋마다 규칙이 달라 틀리기 쉽다.
- 입력 검증은 보조 수단이다. 바인딩을 대체하지 않는다.
- `LIKE` 패턴의 `%`, `_` 는 바인딩해도 와일드카드로 동작한다. 검색어에서 이스케이프하거나 의도를 확인한다.
- 바인딩은 "어떤 행을 볼 권한이 있나"를 해결하지 않는다. `WHERE id = $1` 이 안전해도 남의 주문 ID 를 넣으면 조회된다 → 접근 제어는 따로(OWASP A01).
- 같은 원리가 NoSQL(쿼리 객체에 연산자 주입), OS 명령, LDAP, 템플릿 엔진에도 적용된다. 문자열 조립으로 "코드"를 만드는 곳이 모두 인젝션 지점이다.
