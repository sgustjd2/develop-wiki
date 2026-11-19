---
title: 포즈 그래프 최적화에 GNC 적용하기 — 루프 클로저 이상치를 가중치로 끄기
aka: [GNC for Pose Graph Optimization, GNC-TLS PGO, Robust PGO with Graduated Non-Convexity, Outlier-Robust SLAM Backend]
category: robotics
group: estimation
level: advanced
summary: 포즈 그래프의 루프 클로저에 GNC 를 얹으면 변수 갱신(기존 PGO 솔버)과 간선 가중치 갱신(닫힌 식)을 번갈아 돌려 가짜 루프를 0 가중으로 만든다. 오도메트리가 믿을 만하고 이상치가 서로 안 맞을 때 잘 동작하지만 전역 최적은 보장하지 않는다.
tags: [robotics, slam, pose-graph, gnc, robust-estimation, loop-closure, outliers, truncated-least-squares]
related: [robotics/gnc-teaser-robust-estimation, robotics/loop-closure-outlier-rejection, robotics/factor-graph-slam-optimization, robotics/isam2-bayes-tree-incremental, robotics/slam-concepts, robotics/rotation-representations]
sources:
  - https://arxiv.org/abs/1909.08605
  - https://ar5iv.labs.arxiv.org/html/1909.08605
updatedAt: 2026-11-19
---

> 출처 메모: GNC 논문(Yang·Antonante·Tzoumas·Carlone, RA-L 2020, arXiv 1909.08605)의 포즈 그래프 실험 절(V-B)과 점군·형상 정렬 실험 절을 ar5iv HTML 을 처음에는 요약 도구로 거쳐 읽었고, 이후 독립 팩트체크가 ar5iv 전문(결론까지, 부록 제외)과 대조해 아래 "논문이 보고한 것" 의 수치·잔차 식이 원문과 일치함을 확인했다(2026-11-19). 논문 PDF 는 이 환경에서 텍스트로 추출되지 않았고 부록(Proposition 3 증명)은 읽지 않았다. 아래 직접 만든 모형의 식은 논문 식이 아니라 장난감 모형의 것이다. GNC 알고리즘 일반(대리 비용, 가중치 식, μ 스케줄)은 [GNC·TEASER 노트](/develop-wiki/knowledge/robotics/gnc-teaser-robust-estimation/)에서 다뤘으므로 여기서는 반복하지 않는다. "직접 확인" 절은 직접 만든 2차원 장난감 모형이며 논문 벤치마크의 재현이 아니다.

## 문제

[포즈 그래프](/develop-wiki/knowledge/robotics/factor-graph-slam-optimization/)는 오도메트리 간선(이웃 포즈)과 루프 클로저 간선(재방문)을 가중 최소제곱으로 푼다. 루프 클로저 하나가 가짜(장소 오인식)여도 해 전체가 끌려간다. [DCS·PCM](/develop-wiki/knowledge/robotics/loop-closure-outlier-rejection/)은 이를 위한 SLAM 전용 처방이고, GNC 는 "이상치 없는 PGO 솔버를 그대로 두고 바깥에서 가중치만 갱신" 하는 일반 틀을 PGO 에 꽂는 방식이다.

## 해법

### 구조

간선 `(i, j)` 의 잔차는 상대 회전 불일치와 상대 이동 불일치로 이루어진다(논문 서술: 회전 항은 `R_j` 와 `R_i·R̃_ij` 의 차, 이동 항은 `t_j − t_i` 와 `R_i·t̃_ij` 의 차이고 각각 알려진 잡음 정도로 척도화한다). 바깥 루프는 GNC-TLS 그대로다.

