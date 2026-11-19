/**
 * 노트 "메타안정 장애" 의 재시도 폭풍 모형을 브라우저용으로 옮긴 것.
 * 0.1초 단위 유체 모형: 같은 0.1초에 보낸 요청을 한 묶음(cohort)으로 다룬다.
 * - 서버는 0.1초마다 capacity×0.1 건을 선입선출로 처리하고, 처리된 요청은 그 0.1초 끝에 응답한다.
 * - 클라이언트는 보낸 지 timeout 이 지나도록 응답이 없으면 포기하고(그 요청은 큐에 남는다) 재시도를 보낸다.
 *   재시도도 같은 규칙을 따르며 시도 수는 1+retries 까지. 백오프 없이 모두 같은 시점에 보낸다.
 * - 재시도 예산: 0.1초마다 보내는 재시도 수 ≤ 그 0.1초 새 요청 수 × budget%. 넘치면 비례해 덜 보낸다.
 * - 만료 요청 폐기: 서버가 꺼낼 때 이미 클라이언트가 포기한 요청은 처리하지 않고 버린다(용량을 쓰지 않음).
 *   폐기하지 않으면 포기된 요청도 처리해 용량을 낭비한다.
 * - goodput: 보낸 지 timeout 안에 응답한 요청의 처리량(QPS).
 * - 트리거: 10초부터 길이 L 동안 단절(서버 처리 0, 요청은 계속 쌓임) 또는 부하 급증(새 요청 × 배수).
 */
export const DT = 0.1;
export const HORIZON = 200; // 초
export const TRIGGER_AT = 10; // 초
export const SNAP_TIMES = [5, 15, 30, 60, 100, 150, 199];

export type Trigger = 'outage' | 'spike';
export interface Params {
  load: number; // 평소 부하 QPS
  capacity: number; // QPS
  trigger: Trigger;
  triggerLen: number; // 초
  spikeMul: number; // 급증 배수(trigger=spike 일 때)
  timeout: number; // 초
  retries: number; // 재시도 횟수(시도 수 = 1+retries)
  budgetPct: number; // 재시도 예산(%), 예산 행에만 적용
}
export type Strategy = 'none' | 'retry' | 'retry-budget' | 'retry-drop' | 'retry-budget-drop';
export interface Strat { retries: number; budget: number; drop: boolean } // budget: Infinity = 제한 없음
export interface Series { goodput: Float64Array; queue: Float64Array; offered: Float64Array } // 0.1초마다
export interface Result {
  strategy: Strategy;
  series: Series;
  snaps: number[]; // SNAP_TIMES 시각의 goodput(1초 평균)
  recoveredAt: number; // 트리거가 끝난 뒤 goodput 이 min(평소 부하, 용량)의 90% 이상으로 돌아와 끝까지 유지된 첫 시각(초), 못 하면 NaN
  maxQueue: number;
  finalQueue: number;
}

export function strategies(p: Params): Record<Strategy, Strat> {
  const b = p.budgetPct / 100;
  return {
    none: { retries: 0, budget: Infinity, drop: false },
    retry: { retries: p.retries, budget: Infinity, drop: false },
    'retry-budget': { retries: p.retries, budget: b, drop: false },
    'retry-drop': { retries: p.retries, budget: Infinity, drop: true },
    'retry-budget-drop': { retries: p.retries, budget: b, drop: true },
  };
}

export function simulate(strategy: Strategy, p: Params): Result {
  const s = strategies(p)[strategy];
  const steps = Math.round(HORIZON / DT);
  const toTicks = Math.max(1, Math.round(p.timeout / DT));
  const trigA = Math.round(TRIGGER_AT / DT), trigB = trigA + Math.round(p.triggerLen / DT);
  // 큐: 보낸 시각(틱) 순서. sent=보낸 틱, n=남은 수, att=시도 번호(0=원 요청), fired=재시도/포기 처리 여부
  const sent: number[] = [], n: number[] = [], att: number[] = [], fired: boolean[] = [];
  let head = 0, firePtr = 0, queued = 0;
  const goodput = new Float64Array(steps), queue = new Float64Array(steps), offered = new Float64Array(steps);
  const push = (tick: number, cnt: number, a: number) => {
    if (cnt <= 1e-9) return;
    sent.push(tick); n.push(cnt); att.push(a); fired.push(false); queued += cnt;
  };

  for (let k = 0; k < steps; k++) {
    const inTrig = k >= trigA && k < trigB;
    const fresh = p.load * DT * (inTrig && p.trigger === 'spike' ? p.spikeMul : 1);
    // 1) timeout 이 된 묶음: 남은 요청은 클라이언트가 포기 → 시도가 남았으면 재시도
    const want: number[] = [], from: number[] = [];
    let wantSum = 0;
    while (firePtr < sent.length && sent[firePtr] <= k - toTicks) {
      const i = firePtr++;
      fired[i] = true;
      if (n[i] > 1e-9 && att[i] < s.retries) { want.push(n[i]); from.push(att[i] + 1); wantSum += n[i]; }
    }
    const allow = Math.min(wantSum, s.budget * fresh);
    const scale = wantSum > 0 ? allow / wantSum : 0;
    push(k, fresh, 0);
    for (let j = 0; j < want.length; j++) push(k, want[j] * scale, from[j]);
    offered[k] = (fresh + allow) / DT;
    // 2) 서버 처리(단절 중에는 0). 처리분은 이 틱 끝(k+1)에 응답
    let cap = inTrig && p.trigger === 'outage' ? 0 : p.capacity * DT;
    let good = 0;
    while (head < sent.length && (cap > 1e-9 || (s.drop && fired[head]))) {
      if (n[head] <= 1e-9) { head++; continue; }
      if (s.drop && fired[head]) { queued -= n[head]; n[head] = 0; head++; continue; } // 포기된 요청 폐기
      const take = Math.min(cap, n[head]);
      n[head] -= take; cap -= take; queued -= take;
      if (k + 1 - sent[head] <= toTicks) good += take;
      if (n[head] <= 1e-9) head++;
    }
    goodput[k] = good / DT;
    queue[k] = Math.max(0, queued);
  }

  const avg1s = (k: number) => { // k 틱을 끝으로 하는 1초 평균
    const w = Math.round(1 / DT); let sum = 0, c = 0;
    for (let i = Math.max(0, k - w + 1); i <= k; i++) { sum += goodput[i]; c++; }
    return sum / c;
  };
  const snaps = SNAP_TIMES.map((t) => avg1s(Math.min(steps - 1, Math.round(t / DT))));
  const target = 0.9 * Math.min(p.load, p.capacity);
  let recoveredAt = NaN;
  for (let k = steps - 1; k >= trigB; k--) {
    if (goodput[k] < target) break;
    recoveredAt = k * DT; // 이 틱부터 끝까지 goodput ≥ 평소 부하(또는 용량)의 90%
  }
  let maxQueue = 0;
  for (const v of queue) if (v > maxQueue) maxQueue = v;
  return { strategy, series: { goodput, queue, offered }, snaps, recoveredAt, maxQueue, finalQueue: queue[steps - 1] };
}

export const STRATEGIES: Strategy[] = ['none', 'retry', 'retry-budget', 'retry-drop', 'retry-budget-drop'];
export function runAll(p: Params): Result[] {
  return STRATEGIES.map((st) => simulate(st, p));
}
