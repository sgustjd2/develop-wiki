---
title: HTTP Digest Fields (RFC 9530) - Content-Digest·Repr-Digest
aka: [RFC 9530, Digest Fields, Content-Digest, Repr-Digest, Want-Content-Digest, Want-Repr-Digest, Integrity fields, RFC 3230 대체, Digest 헤더]
category: security
level: advanced
summary: HTTP 본문 무결성 다이제스트를 담는 헤더 규격(RFC 9530). 전송된 콘텐츠를 해시하는 Content-Digest 와 표현 데이터를 해시하는 Repr-Digest 를 구분하고, RFC 3230 의 Digest 를 대체한다.
tags: [http, integrity, digest, rfc9530, rfc3230, structured-fields, content-digest, repr-digest, http-message-signatures, sha-256]
related: [security/fapi-2-message-signing-rfc9421, security/dpop]
sources:
  - https://www.rfc-editor.org/rfc/rfc9530.txt
  - https://www.iana.org/assignments/http-digest-hash-alg/
updatedAt: 2026-11-23
---

## 문제

TCP 체크섬이나 TLS 레코드도 무결성을 주지만 한 연결 안에서만 유효하고 응용 계층에는 보이지 않는다. HTTP 메시지는 프록시·CDN 을 거치며 여러 연결을 건너고, 연결 사이에서 손상될 수 있다(RFC 9530 1절). 응용이 "내가 받은 바이트가 보낸 바이트인가"를 직접 확인하려면 메시지에 다이제스트를 실어야 한다.

옛 규격 RFC 3230 의 `Digest` 헤더가 그 일을 했지만, "instance"라는 용어를 구현마다 다르게 읽었다. 가장 흔한 실수는 **표현 데이터(representation data)** 가 아니라 **메시지 콘텐츠(content)** 에 해시를 건 것이다(1.3절). RFC 9530(2024-02, Standards Track, R. Polli·L. Pardue)이 이를 폐기(obsoletes)하고, 입력이 다른 두 헤더로 갈라 이름에 의도를 드러냈다.

## 핵심 용어

| 한국어 | 영어 | 정의 |
| --- | --- | --- |
| 콘텐츠 | content | 메시지로 실제 전송되는 바이트(HTTP 의미론 6.4절). 범위 요청이면 일부, HEAD 면 없음, 콘텐츠 코딩이 적용되면 인코딩 후 바이트 |
| 표현 데이터 | representation data | 선택된 표현(selected representation)의 전체 데이터(HTTP 의미론 8.1절). 전송 방식·범위와 무관 |
| 무결성 필드 | Integrity fields | `Content-Digest`, `Repr-Digest` 의 총칭 |
| 무결성 선호 필드 | Integrity preference fields | `Want-Content-Digest`, `Want-Repr-Digest` 의 총칭 |
| 알고리즘 키 | Algorithm Key | 딕셔너리 키로 쓰는 해시 알고리즘 이름(`sha-256` 등) |

## 두 헤더의 입력 차이

두 필드 모두 Structured Fields **Dictionary** 이고, 키는 알고리즘 키, 값은 해시 출력의 **Byte Sequence**(`:base64:` 형태)다(2·3절). 하나의 필드에 알고리즘을 여럿 실을 수 있다.

| 필드 | 해시 입력 | 이럴 때 맞다 |
| --- | --- | --- |
| `Content-Digest` | 실제로 전송되는 콘텐츠 바이트 | 받은 바이트가 그대로 왔는지(전송 단위 점검) |
| `Repr-Digest` | 선택된 표현의 전체 데이터(콘텐츠 코딩 적용 후, 범위·메서드 영향 배제) | 여러 요청으로 조각을 모아 복원한 리소스 검증, 범위 응답·HEAD 에서도 같은 값 유지 |

문서 1.2절은 두 필드가 `Content-Encoding`·`Content-Type` 에 묶여 있어서 한 리소스도 전송 방식에 따라 다이제스트가 여럿일 수 있다고 쓴다. 부록 B 의 예시(JSON `{"hello": "world"}` + LF)로 정리하면 다음과 같다.

