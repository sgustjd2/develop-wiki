---
title: R 기초, 데이터 마트, apply 계열과 dplyr (R Basics, Data Mart, apply family, dplyr)
aka: [R Data Structures, NA, apply, lapply, sapply, vapply, dplyr, Data Mart, Summary Variable, Derived Variable, 요약변수, 파생변수]
category: data-analytics
group: preprocessing
level: beginner
summary: R 의 자료구조·결측 NA·이상값 함수, apply·lapply·sapply 의 반환형 차이, dplyr 동사와 파이프, 분석용 데이터 마트(요약·파생 변수) 개념을 공식 문서 기준으로 정리한다. R 코드는 실행하지 않았다.
tags: [r, data-frame, na, apply, sapply, dplyr, data-mart, summary-variable, derived-variable]
related: [data-analytics/missing-values-handling-mechanisms, data-analytics/outlier-detection-methods, data-analytics/scaling-encoding-transformation-derived-features, data-analytics/data-warehouse-data-mart-lake-lakehouse, data-analytics/descriptive-statistics-probability-distributions, data-analytics/eda-exploratory-data-analysis-visual]
sources:
  - https://cran.r-project.org/doc/manuals/r-release/R-intro.html
  - https://stat.ethz.ch/R-manual/R-devel/library/base/html/lapply.html
  - https://stat.ethz.ch/R-manual/R-devel/library/base/html/apply.html
  - https://stat.ethz.ch/R-manual/R-devel/library/base/html/mean.html
  - https://stat.ethz.ch/R-manual/R-devel/library/grDevices/html/boxplot.stats.html
  - https://stat.ethz.ch/R-manual/R-devel/library/stats/html/complete.cases.html
  - https://dplyr.tidyverse.org/articles/dplyr.html
  - https://dplyr.tidyverse.org/reference/summarise.html
  - https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/
updatedAt: 2026-11-23
---

## 개요

- R 은 통계 분석용 언어·환경이다. 벡터를 기본 단위로 하고 데이터프레임(표 형태)이 분석의 중심 구조다.
- 분석용 표를 만드는 작업(결측·이상값 정리, 집계, 새 변수 만들기)은 **데이터 마트** 구축과 겹친다. 반복 적용에는 `apply` 계열, 표 가공에는 `dplyr` 동사와 파이프를 많이 쓴다.
- 이 노트의 R 코드는 **실행하지 않았다**(작성 환경에 R 미설치). 동작 설명은 공식 문서에서 읽은 규칙이고, 코드 뒤 "기대 결과"는 그 규칙에서 도출한 것이다.

## 시험 범위 대응

- ADsP 데이터분석 > R기초와 데이터 마트(R기초, 데이터 마트, 결측값 처리와 이상값 검색), ADP 데이터분석 필기·실기 전처리(결측·이상값 처리, 변환·파생변수), 빅데이터분석기사 2과목 > 데이터 정제·파생변수 생성에 대응한다.

## 핵심 용어

| 한국어 | 영어 | 정의 |
| --- | --- | --- |
| 벡터 | vector | 하나의 모드(logical, numeric, complex, character, raw)를 가진 원소의 나열 |
| 행렬·배열 | matrix, array | 차원 벡터로 정의되는 구조. 데이터는 열 우선 순서로 저장 |
| 리스트 | list | 모드가 서로 다른 구성요소의 순서 있는 모음. `[[ ]]`, `$` 로 접근 |
| 데이터프레임 | data frame | 클래스가 `"data.frame"` 인 리스트. 열마다 모드가 다를 수 있다 |
| 팩터 | factor | 범주형 변수. `factor()` 로 만들고 `levels()` 로 수준 확인, `ordered()` 는 순서 있는 팩터 |
| 결측값 | NA | 값이 없음("not available"). `NA` 를 포함한 연산은 대체로 `NA` |
| 비수(NaN) | NaN | `0/0` 같은 정의되지 않는 수치 결과 |
| 데이터 마트 | data mart | 분석 목적에 맞게 특정 주제·업무용으로 모은 데이터 집합 |
| 요약변수·파생변수 | summary / derived variable | 아래 "데이터 마트" 절 참조(수험 교재 용어) |

## R 자료구조

| 구조 | 차원 | 원소 모드 | 만드는 법 |
| --- | --- | --- | --- |
| 벡터 | 1 | 단일 | `c(1, 2, 3)` |
| 행렬 | 2 | 단일 | `matrix(1:6, nrow = 2)` |
| 배열 | n | 단일 | `array(1:24, dim = c(2, 3, 4))` |
| 리스트 | 1(재귀) | 혼합 | `list(a = 1, b = "x")` |
| 데이터프레임 | 2 | 열별 혼합 | `data.frame(id = 1:3, g = c("a", "b", "c"))` |

- 팩터는 범주형이며 `tapply(값, 팩터, 함수)` 로 그룹별 요약, `table()` 로 빈도표를 낸다(R-intro 4·5.10 절).
- 데이터프레임을 `apply` 에 넣으면 `as.matrix` 로 바뀌므로 열 모드가 섞이면 문자로 통일될 수 있다(apply 문서: 비배열이지만 `dim` 이 있으면 `as.matrix` 로 강제).

