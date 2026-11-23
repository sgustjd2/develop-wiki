---
title: 앰비소닉스 스피커 디코더 — 샘플링·max-rE 가중·AllRAD 로 불규칙 배치 다루기
aka: [Ambisonic Loudspeaker Decoder, SAD, Sampling Ambisonic Decoder, max-rE, Maximum rE Weighting, AllRAD, All-Round Ambisonic Decoding, Imaginary Loudspeaker, VBAP Hybrid]
category: graphics-xr
group: xr
level: advanced
summary: 앰비소닉스를 실제 스피커로 내보내는 디코더는 배치가 불규칙하면 방향마다 음량이 들쭉날쭉해진다. AllRAD 는 균일한 가상 스피커로 먼저 디코딩한 뒤 VBAP 로 실제 스피커에 옮기고, max-rE 가중은 부엽을 줄여 방향감을 선명하게 한다.
tags: [spatial-audio, ambisonics, decoder, loudspeaker, allrad, max-re, vbap, spherical-harmonics, t-design, xr]
related: [graphics-xr/ambisonics-sound-field, graphics-xr/vbap-dbap-amplitude-panning, graphics-xr/magls-binaural-ambisonics-decoding, graphics-xr/hrtf-binaural-rendering, graphics-xr/spatial-audio, graphics-xr/epad-energy-preserving-ambisonic-decoding, graphics-xr/mdap-vbip-multiple-direction-panning, graphics-xr/allrad-plus-mvlad-decoder-comparison, graphics-xr/ambisonic-decoding-constant-angular-spread]
sources:
  - https://phaidra.kug.ac.at/open/o:127169
  - https://aes.org/publications/elibrary-page/?id=16554
  - https://link.springer.com/book/10.1007/978-3-030-17207-7
  - https://ambisonics-symposium.org/Members/zotter/publications/decoder_comparison.pdf
updatedAt: 2026-11-23
---

> 출처 메모: **원전 Zotter·Frank, "All-Round Ambisonic Panning and Decoding"(JAES 60(10), 2012, 위 AES 링크)은 회원 전용이라 여전히 읽지 못했다.** 처음 서술은 이를 인용한 IEM 그라츠의 학생 프로젝트 보고서(Radke, "Comparison of Ambisonic Loudspeaker Decoders for Channel-Based Material", 2022) 2·3장에 근거했다. 2026-11-19 에 같은 저자들의 오픈 액세스 책 Zotter·Frank, *Ambisonics*(Springer 2019, CC BY 4.0) PDF 를 내려받아 3.3절(상상의 스피커), 4.9.1~4.9.8절(SAD·모드 매칭·EPAD·AllRAD)을 읽고 아래 AllRAD·max-rE·SAD 서술을 대조했다. 보고서에서 옮긴 내용은 책과 어긋나지 않았고, 보고서에서 못 읽었던 정규화와 상상의 스피커 처리를 책 기준으로 채웠다. 책은 2012 논문을 "원 논문" 으로 인용하며 요약하는 것이라, 논문 자체의 문장과 대조한 것은 아니다. 보고서의 청취 실험 결과는 한 방·한 가지 소재의 결과라 일반 결론이 아니다. 아래 수치 두 가지는 내가 직접 계산한 것이다(max-rE 가중치 검산, 2차원 모형 비교). 2026-11-19 에 원전의 공개 사본을 다시 찾았으나 AES 다운로드·포럼 페이지는 자동 접근 차단 화면만 돌려주었고, IEM·KUG(phaidra) 저장소에서도 사본을 찾지 못했다. 같은 날 EPAD 원전(Acta Acustica 2012)은 읽을 수 있어 [EPAD 노트](/develop-wiki/knowledge/graphics-xr/epad-energy-preserving-ambisonic-decoding/)에 정리했다. 2026-11-23 에 원전 공개 사본을 다시 찾았으나(OpenAlex·Semantic Scholar 모두 비공개, AES 페이지 403, 저자 출판 목록에 PDF 링크 없음) 접속 확인·유료 장벽은 우회하지 않았고 원문은 여전히 읽지 못했다. 대신 같은 저자들이 공개한 후속 4쪽 논문(Zotter·Frank·Pomberger, AllRAD 를 2012 논문 인용으로 요약하고 변형 AllRAD+ 를 제안)을 전문 읽어 아래 "후속 공개 자료로 확인한 것" 절에 정리했다. 이 절의 AllRAD 서술은 2012 본문이 아니라 그 후속 논문이 요약한 내용이다.

## 문제

[앰비소닉스](/develop-wiki/knowledge/graphics-xr/ambisonics-sound-field/)는 음장을 스피커와 무관한 구면조화 채널로 저장하므로, 재생할 때 스피커 배치에 맞는 **디코더 행렬**이 필요하다. 가장 단순한 두 가지에 약점이 있다.

