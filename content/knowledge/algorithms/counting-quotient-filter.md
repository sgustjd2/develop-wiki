---
title: 카운팅 쿼션트 필터 (Counting Quotient Filter, CQF)
aka: [Counting Quotient Filter, CQF, Rank-and-Select Quotient Filter, RSQF, Counting Filter, 카운팅 필터, 쿼션트 필터 카운터]
category: algorithms
group: data-structure
level: advanced
summary: 쿼션트 필터의 메타데이터를 rank/select 로 재구성해 높은 적재율에서도 빠르게 만들고, 반복 원소는 나머지 슬롯 뒤에 가변 길이 카운터로 끼워 넣어 개수까지 세는 근사 멤버십 구조.
tags: [quotient-filter, counting-filter, amq, rank-select, bit-manipulation, cache-locality, mergeable, ssd]
related: [algorithms/quotient-filter-resize-merge, algorithms/vector-quotient-filter, algorithms/cuckoo-counting-bloom-filter, algorithms/bloom-filter, algorithms/hyperloglog-count-min-sketch, algorithms/top-k-heavy-hitters-space-saving, algorithms/lsm-tree, algorithms/quotient-xor-filter, algorithms/space-time-tradeoff, cs-fundamentals/cpu-cache-locality]
sources:
  - https://users.cs.utah.edu/~pandey/courses/cs6968/spring23/papers/cqf.pdf
  - https://doi.org/10.1145/3035918.3035963
  - http://vldb.org/pvldb/vol5/p1627_michaelabender_vldb2012.pdf
updatedAt: 2026-11-19
---

기본 쿼션트 필터와 리사이즈·병합은 [쿼션트 필터의 리사이즈와 병합](/develop-wiki/knowledge/algorithms/quotient-filter-resize-merge/)에 있다. 이 노트는 그 위에 **개수 세기**를 얹고 메타데이터를 다시 짠 CQF 를 Pandey·Bender·Johnson·Patro(SIGMOD 2017)로 설명한다.

## 문제

근사 멤버십 구조(AMQ)를 실제로 쓰다 보면 기능이 모자란다.

- Bloom 필터는 **삭제·개수 세기·리사이즈**가 안 되고, 캐시 지역성이 나빠 SSD 로 내리기 어렵다.
- 개수를 세려고 쓰는 카운팅 Bloom 필터는 칸마다 같은 크기의 카운터를 둬 공간이 크다. 논문의 한 실험에서 Zipf 입력에서 원소당 337.6 비트였다.
- 현실 데이터는 Zipf 처럼 치우쳐 같은 원소가 많이 반복된다. 쿼션트·쿠쿠 필터는 중복을 조금만 허용해서, 반복이 많으면 느려지거나 실패한다.
- 원래 쿼션트 필터는 적재율 60~75% 를 넘으면 선형 탐사가 길어져 급격히 느려진다.

## 해법

### 1. RSQF: 메타데이터를 rank/select 로 바꾼다

논문이 먼저 만든 개선판 RSQF 의 구조다.

- 해시 값 앞 `q` 비트가 **몫(quotient)**, 뒤 `r` 비트가 **나머지(remainder)**. 슬롯 `2^q` 개에 나머지를 저장한다.
- 같은 몫의 나머지들은 연속 슬롯의 **run** 에 오름차순으로 저장한다. 메타데이터는 비트 벡터 둘이다.
  - `occupieds[b]`: 몫이 `b` 인 원소가 있는가.
  - `runends[b]`: 슬롯 `b` 가 어떤 run 의 마지막인가.
- 두 벡터의 1 은 일대일 대응이다. 몫 `b` 의 run 끝은 `SELECT(runends, RANK(occupieds, b))` 로 바로 찾는다(rank = 1 의 개수, select = i 번째 1 의 위치).
- 슬롯 64 개를 한 **블록**으로 묶고, 블록마다 8비트 **offset** 하나를 둬서 계산을 블록 안으로 제한한다. 메타데이터는 슬롯당 2.125 비트로, 원래 쿼션트 필터의 3비트보다 적다.
- 64비트 워드에서 rank 는 마스크+popcount, select 는 x86 `PDEP`+`TZCNT` 로 구현한다. 비트를 하나씩 보던 클러스터 탐색이 워드 연산으로 바뀌어 **적재율 95%** 에서도 쓸 만한 속도가 나온다. 원래 필터는 75% 를 권했다.

### 2. CQF: 반복은 숫자로 쓴다

RSQF 는 같은 나머지가 `C` 번 나오면 슬롯 `C` 개를 쓴다(단항). CQF 는 중복 나머지 뒤에 **카운터를 같은 슬롯 배열 안에 인코딩**한다. 별도 구조가 없다.