| 상황(부록) | Content-Digest 입력 | Repr-Digest 입력 |
| --- | --- | --- |
| 전체 200 응답 (B.1) | 본문 전체 | 본문 전체 (두 값 동일) |
| HEAD (B.2) | 콘텐츠 없음 = 빈 바이트열의 해시 | 선택된 표현 전체 (200 의 값과 동일) |
| `Range: bytes=10-18` 206 (B.3) | 잘린 조각 `"world"}`+LF | 표현 전체 (전체 응답과 동일) |
| Brotli 로 인코딩된 응답 (B.4 는 Repr-Digest 만 보임, Content-Digest 는 2절 정의상 같은 인코딩 바이트) | 인코딩된 바이트 | 인코딩된 바이트 (요청의 비압축 표현과는 다름) |

HEAD 처럼 콘텐츠가 없어도 `Repr-Digest` 는 "표현이 없었음"을 빈 문자열 해시로 단언할 수 있다(3절). 서명과 함께 쓰면 "콘텐츠가 뒤늦게 붙었는지"를 수신자가 탐지하는 데 쓸 수 있다고 6.3절이 적는다.

## 상태 변경 요청(3.1·3.2절)

요청에 실린 표현이 대상 리소스를 기술하지 않으면(예: PATCH 의 패치 문서) 요청의 `Repr-Digest` 는 **MUST** 그 표현 데이터에 대해 계산한다. 응답에서는 다음과 같다.

- 표현이 요청 처리 상태를 설명하면 동봉된 표현에 대해 계산한다(MUST, 예 B.8).
- 참조된 리소스가 있으면 그 리소스의 선택된 표현에 대해 계산한다(MUST). `Content-Location` 이 있으면 그 값이 가리키는 리소스 기준이다(3.2절, 예 B.7). `Location` 은 표현 메타데이터가 아니라서 영향을 주지 않는다.

PATCH 를 예로 들면 요청의 다이제스트는 패치 문서의 것이고, 응답의 다이제스트는 패치 후 리소스의 것이다.

## 선호 표시: Want-* (4절)

`Want-Content-Digest`, `Want-Repr-Digest` 는 Dictionary 이고 값은 0~10 정수다. 1 이 가장 낮은 선호, 10 이 가장 높은 선호, 0 은 "받아들일 수 없음". 요청과 응답 양쪽에 쓸 수 있고, 응답에 쓰면 서버가 클라이언트의 다음 요청에 무결성 필드를 원한다는 뜻이다. **힌트일 뿐이라** 수신자가 무시하고 다른 알고리즘을 보내거나 생략해도 프로토콜 오류가 아니다. 예(원문): `Want-Repr-Digest: sha-512=3, sha-256=10, unixsum=0`. 부록 C.1·C.2 는 서버가 클라이언트 선호와 다른 알고리즘을 고르는 정상 사례이고, C.3 은 400 으로 거절하는 한 예시다(상태 코드는 규격이 정하지 않는다).

## 알고리즘과 등록부 (5·7.2절)

IANA "Hash Algorithms for HTTP Digest Fields" 등록부는 Specification Required 정책이다. 초기 항목(원문 표 2)은 아래와 같다.

| 키 | 상태 | 설명 |
| --- | --- | --- |
| `sha-512`, `sha-256` | Active | SHA-512, SHA-256 |
| `md5`, `sha` | Deprecated | 충돌 공격 취약(sha 는 SHA-1) |
| `unixsum`, `unixcksum`, `adler`, `crc32c` | Deprecated | UNIX sum·cksum, ADLER32, CRC32c |

- Active 는 응용이 쓰길 **RECOMMENDED**, 적대적 환경(충돌·역상 저항이 필요)에서도 쓸 수 있다.
- Deprecated 는 손상 탐지용으로는 **MAY**, 잠재적 적대 환경에서는 **MUST NOT**. 예로 든 것이 인증 목적의 서명에 무결성 필드 값을 넣는 경우다. RFC 3230 으로 쌓아 둔 다이제스트를 재계산하기 싫은 이전 응용을 위한 예외이고, 그래도 이 요구에서 면제되지는 않는다.
- 상태 값은 Active·Provisional·Deprecated 셋이고, 지정 전문가는 Deprecated·Provisional 이라는 이유만으로 등록을 거부할 수 없다.

