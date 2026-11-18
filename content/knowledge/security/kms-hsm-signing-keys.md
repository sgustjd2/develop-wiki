---
title: 서명 키의 KMS/HSM 운영 (JWT 서명을 예로)
aka: [KMS Signing, HSM, Hardware Security Module, Remote Signing, AWS KMS Sign, Non-exportable Key, 서명 키 보관]
category: security
level: advanced
summary: JWT 같은 서명용 개인키를 애플리케이션 메모리·파일에 두지 않고 KMS/HSM 안에 가둔 채 서명만 호출하는 운영 방식. 권한·감사·회전은 쉬워지고 지연·요청 한도·형식 변환이 비용으로 남는다.
tags: [kms, hsm, signing, jwt, key-management, aws-kms, operations]
related: [security/jwt-key-rotation, security/jwt-algorithm-confusion, security/secrets-management, security/mtls-certificate-bound-tokens, security/oauth2-oidc-pkce, performance/timeout-retry-circuit-breaker, performance/connection-pool]
sources:
  - https://docs.aws.amazon.com/kms/latest/developerguide/overview.html
  - https://docs.aws.amazon.com/kms/latest/APIReference/API_Sign.html
  - https://docs.aws.amazon.com/kms/latest/developerguide/rotate-keys.html
  - https://www.rfc-editor.org/rfc/rfc7518.html
updatedAt: 2026-11-19
---

## 문제

서명 개인키가 앱 서버의 파일·환경 변수·메모리에 있으면 서버 하나가 뚫릴 때 키가 복사되고, 복사는 흔적이 남지 않는다. 키를 가진 인스턴스가 늘수록 노출 면이 커지고, 누가 언제 서명했는지 감사하기도 어렵다. 유출을 알아챈 뒤에는 키를 바꾸는 것밖에 없다 → [서명 키 회전](/develop-wiki/knowledge/security/jwt-key-rotation/).

## 해법: 키는 가두고 서명만 호출한다

KMS/HSM 은 개인키를 **꺼낼 수 없는** 형태로 보관하고, "이 메시지에 서명해 달라"는 호출만 받는다. 이 노트는 AWS KMS 문서를 기준으로 설명한다. 다른 클라우드 KMS 나 PKCS#11 장비도 구조는 같지만 세부는 달라 직접 확인하지 않았다.

