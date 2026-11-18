---
name: joserfc
url: https://jose.authlib.org
docs: https://jose.authlib.org/en/dev/
repo: https://github.com/authlib/joserfc
stars: 184
domain: backend
category: auth
description: JWS·JWE·JWK·JWT 를 RFC 에 맞춰 구현한 Python JOSE 라이브러리. Authlib 에서 분리된 새 API 로, 토큰 서명·검증·암호화를 직접 다룰 때 쓴다.
pricing: oss
tags: [python, jose, jwt, jws, jwe, jwk, oauth]
languages: [python]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-18
---

## 개요
joserfc 는 JOSE(JSON Object Signing and Encryption) 계열 표준인 JWS(RFC 7515), JWE(RFC 7516), JWK(RFC 7517), JWA(RFC 7518), JWT(RFC 7519)를 구현한다. [Authlib](/develop-wiki/backend/auth/authlib/) 의 `authlib.jose` 에서 파생돼 JOSE 기능만 따로 설계한 API 를 갖고 있으며, `authlib.jose` 와 python-jose 에서 옮겨 오는 마이그레이션 가이드를 공식 문서에서 제공한다. JWK 썸프린트(RFC 7638), 서명되지 않은 페이로드(RFC 7797), OKP/EdDSA(RFC 8037), ES256K(RFC 8812), Ed25519·Ed448(RFC 9864)도 지원한다.

라이선스는 BSD-3-Clause, 최신 안정판은 **1.8.0**(2026-11-03)이다. Python 3.11 이상이 필요하고 의존성은 `cryptography>=45.0.1` 이다. 별 수는 적지만 PyPI 주간 다운로드가 3천만 건 이상(2026-11 pypistats)이라 실사용 규모는 크다.

## 설치
```bash
pip install joserfc
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `joserfc.jwt` | `encode()` / `decode()` — JWT 생성·검증 |
| `joserfc.jws` / `joserfc.jwe` | 서명(JWS), 암호화(JWE) 저수준 API |
| `joserfc.jwk` | `OctKey`, `RSAKey`, `ECKey`, `OKPKey`, `KeySet`, `import_key()` |
| `JWTClaimsRegistry` | `iss`, `aud`, `exp` 등 클레임 검증 규칙 (`essential`, `value`, `values`) |
| `algorithms` 인자 | 허용 알고리즘을 명시. 지정하지 않으면 권장되지 않는 알고리즘은 encode 에서 거부 |
| `JWERegistry` | JWE 를 쓰는 JWT 에서 반드시 넘겨야 하는 레지스트리 |

## 기본 사용법
```python
from joserfc import jwt
from joserfc.jwk import OctKey
from joserfc.jwt import JWTClaimsRegistry

key = OctKey.import_key("demo-secret-change-me-32-bytes-min")   # 예시용 비밀값
header = {"alg": "HS256"}
claims = {"iss": "https://example.test", "sub": "user-1"}

token = jwt.encode(header, claims, key)
decoded = jwt.decode(token, key)           # 서명 검증
print(decoded.header, decoded.claims)

registry = JWTClaimsRegistry(iss={"essential": True, "value": "https://example.test"})
registry.validate(decoded.claims)          # 불일치하면 ClaimError
```

## 자주 쓰는 패턴
- **JWKS 로 검증**: 공개 키 세트 JSON 을 `KeySet.import_key_set(data)` 로 읽어 `jwt.decode(token, key_set)` 에 넘긴다. 헤더의 `kid` 로 키를 고른다.
- **알고리즘 고정**: 공격자가 `alg` 를 바꾸지 못하도록 `jwt.decode(token, key, algorithms=["RS256"])` 처럼 허용 목록을 둔다.
- **클레임 검증 분리**: `decode` 는 서명만 확인하므로 `exp`, `aud`, `iss` 는 `JWTClaimsRegistry.validate()` 로 반드시 따로 검사한다.
- **JWE 토큰**: `header = {"alg": "A128KW", "enc": "A128GCM"}`, `OctKey.generate_key(128)`, `registry=jwe.JWERegistry()` 를 `jwt.encode` 에 넘긴다.
- **키 생성·변환**: `OctKey.generate_key()`, `key.as_dict()` 로 JWK 를 직렬화한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 파이썬에서 JWT·JWS·JWE 를 직접 다루는 서비스, python-jose 나 `authlib.jose` 에서 이전할 때, FastAPI 등에서 토큰 검증 계층만 필요할 때.
- 피할 때(대안): OAuth/OIDC 클라이언트·서버 흐름까지 필요하면 [Authlib](/develop-wiki/backend/auth/authlib/). 세션 쿠키 기반 인증이면 JWT 자체가 필요 없을 수 있다.

## 공식 문서
- [소개](https://jose.authlib.org/en/dev/) · [JWT 가이드](https://jose.authlib.org/en/dev/guide/jwt/) · [PyPI](https://pypi.org/project/joserfc/)
- 언어: [Python](/develop-wiki/languages/python/)
