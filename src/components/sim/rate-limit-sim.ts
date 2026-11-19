/**
 * 노트 "레이트 리미팅" 의 알고리즘 다섯 개(고정 윈도, 슬라이딩 윈도 로그, 슬라이딩 윈도 카운터, 토큰 버킷, 리키 버킷)를
 * 같은 요청 열에 적용해 비교한다. 단일 클라이언트·단일 프로세스, 요청 비용은 모두 1.
 * 한도: 윈도 W 초당 L 건. 토큰 버킷·리키 버킷의 속도는 L/W 건/초, 크기는 B.
 * 카운터·로그에는 허용된 요청만 기록한다. 리키 버킷은 큐(길이 B)에 넣고 W/L 초 간격으로 내보낸다.
 */
export type Algo = 'fixed' | 'slidingLog' | 'slidingCounter' | 'tokenBucket' | 'leakyBucket';
export const ALGOS: Algo[] = ['fixed', 'slidingLog', 'slidingCounter', 'tokenBucket', 'leakyBucket'];
export type Pattern = 'uniform' | 'burst' | 'boundary';
export interface Params { limit: number; window: number; bucket: number; load: number; pattern: Pattern; seed: number }
export interface Result {
  algo: Algo;
  accepted: number;
  rejected: number;
  maxPerWindow: number; // 임의 위치 W 초 구간에서 통과한 최대 건수
  maxPerTenth: number; // 임의 위치 W/10 초 구간에서 통과한 최대 건수
  maxWait: number; // 리키 버킷 대기열 최대 대기(초). 나머지는 0
  pass: Float64Array; // 통과 시각(리키 버킷은 내보낸 시각)
}

export const WINDOWS = 20; // 시뮬레이션 길이 = 20 W
const EPS = 1e-9;

function mulberry32(a: number) {
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 요청 도착 시각(오름차순).
 * - uniform: 포아송 도착, 평균 속도 load·L/W.
 * - burst: 4 윈도마다 한 번(1, 5, 9, 13, 17번째 윈도 가운데 0.1W 안) load·L 건.
 * - boundary: 홀수 번째 윈도 경계마다 경계 직전 0.1W 에 load·L/2 건, 직후 0.1W 에 load·L/2 건.
 */
export function arrivals(p: Params): Float64Array {
  const rng = mulberry32(p.seed * 7919 + 1);
  const W = p.window, T = WINDOWS * W, out: number[] = [];
  if (p.pattern === 'uniform') {
    const rate = (p.load * p.limit) / W;
    for (let t = -Math.log(1 - rng()) / rate; t < T; t += -Math.log(1 - rng()) / rate) out.push(t);
  } else if (p.pattern === 'burst') {
    const n = Math.round(p.load * p.limit);
    for (let k = 1; k < WINDOWS; k += 4) for (let i = 0; i < n; i++) out.push((k + 0.45 + 0.1 * rng()) * W);
  } else {
    const n = Math.round((p.load * p.limit) / 2);
    for (let k = 1; k < WINDOWS; k += 2) for (let i = 0; i < n; i++) { out.push((k - 0.1 * rng()) * W); out.push((k + 0.1 * rng()) * W); }
  }
  return Float64Array.from(out).sort();
}

/** 정렬된 시각 열에서 길이 len 인 반열린 구간 (x−len, x] 에 든 최대 개수 */
function maxIn(ts: Float64Array, len: number) {
  let best = 0;
  for (let i = 0, j = 0; i < ts.length; i++) {
    while (ts[j] <= ts[i] - len + EPS) j++;
    if (i - j + 1 > best) best = i - j + 1;
  }
  return best;
}

export function simulate(algo: Algo, p: Params, arr: Float64Array): Result {
  const { limit: L, window: W, bucket: B } = p;
  const rate = L / W;
  const pass: number[] = [];
  let maxWait = 0;

  if (algo === 'fixed') {
    let win = -1, cnt = 0;
    for (const t of arr) {
      const w = Math.floor(t / W);
      if (w !== win) { win = w; cnt = 0; }
      if (cnt < L) { cnt++; pass.push(t); }
    }
  } else if (algo === 'slidingLog') {
    let head = 0; // pass[head..] 가 최근 W 초 안
    for (const t of arr) {
      while (head < pass.length && pass[head] <= t - W + EPS) head++;
      if (pass.length - head < L) pass.push(t);
    }
  } else if (algo === 'slidingCounter') {
    let win = 0, cur = 0, prev = 0;
    for (const t of arr) {
      const w = Math.floor(t / W);
      if (w !== win) { prev = w === win + 1 ? cur : 0; cur = 0; win = w; }
      const est = prev * (1 - (t - w * W) / W) + cur; // 이전 윈도를 남은 비율만큼 가중
      if (est + 1 <= L + EPS) { cur++; pass.push(t); }
    }
  } else if (algo === 'tokenBucket') {
    let tokens = B, last = 0; // 가득 찬 상태로 시작
    for (const t of arr) {
      tokens = Math.min(B, tokens + (t - last) * rate);
      last = t;
      if (tokens >= 1 - EPS) { tokens -= 1; pass.push(t); }
    }
  } else {
    const gap = 1 / rate;
    let head = 0, lastOut = -Infinity; // pass[head..] 는 아직 내보내지 않은 요청
    for (const t of arr) {
      while (head < pass.length && pass[head] <= t + EPS) head++;
      if (pass.length - head < B) {
        const out = Math.max(t, lastOut + gap);
        lastOut = out;
        pass.push(out);
        if (out - t > maxWait) maxWait = out - t;
      }
    }
  }
  const ts = Float64Array.from(pass);
  return {
    algo,
    accepted: ts.length,
    rejected: arr.length - ts.length,
    maxPerWindow: maxIn(ts, W),
    maxPerTenth: maxIn(ts, W / 10),
    maxWait,
    pass: ts,
  };
}

export function runAll(p: Params) {
  const arr = arrivals(p);
  return { arrivals: arr, results: ALGOS.map((a) => simulate(a, p, arr)) };
}
