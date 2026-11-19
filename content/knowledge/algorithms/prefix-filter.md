---
title: 프리픽스 필터 (Prefix Filter)
aka: [Prefix Filter, Incremental Filter, Pocket Dictionary, Bin Table and Spare, 증분 필터, 접두사 필터]
category: algorithms
group: data-structure
level: advanced
summary: 해시 지문을 고정 크기 빈에 넣고 넘치면 "가장 큰 지문"만 예비 필터로 보내, 대부분의 질의·삽입이 캐시 라인 하나만 만지게 하는 삽입 전용(삭제 불가) 근사 멤버십 필터.
tags: [filter, amq, prefix-filter, pocket-dictionary, cache-locality, incremental-filter, cuckoo-filter, bloom-filter]
related: [algorithms/bloom-filter, algorithms/vector-quotient-filter, algorithms/counting-quotient-filter, algorithms/cuckoo-counting-bloom-filter, algorithms/quotient-filter-resize-merge, algorithms/quotient-xor-filter, algorithms/ribbon-binary-fuse-filters, algorithms/lsm-tree, algorithms/space-time-tradeoff, cs-fundamentals/cpu-cache-locality, algorithms/static-filter-xor-fuse-ribbon-benchmarks]
sources:
  - https://arxiv.org/abs/2203.17139
  - https://github.com/tomereven/Prefix-Filter
updatedAt: 2026-11-19
---

필터(AMQ)는 "이 키가 집합에 있는가"를 약간의 오탐을 허용하고 답한다. 삭제 없이 **삽입만** 필요한 경우가 많다(LSM 트리의 SSTable, 불변 데이터 집합). 이때 쓸 수 있는 선택지의 빈틈을 겨냥한 구조가 프리픽스 필터다(Even·Even·Morrison 논문, arXiv 2203.17139).

## 문제

- **Bloom·blocked Bloom**: 삽입 전용이고 빠르지만, 같은 오탐률에서 [공간](/develop-wiki/knowledge/algorithms/bloom-filter/)을 더 쓴다.
- **쿠쿠·벡터 쿼션트 필터**: 지문 해시 테이블이라 공간 효율은 좋지만 후보 위치가 둘이라 부정 질의(없는 키)에 **캐시 미스가 두 번** 나고, 쿠쿠는 부하가 높을수록 삽입이 급격히 느려진다. 삭제를 지원하는 대가를 삽입 전용 용도에서도 낸다.

## 해법

**빈 테이블(1단계) + 예비(spare, 2단계)** 구조다.

1. 키 x 를 지문 하나로 만들고 지문을 (빈 번호 `bin(x)`, 미니 지문 `fp(x)`) 로 쪼갠다(quotienting). 지문 전체를 저장하지 않고 빈 번호는 위치로 표현한다.
2. 빈은 용량 k 의 작은 사전(pocket dictionary)이다. 삽입은 `bin(x)` **하나**에만 시도한다.
3. 빈이 가득 찼으면 빈의 지문들과 새 지문 중 **최댓값**을 예비 필터로 보낸다(새 지문이 최대면 그것, 아니면 기존 최댓값을 내보내고 그 자리에 새 지문). 빈에는 "넘쳤음" 표시를 한다.
4. 이 정책이 **접두사 불변식**을 만든다. 같은 빈에 매핑된 모든 지문을 정렬했을 때, 빈에 있는 것은 그 정렬의 **앞부분(접두사)** 이다.
5. 질의는 빈에서 찾는다. 못 찾았더라도 **빈이 넘쳤고 `fp(x)` 가 빈의 최댓값보다 클 때만** 예비를 본다. 아니면 "없음"을 확정한다. 접두사 불변식 덕에 "내 지문이 빈 안의 범위보다 작다면 예비에 있을 수 없다"가 성립한다.

