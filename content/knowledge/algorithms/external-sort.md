---
title: 외부 정렬
aka: [External Sorting, External Merge Sort, K-way Merge, Replacement Selection, 외부 병합 정렬]
category: algorithms
group: algorithm
level: intermediate
summary: 메모리보다 큰 데이터를 정렬하는 방법. 메모리에 들어가는 조각을 정렬해 디스크에 런으로 쓰고, 런들을 k-way 병합한다. 비용은 비교 횟수가 아니라 디스크 I/O 양으로 센다.
tags: [sorting, external-sort, merge-sort, disk-io, k-way-merge, database]
related: [algorithms/sorting-comparison, algorithms/heap-priority-queue, algorithms/b-tree, algorithms/lsm-tree, algorithms/space-time-tradeoff, algorithms/big-o-complexity, algorithms/stack-queue-deque]
sources:
  - https://en.wikipedia.org/wiki/External_sorting
  - https://www.postgresql.org/docs/current/runtime-config-resource.html
updatedAt: 2026-11-19
---

## 문제

100GB 로그를 정렬하는데 메모리는 8GB 다. [퀵 정렬·힙 정렬](/develop-wiki/knowledge/algorithms/sorting-comparison/)은 모든 데이터가 메모리에 있다고 가정한다. 이 가정이 깨지면 비교 횟수보다 **디스크를 몇 번 읽고 쓰는가**가 시간을 결정한다. 디스크에서 임의 접근(seek)은 순차 읽기보다 훨씬 느리므로, 임의 접근을 피하고 **순차 읽기·쓰기만** 하게 짜는 것이 핵심이다.

## 해법: 외부 병합 정렬

Wikipedia 는 외부 정렬을 크게 두 부류로 나눈다. 퀵 정렬과 비슷한 **분산 정렬(distribution sort)**과 병합 정렬과 비슷한 **외부 병합 정렬**이다. 실무에서는 후자가 표준이다.

1. **런(run) 생성**: 메모리에 들어가는 만큼(M) 읽어 메모리 안에서 정렬하고 임시 파일에 쓴다. 900MB 데이터에 100MB 메모리면 100MB 짜리 정렬된 런이 9개 생긴다(Wikipedia 의 예).
2. **k-way 병합**: 런 k 개의 맨 앞 원소만 최소 [힙](/develop-wiki/knowledge/algorithms/heap-priority-queue/)에 올려, 가장 작은 것을 꺼내 출력에 쓰고 그 런의 다음 원소를 힙에 채운다. 각 런을 읽는 버퍼와 출력 버퍼를 두면 메모리는 약 `(k+1)·버퍼 크기` 면 된다. 위 예에서는 9-way 병합에 각 10MB 정도의 버퍼를 쓴다.
3. 런이 너무 많아 한 번에 병합하지 못하면 **여러 패스**로 병합한다(팬인 F 개씩 묶어 새 런을 만든다).

### I/O 비용

블록 크기 B, 데이터 N, 메모리 M 에서 최적 알고리즘은 약 `O((N/B)·log_{M/B}(N/B))` 번의 블록 전송을 한다(Wikipedia). 패스 수는 대략 `1 + ⌈log_F(런 수)⌉` 이다. 모든 패스가 데이터 전체를 한 번 읽고 한 번 쓴다.

- **패스 수 vs 버퍼 크기**: 한 패스에 k 를 크게 하면 패스가 줄지만 런마다 버퍼가 작아져 읽기 단위가 잘게 쪼개지고 seek 가 늘어난다. Wikipedia 는 한 번에 너무 많은 청크를 병합하면 읽기가 너무 작아져 디스크 탐색이 지배하므로, 병합 패스를 하나 더 하는 편이 오히려 빠를 수 있다고 설명한다. SSD 에서는 이 균형이 달라진다.

### 구현

