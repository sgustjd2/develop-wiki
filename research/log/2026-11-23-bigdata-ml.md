# 빅데이터·데이터분석·머신러닝 노트 추가 (2026-11-23, 11차)

요청: "빅데이터 관련 용어(ADP·ADsP·빅데이터분석기사 개념, 모델 학습 방법, 모델별 용어) 조사·정리".

## 구조
- 새 지식 카테고리 2개를 `src/taxonomy.ts` 에 추가: `data-analytics`(데이터 분석·빅데이터; group understanding/planning/statistics/preprocessing/platform/visualization/governance), `machine-learning`(머신러닝·딥러닝 기초; group paradigm/supervised/unsupervised/ensemble/evaluation/deep-learning/unstructured/operations). 이유: 기존 카테고리에 통계·ML·빅데이터 기술을 담을 곳이 없었다.
- 공식 출제범위는 한국데이터산업진흥원 dataq.or.kr 의 ADsP(a_06)·ADP(a_05)·빅데이터분석기사(a_07) 페이지를 브라우저로 직접 읽어 옮겼다(2026-11-23). 사이트가 JS 렌더링이라 curl 로는 본문이 비어 있다. 빅데이터분석기사 출제기준 적용기간은 2024.1.1~2026.12.31 이므로 2027년 이후 기준은 새로 확인해야 한다.
- 새 노트 59개: data-analytics 35, machine-learning 24. 각 노트에 "시험 범위 대응" 줄(공식 출제범위에 실제로 있는 항목만)과 "검증 범위" 절을 넣었다.

## 검증
독립 fact-checker 8개가 영역별로 원문 대조, 작성자 스크립트 재실행. lint·validate(오류 0)·build(1,475쪽)·링크 검사(깨진 링크 0)·related 존재 검사 통과.

## 팩트체크 정정 (반드시 수정 8건)
- Laney 3V: 노트가 "3V 는 정의가 아니라 이해 틀이라고 Laney 가 서술"이라 했으나 원문은 3V 를 빅데이터 정의의 원형으로 제시하고 뒤에 붙은 V 들을 정의 요소로 혼동하지 말라고 쓴다.
- TF-IDF 노트: "교과서형 idf"가 표(`ln(n/(1+df))`)와 직접 계산 절(`ln(n/df)`)에서 서로 다른 식이었다.
- 사회연결망 노트: Freeman 1978·1979 를 별개 논문처럼 적었으나 networkx 문서상 같은 논문.
- ZooKeeper "Kafka 가 의존" 귀속 오류(원문은 "trusted by", Kafka 4.0 부터 ZooKeeper 불필요), 클라우드 노트 줄바꿈 누락.
- 이상값 노트: 수정 z 3.5 와 `(n−1)/√n` 이 NIST 1.3.5.17 에 있는데 "원전·NIST 에 없음"이라 적었다.
- sklearn 문서가 '정규화' 용어 중복을 명시한다는 서술은 근거 없음(같은 문서가 z-점수에도 normalization 을 씀).
- 수정 권장 약 70건: 원문보다 강한 단정, 출처 귀속(C4.5 이득비·CART 지니·CHAID), 시험 범위 대응 문구(ADsP·ADP 항목명에 없는 회귀분석·모형 평가), 수치·식 표기(Anscombe 값은 공개 사본과 44개 모두 일치 확인) 등.

## 미확정 (노트에 표시)
- 수험 교재 고유 틀(분석 성숙도 4단계, 분석 과제 4사분면, DB 특징 4가지, 마스터플랜 시급성·난이도, 시각화 3단계, 데이터 마트 요약·파생변수 분류)은 공개 1차 출처를 찾지 못해 "미확인"으로 표시하거나 단계 이름을 적지 않았다.
- 원문을 읽지 못한 것: Rousseeuw 1987, Tibshirani 2001, Friedman 2001, Breiman 1984, Gama 2014, Pritchett 2008, Inmon 원전, Rubin 1976, Iglewicz & Hoaglin 1993, Box-Cox·Yeo-Johnson 논문, Adam 원논문 Algorithm 1, ISLR·ESL 본문, ISO/IEC 25012 원문(유료).
- 실행하지 못한 것: xgboost·lightgbm(libomp 없음), R 코드 전부, shap·lime, imbalanced-learn, Spark·Hadoop·Debezium, 실제 VM·클러스터. NVDA 같은 낭독기와 무관.
- 개인정보 보호법 조문은 비공식 사본(korea.legal)과 대조했고 law.go.kr 본문은 JS 로딩이라 직접 못 읽었다. 제28조의6 삭제 조문은 대조 못함. 2027-03-09 시행 예정 제5절(AI 특례)은 보도 기준.
- 시험 출제 방식(어떤 도구·용어를 묻는지)은 미확인이며 노트는 단정하지 않는다.
- seed 의존 수치(앙상블·SVM 표, 누수 실험, 시뮬레이션)는 노트에 단일 실행임을 표시했다.
- WebFetch 가 JS 사이트를 못 읽어 Claude in Chrome 브라우저로 dataq.or.kr 를 읽었다(읽기만, 로그인·제출 없음).