```ts
// 빈 하나의 논리(캐시 라인 안의 정렬 사전으로 구현). 직접 작성한 개념 코드.
function insert(bin: Bin, fp: number, spare: Spare, binId: number) {
  if (bin.size < K) { bin.add(fp); return; }
  const max = bin.max();
  if (fp > max) spare.add(binId, fp);          // 새 지문이 가장 크면 예비로
  else { spare.add(binId, max); bin.replace(max, fp); }
  bin.overflowed = true;
}
function query(bin: Bin, fp: number, spare: Spare, binId: number) {
  if (bin.overflowed && fp > bin.max()) return spare.has(binId, fp);
  return bin.has(fp);
}
```

예비는 지문 집합 위의 아무 증분 필터여도 된다(논문은 blocked Bloom·쿠쿠·벡터 쿼션트 필터로 실험). 넘친 지문이 소수라 예비의 속도·공간이 전체에 미치는 영향이 작기 때문이다. 단점으로 접두사 불변식을 지키려면 빈의 최댓값을 채우는 후보가 예비에 있어야 하므로 **삭제를 효율적으로 지원할 수 없다**.

### 논문의 분석 (요약)

- 빈 용량 k, 빈 개수 `m = n/(α·k)`(α ≤ 1)일 때 예비로 가는 지문의 기댓값은 약 `n/√(2πk)` 이고, 예비에 접근하는 질의 비율은 `1/√(2πk)` 이하다. k=25 이면 약 8%.
- 오탐률은 `α·k/s + (1/√(2πk))·ε′`(s 는 미니 지문의 값 범위, ε′ 은 예비의 오탐률)로 상한이 정해지고, 예비의 영향은 `1/k` 정도로 줄어든다.
- 실패(예비 용량 초과) 확률도 분석한다. 상한은 n 이 크면 지수적으로 낮아진다고 논문이 보인다(논문 표기로 n ≥ 2²⁸·k, k=25 일 때 2⁻⁴⁰ 미만).
- 구현은 한 빈을 **64바이트 캐시 라인 하나**에 넣는 pocket dictionary `PD(25, 8, 25)` 를 쓴다. 헤더 50비트가 한 워드에 들어가고 본문은 SIMD 비교로 처리한다. 질의 대부분은 본문 비교 한 번으로 "없음"이 나와 select 연산 없이 끝난다(논문: 99% 이상의 부정 질의).

## 직접 돌려 본 것 (논리만 옮긴 모형)

k=25, 미니 지문 범위 s=25·256(그래서 k/s=1/256), 예비는 정확한 집합으로 대체해 빈 테이블 논리만 확인했다. 해시가 균등하다는 가정이고 SIMD·캐시 라인 구현은 하지 않았다.

| n | α | 예비로 간 비율 | 예비를 만진 부정 질의 | 오탐률 (상한 α·k/s) | 거짓 음성 |
| --- | --- | --- | --- | --- | --- |
| 2²⁰ | 1.00 | 7.98% | 7.71% | 0.390% (0.391%) | 0 |
| 2²⁰ | 0.95 | 5.90% | 5.63% | 0.366% (0.371%) | 0 |
| 2²² | 0.95 | 5.90% | 5.60% | 0.374% (0.371%) | 0 |
| 2²² | 0.85 | 2.72% | 2.48% | 0.335% (0.332%) | 0 |

- α=1 에서 예비로 간 비율 7.98% 는 `1/√(2π·25) = 7.98%` 와 일치한다. α 를 낮추면 예비 비율이 급감하고(α=0.85 에서 2.72%) 대신 빈 테이블이 커진다(빈 테이블 공간 10.0 → 10.5 → 11.8 비트/키, 위 순서의 α=1, 0.95, 0.85).
- 오탐률이 α·k/s 를 따라가고 거짓 음성이 0 이라 접두사 불변식과 질의 규칙이 서로 맞는 것을 확인했다.
- 논문이 보고한 실제 구현의 공간: 오탐률 0.37% 에서 약 11.6~12.1 비트/키(정보 이론 하한 대비 +3.6~4.1비트). 같은 표에서 쿠쿠 CF-12 는 12.77 비트/키 오탐 0.18%, 벡터 쿼션트 필터(TC) 는 11.41 비트/키 오탐 0.44% 다. **공간은 비슷한 수준**이라는 의미다.

## 논문이 보고한 속도 (Intel Ice Lake 2.4GHz, n=0.94·2²⁸ ≈ 2.5억 키)