- run 안의 나머지는 오름차순이어야 하므로, **순서가 깨지는 값**이 나오면 그 슬롯은 카운터의 일부라는 신호(이스케이프)다.
- 카운터의 끝은 **같은 나머지 `x` 가 한 번 더** 나오는 것으로 표시한다. 그래서 카운터 숫자에는 `x` 를 못 쓴다.
- 규칙(`C` 가 `x` 의 개수):

| 개수 | 슬롯 모양 |
| --- | --- |
| 1 | `x` |
| 2 | `x, x` |
| 3 이상 (`x>0`) | `x, [0], c…, x` — `C−3` 을 밑 `2^r−2` 로 쓰고 숫자 `0` 과 `x` 를 제외한 심볼을 쓴다. 첫 숫자가 `x` 이상이면 앞에 `0` 을 붙인다 |
| 나머지 0 | `0` 은 특수: 1~3 개는 반복, 4 이상은 `0, c…, 0, 0`(연속 두 0 이 끝 표시) |

논문의 예시를 구현해 확인했다. `r=4` 에서 0 이 5개, 3 이 7개, 8 이 9개인 run 은 `(0,2,0,0, 3,0,6,3, 8,7,8)` 로 인코딩되며, 내 구현의 출력이 같다.

```ts
// 나머지 x>0 의 개수 C 를 슬롯 배열로 (논문 4절 Table 3)
function encode(x: number, C: number, r: number): number[] {
  if (C === 1) return [x];
  if (C === 2) return [x, x];
  const base = 2 ** r - 2;                                  // 0 과 x 를 못 쓰므로 심볼 2^r - 2 개
  const sym = (d: number) => (d + 1 < x ? d + 1 : d + 2);   // 숫자 -> 값 (x 건너뛰기)
  const digits: number[] = [];
  for (let v = C - 3; ; v = Math.floor(v / base)) { digits.unshift(sym(v % base)); if (v < base) break; }
  return [x, ...(digits[0] >= x ? [0] : []), ...digits, x];
}
```

직접 만든 구현의 검증 결과다. 무작위 run(r=3~8, 나머지 1~6개, 개수 최대 5,000) 2 만 개를 인코딩했다가 복원해 모두 원본과 같았다. 슬롯 수(`r=8`, `x=100`)는 `C=3` 이면 3, `C=10` 이면 3, `C=1,000` 이면 4, `C=1,000,000` 이면 5 였다. 단항은 `C` 슬롯이다. 키 10 만 종류에 Zipf(s=1) 로 100 만 번 삽입했을 때는 단항 슬롯 1,000,000 개에 대해 CQF 가 176,013 개(17.6%)였고, 평균 10 번씩 고르게 나오는 입력에서는 299,672 개(30.0%)였다. 슬롯 수만 센 것이라 메타데이터와 해시 충돌은 반영하지 않았다.

- 개수가 3 이하면 단항과 같거나 같은 크기라 이득이 없다. **4 이상부터** 줄어든다.
- 논문의 상한: 어떤 원소가 `C` 번 나오면 나머지 슬롯 하나와 카운터 슬롯 최대 `⌈log2 C /(r−1)⌉ + 2` 개 정도로, 총 약 `4r + 2 log2 C` 비트 이하다. CQF 는 같은 다중집합을 담은 RSQF 보다 **절대 크지 않다.**

### 3. 확장 기능

- **열거**: 슬롯 배열을 선형 스캔하면 해시 값(과 개수)을 정렬된 순서로 뽑는다. 이 열거 위에 리사이즈(몫 비트 늘리고 나머지 비트 줄여 다시 삽입)와 병합(정렬된 순서로 삽입하므로 슬롯을 밀 필요가 없음)이 선다. 논문의 K-way 병합 실험은 초당 약 1,136만~1,240만 원소였다.
- **구성**: 미리 정할 것은 해시 비트 수 `p = ⌈log2(n/δ)⌉` 뿐이다. `n` 을 2 배로 과대 추정해도 나머지가 1 비트 늘 뿐이다(1% 오탐에서 슬롯당 약 9비트 → 최대 약 11% 증가).
- **병렬**: 4096 슬롯 영역 단위로 잠그고(이웃 영역까지 둘), 락을 못 잡으면 스레드별 작은 CQF 에 쓴 뒤 나중에 병합해 경합을 줄인다. 대신 조회가 약간 오래된 데이터를 볼 수 있다. 삽입 단계와 조회 단계가 분리된 용도(생물정보, LSM)에 맞는다.

### 4. 논문의 수치(오탐률 1/512 설정, 표 1 발췌)

단위는 메모리 상 초당 백만 연산이고, 비트 수는 원소당이다.

| | QF | RSQF | CQF | 쿠쿠(CF) | Bloom |
| --- | --- | --- | --- | --- | --- |
| 균등 삽입 | 11.12 | 12.06 | 11.19 | 14.25 | 2.84 |
| 존재하는 키 조회 | 3.39 | 17.13 | 11.16 | 18.87 | 2.55 |
| 없는 키 조회 | 5.71 | 25.09 | 25.93 | 18.84 | 11.56 |
| 비트/원소 | 12.631 | 11.71 | 11.71 | 12.631 | 12.984 |