필드 이름 등록부에서는 `Digest`·`Want-Digest` 가 obsoleted 로 바뀌었다(7.1절).

## 보안 고려사항 (6절)

- **전체 보호가 아니다(6.1).** 헤더·트레일러는 보호하지 않는다. 경로상 공격자가 다이제스트를 지우거나 조작된 본문의 다이제스트로 바꿀 수 있으므로 TLS 나 서명(예: HTTP Message Signatures)과 함께 써야 한다.
- **서명 시 메타데이터(6.3).** 다이제스트는 `Content-Type`·`Content-Encoding` 등 표현 메타데이터에 의존한다. 무결성 필드만 서명하고 이들을 서명하지 않으면 공격자가 `Content-Type` 을 바꿔 검증 실패를 유발해 양쪽 자원을 소모시킬 수 있다. 필드를 중복 제거하거나 합치는 변형도 서명 검증을 깰 수 있다.
- **트레일러(6.4).** 중간자가 트레일러를 버릴 수 있고, 값이 본문 뒤에 오므로 본문을 먼저 처리하면 검증 전에 잘못된 데이터를 쓰게 된다.
- **인코딩 변이(6.5).** gzip 압축 수준처럼 같은 입력도 인코딩 결과가 달라질 수 있어 다이제스트는 전체 콘텐츠를 보관하지 않는 한 "보관 중(at rest)" 무결성의 증거가 못 된다.
- **알고리즘 민첩성(6.6).** 여러 값을 보낼 수 있지만 **다운그레이드·대체 공격을 막아 주지는 않는다.** 약한 알고리즘을 받아들이는 수신자는 가장 약한 것에 대해 취약하다. 지원 알고리즘을 강한 것으로 제한하고 필드 값을 TLS·서명으로 보호하라고 권한다.
- **자원 소모(6.7).** 검증 비용 때문에 검증을 건너뛰거나 선호 알고리즘 실패를 무시하면 다운그레이드 여지가 남는다.

## 직접 계산

Node 24 의 `node:crypto` 로 원문 값을 재계산했다(스크립트는 스크래치 디렉터리). 입력은 본문 `{"hello": "world"}` 에 LF 를 붙인 19바이트다.

```ts
import { createHash } from "node:crypto";
const body = '{"hello": "world"}\n';
const b64 = (alg: string, b: Buffer | string) => createHash(alg).update(b).digest("base64");
console.log(`Repr-Digest: sha-256=:${b64("sha256", body)}:`);
// 본문이 없을 때(HEAD)의 Content-Digest = 빈 문자열의 해시
console.log(`Content-Digest: sha-256=:${b64("sha256", "")}:`);
// 범위 응답(bytes=10-18)의 Content-Digest 는 잘린 조각 기준
console.log(b64("sha256", Buffer.from(body).subarray(10, 19)));
```

| 검사 | 계산 결과 | 원문과 |
| --- | --- | --- |
| 전체 본문 sha-256 (B.1) | `RK/0qy18…FabDg=` | 일치 |
| 전체 본문 sha-512 (2·3절 예시) | `YMAam51J…44T3qg==` | 일치 |
| 빈 바이트열 sha-256 (B.2 의 Content-Digest) | `47DEQpj8…hSuFU=` | 일치 |
| 조각 `"world"}`+LF (B.3 의 Content-Digest) | `jjcgBDWN…dyepQ=` | 일치 |
| POST 요청 본문 `{"title": "New Title"}`+LF (B.7) | `mEkdbO7S…gc4=` | 일치 |
| 부록 D: LF 없는 `{"hello": "world"}` 의 sha-256·sha-512·md5·sha | 모두 | 일치 |
| Node brotli 로 압축한 바이트 sha-256 (B.4 응답 값) | `d435Qo+n…GPk=` | 일치 |

