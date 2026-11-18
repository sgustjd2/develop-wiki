---
title: 위협 모델링과 STRIDE
aka: [Threat Modeling, STRIDE, Data Flow Diagram, DFD, Trust Boundary, Four Question Framework, Security Design Review]
category: security
level: intermediate
summary: 만들기 전에 "무엇이 잘못될 수 있나"를 체계적으로 찾는 위협 모델링. 네 가지 질문, 데이터 흐름도와 신뢰 경계, STRIDE 분류, 대응 선택지와 운영 방법.
tags: [owasp, threat-modeling, stride, security-design, sdlc]
related: [security/owasp-top-10, security/access-control-design, security/ssrf, security/password-storage, security/secrets-management, security/supply-chain-security, engineering-practice/code-review]
sources:
  - https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html
  - https://www.threatmodelingmanifesto.org/
updatedAt: 2026-11-18
---

## 문제

보안 리뷰를 배포 직전에 하면 고칠 수 있는 것이 거의 없다. 인증 구조, 데이터가 흐르는 경로, 신뢰하는 외부 시스템 같은 **설계 결정**에서 생긴 취약점은 코드 몇 줄로 막을 수 없다. 반대로 "보안 신경 쓰자"는 막연한 다짐은 아무것도 찾지 못한다.

## 해법: 네 가지 질문

위협 모델링 선언문(Threat Modeling Manifesto)이 정리한 틀이다. 형식은 팀마다 달라도 이 네 질문에 답하면 된다.

1. **무엇을 만들고 있나?** — 시스템 모델(보통 데이터 흐름도)
2. **무엇이 잘못될 수 있나?** — 위협 식별 (STRIDE 등)
3. **그래서 무엇을 할 건가?** — 대응 결정
4. **충분히 잘했나?** — 검토와 갱신

### 1. 데이터 흐름도(DFD)와 신뢰 경계

```
 [사용자 브라우저] ──HTTPS──▶ ( API 서버 ) ──SQL──▶ [[ 주문 DB ]]
   외부 개체          ┆           처리          ┆        데이터 저장소
                      ┆             │            ┆
              ─ ─ ─ 신뢰 경계 ─ ─ ─ │ ─ ─ ─ 신뢰 경계 ─ ─
                                    ▼
                           ( 결제 대행 API )  외부 개체
```

- 요소: 외부 개체, 처리(프로세스), 데이터 저장소, 데이터 흐름, **신뢰 경계**.
- 신뢰 경계를 넘는 흐름이 공격 지점이다. 위협 찾기는 여기서부터 시작한다.
- 화이트보드 수준이면 충분하다. 정확한 다이어그램보다 팀이 같은 그림을 보는 것이 중요하다.

### 2. STRIDE: 위협을 빠짐없이 떠올리는 체크리스트

Microsoft 에서 나온 분류로, 각 글자는 깨지는 보안 속성 하나에 대응한다.

| 위협 | 깨지는 속성 | 질문 예 | 흔한 대응 |
| --- | --- | --- | --- |
| **S**poofing (위장) | 인증 | 남인 척 요청할 수 있나? 웹훅 발신자를 확인하나? | 강한 인증, MFA, 서명 검증, mTLS |
| **T**ampering (변조) | 무결성 | 전송 중·저장된 데이터를 바꿀 수 있나? 가격을 클라이언트가 보내나? | TLS, 서명·MAC, 서버 측 재계산, 입력 검증 |
| **R**epudiation (부인) | 책임 추적 | "내가 안 했다"고 할 때 반박할 기록이 있나? | 변조 방지 감사 로그, 타임스탬프 |
| **I**nformation disclosure (정보 노출) | 기밀성 | 남의 데이터, 스택 트레이스, 로그 속 토큰이 보이나? | 인가 검사, 암호화, 최소 노출, 로그 마스킹 |
| **D**enial of service (서비스 거부) | 가용성 | 비싼 요청을 반복해 서버를 멈출 수 있나? | [레이트 리밋](/develop-wiki/knowledge/performance/rate-limiting/), 크기 제한, 타임아웃 |
| **E**levation of privilege (권한 상승) | 인가 | 일반 사용자가 관리자 기능을 쓸 수 있나? | 기본 거부, 객체 단위 검사. [접근 제어 설계](/develop-wiki/knowledge/security/access-control-design/) |

요소별로 적용하면 빠짐이 줄어든다(STRIDE-per-element): 외부 개체는 S·R, 데이터 흐름은 T·I·D, 저장소는 T·I·D(+로그면 R), 처리는 전부.

### 3. 대응 선택지

| 선택 | 의미 |
| --- | --- |
| 완화 (mitigate) | 통제를 넣어 가능성·영향을 줄인다 — 대부분 이것 |
| 제거 (eliminate) | 위협을 만드는 기능·구성 요소 자체를 없앤다 (예: URL 가져오기 기능 삭제) |
| 이전 (transfer) | 계약·보험·외부 서비스로 책임을 넘긴다. 위험 자체는 남으므로 잔여 위험의 담당자를 기록 |
| 수용 (accept) | 비용 대비 가치가 없어 그대로 둔다. **누가, 왜** 수용했는지 기록 |

결과물은 "위협 – 대응 – 담당 – 상태" 표 하나면 된다. 각 대응은 이슈 트래커의 작업이나 테스트로 연결해야 실제로 반영된다.

### 4. 검토

- 찾은 위협마다 대응이 있거나 수용 근거가 있는가?
- 대응이 구현·테스트됐는가? 보안 테스트 케이스로 남긴다.
- 시스템이 바뀌면 모델도 고친다. 한 번 하고 끝내는 문서가 아니다.

## 언제 하나

- 설계 단계: 새 서비스, 새 외부 연동, 인증·결제·파일 업로드·사용자 URL 처리처럼 경계를 넘는 기능.
- 큰 변경 때: 아키텍처 변경, 새 데이터 종류(개인정보) 추가, 퍼블릭 API 공개.
- 작게 자주: 기능 설계 문서에 "위협" 절을 두고 30~60분 세션으로. 코드 리뷰에서 경계를 넘는 변경을 표시한다.

## 주의

- **완벽한 다이어그램을 목표로 하지 않는다.** 그리다가 지쳐 위협 찾기를 못 한다.
- STRIDE 는 떠올리기 도구이지 위험 크기를 알려 주지 않는다. 우선순위는 영향 × 가능성으로 따로 매긴다(조직의 위험 기준, 필요하면 DREAD·CVSS 류 점수).
- 보안 전문가 혼자 하면 시스템을 모르고, 개발자만 하면 공격 시각이 없다. 같이 한다.
- 공격자 관점 카탈로그(OWASP Top 10, [공급망 보안](/develop-wiki/knowledge/security/supply-chain-security/), 과거 사고)를 함께 놓고 보면 놓치는 것이 줄어든다.
- 프라이버시 위협은 STRIDE 만으로는 약하다. 개인정보를 다룬다면 LINDDUN 같은 프라이버시 전용 분류를 함께 검토한다.
