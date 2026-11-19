/**
 * 노트 "다중 비교 교정" 의 시뮬레이션을 브라우저용으로 옮긴 것.
 * 모형: 가설 m 개가 서로 독립. 귀무(효과 0)는 z ~ N(0,1), 참 효과는 z ~ N(shift,1). 양측 검정 p = 2(1 − Φ(|z|)).
 * p ≤ a ⇔ |z| ≥ Φ⁻¹(1 − a/2) 이므로 p 값 대신 |z| 와 임계값을 비교한다(결과는 같다).
 */
export type Method = 'none' | 'bonferroni' | 'holm' | 'bh';
export const METHODS: Method[] = ['none', 'bonferroni', 'holm', 'bh'];
export interface Params { m: number; trueEffects: number; shift: number; alpha: number; reps: number; seed: number }
export interface Result {
  method: Method;
  fwer: number; // P(거짓 기각 ≥ 1)
  fdr: number; // E[거짓 기각 / max(기각, 1)]
  power: number; // 참 효과 중 기각된 비율(참 효과가 없으면 NaN)
  meanRejections: number;
}

function mulberry32(a: number) {
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 표준정규 분위수 Φ⁻¹(p) (Acklam 근사, 상대오차 약 1e-9) */
export function normInv(p: number): number {
  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1, 2.506628277459239];
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
  const lo = 0.02425;
  if (p < lo) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p > 1 - lo) return -normInv(1 - p);
  const q = p - 0.5, r = q * q;
  return ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

/** 양측 p ≤ a 에 해당하는 |z| 임계값 */
const crit = (a: number) => normInv(1 - a / 2);

export function simulate(p: Params): Result[] {
  const { m, alpha, reps, shift } = p;
  const k = Math.min(p.trueEffects, m); // 앞의 k 개가 참 효과
  const rng = mulberry32(p.seed * 7919 + 1);
  const cNone = crit(alpha), cBonf = crit(alpha / m);
  const cHolm = new Float64Array(m), cBh = new Float64Array(m);
  for (let j = 0; j < m; j++) { cHolm[j] = crit(alpha / (m - j)); cBh[j] = crit(((j + 1) * alpha) / m); }

  const z = new Float64Array(m), s = new Float64Array(m);
  const anyV = [0, 0, 0, 0], fdp = [0, 0, 0, 0], tp = [0, 0, 0, 0], rej = [0, 0, 0, 0];
  let spare = NaN;
  const gauss = () => {
    if (!Number.isNaN(spare)) { const g = spare; spare = NaN; return g; }
    const u = 1 - rng(), v = rng();
    const r = Math.sqrt(-2 * Math.log(u));
    spare = r * Math.sin(2 * Math.PI * v);
    return r * Math.cos(2 * Math.PI * v);
  };

  for (let it = 0; it < reps; it++) {
    for (let i = 0; i < m; i++) z[i] = Math.abs(gauss() + (i < k ? shift : 0));
    s.set(z); s.sort(); // 오름차순 → 큰 |z|(작은 p) 는 뒤쪽
    // 방법별 기각 수 R. 기각 집합은 |z| 상위 R 개(동률은 확률 0).
    let rNone = 0, rBonf = 0, rHolm = 0, rBh = 0;
    for (let i = 0; i < m; i++) { if (z[i] >= cNone) rNone++; if (z[i] >= cBonf) rBonf++; }
    while (rHolm < m && s[m - 1 - rHolm] >= cHolm[rHolm]) rHolm++;
    for (let j = m - 1; j >= 0; j--) if (s[m - 1 - j] >= cBh[j]) { rBh = j + 1; break; }
    const R = [rNone, rBonf, rHolm, rBh];
    for (let q = 0; q < 4; q++) {
      const r = R[q];
      if (r === 0) continue;
      const cut = s[m - r];
      let t = 0;
      for (let i = 0; i < k; i++) if (z[i] >= cut) t++;
      const v = r - t;
      if (v > 0) { anyV[q]++; fdp[q] += v / r; }
      tp[q] += t; rej[q] += r;
    }
  }
  return METHODS.map((method, q) => ({
    method,
    fwer: anyV[q] / reps,
    fdr: fdp[q] / reps,
    power: k > 0 ? tp[q] / (k * reps) : NaN,
    meanRejections: rej[q] / reps,
  }));
}