- **샘플링 디코더(SAD)**: 스피커 방향의 구면조화 값을 그대로 쓴다. 스피커가 t-디자인처럼 구 위에 고르게 있어야 방향에 따라 음량·폭이 일정하다. 고르지 않으면 스피커가 드문 방향에서 레벨이 떨어진다(보고서가 인용한 책 서술).
- **저차 부엽.** 차수를 N 으로 자르면 음원 방향 주변에 부엽이 생겨 인접 채널 간 누화와 상관이 커진다. 차수가 높을수록 부엽은 더 많지만 레벨은 낮다.

현실의 스피커 배치(5.1, 7.0.4 같은 반구형)는 불규칙하고, 아래쪽엔 스피커가 아예 없다.

## 해법

### 1. max-rE 가중: 부엽 대신 폭을 낸다

차수별 가중치 `a_n` 을 곱해 부엽을 줄인다. 에너지 벡터 rE 의 크기를 최대로 하는 가중치이며, 보고서는 식을 `a_n = P_n(cos(137.9° / (N + 1.51)))` (`P_n` 은 n차 르장드르 다항식)으로 적는다. 고차를 서서히 줄이는 효과가 있고, 부엽이 줄지만 주엽이 넓어진다.

직접 확인했다. 식의 인수 `cos(137.9°/(N+1.51))` 는 `P_{N+1}` 의 가장 큰 근(수치 이분법으로 구함)과 거의 같았다.

| N | 정확한 최대 근 | 식 값 | 가중치 a_0..a_N (정확 근 기준) |
| --- | --- | --- | --- |
| 1 | 0.5774 | 0.5744 | 1, 0.577 |
| 3 | 0.8611 | 0.8610 | 1, 0.861, 0.612, 0.305 |
| 5 | 0.9325 | 0.9324 | 1, 0.932, 0.804, 0.628, 0.422, 0.206 |

1차(N=1)는 `1/√3 ≈ 0.577` 이다. 식은 근사이고 N 이 클수록 일치한다(1차에서 오차 0.003).

```ts
function legendre(n: number, x: number): number {
  let a = 1, b = x;
  if (n === 0) return a;
  for (let k = 2; k <= n; k++) [a, b] = [b, ((2 * k - 1) * x * b - (k - 1) * a) / k];
  return b;
}
// 차수 N 의 max-rE 가중치 a_n = P_n(cos(137.9° / (N + 1.51)))
const maxRE = (N: number) => {
  const x = Math.cos((137.9 / (N + 1.51)) * Math.PI / 180);
  return Array.from({ length: N + 1 }, (_, n) => legendre(n, x));
};
// ACN 채널 (n,m) 마다 a_n 을 곱한다 → 채널 수 (N+1)^2 = 3차에서 16
console.log(maxRE(3).map((v) => v.toFixed(3))); // [1.000, 0.861, 0.612, 0.304]
```

실행 결과 3차에서 `1.000, 0.861, 0.612, 0.304` 가 나왔다. 정확한 근 기준(0.305)과 마지막 자리만 다르다.

### 2. AllRAD: 균일 디코딩 후 VBAP 로 옮기기

보고서가 설명하는 순서:

1. 앰비소닉스 신호를 구 위에 **고르게 놓은 많은 가상 스피커**(t-디자인; 보고서는 5200개 사용)로 SAD 디코딩한다.
2. 그 가상 스피커 신호를 실제 스피커 방향으로 **VBAP** 패닝해 합친다.
3. 결과 디코더 행렬은 `D = (S/L̂) · Ĝ · Ŷ^T` 꼴이다(`Ĝ` 는 가상 스피커 L̂ 개 방향의 VBAP 이득, `Ŷ` 는 그 방향의 구면조화, `S` 는 단위 구 넓이 4π; 책 식 4.46). 하나의 행렬로 구현되며 크기는 실제 스피커 수 × (N+1)² 이므로 **가상 스피커 수에는 의존하지 않는다**. 책은 이를 VBAP 이득 함수를 구면조화 계수로 바꾸는 변환으로 해석하고, max-rE 가중 `diag{a_N}` 은 이 행렬 밖에서 곱한다. 또 디코더 **크기 조정이 따로 필요**하다며, 예로 무지향 성분(첫 열)의 노름을 1로 맞추는 방법을 든다. 책은 VBAP 이득 함수가 매끄럽지 않아 차수 제한이 없으므로 충분히 높은 t-디자인이 필요하다고 하고, 3차원 실무에서는 5200점 설계면 충분하다고 적는다.
4. 스피커 배치에 구멍(예: 아래쪽)이 있으면 **상상의 스피커**를 채워 넣어 VBAP 삼각분할이 구를 덮게 한다(책 3.3절, 원 논문의 제안이라고 적음). 그 신호는 두 가지로 처리한다. 버리거나, 이웃 실제 스피커 M 대에 `1/√M` 이하로 나눠 섞는다(섞은 뒤 이득 벡터를 다시 정규화할 수도 있다). 반구형 배치의 천저 스피커는 버려도 된다고 책은 설명한다. 지평선 바로 아래 성분은 어차피 수평 스피커로 가므로 음량 손실이 없고, 오히려 음상이 위로 들리는 것을 끌어내린다는 것이다. 책의 ITU 4+5+0 예에서는 옆·위·뒤의 상상 스피커는 계수 1로 섞고 아래쪽 것은 버렸다. 사각형 스피커 배치를 삼각형으로 나누는 방법이 모호해 좌우 비대칭이 생길 때도 사각형 가운데에 상상의 스피커를 넣는다.