두 가지 관찰이 있다. (1) 부록 D 의 값은 LF 가 **없는** 입력이라 본문 예시의 값(LF 있음)과 다르다. 구현을 시험할 때 개행 유무를 맞추지 않으면 어긋난다. (2) B.4·B.6 그림에 적힌 16진 바이트열 `8B 08 80 7B …` 를 그대로 해시하면 그림의 다이제스트와 달랐고(`MklYnI/S…`), Node 가 만든 brotli 출력 `0b 09 80 7b …` 는 그림의 값과 일치했다. 압축 출력은 유일하지 않으므로 이것만으로 오류라고 단정할 수는 없으나, 정오표 8890(Reported)이 같은 문제를 보고했다. 또 B.5·B.6·B.11·C.1 의 일부 값은 `Dg==:` 로 적혀 있는데, 32바이트 base64 의 정규 형태는 `=` 한 개다. 이 둘은 원문 텍스트를 읽은 필자의 관찰이며 정오표는 확인하지 않았다.

## 헷갈리는 구분

- **Content-Digest 와 Repr-Digest 의 선택.** 범위 요청·HEAD·콘텐츠 코딩이 끼면 값이 갈린다. 서명 프로토콜(예: [FAPI 2.0 의 HTTP 서명](/develop-wiki/knowledge/security/fapi-2-message-signing-rfc9421/))은 본문을 덮기 위해 보통 `Content-Digest` 를 서명 대상에 넣는다. 그 노트가 읽은 RFC 9421 7.2.8 은, 서명만 확인하고 실제 본문을 다이제스트와 대조하지 않으면 본문 바꿔치기가 가능하다고 경고한다.
- **다이제스트 ≠ 서명.** 키가 없는 해시라서 경로상 공격자가 값을 새로 계산해 바꿔 끼울 수 있다(6.1). 인증은 서명·TLS 몫이다.
- **RFC 3230 `Digest` 와의 이전.** 부록 E 에 따르면 `Digest` 는 콘텐츠 해시를 표현할 수 없었고 출력 인코딩(base64·16진·10진)이 알고리즘마다 달랐다. 이제 Structured Fields 로 인코딩이 하나다.

## 언제 쓰나

- 프록시·CDN 을 지나는 업로드·다운로드에서 변조가 아닌 **손상·변환 탐지**가 목적일 때.
- HTTP 메시지 서명으로 본문을 보호할 때 본문 대신 다이제스트 필드를 서명 범위에 넣는 방식.
- 조각 다운로드 후 조립한 리소스 전체를 `Repr-Digest` 로 검증할 때.

## 주의·비용

- 큰 본문은 해시 계산을 위해 전체를 읽어야 한다. 스트리밍 송신이면 트레일러에 넣을 수 있으나 버려질 수 있고(6.4), 수신 측은 검증 전에 처리하지 않도록 설계해야 한다.
- 프록시가 압축·재인코딩하면 `Content-Digest` 가 달라진다. 이때 `Repr-Digest` 는 표현 메타데이터가 정확히 갱신되어야 의미가 있다.
- 적대 환경에서는 Active 알고리즘만 허용하고(5절), 다중 값은 다운그레이드 통로가 되지 않게 가장 약한 허용 알고리즘 기준으로 위험을 평가한다(6.6).
- 다이제스트만으로 인증·무결성 증명이 끝났다고 보면 안 된다. 서명 또는 TLS 와 한 세트다(6.1, 6.3).

## 검증 범위

RFC 9530 전문(1~7절, 부록 A~E 일부)을 rfc-editor.org 의 텍스트판에서 읽었다. 위 MUST/MAY 표기와 절 번호는 그 텍스트 기준이다. 부록 B.8~B.11, 부록 A 의 상세 예시는 읽는 데 그쳤고 위 계산 표에는 포함하지 않았다. 원문 정오표는 나중에 확인했다: 정오표 8890(Reported, 미검증 상태)이 B.4·B.6 의 브로틀리 바이트열 문제를 보고했고, 8158·8273 은 편집 수준(Verified)이다. `Dg==:` 이중 `=` 문제는 정오표에 없다(필자 관찰로 둠). IANA 등록부는 2024-05-22 갱신본에서 초기 8개 항목이 표 2 와 같음만 확인했다. 응용 단의 실제 구현(프레임워크별 지원)은 조사하지 않았다. 계산은 Node 24 로 직접 실행했다.
