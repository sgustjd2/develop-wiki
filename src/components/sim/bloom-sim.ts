/**
 * 노트 "블룸 필터" 의 오탐률 공식을 실제 필터로 확인하는 시뮬레이션.
 * 모형: m 비트 배열, 서로 다른 정수 키 n 개를 넣고 넣지 않은 키 QUERIES 개를 질의해 "아마 있음" 비율을 잰다.
 * 해시 방식: 'independent' = 위치마다 따로 섞은 해시(이론식의 가정에 가깝다),
 *            'double' = 노트 코드의 이중 해싱 h_i = h1 + i·h2, h2 는 홀수 (Kirsch–Mitzenmacher).
 * 해시는 시드로 고른 소금을 섞은 murmur3 fmix32.
 */
export type HashMode = 'independent' | 'double';
export interface BloomParams { n: number; bitsPerKey: number; k: number; seed: number; hash: HashMode }
export interface BloomResult {
  m: number; n: number; k: number; queries: number;
  falsePositives: number; measuredFpr: number; ci95: number; // 측정값의 95% 정규 근사 반폭
  theoryFpr: number; // (1 − e^(−kn/m))^k
  optimalK: number; // (m/n)·ln 2 (실수)
  optimalKInt: number; // 이론 오탐률이 더 낮은 쪽 정수
  optimalFpr: number;
  fillMeasured: number; fillTheory: number; // 켜진 비트 비율: 측정, 1 − (1 − 1/m)^(kn)
  bits?: Uint8Array; // m ≤ BIT_VIEW_MAX 일 때만
}

export const QUERIES = 200_000;
export const BIT_VIEW_MAX = 512;
export const K_MAX = 20;

function mulberry32(a: number) {
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function fmix32(h: number) {
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

export const mOf = (n: number, bitsPerKey: number) => Math.max(1, Math.round(n * bitsPerKey));
export const theoryFpr = (m: number, n: number, k: number) => (1 - Math.exp((-k * n) / m)) ** k;
export const optimalK = (m: number, n: number) => (m / n) * Math.LN2;

export function optimalKInt(m: number, n: number) {
  const x = optimalK(m, n);
  const lo = Math.max(1, Math.floor(x)), hi = Math.max(1, Math.ceil(x));
  return theoryFpr(m, n, hi) < theoryFpr(m, n, lo) ? hi : lo;
}

export function simulate(p: BloomParams): BloomResult {
  const { n, k } = p;
  const m = mOf(n, p.bitsPerKey);
  const rng = mulberry32(p.seed * 2654435761);
  const s1 = (rng() * 4294967296) >>> 0, s2 = (rng() * 4294967296) >>> 0;
  const bits = new Uint8Array(m);
  const pos = new Float64Array(k);
  const salts = Array.from({ length: k }, () => (rng() * 4294967296) >>> 0);
  // 키 x 의 위치 k 개를 pos 에 채운다
  const positions = p.hash === 'double'
    ? (x: number) => {
        // (h1 + i·h2) mod m. h1, h2 < 2^32, i < 20 이라 double 로 정확히 계산된다
        const a = fmix32(x ^ s1), b = (fmix32(Math.imul(x, 0x9e3779b1) ^ s2) | 1) >>> 0; // 노트처럼 h2 를 홀수로
        for (let i = 0; i < k; i++) pos[i] = (a + i * b) % m;
      }
    : (x: number) => {
        // 위치마다 다른 소금 t_i 를 XOR. (a + i·C 같은 등차 입력은 키끼리 위치 수열이 통째로 겹칠 수 있어 피한다)
        const a = fmix32(x ^ s1);
        for (let i = 0; i < k; i++) pos[i] = fmix32(a ^ salts[i]) % m;
      };

  // 넣는 키: 0..n−1, 질의 키: n..n+QUERIES−1 (겹치지 않으므로 "아마 있음"은 모두 오탐)
  let ones = 0;
  for (let x = 0; x < n; x++) {
    positions(x);
    for (let i = 0; i < k; i++) if (!bits[pos[i]]) { bits[pos[i]] = 1; ones++; }
  }
  let fp = 0;
  for (let x = n; x < n + QUERIES; x++) {
    positions(x);
    let hit = true;
    for (let i = 0; i < k; i++) if (!bits[pos[i]]) { hit = false; break; }
    if (hit) fp++;
  }
  const measured = fp / QUERIES;
  const kOpt = optimalKInt(m, n);
  return {
    m, n, k, queries: QUERIES,
    falsePositives: fp, measuredFpr: measured, ci95: 1.96 * Math.sqrt((measured * (1 - measured)) / QUERIES),
    theoryFpr: theoryFpr(m, n, k),
    optimalK: optimalK(m, n), optimalKInt: kOpt, optimalFpr: theoryFpr(m, n, kOpt),
    fillMeasured: ones / m, fillTheory: 1 - (1 - 1 / m) ** (k * n),
    bits: m <= BIT_VIEW_MAX ? bits : undefined,
  };
}