```ts
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

// 메모리에 chunkSize 개까지만 올린다고 가정. 숫자 한 줄 = 레코드 하나
function createRuns(input: string, dir: string, chunkSize: number): string[] {
  const lines = fs.readFileSync(input, 'utf8').split('\n').filter(Boolean); // 데모용: 실제로는 스트리밍으로 chunk 씩 읽는다
  const runs: string[] = [];
  for (let i = 0; i < lines.length; i += chunkSize) {
    const chunk = lines.slice(i, i + chunkSize).map(Number).sort((a, b) => a - b); // 메모리 안 정렬
    const p = path.join(dir, `run-${runs.length}.txt`);
    fs.writeFileSync(p, chunk.join('\n') + '\n');
    runs.push(p);
  }
  return runs;
}

// 최소 힙 기반 k-way 병합: 힙에는 "각 런의 현재 머리" k 개만 둔다
function* readRun(p: string): Generator<number> {
  const fd = fs.openSync(p, 'r'); const buf = Buffer.alloc(1 << 16); let rest = '';
  try {
    for (let n = fs.readSync(fd, buf, 0, buf.length, null); n > 0; n = fs.readSync(fd, buf, 0, buf.length, null)) {
      const parts = (rest + buf.toString('utf8', 0, n)).split('\n'); rest = parts.pop()!;
      for (const s of parts) if (s) yield Number(s);
    }
    if (rest) yield Number(rest);
  } finally { fs.closeSync(fd); }
}

function mergeRuns(runs: string[], out: string): void {
  type H = { v: number; src: Generator<number> };
  const heap: H[] = [];
  const up = (i: number): void => { for (; i > 0; i = (i - 1) >> 1) { const p = (i - 1) >> 1; if (heap[p].v <= heap[i].v) break; [heap[p], heap[i]] = [heap[i], heap[p]]; } };
  const down = (i: number): void => { for (;;) { let m = i; const l = 2 * i + 1, r = l + 1; if (l < heap.length && heap[l].v < heap[m].v) m = l; if (r < heap.length && heap[r].v < heap[m].v) m = r; if (m === i) return; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } };
  for (const p of runs) { const src = readRun(p); const f = src.next(); if (!f.done) { heap.push({ v: f.value, src }); up(heap.length - 1); } }
  const fd = fs.openSync(out, 'w'); let batch: number[] = [];
  while (heap.length) {
    const top = heap[0]; batch.push(top.v);
    if (batch.length >= 4096) { fs.writeSync(fd, batch.join('\n') + '\n'); batch = []; }
    const nx = top.src.next();
    if (nx.done) { heap[0] = heap[heap.length - 1]; heap.pop(); } else top.v = nx.value;
    if (heap.length) down(0);
  }
  if (batch.length) fs.writeSync(fd, batch.join('\n') + '\n');
  fs.closeSync(fd);
}

// 팬인 fanIn 개씩 묶어 여러 패스로 병합
function externalSort(input: string, output: string, chunkSize: number, fanIn: number): { runs: number; passes: number } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'xsort-'));
  let runs = createRuns(input, dir, chunkSize); const initial = runs.length; let passes = 0;
  while (runs.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < runs.length; i += fanIn) {
      const p = path.join(dir, `m${passes}-${next.length}.txt`); mergeRuns(runs.slice(i, i + fanIn), p); next.push(p);
    }
    runs = next; passes++;
  }
  fs.copyFileSync(runs[0], output); fs.rmSync(dir, { recursive: true });
  return { runs: initial, passes };
}
```

20만 개 난수(런 크기 1만 → 런 20개, 팬인 8 → 병합 2패스)를 정렬해 `tsc --strict` 컴파일 후 실행한 결과는 `{ runs: 20, passes: 2 }`, 결과 길이와 오름차순 검증이 모두 통과했다. 위 `createRuns` 는 데모를 위해 입력 전체를 읽는다. 실제 구현은 스트림에서 chunkSize 만큼씩 읽어야 한다.

### 개선 기법

