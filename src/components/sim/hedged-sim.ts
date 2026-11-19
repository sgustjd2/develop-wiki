/**
 * 노트 "요청 헤징과 tied requests" 의 이산 사건 모사를 브라우저용으로 옮긴 것.
 * 모형: 서버 SERVERS 대, 서버당 워커 1 개(FIFO 큐). 서비스 시간은 실행(사본)마다 독립으로
 * 확률 1-q 로 FAST_MS×U(0.5,1.5), 확률 q 로 SLOW_MS×U(0.5,1.5). 도착은 포아송, 요청은 무작위 서버 하나로.
 * 헤징: 응답이 delay 안에 없으면 다른 무작위 서버에 사본을 하나 더 보낸다. delay 는 같은 시드의
 * 헤징 없음 실행에서 잰 응답 시간 백분위(예 p95).
 * 큐 취소: 한 사본이 끝나는 순간 다른 사본이 아직 큐에서 대기 중이면 버린다(실행 중이면 끝까지 간다).
 */
export const SERVERS = 10;
export const REQUESTS = 300_000; // 노트와 같은 조건당 요청 수
export const FAST_MS = 10;
export const SLOW_MS = 200;

export type Mode = 'none' | 'hedge' | 'hedge-cancel';
export interface Params { util: number; slowPct: number; hedgePct: number; seed: number }
export interface Result {
  mode: Mode;
  delay: number; // 헤지 지연(ms), 헤징 없음은 NaN
  p50: number; p99: number; p999: number;
  hedgedFrac: number; // 헤지 사본을 보낸 요청 비율
  execPerReq: number; // 요청당 실제 실행(시작)된 사본 수
  effUtil: number; // util × execPerReq: 1 이상이면 서버가 감당할 수 없는 부하
}

function mulberry32(a: number) {
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function meanService(slowPct: number) {
  const q = slowPct / 100;
  return (1 - q) * FAST_MS + q * SLOW_MS;
}

const pct = (sorted: Float64Array, p: number) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];

/** 응답 시간 배열(정렬 전)과 집계를 돌려준다 */
function simulate(mode: Mode, p: Params, delay: number) {
  const N = SERVERS, R = REQUESTS;
  const q = p.slowPct / 100;
  const rate = (p.util * N) / meanService(p.slowPct); // 요청/ms
  const arrRng = mulberry32(p.seed * 7919 + 1); // 도착 간격·서버 선택: 모드가 달라도 같은 흐름
  const svcRng = mulberry32(p.seed * 104729 + 2); // 서비스 시간
  const hedgeRng = mulberry32(p.seed * 15485863 + 3); // 헤지 사본의 서버 선택

  const arrival = new Float64Array(R);
  const resp = new Float64Array(R);
  const done = new Uint8Array(R);
  const sibling = new Int32Array(2 * R).fill(-1); // 사본 id → 다른 사본 id
  const reqOf = new Int32Array(2 * R);
  const state = new Uint8Array(2 * R); // 0 대기, 1 실행 중/끝, 2 취소
  const origServer = new Int16Array(R);
  let copies = 0, execs = 0, hedged = 0;

  const busyUntil = new Float64Array(N).fill(Infinity);
  const running = new Int32Array(N).fill(-1);
  const queues: number[][] = Array.from({ length: N }, () => []);
  const heads = new Int32Array(N);

  const start = (s: number, c: number, t: number) => {
    state[c] = 1; execs++;
    const u = svcRng(), v = svcRng();
    const svc = (u < q ? SLOW_MS : FAST_MS) * (0.5 + v);
    running[s] = c; busyUntil[s] = t + svc;
  };
  const enqueue = (s: number, r: number, t: number) => {
    const c = copies++;
    reqOf[c] = r;
    if (running[s] < 0) start(s, c, t);
    else queues[s].push(c);
    return c;
  };

  let nextArr = -Math.log(1 - arrRng()) / rate, nArr = 0;
  let hp = 0; // 헤지 타이머: 도착 순서대로 arrival+delay 에 울린다
  const useHedge = mode !== 'none';
  const firstCopy = new Int32Array(R);

  for (;;) {
    let s = -1, tc = Infinity;
    for (let k = 0; k < N; k++) if (busyUntil[k] < tc) { tc = busyUntil[k]; s = k; }
    while (useHedge && hp < nArr && done[hp]) hp++;
    const th = useHedge && hp < nArr ? arrival[hp] + delay : Infinity;
    const ta = nArr < R ? nextArr : Infinity;
    if (tc === Infinity && th === Infinity && ta === Infinity) break;

    if (tc <= th && tc <= ta) {
      // 완료
      const c = running[s], r = reqOf[c];
      if (!done[r]) {
        done[r] = 1; resp[r] = tc - arrival[r];
        const o = sibling[c];
        if (mode === 'hedge-cancel' && o >= 0 && state[o] === 0) state[o] = 2;
      }
      running[s] = -1; busyUntil[s] = Infinity;
      const qu = queues[s];
      while (heads[s] < qu.length) {
        const nx = qu[heads[s]++];
        if (state[nx] === 0) { start(s, nx, tc); break; }
      }
      if (heads[s] > 4096 && heads[s] * 2 > qu.length) { queues[s] = qu.slice(heads[s]); heads[s] = 0; }
    } else if (th <= ta) {
      // 헤지 타이머: 아직 응답이 없으면 다른 서버에 사본
      const r = hp++;
      hedged++;
      let sv = Math.floor(hedgeRng() * (N - 1));
      if (sv >= origServer[r]) sv++;
      const c = enqueue(sv, r, th);
      sibling[c] = firstCopy[r]; sibling[firstCopy[r]] = c;
    } else {
      const r = nArr++;
      arrival[r] = ta;
      const sv = Math.floor(arrRng() * N);
      origServer[r] = sv;
      firstCopy[r] = enqueue(sv, r, ta);
      nextArr = ta - Math.log(1 - arrRng()) / rate;
    }
  }
  return { resp, hedged, execs };
}

export function runAll(p: Params): Result[] {
  const base = simulate('none', p, Infinity);
  const sortedBase = base.resp.slice().sort();
  const delay = pct(sortedBase, p.hedgePct / 100);
  const out: Result[] = [];
  for (const mode of ['none', 'hedge', 'hedge-cancel'] as Mode[]) {
    const run = mode === 'none' ? base : simulate(mode, p, delay);
    const sorted = mode === 'none' ? sortedBase : run.resp.slice().sort();
    const execPerReq = run.execs / REQUESTS;
    out.push({
      mode,
      delay: mode === 'none' ? NaN : delay,
      p50: pct(sorted, 0.5), p99: pct(sorted, 0.99), p999: pct(sorted, 0.999),
      hedgedFrac: run.hedged / REQUESTS,
      execPerReq,
      effUtil: p.util * execPerReq,
    });
  }
  return out;
}