- 부정 질의: CF-12-Flex·TC 보다 모든 부하에서 빠르고, CF-12 보다는 95% 부하까지 빠르다(부하 50/70/90% 에서 55%/40%/2.8% 높음). 이유는 쿠쿠·TC 가 캐시 미스 두 번인 반면 프리픽스 필터는 보통 한 번이어서라고 논문이 설명한다.
- 삽입: TC 보다 약 1.25배(약 85% 부하까지), 쿠쿠 필터는 부하가 오르면 처리량이 급감하는 반면 프리픽스 필터는 60% 부하까지 안정적이다.
- 전체 구축 시간: 쿠쿠 필터보다 3.2~3.5배, 벡터 쿼션트 필터보다 1.39~1.46배 빠르다.
- 긍정 질의(있는 키): 100% 부하에서 CF-12-Flex 보다 28~40% 낮은 처리량이다. TC 보다는 12~22% 빠르다.
- blocked Bloom 은 모든 연산에서 약 2배 빠르지만 오탐률이 3~6배 높게 측정됐다(구현 한계로 오탐률을 맞출 수 없다는 논문 설명).

## 언제 쓰나

- **삽입 전용**이고 삭제가 없는 필터. 디스크·원격 저장소 앞의 부정 질의 차단용(없는 키 조회가 대다수인 경우), 구축이 잦은 필터.
- 공간이 Bloom 보다 중요하고 쿠쿠·TC 의 삽입 편차가 부담스러울 때.
- 필터가 이미 캐시에 안 들어가는 크기라서 **캐시 미스 수**가 성능을 좌우하는 환경([캐시 지역성](/develop-wiki/knowledge/cs-fundamentals/cpu-cache-locality/)).

## 주의 (비용)

- **삭제가 없다.** 삭제가 필요하면 [벡터 쿼션트 필터](/develop-wiki/knowledge/algorithms/vector-quotient-filter/)·[카운팅 쿼션트 필터](/develop-wiki/knowledge/algorithms/counting-quotient-filter/)·쿠쿠 필터 계열을 쓴다. 키 집합이 처음부터 완전히 고정돼 구축 후 불변이라면 [Ribbon·Binary Fuse](/develop-wiki/knowledge/algorithms/ribbon-binary-fuse-filters/) 같은 정적 필터가 공간이 더 작을 수 있다(이 노트는 두 계열을 같은 표에서 비교하지 않았다).
- **오탐률이 고정**이다. 원형 구현은 약 2⁻⁸(0.37%)이고 다른 값은 구조가 달라진다. 더 낮은 오탐이 필요하면 지문 크기·빈 구성을 다시 설계해야 한다.
- 구현은 AVX-512/AVX2·BMI 같은 **특정 명령어 집합에 최적화**돼 있다(논문 구현 기준). 다른 플랫폼 이식 성능은 확인하지 못했다.
- 예비 용량을 넘으면 실패한다. 분석은 확률을 낮게 잡지만 `n` 이 작을수록 상한이 느슨하다(논문이 대규모에서 더 강한 상한을 보임). 사용 시 필터의 `n` 상한을 지켜야 한다.
- 긍정 질의가 쿠쿠 필터보다 느리다. 있는 키 조회가 다수라면 이점이 줄어든다.
- 수치는 논문 저자들의 한 대의 기계·자체 구현 결과다. 이 노트는 속도를 재현하지 않았고 위 모형은 구조 성질(비율·오탐·거짓 음성)만 검증했다.

> 출처 확인 범위: arXiv 2203.17139 HTML 판(v3, 2022-10-25)의 초록, 1절 서론, 4절(구조·삽입·질의·예비·분석 요약 정리 2), 5.2.1~5.2.2(PD 매개변수·질의 컷오프), 7절(실험 설정, Table 3, 7.3·7.4)과 4.4절 토론을 직접 읽었다. 6절 증명, 5절의 pocket dictionary 상세, 3절 관련 연구, Figure 의 수치는 읽지 않았다. 구현 저장소는 열지 않았다. 빈 테이블 모형은 직접 작성해 실행했다.
