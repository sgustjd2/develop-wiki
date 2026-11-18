---
title: CPU 캐시와 지역성
aka: [CPU Cache, Cache Line, Locality of Reference, Spatial Locality, Temporal Locality, False Sharing, Memory Hierarchy, TLB]
category: cs-fundamentals
group: architecture
level: intermediate
summary: CPU 는 메모리를 캐시 라인 단위로 가져와 계층형 캐시에 둔다. 가까운 데이터를 연달아(공간 지역성), 같은 데이터를 반복해서(시간 지역성) 쓰는 코드가 같은 알고리즘이라도 몇 배 빠르다.
tags: [architecture, cpu, cache, performance, memory, data-layout]
related: [cs-fundamentals/virtual-memory, cs-fundamentals/memory-model-atomics, cs-fundamentals/number-representation]
sources:
  - https://lwn.net/Articles/252125/
  - https://lwn.net/Articles/255364/
  - https://docs.kernel.org/admin-guide/mm/transhuge.html
updatedAt: 2026-11-18
---

## 메모리 계층

Drepper 의 *What every programmer should know about memory*(LWN 연재)에 실린 Pentium M 기준 접근 비용은 대략 이 정도다.

| 위치 | 접근 시간(사이클) | 비유 |
| --- | --- | --- |
| 레지스터 | ≤ 1 | 손에 든 것 |
| L1d | ~3 | 책상 위 |
| L2 | ~14 | 책장 |
| 메인 메모리 | ~240 | 다른 건물 창고 |

수치는 CPU 세대마다 다르지만 **계층마다 한 자릿수 이상 차이**가 난다는 구조는 같다. 현대 CPU 는 보통 코어별 L1·L2 와 공유 L3 를 가진다.

## 캐시 라인

CPU 는 바이트 하나가 필요해도 **캐시 라인**(흔히 64바이트) 전체를 가져온다. 주소의 하위 비트는 라인 안 오프셋, 중간 비트는 캐시의 세트 번호, 상위 비트는 태그로 쓰인다.

```
메모리:  [ 64B 라인 ][ 64B 라인 ][ 64B 라인 ] ...
           ▲ arr[0] 을 읽으면 arr[0..15](int32) 가 함께 캐시에 올라옴
           → arr[1] ~ arr[15] 는 거의 공짜
```

## 지역성 두 가지

| 종류 | 뜻 | 좋은 예 | 나쁜 예 |
| --- | --- | --- | --- |
| 공간 지역성 | 가까운 주소를 이어서 접근 | 배열 순차 순회 | 연결 리스트, 포인터를 따라 흩어진 객체 |
| 시간 지역성 | 같은 데이터를 짧은 간격으로 재사용 | 작은 작업 집합을 반복 처리 | 큰 데이터를 한 번씩만 훑기 |

```ts
// 2차원 배열(행 우선 저장)을 순회하는 두 방식
const N = 4096;
const m = new Float64Array(N * N);

// 빠름: 행 우선 → 메모리를 연속으로 읽음
for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) sum += m[i * N + j];

// 느림: 열 우선 → 매번 N*8 바이트씩 건너뛰어 캐시 라인을 거의 재사용 못 함
for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) sum += m[i * N + j];
```

같은 연산 횟수인데 두 번째가 여러 배 느리다(배수는 CPU 와 크기에 따라 다르니 직접 측정한다). Drepper 연재 5부는 행렬 곱에서 한쪽 행렬을 전치해 순차 접근으로 바꾸는 것만으로 크게 빨라지는 예를 보여 준다.

## 개발자에게 왜 중요한가

- **자료구조 선택**: 원소 수천 개 정도면 이진 탐색 트리·연결 리스트보다 정렬된 배열 + 이진 탐색이 빠른 경우가 많다. 빅오가 같아도(또는 더 나빠도) 상수가 캐시로 결정된다.
- **객체 배열 vs 구조체의 배열(SoA)**: 필드 하나만 훑는 분석 코드는 `{x, y, z}[]` 보다 `xs[], ys[], zs[]` 가 캐시 라인을 덜 낭비한다. 컬럼 지향 DB(ClickHouse, Parquet)가 빠른 이유와 같다.
- **JS·Java 의 객체 배열**은 객체가 힙에 흩어져 포인터를 따라가야 한다. 숫자 대량 처리는 `TypedArray`·원시 배열을 쓴다.
- **TLB**: 큰 메모리를 랜덤 접근하면 캐시뿐 아니라 주소 변환 캐시(TLB)도 미스가 난다. 커널 문서는 2MiB 휴지 페이지가 TLB 미스를 줄인다고 설명한다. [가상 메모리](/develop-wiki/knowledge/cs-fundamentals/virtual-memory/) 참고.

## 거짓 공유(false sharing)

서로 다른 스레드가 **다른 변수**를 쓰는데, 두 변수가 **같은 캐시 라인**에 있으면 코어 간 캐시 일관성 프로토콜 때문에 라인이 계속 오간다. 락도 공유도 없는데 멀티스레드 성능이 안 나오는 대표 원인이다.

```go
// 스레드별 카운터를 캐시 라인 크기로 띄운다
type paddedCounter struct {
	n int64
	_ [56]byte // 64B 라인 가정
}
var counters [8]paddedCounter // 고루틴 i 는 counters[i].n 만 갱신
```

## 언제 신경 쓰나

- 프로파일러에서 특정 루프가 뜨거운데 연산은 단순할 때 → `perf stat -e cache-misses` 등으로 캐시 미스를 본다.
- 코어를 늘려도 처리량이 안 오를 때 → 거짓 공유, 공유 원자 변수 경합.
- 대용량 데이터 처리·게임·DB 엔진·수치 계산.

## 주의 (비용)

- 일반적인 웹 API 는 네트워크·DB 대기가 지배적이라 캐시 최적화의 체감 효과가 작다. 측정해서 CPU 바운드인 곳에만 쓴다.
- 패딩은 메모리를 늘린다. 경합이 확인된 곳에만 쓴다.
- 캐시 라인 크기·계층 크기는 CPU 마다 다르다(일부 ARM 은 128바이트 라인). 하드코딩보다는 언어·라이브러리가 제공하는 상수를 쓴다(C++ `std::hardware_destructive_interference_size` 등).