### 직접 확인: 2차원 단순 모형

원전은 3차원이다. 개념 확인용으로 **수평면 2차원**, 2차 앰비소닉스, ITU 5.0 방위(0°, ±30°, ±110°)에서 세 가지를 비교했다. 순수 Python 이며 구면이 아닌 원 위의 모형이라 원전 결과의 재현이 아니다. 2도 간격 패닝 방향 180개에서 측정했다. AllRAD 는 원 위 가상 스피커 360개 + 인접 쌍 VBAP, "모드 매칭" 은 5×5 원형 조화 행렬의 역행렬이다. 원형 조화는 `[1, √2 cos mφ, √2 sin mφ]` 정규화, max-rE 는 2D 식 `a_n = cos(nπ/(2N+2))` 를 썼다.

| 디코더 | 방향별 에너지 편차(최대−최소) | rE 방향 오차 평균 / 최대 |
| --- | --- | --- |
| 모드 매칭(역행렬) | 21.0 dB | 71.1° / 180° |
| AllRAD(기본 가중) | 2.8 dB | 10.8° / 34.0° |
| AllRAD + max-rE | 3.2 dB | 7.6° / 26.9° |

불규칙한 배치에서 역행렬 디코더는 레벨과 방향이 크게 무너지는 반면, AllRAD 는 VBAP 가 양의 이득만 주는 덕에 안정적이다. max-rE 는 방향 오차를 줄이는 대신 이 모형에서 에너지 편차가 조금 늘었다. 뒤쪽 구멍(110° 와 −110° 사이)에서의 오차가 가장 컸다.

## 후속 공개 자료로 확인한 것

2012 원전 본문 대신, 저자들이 공개한 4쪽 후속 논문(Zotter·Frank·Pomberger, [AllRAD+·MVLAD 비교 노트](/develop-wiki/knowledge/graphics-xr/allrad-plus-mvlad-decoder-comparison/)에 상세)을 읽고 확인한 것만 적는다. 학회명·연도는 PDF 에 없다.

- **AllRAD 의 두 단계 서술이 일치한다.** 후속 논문은 1단계를 최적 가상 배치(예: 정50각형)에 대한 SAD, 2단계를 가상 스피커를 실제 스피커로 보내는 VBAP 행렬 `G` 로 쓰고, `D_AllRAD = G_{1:L,:}·D_SAD^(opt)` 로 적는다. 배치가 불완전하면 더미(상상의) 스피커를 더한다. 위 3·4절의 책 기준 서술과 구조가 같다. SAD 는 `t ≥ 2N+1` 인 t-디자인에서 최적이라고 2012 논문을 인용해 서술한다(원전 문장은 미확인).
- **반원 불규칙 배치 9개 스피커 예에서 논문이 서술한 AllRAD 의 성격.** 에너지 변동은 거칠지만 방향 오차가 매우 작고 매끄러우며 폭 변동도 비교한 디코더 중 가장 작다. EPAD 는 에너지가 완전히 일정하지만 이 배치에서 N ≤ 8 까지만 동작하고, SAD 는 간격이 큰 곳에서 에너지가 떨어지고 방향 오차가 크게 넘친다. 이는 논문 서술이며 이 노트의 위 2차원 모형과는 별개의 설정이다.
- **AllRAD+ (논문 제안).** AllRAD 와 SAD 를 가중 합(`D = g_AllRAD·D_AllRAD + g_SAD·D_SAD`)해 에너지 변동을 EPAD 에 가깝게 줄이면서 방향 특성은 AllRAD 를 유지한다. 계수는 근사 연립방정식(논문이 "estimated"라 부름)에서 `1/√2`, `1/√8` 를 얻는다. 직접 구현한 2D 반원 모형에서는 N ≤ 8 에서 에너지 변동이 절반 안팎으로 줄었지만 EPAD 만큼 평평하지는 않았고 N = 12 에서는 오히려 나빠졌다.
- **MVLAD(Epain 이 제안했다고 논문이 귀속하는 "가장 VBAP 다운 디코더").** `D = G·Yᵀ(YYᵀ)⁻¹` 는 가상 스피커가 균일하게 샘플링될 때 AllRAD 와 같아진다는 유도가 후속 논문 부록에 있다. 직접 계산에서 균일 샘플 S = 26·50 은 약 1e−15 오차로 일치했고 불균일 S = 70 은 어긋났다.
- **방향별 소스 퍼짐을 일정하게 하는 접근은 따로 있다.** Epain·Jin·Zotter 2014 는 에너지 일정(EPAD)이 아니라 퍼짐 일정을 목표로 하며, 폭 정의가 `2·arccos(2‖rE‖−1)` 로 이 노트 계열의 `2·arccos‖rE‖` 와 달라 [환산](/develop-wiki/knowledge/graphics-xr/ambisonic-decoding-constant-angular-spread/)이 필요하다.

