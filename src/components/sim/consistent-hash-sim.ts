/**
 * 노트 "일관된 해싱" 의 해시 링(가상 노드)과 hash mod N 을 같은 키로 비교하는 시뮬레이션.
 * 해시는 노트 코드의 hash32(FNV-1a + murmur3 마무리 섞기), 가상 노드 이름은 `${node}#${i}`, 키는 `user:${i}`.
 * 노드 이름: 시드 1 이면 노트 코드와 같은 a, b, c …, 그 밖의 시드는 `a.<시드>` 처럼 접미사를 붙여 링 위 위치를 바꾼다.
 * 노드 추가는 다음 이름의 노드 1개를 넣고, 제거는 마지막 노드 1개를 뺀다.
 */
export type Op = 'add' | 'remove';
export interface ChParams { nodes: number; vnodes: number; keys: number; op: Op; seed: number }
export interface SchemeStats {
  loads: number[]; // 변경 전 노드별 키 수
  maxRatio: number; minRatio: number; // 최대/평균, 최소/평균
  stdev: number; // 모표준편차(키 수)
  moved: number; // 변경 후 담당 노드가 바뀐 키 비율
  movedTheory: number;
}
export interface ChResult {
  names: string[]; // 변경 전 노드 이름
  changed: string; // 추가·제거되는 노드 이름
  ring: SchemeStats; mod: SchemeStats;
  points?: { point: number; node: number }[]; // 링 그림용(점이 RING_VIEW_MAX 이하일 때). node 는 이름 인덱스, 추가 노드는 names.length
}

export const RING_VIEW_MAX = 64;

/** 노트 코드와 같은 해시 */
export function hash32(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
  return h >>> 0;
}

/** 0 → a, 25 → z, 26 → aa … */
export function nodeName(i: number, seed: number) {
  let s = '';
  for (let x = i + 1; x > 0; x = Math.floor((x - 1) / 26)) s = String.fromCharCode(97 + ((x - 1) % 26)) + s;
  return seed === 1 ? s : `${s}.${seed}`;
}

class Ring {
  pts: Float64Array; owner: Int32Array;
  constructor(entries: { point: number; node: number }[]) {
    entries.sort((a, b) => a.point - b.point);
    this.pts = Float64Array.from(entries, (e) => e.point);
    this.owner = Int32Array.from(entries, (e) => e.node);
  }
  /** h 이상인 첫 지점의 노드. 끝을 넘으면 0번으로 감아 돈다 */
  lookup(h: number) {
    const p = this.pts;
    let lo = 0, hi = p.length;
    while (lo < hi) { const m = (lo + hi) >>> 1; if (p[m] < h) lo = m + 1; else hi = m; }
    return this.owner[lo % p.length];
  }
}

function stats(loads: number[], moved: number, movedTheory: number): SchemeStats {
  const mean = loads.reduce((a, b) => a + b, 0) / loads.length;
  const sd = Math.sqrt(loads.reduce((a, b) => a + (b - mean) ** 2, 0) / loads.length);
  return { loads, maxRatio: Math.max(...loads) / mean, minRatio: Math.min(...loads) / mean, stdev: sd, moved, movedTheory };
}

export function simulate(p: ChParams): ChResult {
  const N = p.nodes, V = p.vnodes, K = p.keys;
  const after = p.op === 'add' ? N + 1 : N - 1;
  const names = Array.from({ length: Math.max(N, after) }, (_, i) => nodeName(i, p.seed));
  const entries: { point: number; node: number }[] = [];
  for (let n = 0; n < names.length; n++) for (let i = 0; i < V; i++) entries.push({ point: hash32(`${names[n]}#${i}`), node: n });
  const ringBefore = new Ring(entries.filter((e) => e.node < N));
  const ringAfter = new Ring(entries.filter((e) => e.node < after));

  const ringLoads = new Array<number>(N).fill(0), modLoads = new Array<number>(N).fill(0);
  let ringMoved = 0, modMoved = 0;
  for (let i = 0; i < K; i++) {
    const h = hash32(`user:${i}`);
    const r = ringBefore.lookup(h);
    ringLoads[r]++;
    if (ringAfter.lookup(h) !== r) ringMoved++;
    const m = h % N;
    modLoads[m]++;
    if (h % after !== m) modMoved++;
  }
  // 이론 이동 비율: 링은 바뀐 노드 몫의 기댓값, mod 는 h mod N = h mod N' 인 비율을 뺀 값
  const ringTheory = p.op === 'add' ? 1 / (N + 1) : 1 / N;
  const modTheory = p.op === 'add' ? N / (N + 1) : (N - 1) / N;
  const total = names.length * V;
  return {
    names: names.slice(0, N),
    changed: names[p.op === 'add' ? N : N - 1],
    ring: stats(ringLoads, ringMoved / K, ringTheory),
    mod: stats(modLoads, modMoved / K, modTheory),
    points: total <= RING_VIEW_MAX ? entries.map((e) => ({ ...e })).sort((a, b) => a.point - b.point) : undefined,
  };
}
