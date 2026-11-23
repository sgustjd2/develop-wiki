# 로컬 모델 초안 (사이트 미공개)

매주 일요일 04:00 Hermes 주간 조사(`hermes/weekly.mjs`)가 `research/backlog.md` 의 knowledge 주제를 골라 원문을 읽고 초안을 쓴다.
초안은 원문 인용이 내려받은 텍스트와 일치한 사실만 쓰지만, **번역·해석 오류는 걸러지지 않는다.** Claude Code 에서 `review-drafts` 로 원문 대조 후 `content/knowledge/` 로 옮겨 공개한다.

| 주제 | 상태 | 파일·사유 | 날짜 |
| --- | --- | --- | --- |
| STRIDE 등 인증 가능 견고 추정 전용 솔버 | 공개됨 | content/knowledge/robotics/stride-certifiable-outlier-robust-perception-solver.md | 2026-11-23 |
| Epain·Jin·Zotter 2014 일정 각 퍼짐 디코딩 | 공개됨 | content/knowledge/graphics-xr/ambisonic-decoding-constant-angular-spread.md | 2026-11-23 |
| LeaseGuard(SIGMOD 2026) | 공개됨 | content/knowledge/distributed-systems/leaseguard-raft-lease-read-optimization.md | 2026-11-23 |
| RFC 9701 JWT 인트로스펙션 | 공개됨 | content/knowledge/security/rfc-9701-jwt-introspection-response.md | 2026-11-23 |
| Envoy zone-aware routing·패닉 임계 | 공개됨 | content/knowledge/performance/envoy-zone-aware-routing-panic-threshold.md | 2026-11-23 |
| Friedman 검정 | 공개됨 | content/knowledge/ui-ux/friedman-test-repeated-ordinal.md | 2026-11-23 |
| 정규성 검정과 Q-Q 그림 (Shapiro-Wilk, normality test) | 공개됨 | content/knowledge/data-analytics/shapiro-wilk-normality-test-qq-plot.md | 2026-11-23 |
| 검정력 분석과 표본 크기 계산 (statistical power analysis, sample size) | 공개됨 | content/knowledge/data-analytics/power-analysis-sample-size.md | 2026-11-23 |
| 부트스트랩과 순열검정 (bootstrap, permutation test) | 공개됨 | content/knowledge/data-analytics/bootstrap-permutation-test.md | 2026-11-23 |
| 확률 보정 (probability calibration, Platt scaling, isotonic regression, Brier score) | 공개됨 | content/knowledge/machine-learning/probability-calibration.md | 2026-11-23 |
| FAPI 2.0 구현·배포 권고와 x-fapi 헤더 (FAPI 2.0 Implementation and Deployment Advice) | 공개됨 | content/knowledge/security/fapi-2-implementation-deployment-advice.md | 2026-11-23 |
| OAuth 2.0 Device Authorization Grant RFC 8628 와 CIBA 비교 | 중복 의심 | security/openid-ciba-poll-ping-push | 2026-11-23 |
| RFC 9530 Digest Fields Content-Digest Repr-Digest | 공개됨 | content/knowledge/security/rfc-9530-digest-fields.md | 2026-11-23 |
| CockroachDB linearizable 모드와 causal reverse (strict serializability) | 공개됨 | content/knowledge/distributed-systems/cockroachdb-linearizable-causal-reverse.md | 2026-11-23 |
| PgBouncer transaction pooling 모드와 세션 상태 (prepared statements, SET, advisory lock) | 공개됨 | content/knowledge/performance/pgbouncer-transaction-pooling-session-state.md | 2026-11-23 |
| Envoy retry budget 과 retry_host_predicate 재시도 정책 | 공개됨 | content/knowledge/performance/envoy-retry-budget-host-predicate.md | 2026-11-23 |
| 가우시안 과정 사전 연속시간 궤적 추정 (Barfoot Tong Särkkä, exactly sparse Gaussian process regression, continuous-time SLAM) | 공개됨 | content/knowledge/robotics/gp-continuous-time-trajectory-estimation.md | 2026-11-23 |
| Hedborg 롤링 셔터 번들 조정 (rolling shutter bundle adjustment, Hedborg Forssén) | 공개됨 | content/knowledge/robotics/rolling-shutter-bundle-adjustment-hedborg.md | 2026-11-23 |
| 파동 변수 원격 조작 (wave variables, Niemeyer Slotine teleoperation passivity) | 출처 부족(1회) | 원논문(Niemeyer·Slotine) 미확보 — 특허·후속 논문만으로 쓴 보류 초안 research/drafts/robotics/wave-variable-teleoperation-HOLD.md | 2026-11-23 |
| 그래디언트 영역 양방향 경로 추적 (gradient-domain bidirectional path tracing, Manzi EGSR 2015) | 중복 의심 | graphics-xr/gradient-domain-path-tracing | 2026-11-23 |
| 볼류메트릭 ReSTIR (volumetric ReSTIR, Lin Wyman Yuksel 2021 resampled importance sampling in participating media) | 공개됨 | content/knowledge/graphics-xr/volumetric-restir.md | 2026-11-23 |
| Frank 소스 폭 지각 연구 (source width of frontal phantom sources perception measurement modeling, Matthias Frank) | 공개됨 | content/knowledge/graphics-xr/frank-source-width-perception.md | 2026-11-23 |
| AllRAD2 (Zotter Frank 2018, All-round ambisonic decoding and panning with loudness and spread preservation) | 출처 부족(1회) | AES 2018 원문 미확보(공개 사본 없음) | 2026-11-23 |
| 알림·피드백 UI 컴포넌트 비교: 토스트·스낵바·배너·모달·바텀시트·인라인 오류·툴팁·코치마크 (toast, snackbar, banner, bottom sheet, tooltip) | 공개됨 | content/knowledge/ui-ux/ui-component-lookalikes-naming.md | 2026-11-23 |
| 모달·팝업·다이얼로그·알럿·컨펌 구분 (modal dialog, alert dialog, popover, WAI-ARIA dialog alertdialog) | 중복 의심 | ui-ux/modal-dialog | 2026-11-23 |
| 토글·체크박스·라디오·세그먼티드 컨트롤 구분 (switch vs checkbox, radio group, segmented control, WAI-ARIA) | 공개됨 | content/knowledge/ui-ux/ui-component-lookalikes-naming.md | 2026-11-23 |
| 진행 표시와 로딩 패턴: 프로그레스 바·스피너·스켈레톤 (determinate indeterminate progress indicator, skeleton screen) | 공개됨 | content/knowledge/ui-ux/loading-states.md | 2026-11-23 |
| 빈 화면(empty state)과 온보딩 첫 화면 유형 (empty states, onboarding, first-run experience) | 공개됨 | content/knowledge/ui-ux/empty-states.md | 2026-11-23 |
| 좋아요·찜(북마크)·공유·별점 같은 액션 UI의 의미 구분 (like, bookmark, share, rating interaction patterns) | 공개됨 | content/knowledge/ui-ux/like-bookmark-share-rating-ui.md | 2026-11-23 |
| 날짜 선택 UI 유형: 캘린더·피커·직접 입력 (date picker, date input pattern GOV.UK) | 중복 의심 | ui-ux/date-picker-ux | 2026-11-23 |
| AI 응답 아래 액션 버튼: 복사·재생성·좋아요·싫어요·공유 (chat response actions, feedback controls, regenerate) | 공개됨 | content/knowledge/ui-ux/ai-response-action-buttons.md | 2026-11-23 |
| 테스트 종류 분류: 기능·비기능·스모크·새니티·회귀·탐색적 (ISTQB test types levels) | 공개됨 | content/knowledge/testing-practice/test-types-classification.md | 2026-11-23 |
| 성능 테스트 용어: 응답 시간·TPS·동시 사용자·로드·스트레스·스파이크·소크 (performance testing load stress spike soak) | 공개됨 | content/knowledge/testing-practice/performance-testing-types-and-metrics.md | 2026-11-23 |
| ISTQB 테스트 7원칙: 결함 집중·살충제 역설·완전한 테스트 불가 (seven testing principles) | 공개됨 | content/knowledge/testing-practice/seven-testing-principles.md | 2026-11-23 |
| 테스트 설계 기법: 동등 분할·경계값 분석·결정 테이블·상태 전이 (equivalence partitioning, boundary value analysis, decision table, state transition) | 공개됨 | content/knowledge/testing-practice/black-box-test-design-techniques.md | 2026-11-23 |
| 좋은 버그 리포트 작성: 재현 절차·기대 결과·실제 결과·환경·심각도와 우선순위 (bug report, severity vs priority) | 공개됨 | content/knowledge/testing-practice/effective-bug-report-writing.md | 2026-11-23 |
| 테스트 지표: 결함 밀도·결함 누출·테스트 커버리지·수정률 (test metrics defect density defect leakage test coverage) | 공개됨 | content/knowledge/testing-practice/test-metrics-defect-density-leakage.md | 2026-11-23 |
| 테스트 문서: 테스트 계획·시나리오·케이스·결과 보고 (test plan, test case, test scenario, IEEE 829 ISO 29119) | 공개됨 | content/knowledge/testing-practice/test-documentation-types.md | 2026-11-23 |
| 테스트 프로세스 단계: 계획·분석·설계·구현·실행·완료 (ISTQB test process, test planning, test monitoring and control) | 공개됨 | content/knowledge/testing-practice/test-process-stages.md | 2026-11-23 |
| 인앱(네이티브) 대 웹뷰 앱 테스트 차이 (native app vs WebView hybrid testing) | 공개됨 | content/knowledge/testing-practice/webview-vs-native-app-testing.md | 2026-11-23 |
| 테스트 환경과 테스트 데이터 (test environment, staging, test data management) | 공개됨 | content/knowledge/testing-practice/test-environment-test-data-management.md | 2026-11-23 |