- Zipf 입력(메모리): CQF 는 삽입 13.43, 조회 19.77(백만/초), 11.71 비트, 카운팅 Bloom 은 삽입 0.27, 조회 2.15, 337.584 비트. 본문은 6~10 배 빠르고 공간은 약 30 배 작다고 요약한다(Zipf 계수 1.5, 우주 2억 원소 실험).
- SSD(천 연산/초): RSQF 삽입 69.05, CQF 68.30, 쿠쿠 42.20. 조회는 CQF 34.49 대 쿠쿠 12.26. 쿠쿠 필터는 위치 둘을 봐야 하고 밀어내기(kick)마다 임의 I/O 가 생겨서라고 설명한다.
- 쿠쿠 필터는 같은 원소를 8 개 넘게 못 담아 Zipf 실험에서 약 200 번 삽입 만에 실패했다.

수치는 논문의 측정 환경(Skylake i5, 8GB, SATA SSD)이고 재현하지 않았다.

## 비교

| 쟁점 | Bloom | 카운팅 Bloom | 쿠쿠 필터 | CQF |
| --- | --- | --- | --- | --- |
| 삭제 | 불가(논문) | 가능 | 가능 | 가능(논문 주장) |
| 개수 | 불가 | 가능(고정 폭 카운터, 포화 가능) | 같은 원소 최대 8 개까지(구현 기준) | 가능(가변 길이) |
| 리사이즈 | 불가(논문) | 논문이 지원 기능으로 꼽지 않음 | 논문이 지원 기능으로 꼽지 않음 | 가능(열거 후 재삽입) |
| 병합 | 논문이 다루지 않음 | 논문이 다루지 않음 | 논문이 다루지 않음 | 가능(정렬 병합) |
| SSD 지역성 | 나쁨 | 나쁨 | 위치 둘 | 블록 연속 |
| 권장 적재율(논문 그림 4 가정) | 100% | — | 95% | 95% |

개수가 필요 없고 삽입·조회 속도가 최우선이면 쿠쿠 필터가 비슷하거나 약간 빠르다고 논문 자신이 인정한다. 정적 집합이면 [XOR 필터](/develop-wiki/knowledge/algorithms/quotient-xor-filter/)류가 더 작다.

## 언제 쓰나

- 입력이 치우쳐(Zipf) 있고 **개수**를 대략 알아야 하는 곳: k-mer 세기, 네트워크 이벤트 감시, 중복 제거 시스템의 빈도.
- 필터를 SSD 에 두거나 여러 필터를 **병합**해야 하는 곳: [LSM 트리](/develop-wiki/knowledge/algorithms/lsm-tree/)의 레벨별 필터.
- 상위 빈도 원소만 필요하면 [Top-K / Space-Saving](/develop-wiki/knowledge/algorithms/top-k-heavy-hitters-space-saving/)이나 [Count-Min](/develop-wiki/knowledge/algorithms/hyperloglog-count-min-sketch/)이 더 단순하다.

## 주의

- 개수는 **해시 값 단위**다. 서로 다른 키의 해시(지문)가 충돌하면 개수가 합쳐져 과대 추정이 되며, 틀릴 때는 항상 참값보다 크다.
- 구현이 복잡하다. 인코딩 규칙(특히 나머지 0)과 run 을 밀어내는 삽입·삭제에서 버그가 나기 쉽다. 검증된 구현(저자 저장소 `splatlab/cqf`)을 쓰고, 직접 구현하면 왕복 검증을 반드시 한다.
- PDEP/TZCNT 같은 x86 BMI2 명령에 최적화돼 있다. 다른 아키텍처에서는 이식 성능이 달라질 수 있다.
- 리사이즈로 몫 비트를 늘리면 나머지 비트가 줄어 오탐률 하한이 고정된다. 처음부터 최대 원소 수와 목표 오탐률에서 `p` 를 잡아야 한다.
- 병렬 삽입의 지연 병합 방식은 조회가 최신이 아닐 수 있다.

> 출처 확인 범위: CQF 논문(SIGMOD 2017) 저자 배포 PDF 13쪽 전체 중 1~11쪽(소개, AMQ·카운팅 구조 개요, RSQF 메타데이터, rank/select, 공간 분석, CQF 카운터 인코딩·공간 상한, 병렬화, 평가·표 1~5)을 본문 텍스트로 읽었다. 12~13쪽의 결론·참고문헌은 읽지 않았다. 인코딩과 슬롯 수 비교 코드는 직접 작성해 실행했다. 미확인: 삭제 알고리즘의 세부, 저자 구현의 현재 상태, 이후 개선(예: Vector Quotient Filter 와의 최신 비교), 논문 수치의 재현.
