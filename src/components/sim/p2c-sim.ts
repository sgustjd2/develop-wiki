/**
 * 노트 "Power of Two Choices" 의 동적 큐 시뮬레이션을 브라우저용으로 옮긴 것.
 * 모형: N 대 서버(각 M/M/1, 서비스율 1), 전체 도착은 포아송(율 N·λ), FIFO.
 * 부하 정보는 interval 마다만 갱신되는 스냅샷(0 이면 실시간). 갱신 사이에는 자신이 보낸 요청도 스냅샷에 반영되지 않는다.
 */
export type Policy = 'random' | 'p2c' | 'jsq';
export interface Result { policy: Policy; mean: number; p99: number; maxQueue: number; jobs: number }
export interface Params { servers: number; lambda: number; interval: number; seed: number }

export const MAX_ARRIVALS = 250_000; // 정책당 도착 수 상한(수 초 이내 보장)
export const MAX_HORIZON = 4000; // 노트와 같은 시뮬레이션 시간
export const WARMUP = 0.2; // 노트와 같이 앞 20% 버림

function mulberry32(a: number) {
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function horizonFor(p: Params) {
  return Math.min(MAX_HORIZON, MAX_ARRIVALS / (p.servers * p.lambda));
}

/** 최소 힙(departure 시각, 서버 번호) */
class Heap {
  t: number[] = [];
  s: number[] = [];
  get size() { return this.t.length; }
  push(time: number, srv: number) {
    let i = this.t.length;
    this.t.push(time); this.s.push(srv);
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.t[p] <= time) break;
      this.t[i] = this.t[p]; this.s[i] = this.s[p]; i = p;
    }
    this.t[i] = time; this.s[i] = srv;
  }
  pop() {
    const n = this.t.length - 1;
    const lt = this.t[n], ls = this.s[n];
    this.t.pop(); this.s.pop();
    if (n === 0) return;
    let i = 0;
    for (;;) {
      let c = 2 * i + 1;
      if (c >= n) break;
      if (c + 1 < n && this.t[c + 1] < this.t[c]) c++;
      if (this.t[c] >= lt) break;
      this.t[i] = this.t[c]; this.s[i] = this.s[c]; i = c;
    }
    this.t[i] = lt; this.s[i] = ls;
  }
}

export function simulate(policy: Policy, p: Params): Result {
  const N = p.servers;
  const horizon = horizonFor(p);
  const warm = horizon * WARMUP;
  const arrRng = mulberry32(p.seed * 7919 + 1); // 도착·서비스 시간: 정책이 달라도 같은 흐름
  const pickRng = mulberry32(p.seed * 104729 + 2); // 서버 선택
  const rate = N * p.lambda;
  const len = new Int32Array(N); // 실제 큐 길이
  const snap = new Int32Array(N); // 로드 밸런서가 보는 값
  const free = new Float64Array(N); // 각 서버의 마지막 완료 시각(FIFO)
  const heap = new Heap();
  const resp: number[] = [];
  let sum = 0, maxQ = 0, nextSnap = p.interval > 0 ? p.interval : Infinity;
  let t = 0;

  for (;;) {
    t += -Math.log(1 - arrRng()) / rate;
    if (t > horizon) break;
    const service = -Math.log(1 - arrRng());
    // t 이전의 완료·스냅샷 갱신을 시간순으로 처리
    for (;;) {
      const d = heap.size ? heap.t[0] : Infinity;
      if (d <= t && d <= nextSnap) { len[heap.s[0]]--; heap.pop(); }
      else if (nextSnap <= t) { snap.set(len); nextSnap += p.interval; }
      else break;
    }
    const view = p.interval === 0 ? len : snap;
    let s: number;
    if (policy === 'random' || N === 1) s = Math.floor(pickRng() * N);
    else if (policy === 'p2c') {
      const i = Math.floor(pickRng() * N);
      let j = Math.floor(pickRng() * (N - 1));
      if (j >= i) j++;
      s = view[j] < view[i] ? j : i; // 동률이면 첫 후보
    } else {
      let best = Infinity, cnt = 0; s = 0;
      for (let k = 0; k < N; k++) {
        if (view[k] < best) { best = view[k]; s = k; cnt = 1; }
        else if (view[k] === best && pickRng() * ++cnt < 1) s = k; // 동률은 무작위(저수지 추출)
      }
    }
    const done = Math.max(t, free[s]) + service;
    free[s] = done;
    len[s]++;
    heap.push(done, s);
    if (t >= warm) {
      const r = done - t;
      resp.push(r); sum += r;
      if (len[s] > maxQ) maxQ = len[s];
    }
  }
  resp.sort((a, b) => a - b);
  const n = resp.length;
  return { policy, mean: n ? sum / n : NaN, p99: n ? resp[Math.min(n - 1, Math.floor(n * 0.99))] : NaN, maxQueue: maxQ, jobs: n };
}

export function runAll(p: Params): Result[] {
  return (['random', 'p2c', 'jsq'] as Policy[]).map((pol) => simulate(pol, p));
}