1. 모든 간선 가중치 1 로 시작. 오도메트리 간선은 이상치 후보에서 빼고 1 로 고정해도 된다(논문의 방식인지는 요약본에서 확인하지 못함. 아래 직접 확인은 이렇게 했다).
2. **변수 갱신**: 가중치를 고정하고 가중 PGO 를 푼다. 비볼록 PGO 의 최소 솔버 자리에 기존 솔버를 그대로 쓴다. 논문은 PGO 에서 SE-Sync 같은 빠른 비최소 솔버를 언급한다. GNC 안에서 어떤 솔버로 풀었는지는 요약본에서 명시되지 않아 확인하지 못했다.
3. **가중치 갱신**: 간선 잔차 제곱(잡음으로 정규화)을 TLS 닫힌 식에 넣어 `w_ij ∈ [0, 1]`. 임계 `c̄²` 는 정규화 잔차의 카이제곱 분위수로 정하는 것이 자연스럽다.
4. `μ` 를 키워 TLS 에 다가가고, 가중치가 수렴하면 종료. 가중치가 0 인 간선이 걸러진 루프 클로저다.

```ts
// 바깥 루프 골격: solvePgo 는 가중 PGO 솔버(g2o, GTSAM, SE-Sync 등을 감싼 함수)
function gncPgo(edges: Edge[], cbar2: number, solvePgo: (e: Edge[], w: number[]) => Poses) {
  const w = edges.map(() => 1);
  let poses = solvePgo(edges, w);
  let mu = initMu(edges, poses, cbar2); // 논문 지침: c̄² / (2 r²max − c̄²)
  while (mu < 1e6) {
    edges.forEach((e, k) => {
      if (!e.isLoop) return;                       // 오도메트리는 1 로 고정
      w[k] = tlsWeight(normResidual2(e, poses), mu, cbar2); // 닫힌 식
    });
    poses = solvePgo(edges, w);
    mu *= 1.4;
  }
  return { poses, w };
}
```

### 논문이 보고한 것 (요약본 기준)

- 벤치마크: SE-Sync 논문의 INTEL, CSAIL. 오도메트리는 두고 루프 클로저를 **무작위 포즈 쌍 + 무작위 측정** 으로 만든 가짜로 채웠다. 몬테카를로 10 회.
- 비교 대상: g2o(비견고), DCS(Φ ∈ {1, 10, 100}), PCM(임계 5·10·15%), ADAPT. DCS·PCM 은 최적 파라미터 하나만 보고했다고 한다.
- INTEL: g2o 는 이상치에 약했고 DCS·PCM 은 이상치가 늘수록 점차 나빠졌다. GNC-GM·GNC-TLS·ADAPT 는 40% 까지 둔감하고 70~80% 부근까지 쓸 만했으며 GNC-TLS 가 가장 좋았다. CSAIL 에서는 GNC-TLS 가 90% 이상치에서도 견뎠다고 한다.
- 실행 시간은 그림으로만 제시된 것으로 보이며 PGO 에 대한 구체 수치는 요약본에 없었다.
- 한계: 논문 전체가 말하듯 전역 최적을 보장하지 않는다.

### 직접 확인: 2차원 장난감 포즈 그래프

모형: 반지름 5 인 원을 두 바퀴(포즈 40 개, 한 바퀴 20 개). 오도메트리 39 간선(잡음 이동 0.02, 회전 0.01 rad), 참 루프 클로저 38 개(한 바퀴 차이 (i, i+20) 과 (i, i+22)). 가짜는 무작위 포즈 쌍(|i−j| ≥ 2)에 **큰 무작위 측정**을 붙인 것이다. 초기값은 오도메트리 적분, `c̄² = 11.34`(자유도 3 카이제곱 99%), 바깥 반복마다 가중 가우스-뉴턴 2 회, 최대 200 회, `μ ×1.4`. Node.js 로 직접 구현했고 순수 최소제곱 대비 **ATE**(포즈 0 고정 후 위치 RMSE, 20회 중앙값)를 비교했다.