## 결측값과 이상값 함수

```r
df <- data.frame(id = 1:6,
                 grp = c("a", "a", "b", "b", "c", "c"),
                 amt = c(10, NA, 30, 25, 5, 8))
is.na(df$amt)                    # 결측 위치 (논리 벡터)
colSums(is.na(df))               # 열별 결측 수
mean(df$amt, na.rm = TRUE)       # NA 를 제거하고 평균
df[complete.cases(df), ]         # 모든 열이 채워진 행만
boxplot.stats(df$amt)$out        # 상자그림 기준 이상값
```

- `is.na()` 는 `NA` 와 `NaN` 모두에 `TRUE`, `is.nan()` 은 `NaN` 에만 `TRUE`(R-intro 2.5 절).
- `mean(x, na.rm = TRUE)` 의 `na.rm` 은 계산 전에 NA 를 제거할지(기본 `FALSE`)를 정한다(`mean` 문서). `na.rm` 을 안 쓰면 NA 가 있는 열의 평균은 결측이 되는 것이 일반적이지만, `mean` 문서에는 그 반환값 서술이 없고, R-intro 2.5 는 "NA 에 대한 연산은 일반적으로 NA 가 된다"고 쓴다.
- `complete.cases()` 는 모든 인수에서 결측이 없는 행의 논리 벡터를 반환한다(문서).
- `boxplot.stats()` 의 `coef` 기본값은 1.5 이며 `$out` 은 수염 바깥 값이다. 경계는 사분위수가 아니라 **힌지(hinge)** 로 계산한다. 힌지는 사분위수와 비슷하지만 표본 크기에 따라 달라질 수 있어, `quantile()` 로 계산한 IQR 규칙과 결과가 다를 수 있다 → [이상값 탐지](/develop-wiki/knowledge/data-analytics/outlier-detection-methods/)
- 결측의 원인과 처리법은 [결측값 처리](/develop-wiki/knowledge/data-analytics/missing-values-handling-mechanisms/)에서 다룬다.

## apply 계열의 반환형

| 함수 | 입력 | 반환 |
| --- | --- | --- |
| `apply(X, MARGIN, FUN)` | 행렬·배열(데이터프레임은 변환) | 결과 길이 1(MARGIN 길이가 1 일 때) → 벡터, 길이 n>1 → 첫 차원이 n 인 배열, 길이가 다르면 리스트 |
| `lapply(X, FUN)` | 벡터·리스트 | **항상 리스트**(입력과 같은 길이) |
| `sapply(X, FUN)` | 벡터·리스트 | 각 결과 길이가 모두 1 이면 벡터, 같은 길이>1 이면 행렬(열이 원소), 길이가 다르면 리스트, 입력이 비면 빈 리스트 |
| `vapply(X, FUN, FUN.VALUE)` | 같음 | `FUN.VALUE` 로 반환형을 고정(안전). 맞지 않으면 오류 |

```r
m <- matrix(1:6, nrow = 2)
apply(m, 1, sum)                    # 행별 합: 길이 2 벡터
apply(m, 2, range)                  # 열별 (최소, 최대): 2x3 행렬 (FUN 결과가 열이 됨)
lapply(1:3, function(i) i^2)        # 길이 3 리스트
sapply(1:3, function(i) i^2)        # 숫자 벡터
sapply(1:3, function(i) c(i, i^2))  # 2x3 행렬
vapply(1:3, function(i) i^2, numeric(1))
```

- `MARGIN`: 행렬에서 `1` = 행, `2` = 열, `c(1, 2)` = 각 셀.
- **전치 함정**: `FUN` 이 길이 n>1 벡터를 돌려주면 그 벡터가 결과의 **열**이 된다. `apply(x, 1, f)` 는 `nrow(x)` 행이 아니라 n × nrow(x) 모양이다. 필요하면 `t()` 로 뒤집는다.
- `sapply` 는 입력에 따라 반환형이 바뀌어 코드에서 예기치 않은 결과를 낳을 수 있다. 안정적인 반환이 필요하면 `vapply`, 항상 리스트가 필요하면 `lapply`.
- 데이터프레임 그룹별 계산은 `tapply`(R-intro 4.2) 또는 아래 dplyr 의 `group_by` + `summarise`.

## dplyr

dplyr 문서(소개 글, 표기 버전 1.2.1)의 핵심 동사:

| 동사 | 하는 일 |
| --- | --- |
| `filter()` | 조건에 맞는 행을 남김 |
| `arrange()` | 행 정렬(`desc()` 로 내림차순) |
| `select()` | 열 선택·이름 변경(선택 안 한 열은 버려짐) |
| `mutate()` | 열 추가·수정. 같은 호출 안에서 앞서 만든 열 사용 가능 |
| `summarise()` | 그룹마다 한 행으로 요약 |
| `group_by()` | 이후 동사에 그룹 단위를 지정 |

