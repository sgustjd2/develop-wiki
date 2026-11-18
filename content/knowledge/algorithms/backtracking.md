---
title: 백트래킹
aka: [Backtracking, 퇴각 검색, Branch and Bound, 분기 한정, Constraint Satisfaction]
category: algorithms
group: algorithm
level: intermediate
summary: 해를 한 단계씩 만들어 가다가 제약을 어기는 순간 되돌아가 다른 선택을 시도하는 완전 탐색 기법. 가지치기로 탐색 공간을 줄이지만 최악은 지수 시간이다.
tags: [backtracking, search, pruning, constraint-satisfaction, regex]
related: [algorithms/bfs-dfs, algorithms/dynamic-programming, algorithms/greedy, security/owasp-top-10]
sources:
  - https://en.wikipedia.org/wiki/Backtracking
  - https://community.owasp.org/attacks/Regular_expression_Denial_of_Service_-_ReDoS
  - https://en.wikipedia.org/wiki/DPLL_algorithm
  - https://github.com/google/re2/wiki/WhyRE2
updatedAt: 2026-11-18
---

## 개념

선택의 나무(상태 공간 트리)를 [DFS](/develop-wiki/knowledge/algorithms/bfs-dfs/)로 내려간다.

1. 현재 부분 해에 선택지 하나를 **추가**한다.
2. 제약을 만족하면 더 깊이 들어가고, 완성되면 기록한다.
3. 막히거나 다 봤으면 방금 선택을 **취소**(되돌리기)하고 다음 선택지로.

전수 조사와 차이는 **가지치기(pruning)**: 부분 해만 봐도 실패가 확실하면 그 아래 서브트리 전체를 건너뛴다.

## 예: N-Queens

```ts
function solveNQueens(n: number): number[][] {
  const res: number[][] = [];
  const cols: number[] = [];                     // cols[r] = r 행 퀸의 열
  const usedCol = new Array<boolean>(n).fill(false);
  const usedD1 = new Array<boolean>(2 * n).fill(false); // r + c
  const usedD2 = new Array<boolean>(2 * n).fill(false); // r - c + n

  const place = (r: number): void => {
    if (r === n) { res.push([...cols]); return; }
    for (let c = 0; c < n; c++) {
      if (usedCol[c] || usedD1[r + c] || usedD2[r - c + n]) continue; // 가지치기: O(1) 충돌 검사
      usedCol[c] = usedD1[r + c] = usedD2[r - c + n] = true;
      cols.push(c);
      place(r + 1);
      cols.pop();                                    // 되돌리기
      usedCol[c] = usedD1[r + c] = usedD2[r - c + n] = false;
    }
  };
  place(0);
  return res;
}
console.log(solveNQueens(6).length, solveNQueens(8).length); // 4 92
```

## 예: 합이 target 인 조합 (정렬 + 가지치기)

```ts
function combinationSum(cands: readonly number[], target: number): number[][] {
  const xs = [...cands].sort((a, b) => a - b);
  const out: number[][] = [];
  const path: number[] = [];
  const go = (start: number, remain: number): void => {
    if (remain === 0) { out.push([...path]); return; }
    for (let i = start; i < xs.length; i++) {
      if (xs[i] > remain) break;                 // 정렬돼 있으니 뒤는 전부 불가능
      if (i > start && xs[i] === xs[i - 1]) continue; // 같은 값 중복 조합 제거
      path.push(xs[i]);
      go(i + 1, remain - xs[i]);
      path.pop();
    }
  };
  go(0, target);
  return out;
}
console.log(combinationSum([10, 1, 2, 7, 6, 1, 5], 8)); // [[1,1,6],[1,2,5],[1,7],[2,6]]
```

## 복잡도

| 문제 | 탐색 공간 | 비고 |
| --- | --- | --- |
| 부분집합 | O(2ⁿ) | |
| 순열 | O(n!) | |
| N-Queens | O(n!) 상한 | 실제로는 가지치기로 훨씬 적음 |
| 스도쿠·SAT 일반 | 지수 | 휴리스틱(가장 제약 많은 칸부터)이 실제 성능을 좌우 |

공간은 재귀 깊이 + 현재 경로로 O(깊이). 해를 모두 저장하면 그만큼 추가.

## 기법

- **제약 전파**: 선택 후 다른 변수의 가능한 값을 미리 줄여 막다른 길을 빨리 발견(스도쿠의 후보 소거).
- **변수 순서 휴리스틱**: 선택지가 가장 적은 변수부터(MRV). 실패를 일찍 드러낸다.
- **분기 한정(branch and bound)**: 최적화 문제에서 "이 가지로는 현재 최선보다 나을 수 없다"는 상한/하한으로 자른다.
- **메모이제이션**: 같은 부분 상태를 반복 방문하면 결과를 저장 → [동적 계획법](/develop-wiki/knowledge/algorithms/dynamic-programming/).

## 언제 쓰나

- 모든 해를 나열해야 할 때(조합·순열·배치 생성).
- 제약 만족 문제: 스도쿠, 일정표 짜기, 좌석 배정, 설정 조합 검증.
- 입력이 작거나(n ≤ 20 안팎) 가지치기가 강력해 실제 탐색량이 작을 때.
- 정답 검증용 기준 구현: 빠른 알고리즘(그리디·DP)의 결과를 작은 입력에서 대조.

## 주의

- **최악은 지수 시간이다.** 입력 크기 상한을 정하고, 실서비스라면 시간·노드 수 제한(타임아웃)을 둔다.
- 되돌리기를 빠뜨리면(공유 상태 미복원) 다른 가지의 결과가 오염된다. 결과를 저장할 때는 경로를 복사한다(`[...path]`).
- 중복 해 제거를 나중에 `Set` 으로 하면 탐색은 그대로 낭비된다. 정렬 후 같은 값 건너뛰기처럼 탐색 단계에서 막는다.
- 일반 제약 문제는 직접 구현보다 SAT/CSP/MIP 솔버(OR-Tools, Z3)가 훨씬 강력하다.

## 실무에서

- **정규식 ReDoS**: 대부분 언어의 정규식 엔진(JS, Java, Python, PCRE)은 백트래킹으로 구현돼 있다. `(a+)+$` 처럼 반복이 중첩된 패턴에 `aaaa…!` 를 넣으면 경로 수가 글자마다 두 배로 늘어 서버가 멈춘다(OWASP). 대책은 패턴 검토, 입력 길이 제한, 선형 시간 엔진(RE2, Rust `regex`, Go `regexp`) 사용.
- SAT 솔버의 DPLL/CDCL 은 단위 전파 + 백트래킹(충돌 학습으로 비연대기적 되돌리기)이다. 패키지 매니저 의존성 해석기 일부가 SAT 솔버를 쓴다.
- Prolog 의 실행 모델, 파서의 백트래킹(PEG), 퍼즐·일정 최적화.