| 이상치 비율(루프 클로저 중) | 최소제곱 | GNC-TLS (중앙값 / 최댓값) |
| --- | --- | --- |
| 0% | 0.055 | 0.053 / 0.112 |
| 30% | 6.2 | 0.059 / 0.089 |
| 70% | 6.8 | 0.049 / 0.117 |
| 90% | 7.1 | 0.034 / 0.112 |
| 95% | 7.4 | 0.064 / 0.155 |

가짜가 **오도메트리와 쉽게 모순되는** 경우라 매우 쉬운 설정이다(오도메트리 간선이 모든 포즈를 묶고 있어 가짜는 큰 잔차를 낸다). 그래서 95% 에서도 실패가 없었다. 이는 논문 수치(70~80% 부근 한계)와 직접 비교할 수 없다.

이상치를 "비슷한 장소로 잘못 인식" 한 형태로 바꿔(측정이 항상 `(0, 0, 0)` + 잡음, 즉 "같은 자리") 다시 돌렸다. 가짜끼리는 서로 모순이라 여전히 쉽지만, 95% 에서 20회 중 **2회가 실패**(ATE 최대 1.8)했고 중간 비율에서 가짜 3% 가 가중치 0.5 를 넘겨 남았다. 이상치가 수적으로 압도하고 그럴싸하면 가중치 갱신이 흔들린다는 방향이다.

## 언제 쓰나

- 백엔드 솔버(GTSAM·g2o·Ceres 등)가 이미 있고, 루프 클로저 후보를 프런트엔드가 걸러 주지 못하는 상황.
- 이상치 비율이 매우 높을 수 있는 다중 로봇 지도 병합, 반복 환경(복도·창고)에서 장소 인식이 자주 틀리는 경우.
- 사후 일괄(batch) 최적화. 가중치가 0/1 에 가깝게 나오므로 어떤 루프 클로저가 버려졌는지 보고하기 쉽다.

## 주의/비용

- **외부 반복 비용**. 바깥 반복마다 PGO 를 한 번(이상) 푼다. GNC 전체 비용은 바깥 반복 횟수만큼 PGO 를 반복해 푸는 값이고, 반복 횟수는 μ 를 ×1.4 로 키우며 수렴할 때까지 도는 값이라 데이터에 따라 달라진다(논문은 CSAIL CPU 시간을 그림으로만 제시하며 배수는 적지 않았다). [iSAM2](/develop-wiki/knowledge/robotics/isam2-bayes-tree-incremental/) 같은 증분 파이프라인에는 그대로 못 넣고, 윈도우를 정해 일괄로 돌려야 한다.
- **`c̄` 가 잡음 모델에 묶인다.** 정보행렬(공분산)이 틀리면 정규화 잔차가 틀려 정상 루프도 끈다. 회전 오차는 각도 단위, 이동은 길이 단위라 정규화가 필수다.
- **좋은 초기값이 여전히 도움이 된다.** PGO 의 비볼록성(회전)은 GNC 가 해결하는 비볼록성(견고 비용)과 다르다. 위 실험은 오도메트리 적분으로 초기화했다. 초기값이 나쁠 때의 거동은 확인하지 않았다.
- **전역 최적 비보장**, 이상치가 그럴싸하거나 압도적이면 실패 가능(위 실험).
- 오도메트리에도 이상치(휠 슬립, 점프)가 있으면 "오도메트리 = 1 고정" 가정이 깨진다.

## 비교

| 방법 | 이상치 처리 위치 | 추가 변수 | 비고 |
| --- | --- | --- | --- |
| 스위처블 제약 | 최적화 안(스위치 변수) | 루프당 1 개 | DCS 논문이 변수 증가·느린 수렴을 지적([루프 클로저 노트](/develop-wiki/knowledge/robotics/loop-closure-outlier-rejection/)) |
| DCS | 최적화 안(닫힌 식 스케일) | 없음 | 단일 최적화, 가벼움 |
| PCM | 최적화 전(상호 일관성) | 없음 | 최대 클릭이 입력 |
| GNC | 최적화 바깥 루프(가중치) | 없음 | 솔버 교체 용이, 반복 비용 큼 |