## 언제 쓰나

- 스피커 배치가 불규칙하거나 반구형(5.1, 7.1, 7.0.4, 돔 일부)인데 앰비소닉스 콘텐츠를 내보내야 할 때: **AllRAD**.
- 스피커 배치가 거의 균일(t-디자인에 가까움)할 때: SAD 로 충분하다.
- 청취 영역이 넓고 방향감이 흐릿하면 **max-rE** 로 부엽을 줄이는 것을 시도. 단일 스위트 스폿에서 주엽 폭이 중요하면 기본 가중이 나을 수도 있으니 비교해 듣는다.

## 주의/비용

- **max-rE 는 공짜가 아니다.** 부엽·누화는 줄지만 주엽이 넓어진다. 보고서의 실험에서는 FL·FR 레벨 차 지표에서 기본 가중이 max-rE 보다 나았고, 그 이유를 주엽 확장으로 설명했다(해당 실험 환경 한정).
- **VBAP 구멍.** 스피커가 없는 방향을 상상의 스피커로 메우므로 그 방향의 음은 실제 스피커로 근사된다. 구멍이 클수록 이동하는 음원의 정위가 부정확해질 수 있다(내 추론, 원전 미확인).
- **촘촘한 스피커 구역의 감쇠.** 책은 AllRAD 가 ITU 4+5+0 의 앞쪽처럼 스피커가 너무 가깝게 모인 구역에서 신호가 약해지는 경향을 보인다고 적는다. 책의 반구형 25채널 예에서 5차 max-rE AllRAD 의 방향별 음량 변동은 약 1 dB, max-rE 가중 EPAD(차수는 본문에 명시되지 않음)는 0.3 dB 였다(책은 1 dB 미만 변동은 보통 들리지 않는다고 본다).
- **저차의 한계.** 1차는 공간 분해능이 낮아 어떤 디코더든 인접 스피커 간 레벨 차가 작았다(보고서). 차수를 올려야 좋아진다.
- **헤드폰은 다른 문제.** 스피커 디코더 대신 HRTF 를 쓰는 바이노럴 디코딩은 [MagLS](/develop-wiki/knowledge/graphics-xr/magls-binaural-ambisonics-decoding/) 같은 별도 기법을 따른다.
- **구현 전 확인.** (후속 논문의 반원 예는 180° 에 더미 스피커 한 개를 둔다. 일반 규칙은 아니다.) 정규화와 상상의 스피커 처리는 책 기준으로 채웠지만, 상상의 스피커 **위치를 정하는 일반 규칙**은 책에도 예시(천저, 사각형 가운데, 4+5+0 의 구체 각도)만 있다. 2012 AES 논문 본문은 이 노트에서 확인하지 못했다.

## 비교

| 디코더 | 아이디어 | 불규칙 배치 | 비고 |
| --- | --- | --- | --- |
| SAD | 스피커 방향에서 SH 샘플링 | 약함(드문 방향 레벨 저하) | 균일 배치(t-디자인)에서 적합 |
| 모드 매칭 | SH 행렬의 (의사)역행렬 | 약함(위 2차원 모형에서 큰 오차) | 스피커 수와 SH 수가 맞아야 단순 |
| AllRAD | 가상 SAD + VBAP, 상상의 스피커 | 견고(원전 인용) | 행렬 한 개로 구현 |
| + max-rE | 차수별 가중으로 부엽 억제 | 디코더와 독립적으로 곱함 | 주엽이 넓어짐 |
| AllRAD+ | AllRAD + SAD 가중 합 | 에너지 변동을 줄이되 방향 특성 유지(후속 논문 서술) | 계수는 근사(논문이 어림이라 부름), 차수 의존 |
| MVLAD | `G·Yᵀ(YYᵀ)⁻¹` | 균일 샘플링에서 AllRAD 와 동치(후속 논문 부록) | 불균일 샘플링에서는 다름(직접 계산) |
