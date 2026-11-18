---
title: 해시 함수 선택과 HashDoS
aka: [Hash Function Selection, HashDoS, Hash Flooding, Algorithmic Complexity Attack, MurmurHash, xxHash, SipHash, 해시 충돌 공격]
category: algorithms
group: complexity
level: advanced
summary: 해시 함수는 용도에 따라 골라야 한다. 비암호 해시(Murmur·xxHash)는 빠르지만 공격자가 충돌을 만들 수 있어, 외부 입력을 키로 받는 해시 테이블에는 키 있는 SipHash 를 쓴다.
tags: [hash, hashdos, siphash, murmurhash, xxhash, security, hash-table]
related: [algorithms/hash-table, algorithms/bloom-filter, algorithms/consistent-hashing, algorithms/hyperloglog-count-min-sketch, security/password-storage, algorithms/rendezvous-hashing, algorithms/cuckoo-counting-bloom-filter]
sources:
  - https://ocert.org/advisories/ocert-2011-003.html
  - https://peps.python.org/pep-0456/
  - https://en.wikipedia.org/wiki/SipHash
  - https://doc.rust-lang.org/std/collections/struct.HashMap.html
  - https://github.com/Cyan4973/xxHash
  - https://en.wikipedia.org/wiki/MurmurHash
updatedAt: 2026-11-19
---

## 문제

해시 함수는 한 이름으로 서로 다른 일을 한다. 요구가 다르면 답도 다르다.

| 용도 | 중요한 것 | 후보 |
| --- | --- | --- |
| 내부 해시 테이블·블룸 필터·샤딩(입력이 신뢰됨) | 속도, 분포 | xxHash(XXH3), MurmurHash3, wyhash |
| **공격자가 키를 고르는 해시 테이블** | 속도 + **예측 불가능성** | **SipHash**(키 있는 PRF) |
| 무결성·지문(파일 체크섬, 중복 제거) | 충돌 저항 | SHA-256 등 암호 해시 |
| 비밀번호 저장 | **일부러 느리고 메모리 많이** | Argon2, bcrypt, scrypt → [비밀번호 저장](/develop-wiki/knowledge/security/password-storage/) |
| 서명·MAC | 암호학적 안전 | HMAC, SHA-2/3 |

잘못 고르면 두 가지 방향으로 아프다. 암호 해시를 해시 테이블에 쓰면 느리고, 비암호 해시를 외부 입력 테이블에 쓰면 **서비스 거부(DoS) 공격**을 받는다.

## HashDoS

해시 테이블은 평균 O(1) 이지만, 모든 키가 같은 버킷에 몰리면 한 번의 삽입이 O(n), n 개 삽입이 O(n²) 이 된다. 시드 없는 고정 해시라면 공격자가 **같은 해시값이 되는 키**를 대량으로 미리 계산해 보낼 수 있다.

- 2003년 Perl 에 대한 "algorithmic complexity attack" 이 먼저 알려졌고, oCERT-2011-003(2011-12-28 공개)이 같은 공격이 PHP, Java, Python, Ruby, V8, Tomcat 등 대부분의 웹 플랫폼에 통한다고 경고했다. 보고자는 Alexander Klink 와 Julian Wälde 다.
- 공격 경로: 많은 서버가 POST 파라미터 수를 제한하지 않고 파라미터를 해시 테이블에 담는다. 충돌하는 파라미터 이름을 가득 담은 요청 하나로 CPU 를 100% 로 몰 수 있고, 적은 대역폭으로 몇 시간씩 지속될 수 있다고 advisory 는 적는다.
- 완화는 플랫폼별 패치(파라미터 수 제한, 해시 무작위화)였다.

### 직접 재현

Java 의 `String.hashCode` 와 같은 `h = 31·h + c` 해시에서는 `"Aa"` 와 `"BB"` 의 해시가 2112 로 같다. 해시가 선형이라 이 두 블록을 이어 붙인 문자열도 순서·조합과 무관하게 같은 해시가 된다. 블록 14개면 2¹⁴ = 16,384개의 서로 다른 키가 **해시값이 전부 같다**.

```ts
function javaHash(s: string): number { let h = 0; for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0; return h; }
function collidingKeys(blocks: number): string[] {
  let keys = [''];
  for (let i = 0; i < blocks; i++) keys = keys.flatMap((k) => [k + 'Aa', k + 'BB']);
  return keys;
}
const keys = collidingKeys(14); // 16,384 개, 서로 다른 해시값 수 = 1
```

이 키들을 체이닝 해시 테이블(버킷 65,536개)에 넣어 비교한 값(`tsc --strict` 컴파일, 실행):