- **Replacement selection**: 런을 만들 때 메모리 안에 힙을 두고 "마지막에 낸 값보다 큰 것"만 현재 런에 계속 붙이면 무작위 입력에서 런 길이가 평균 약 2M 으로 늘어난다(고전적으로 알려진 결과). 런 수가 줄어 패스가 줄지만 구현이 복잡하다.
- **비동기·다중 디스크**: 읽기·정렬·쓰기를 파이프라이닝하고, 입력과 임시 파일을 다른 디스크에 둔다. Wikipedia 도 다중 디스크, 스레드, 비동기 I/O, 클러스터, SSD, 더 큰 RAM 이 속도를 높인다고 정리한다.
- **분산 정렬 방식**: 피벗으로 데이터를 여러 구간으로 나눠 구간별로 정렬한다. 분산 처리 엔진의 셔플 단계가 비슷한 발상이다.
- **압축**: 런을 압축해 쓰면 I/O 가 줄어든다. CPU 와 맞바꾼다.

## 언제 쓰나

- 데이터가 메모리를 넘는 정렬: 대용량 로그·CSV 정렬, 중복 제거(정렬 후 인접 비교), 조인 전 정렬(sort-merge join).
- DB 의 `ORDER BY`, `DISTINCT`, 병합 조인, 인덱스 생성(`CREATE INDEX`). PostgreSQL 의 `work_mem`(기본 4MB)은 정렬·해시 같은 연산이 임시 디스크 파일로 넘어가기 전에 쓸 수 있는 기본 메모리 한도이고, `maintenance_work_mem`(기본 64MB)은 인덱스 생성 같은 유지보수 작업에 쓰인다. 메모리가 부족하면 이 외부 정렬 경로로 떨어진다.
- 저장 엔진의 병합: [LSM 트리](/develop-wiki/knowledge/algorithms/lsm-tree/)의 컴팩션은 정렬된 런(SSTable)들의 k-way 병합이다.

## 주의

- **먼저 메모리 안에서 풀 수 있는지 본다.** 필요한 필드만 뽑아 정렬 키+오프셋으로 줄이면 들어갈 때가 많다. 인덱스가 이미 정렬돼 있으면 정렬이 필요 없다.
- DB 에서 `work_mem` 을 올리면 정렬이 디스크를 안 쓰지만, 복잡한 질의는 정렬·해시 연산을 여러 개 동시에 하고 세션도 여러 개라 총 사용량이 `work_mem` 의 몇 배가 될 수 있다(PostgreSQL 문서). 무작정 올리지 않는다.
- 임시 디스크 공간이 입력 크기만큼(병합 패스 중에는 그 이상) 필요하다. 임시 파일 위치와 여유 공간을 점검한다.
- 안정 정렬이 필요하면 병합 시 동점을 런 순서로 풀고, 런 생성 단계도 안정 정렬을 쓴다.
- 입력이 이미 거의 정렬돼 있으면 런이 길어지는 replacement selection 이나 자연 병합(natural merge)이 유리하다.
- 레코드가 고정 크기가 아니면 버퍼 경계에서 레코드가 잘린다. 위 예시의 줄 단위 처리처럼 경계 처리를 해야 한다.
- Top-K 만 필요하면 전체 정렬이 낭비다. 크기 K 힙 하나로 한 번 훑는다 → [Top-K](/develop-wiki/knowledge/algorithms/top-k-heavy-hitters-space-saving/).

## 실무에서

- GNU `sort`, 데이터베이스 실행기, 빅데이터 엔진(Spark·Hadoop 셔플)이 모두 같은 틀의 외부 정렬을 한다. 직접 짜기보다 이런 도구가 데이터 크기에 맞게 임시 디렉터리와 버퍼 크기를 조절하도록 설정하는 편이 현실적이다.
- 대회 벤치마크(Sort Benchmark)의 상위 시스템은 다중 디스크·스레드·비동기 I/O 로 같은 알고리즘을 극한까지 튜닝한다(Wikipedia).
