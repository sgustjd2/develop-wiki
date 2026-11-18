---
title: 비밀번호 저장 (argon2id·scrypt·bcrypt)
aka: [Password Hashing, Password Storage, Argon2id, bcrypt, scrypt, PBKDF2, Salt, Pepper, Key Stretching]
category: security
level: intermediate
summary: 유출을 전제로 비밀번호를 저장하는 법. 느린 전용 해시(argon2id 우선)와 솔트, OWASP 권장 파라미터, 페퍼, 옛 해시를 옮기는 방법.
tags: [owasp, password, hashing, argon2, bcrypt, cryptography, authentication]
related: [security/secrets-management, security/session-vs-jwt, security/owasp-top-10, security/sql-injection, security/threat-modeling-stride]
sources:
  - https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
updatedAt: 2026-11-18
---

## 문제

DB 는 언젠가 샌다(SQL 인젝션, 백업 유출, 내부자). 그때 비밀번호가

- **평문·암호화**로 있으면: 그대로 노출. 암호화 키는 같은 서버에 있으므로 함께 샌다.
- **SHA-256 같은 빠른 해시**로 있으면: GPU 로 초당 수십억 번 대입해 흔한 비밀번호는 금방 풀린다. 솔트가 없으면 레인보 테이블로 한 번에 풀린다.

사용자는 비밀번호를 재사용하므로 피해는 우리 서비스 밖으로 번진다.

## 해법: 느리고 메모리를 먹는 전용 해시 + 솔트

- **해싱은 단방향**이다. 로그인 때 입력값을 같은 방식으로 해시해 비교한다. 복호화가 필요한 설계라면 잘못된 것이다.
- **솔트**: 사용자마다 다른 랜덤 값. 같은 비밀번호도 다른 해시가 되어 레인보 테이블과 일괄 대입이 막힌다. 아래 알고리즘들은 솔트를 자동으로 만들고 결과 문자열에 포함한다.
- **작업 계수(work factor)**: 한 번 계산을 일부러 느리게(그리고 메모리를 많이 쓰게) 만들어 대입 비용을 올린다. 하드웨어가 빨라지면 올린다.

### OWASP 권장 (2026-11 확인)

| 우선순위 | 알고리즘 | 최소 파라미터 | 비고 |
| --- | --- | --- | --- |
| 1 | **Argon2id** | m=19 MiB(19456 KiB), t=2, p=1 | 같은 강도 대안: m=46MiB/t=1, m=12MiB/t=3, m=9MiB/t=4, m=7MiB/t=5 |
| 2 | **scrypt** | N=2^17(128MiB), r=8, p=1 | Argon2id 를 못 쓸 때 |
| 3 | **bcrypt** | cost ≥ 10 (서버가 감당하는 만큼 높게) | 레거시용. **입력 72바이트 제한** |
| FIPS 필요 시 | PBKDF2 | HMAC-SHA256 60만 회 / HMAC-SHA512 21만 회 | 메모리 하드 아님 → GPU 에 약함 |

메모리 하드(Argon2id, scrypt)는 GPU·ASIC 이 병렬로 많이 돌리기 어렵게 만든다는 점에서 bcrypt·PBKDF2 보다 낫다.

```ts
// Node: argon2 패키지 (node-argon2)
import argon2 from 'argon2';

const hash = await argon2.hash(password, {
  type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1,
});
// → "$argon2id$v=19$m=19456,t=2,p=1$<salt>$<hash>"  (PHC 문자열: 알고리즘·파라미터·솔트 포함)

const ok = await argon2.verify(hash, input);          // 상수 시간 비교
if (ok && argon2.needsRehash(hash, { memoryCost: 19456, timeCost: 2 })) {
  await saveHash(userId, await argon2.hash(input, { type: argon2.argon2id }));
}
```

결과를 PHC 문자열 그대로 한 칼럼에 저장하면, 파라미터가 다른 옛 해시와 새 해시가 섞여도 각자 검증된다.

## 페퍼 (선택, 심층 방어)

- 모든 비밀번호에 공통으로 섞는 비밀 값. **DB 와 다른 곳**(시크릿 저장소, HSM)에 둔다. DB 만 샌 경우 대입이 불가능해진다.
- 방식: 해시 전에 섞거나, 해시 결과를 페퍼를 키로 HMAC.
- 비용: 페퍼가 바뀌면 평문 없이는 재계산할 수 없어 **전원 비밀번호 재설정**이 필요하다. 키 관리는 [시크릿 관리](/develop-wiki/knowledge/security/secrets-management/) 참고.

## 옛 해시 옮기기

1. **로그인 시 재해시**: 검증에 성공하면 그 평문으로 새 알고리즘 해시를 저장. 가장 깔끔하다.
2. 오래 로그인 안 한 계정: 해시를 만료시키고 재설정 요구(안전하지만 사용자 불편, 대량 만료는 유출로 오해받을 수 있음).
3. 급하면 **감싸기**: `argon2id(md5_hash)` 로 즉시 전체를 강화하고, 다음 로그인 때 직접 해시로 바꾼다.

## 언제 쓰나

- 사람이 기억하는 비밀(비밀번호, PIN)을 서버가 검증해야 할 때.
- **쓰지 않는 곳**: API 키·세션 토큰처럼 엔트로피가 충분한 기계 생성 값은 느린 해시가 필요 없다. SHA-256(또는 HMAC)으로 해시해 저장하면 된다. 암호화 키를 비밀번호에서 만들 때는 KDF 로 쓰되 목적이 다르다.

## 주의

- **직접 만들지 않는다.** `sha256(salt + password)` 를 몇 번 돌리는 자작 방식 대신 검증된 라이브러리를 쓴다.
- **bcrypt 72바이트**: 그 뒤는 잘려 무시된다(UTF-8 한글은 글자당 3바이트). 긴 비밀번호를 허용하려고 `bcrypt(sha512(pw))` 처럼 사전 해시하면 널 바이트 잘림·password shucking 위험이 있다. OWASP 는 사전 해시가 꼭 필요하면 HMAC(페퍼) 결과를 base64 로 인코딩해 넣으라고 한다. 새 시스템이면 그냥 Argon2id 를 쓴다.
- **서버 자원·DoS**: 해시 한 번에 수십 MB·수십 ms 가 든다. 로그인 엔드포인트에 [레이트 리밋](/develop-wiki/knowledge/performance/rate-limiting/)을 두고, 비밀번호 최대 길이를 정한다(예: 64자 이상 허용하되 상한은 둠). 파라미터는 실제 서버에서 측정해 정한다.
- 사용자가 없을 때와 비밀번호가 틀릴 때 응답 시간·메시지를 같게 한다(계정 존재 노출 방지).
- 해시를 잘 저장해도 유출 비밀번호 재사용은 못 막는다. 유출 목록 대조, MFA·패스키를 함께 고려한다.