| 해시 | 탐색(probe) 횟수 |
| --- | --- |
| 고정 `31·h+c` | 134,209,536 (≈ n²/2) |
| 비밀 키 SipHash-2-4 | 약 2,000 (키에 따라 조금씩 다름) |

6만 배 차이다. 같은 키 집합인데 해시가 키를 모른다는 이유만으로 충돌이 사라졌다.

## 해법: 키 있는 해시 (SipHash)

SipHash 는 Jean-Philippe Aumasson 과 Daniel J. Bernstein 이 2011년 말의 해시 플러딩 공격에 대응해 2012년 설계한 ARX(덧셈·회전·XOR) 기반 의사난수 함수 계열이다. **128비트 비밀 키**와 임의 길이 입력으로 64비트 값을 낸다(Wikipedia). 프로세스 시작 시 무작위 키를 뽑으면 공격자는 어떤 키들이 충돌할지 계산할 수 없다.

- 짧은 입력에서 빠르게 설계됐다. 속도가 CityHash 같은 비암호 해시에 근접한다고 Wikipedia 는 설명한다.
- 이름 `SipHash-c-d`: 메시지 블록당 c 라운드, 마무리 d 라운드. 권장은 SipHash-2-4, 보수적 안전 마진이 필요하면 4-8. 일부 언어는 속도를 위해 1-3 을 쓰는데, 아직 모르는 공격이 있을 수 있다는 위험이 따른다.
- **MAC 이지 범용 암호 해시가 아니다.** 키가 비밀로 유지될 때만 안전하다. 파일 지문이나 서명용이 아니다.

위 실험의 SipHash-2-4 BigInt 구현(설명용, 느림)은 공식 테스트 벡터로 검증했다. 키 `00 01 … 0f`, 빈 입력에서 `726fdb47dd0e0e31`, 15바이트 입력(`00 … 0e`)에서 `a129ca6149be45e5` 가 나왔다.

```ts
const M = (1n << 64n) - 1n;
const rotl = (x: bigint, b: bigint): bigint => ((x << b) | (x >> (64n - b))) & M;

function siphash24(key: Uint8Array, data: Uint8Array): bigint {
  const rd = (b: Uint8Array, o: number): bigint => { let x = 0n; for (let i = 7; i >= 0; i--) x = (x << 8n) | BigInt(b[o + i] ?? 0); return x; };
  const k0 = rd(key, 0), k1 = rd(key, 8);
  let v0 = k0 ^ 0x736f6d6570736575n, v1 = k1 ^ 0x646f72616e646f6dn, v2 = k0 ^ 0x6c7967656e657261n, v3 = k1 ^ 0x7465646279746573n;
  const round = (): void => {
    v0 = (v0 + v1) & M; v1 = rotl(v1, 13n); v1 ^= v0; v0 = rotl(v0, 32n);
    v2 = (v2 + v3) & M; v3 = rotl(v3, 16n); v3 ^= v2;
    v0 = (v0 + v3) & M; v3 = rotl(v3, 21n); v3 ^= v0;
    v2 = (v2 + v1) & M; v1 = rotl(v1, 17n); v1 ^= v2; v2 = rotl(v2, 32n);
  };
  const len = data.length, end = len - (len % 8);
  for (let o = 0; o < end; o += 8) { const m = rd(data, o); v3 ^= m; round(); round(); v0 ^= m; }
  let last = BigInt(len & 0xff) << 56n;
  for (let i = 0; i < len % 8; i++) last |= BigInt(data[end + i]) << BigInt(8 * i);
  v3 ^= last; round(); round(); v0 ^= last;
  v2 ^= 0xffn; for (let i = 0; i < 4; i++) round();
  return (v0 ^ v1 ^ v2 ^ v3) & M;
}
```

운영에서는 BigInt 구현이 아니라 검증된 네이티브·표준 라이브러리 구현을 쓴다.

## 비암호 해시: Murmur 와 xxHash

- **MurmurHash**(Austin Appleby, 2008): MurmurHash3(2011년 4월 완성)은 32비트·128비트 출력. libstdc++, nginx, Cassandra, Elasticsearch, Kafka, Guava 등이 쓴다. 공격자에 대한 방어는 설계 목표가 아니다. Aumasson·Bernstein 은 **시드를 무작위로 줘도** 충돌 공격이 가능함을 보였다고 Wikipedia 가 전한다. PEP 456 도 MurmurHash3 와 CityHash 를 같은 이유로 후보에서 탈락시켰다.
- **xxHash**(Yann Collet): XXH32, XXH64, XXH3(64·128비트, v0.8.0 부터). README 는 새 애플리케이션에 `XXH3_64bits()` 를 권한다. README 벤치마크(i7-9700K, Clang 10 -O3)에서 XXH3 AVX2 는 약 59 GB/s, XXH64 는 약 19 GB/s, XXH32 는 약 10 GB/s 로 제시하며, 같은 기계의 RAM→RAM memcpy 는 약 28 GB/s 다. SMHasher 를 통과하지만 **암호 해시가 아니라고 명시**한다. 라이선스는 라이브러리 BSD 2-Clause, `xxhsum` CLI 는 GPLv2.