- AWS 문서에 따르면 KMS 키는 FIPS 140-3 보안 수준 3 검증 HSM 으로 보호되고 **KMS 밖으로 암호화 없이 나오지 않는다.**
- `Sign` API: 비대칭 KMS 키(`KeyUsage = SIGN_VERIFY`)의 개인키로 메시지나 다이제스트에 서명한다. 호출자에게 `kms:Sign` 권한이 있어야 하고(키 정책), 메시지는 최대 4096바이트이며 그보다 크면 해시를 `MessageType = DIGEST` 로 보낸다. 서명 알고리즘은 RSA(PSS 권장, PKCS#1 v1.5 는 호환용)·ECDSA 등에서 키와 맞게 고른다.
- 검증은 `Verify` API 로도 가능하고, `GetPublicKey` 로 공개키를 받아 **KMS 밖에서** 해도 된다. JWT 검증자는 후자(JWKS 로 공개키 배포)를 쓴다.
- 서명 때 어떤 KMS 키와 알고리즘을 썼는지 기록해야 나중에 검증할 수 있다고 문서가 강조한다. JWT 에서는 `kid` 와 `alg` 헤더가 그 역할이다.
- 호출은 CloudTrail 에 남아 **누가 어떤 키로 서명했는지** 감사된다(KMS 키의 사용 기록을 CloudTrail 로 볼 수 있다는 것은 개념 문서에 있다).

### JWT 서명에 쓸 때의 형식 문제

KMS 의 ECDSA 서명은 **DER** 로 돌아온다(Sign 응답 설명). 그런데 JWS(ES256)는 `r || s` 를 각 32바이트로 이어 붙인 **64바이트**를 요구한다(RFC 7518 3.4절). DER 을 그대로 넣으면 표준 검증자가 거절한다. 아래는 KMS 대신 로컬 키를 감싼 가짜 서명기로 변환을 확인한 코드다(KMS 자체는 호출하지 않았다).

```ts
import { createPublicKey, generateKeyPairSync, sign, verify } from 'node:crypto';
const b64u = (v: Buffer | string) => Buffer.from(v).toString('base64url');
interface RemoteSigner { keyId: string; sign(message: Buffer): Promise<Buffer>; publicJwk(): object }
// 로컬 키로 흉내: 개인키는 클로저 안에만 있고 DER 서명만 나간다
function fakeKms(keyId: string): RemoteSigner {
  const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  return { keyId,
    async sign(m) { return sign('sha256', m, { key: privateKey, dsaEncoding: 'der' }); },
    publicJwk() { return { ...publicKey.export({ format: 'jwk' }), kid: keyId, alg: 'ES256', use: 'sig' }; } };
}
// DER(SEQUENCE{INTEGER r, INTEGER s}) → r||s 64바이트
function derToJose(der: Buffer): Buffer {
  let o = 2 + (der[1] & 0x80 ? der[1] & 0x7f : 0);
  const take = () => { const len = der[o + 1]; let n = der.subarray(o + 2, o + 2 + len); o += 2 + len;
    while (n.length > 32 && n[0] === 0) n = n.subarray(1); return Buffer.concat([Buffer.alloc(32 - n.length), n]); };
  return Buffer.concat([take(), take()]);
}
async function issueJwt(signer: RemoteSigner, claims: object) {
  const h = b64u(JSON.stringify({ alg: 'ES256', typ: 'JWT', kid: signer.keyId })), p = b64u(JSON.stringify(claims));
  return `${h}.${p}.${b64u(derToJose(await signer.sign(Buffer.from(`${h}.${p}`))))}`;
}
```

실행 결과: 변환한 서명은 서명 길이 64바이트로 표준 검증(`ieee-p1363`)을 통과했고, DER 을 그대로 쓴 토큰은 검증에 실패했다. 변환 코드는 길이 짧은 정수의 앞 0 패딩과 33바이트 정수(부호용 0)를 처리한다. RSA 서명은 형식 변환이 필요 없다.

### 회전 (AWS KMS 의 제약)

AWS 문서상 KMS 의 자동·온디맨드 회전은 **대칭 암호화 키**에만 있다. **비대칭 KMS 키는 수동 회전**만 가능하다: 새 키를 만들고, 애플리케이션이나 별칭(alias)이 새 키를 가리키게 한다. 따라서 JWT 서명 키 회전은 KMS 가 대신해 주지 않고 다음 절차를 직접 한다(전체 절차는 [서명 키 회전](/develop-wiki/knowledge/security/jwt-key-rotation/)).

1. 새 KMS 키 생성, `GetPublicKey` 로 공개키를 얻어 새 `kid` 로 JWKS 에 **추가**.
2. 캐시 전파를 기다린 뒤 서명 호출이 새 키를 쓰도록 전환.
3. 옛 토큰이 모두 만료되면 JWKS 에서 옛 키를 빼고, KMS 에서 옛 키를 비활성화한 뒤 삭제를 예약한다(삭제는 되돌릴 수 없으니 비활성화 기간을 둔다. 일반 운영 권고).

## 언제 쓰나

- 서명 키 유출이 곧 전면 위조·전면 재로그인인 발급자(인증 서버, 결제·정부 연계, 코드/아티팩트 서명).
- 규정이 키의 HSM 보관이나 사용 감사를 요구할 때.
- 앱 인스턴스가 많아 키를 각자 들고 있는 구조를 없애고 싶을 때.

## 주의 (비용)

- **서명 1건 = 원격 호출 1건.** 지연이 추가되고 요청 한도·요금이 붙는다(AWS 는 요청 단위 과금과 계정 할당량이 있다고 문서에 명시. 구체 수치는 확인하지 않았다). 토큰 수명이 짧고 발급이 잦으면 병목이 된다. 발급 경로에 타임아웃·재시도·동시성 제한을 둔다 → [타임아웃·재시도](/develop-wiki/knowledge/performance/timeout-retry-circuit-breaker/).
- **KMS 가용성이 발급 가용성이 된다.** 검증은 공개키만 쓰므로 영향이 없고, **발급만** 영향을 받는다. 이미 발급된 토큰은 계속 검증된다. 리전 장애 대비는 멀티 리전 키 등을 따로 검토한다.
- **권한이 새 취약점이 된다.** 키는 못 꺼내도 `kms:Sign` 권한이 있는 쪽은 임의 클레임에 서명할 수 있다. 서명 호출 권한을 발급 서비스 하나로 좁히고, 이상 호출량을 모니터링한다. 키를 보호해도 **서명 오라클**을 지키지 못하면 의미가 줄어든다.
- **알고리즘 제약.** KMS 가 지원하는 알고리즘만 쓸 수 있다. JWT 알고리즘 허용 목록과 맞춘다 → [알고리즘 혼동 공격](/develop-wiki/knowledge/security/jwt-algorithm-confusion/).
- **다이제스트 서명 실수.** `DIGEST` 로 보낼 값을 `RAW` 로 보내면 두 번 해시돼 표준 검증이 실패하고, 반대면 보안이 약해질 수 있다고 문서가 경고한다.
- **HSM 직접 운영(온프레미스·PKCS#11)** 은 장비 이중화, 백업 키 의식, 펌웨어 관리가 추가된다. 관리형 KMS 로 충분한지 먼저 본다.
- 개발·테스트 환경은 로컬 키로 대체하되, 서명기 인터페이스 뒤에 숨겨 코드 경로를 같게 유지한다(위 코드의 `RemoteSigner`).