- 모든 동사는 첫 인수가 데이터프레임이고 결과가 새 데이터프레임이다. **입력을 바꾸지 않으므로** 결과를 변수에 저장해야 한다.
- 파이프 `|>` 는 앞 결과를 다음 호출의 첫 인수로 넘긴다(`x |> f(y)` = `f(x, y)`).
- `summarise()` 는 그룹 조합마다 한 행을 돌려주고, 각 요약식은 길이 1 이어야 한다. `.groups` 기본값은 `"drop_last"` 로 마지막 그룹 수준만 푼다. 같은 이름의 열을 재사용하면 원래 열이 덮어써질 수 있다(문서 예).

```r
library(dplyr)
mart <- df |>
  filter(!is.na(amt)) |>
  group_by(grp) |>
  summarise(n = n(), total = sum(amt), avg = mean(amt))
df |> mutate(share = amt / sum(amt, na.rm = TRUE))
```

기대 결과(문서 규칙에서 도출): `mart` 는 `grp` 별 한 행(3 행)에 `n`, `total`, `avg` 열을 가진다. 두 번째 식은 `df` 를 바꾸지 않고 `share` 열이 추가된 새 표를 돌려준다(결과를 저장하지 않으면 사라진다).

## 데이터 마트

- **일반 개념**: 데이터 웨어하우스에서 특정 주제·부서에 맞게 뽑은 부분 집합. 저장소 전체 구조(웨어하우스·마트·레이크)는 [데이터 웨어하우스·마트·레이크](/develop-wiki/knowledge/data-analytics/data-warehouse-data-mart-lake-lakehouse/)에서 다룬다.
- **Kimball 접근**: Kimball Group 기법 목록은 비즈니스 프로세스·grain·conformed dimension 을 기본 개념으로 나열한다. 마트를 비즈니스 프로세스 단위로 짓고 conformed dimension 으로 일관성을 맞춘다는 설명은 보조 자료에서 본 것이며 이 노트가 읽은 Kimball 페이지에는 정의가 없다.
- **분석용 데이터 마트**: 분석 한 건을 위해 여러 원천을 합쳐 "행 = 분석 단위(예: 고객), 열 = 변수"의 표로 만든 것. 이 표를 만드는 과정이 아래 두 종류의 변수 작업이다.

| 구분 | 의미(일반적 용법) | 예 |
| --- | --- | --- |
| 요약변수 | 원자료를 집계한 변수 | 고객별 최근 3 개월 구매 횟수·총액 |
| 파생변수 | 기존 변수를 조합·변환해 새로 만든 변수 | 구매액/방문 횟수, 가입 후 경과일, 구간화 변수 |

- **요약변수·파생변수라는 구분과 "분류 체계"는 국내 수험 교재에서 쓰는 틀이며, 이 노트는 그것의 공개 1차 출처를 확인하지 못했다.** 위 정의는 일반적 의미를 필자가 정리한 것이다.
- 파생변수 설계 기법(구간화·변환·인코딩)은 [스케일링·인코딩·파생변수](/develop-wiki/knowledge/data-analytics/scaling-encoding-transformation-derived-features/)에 있다.

## 언제 쓰나 / 주의

- 분석 전 표를 정리·집계할 때 `dplyr`, 같은 연산을 여러 열·원소에 반복할 때 `apply` 계열. 반복 연산이 느리면 벡터화를 먼저 고려한다.
- `NA` 를 포함한 연산은 결과가 `NA` 가 되는 경우가 많으므로 `na.rm` 사용 여부를 명시한다. `na.rm = TRUE` 로 모르는 사이에 표본이 줄어드는 점도 기록한다.
- 마트를 만들 때 집계 기준일·누수(예측 시점 이후 정보가 요약변수에 들어감)를 점검한다 → [데이터 분할과 누수](/develop-wiki/knowledge/machine-learning/data-split-cross-validation-leakage/)
- 데이터프레임은 팩터·문자 열이 섞이므로 행렬 연산 전에 모드 변환에 유의한다.

## 검증 범위

- 읽은 것: CRAN *An Introduction to R*(문서 표기 R 4.6.2, 2026-10-29) 중 벡터·NA·팩터·배열·리스트·데이터프레임 절(앞쪽 약 10만 자만 읽음; 이후 부분은 읽지 못함), R 매뉴얼 `lapply/sapply/vapply`, `apply`, `mean`, `boxplot.stats`, `complete.cases` 페이지, dplyr 소개·`summarise` 문서(dplyr 1.2.1 표기), Kimball 기법 목록 페이지.
- **R 코드는 실행하지 않았다.** 위 코드의 출력은 문서 규칙에서 도출했고 실제 출력과 대조하지 않았다.
- 미확인: `sapply` 가 반환형을 `vapply` 와 비교해 "위험"하다는 서술의 공식 문서 표현(필자 정리), `na.omit` 동작, `mapply` 상세, 데이터 마트의 Kimball 원문 정의, 요약변수·파생변수 분류의 공개 출처.