둘 다 "입력이 내 통제 안에 있을 때"의 선택이다. 블룸 필터 위치 계산, 내부 캐시 키 샤딩, 체크섬(비보안)이 전형이다.

## 언어·런타임의 선택

| 런타임 | 기본 해시 맵 해시 |
| --- | --- |
| Python (3.4+, PEP 456) | SipHash-2-4 로 시작. 3.11 부터는 1-3 (Wikipedia). 짧은 문자열 최적화는 기본 꺼짐 |
| Rust `HashMap` | SipHash 1-3 + 맵마다 무작위 시드. 문서가 "변경될 수 있음"이라 명시 |
| Ruby | SipHash 1-3 (Wikipedia) |
| Java `HashMap` | 문자열 해시는 고정 공식이고, 충돌 버킷이 길면 트리로 바꿔 최악을 O(log n) 로 방어 → [해시 테이블](/develop-wiki/knowledge/algorithms/hash-table/) |

PEP 456 은 SipHash24 가 기존 FNV 기반 코드와 속도가 비슷했고(벤치마크 합계 1% 이내), 32비트·옛 CPU 에서는 약간 느렸다고 적는다. 절반 정도의 문자열이 1~6바이트라서 작은 문자열 최적화도 실험했지만 보안 영향이 불분명해 기본값으로 켜지 않았다.

Rust 문서는 반대편의 사실도 적는다. 기본 해시는 중간 크기 키에 경쟁력 있지만, 정수 같은 작은 키나 긴 문자열에서는 다른 해시가 더 빠르다. 해시를 교체하면 HashDoS 방어가 사라질 수 있으니 **키가 공격자 통제 밖일 때만** 바꾸라고 한다.

## 고르는 기준

1. 키가 **외부 입력**(HTTP 파라미터, JSON 키, 사용자 이름)인가? → 키 있는 SipHash(또는 언어 기본값 유지).
2. 키가 내부 생성값이고 속도가 병목인가? → XXH3 / Murmur3.
3. 같은 입력에 같은 해시가 재시작 후에도 필요한가(영속 파티셔닝, 일관된 해싱)? → 시드를 **고정**하고, 대신 그 입력은 공격자가 못 고르게 한다. 무작위 시드는 프로세스마다 값이 달라진다.
4. 보안 속성(위조 불가)이 필요한가? → HMAC 이나 암호 해시. xxHash·SipHash 는 서명용이 아니다.
5. 비밀번호인가? → 위 표의 느린 해시.

## 주의

- **해시값 순서에 의존하지 않는다.** 시드가 무작위이면 순회 순서가 실행마다 달라진다. 테스트가 순서에 의존하면 깨진다.
- 분산 시스템에서 노드마다 시드가 다르면 같은 키가 다른 샤드로 간다. 샤딩 해시는 **모든 노드가 같은 함수·같은 시드**여야 하고, 클라이언트가 고를 수 있는 키라면 [일관된 해싱](/develop-wiki/knowledge/algorithms/consistent-hashing/)·[랑데부 해싱](/develop-wiki/knowledge/algorithms/rendezvous-hashing/)의 부하 편향 공격도 고려한다.
- 입력 크기 제한이 가장 값싼 1차 방어다. 요청당 파라미터·JSON 키 수를 제한한다. 해시 방어와 함께 둔다.
- "충돌이 안 난다"와 "충돌을 못 만든다"는 다르다. 64비트 해시도 생일 역설 때문에 약 2³² 개 근처에서 충돌이 난다.
- 직접 만든 해시(`h*31 + c`, djb2 등)는 분포가 나쁘고 충돌 조작이 쉽다. 문자열 해시를 새로 구현하지 않는다.
- 해시 함수를 느린 수작업(BigInt 등)으로 구현한 위 예시는 이해용이다. 실제 호출 경로에 넣지 않는다.

## 실무에서

- 웹 프레임워크가 요청 파라미터 개수·본문 크기를 제한하는 것은 HashDoS 이후 흔해진 방어다(oCERT 가 지목한 것도 이 부분이다).
- 직접 `Map`·딕셔너리를 쓰는 서비스 코드는 대부분 런타임 기본값에 방어가 들어 있다. 문제는 **직접 해시 함수를 만들어 해시 테이블·샤딩에 끼우는 코드**와 해시를 교체하는 성능 튜닝(Rust `with_hasher` 등)이다.
