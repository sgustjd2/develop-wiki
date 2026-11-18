---
title: 접근 제어 설계 (RBAC·ABAC·ReBAC 와 IDOR)
aka: [Access Control, Authorization, RBAC, ABAC, ReBAC, IDOR, BOLA, Broken Access Control, Zanzibar, Policy Engine]
category: security
level: intermediate
summary: 누가 무엇을 할 수 있는지를 역할·속성·관계 중 무엇으로 표현할지 고르는 법과, 가장 흔한 실수인 객체 단위 검사 누락(IDOR)을 막는 구조.
tags: [owasp, authorization, rbac, abac, rebac, idor, multi-tenancy]
related: [security/owasp-top-10, security/session-vs-jwt, security/csrf, security/threat-modeling-stride, security/ssrf, architecture/hexagonal]
sources:
  - https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
  - https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html
  - https://research.google/pubs/zanzibar-googles-consistent-global-authorization-system/
updatedAt: 2026-11-18
---

OWASP Top 10 에서 접근 제어 실패(Broken Access Control)는 2021·2025 모두 A01 이다. [OWASP Top 10](/develop-wiki/knowledge/security/owasp-top-10/) 참고.

## 문제

인증(누구인가)은 프레임워크가 잘 해 준다. 인가(그 사람이 **이 객체에** 이 행동을 해도 되나)는 업무 규칙이라 앱이 직접 해야 하고, 그래서 자주 빠진다.

```
GET /api/invoices/1043     ← 로그인한 사용자 A
GET /api/invoices/1044     ← 숫자만 바꾸면 B 회사 청구서가 보인다 (IDOR)
```

- **수평 권한 상승**: 같은 등급의 다른 사용자 데이터 접근 (IDOR, API 에서는 BOLA 라고도 부른다).
- **수직 권한 상승**: 일반 사용자가 관리자 기능 호출 (UI 에서 버튼만 숨긴 경우).

## 해법 1: 구조 원칙 (OWASP)

- **기본 거부(deny by default)**: 규칙에 명시적으로 허용되지 않으면 거부. 프레임워크 기본값에 기대지 않는다.
- **모든 요청에서 서버가 검사**: 클라이언트 검사는 UX 일 뿐이다. 개별 핸들러에 흩어 두지 말고 미들웨어·정책 계층 한 곳으로 모은다.
- **최소 권한**: 수평·수직 모두. 권한이 쌓이기만 하는 것(privilege creep)을 주기적으로 검토한다.
- **실패 처리·로그**: 거부를 일관된 형식으로 기록하고, 오류 메시지로 내부 정보를 흘리지 않는다.

## 해법 2: IDOR 를 구조적으로 막기

```ts
// 나쁨: ID 로 가져온 뒤 검사를 잊기 쉽다
const inv = await db.invoice.findUnique({ where: { id } });

// 좋음: 조회 자체를 현재 주체의 범위로 한정 → 남의 것은 애초에 "없음"
const inv = await db.invoice.findFirst({
  where: { id, tenantId: ctx.user.tenantId },
});
if (!inv) throw new NotFound(); // 존재 여부도 숨기려면 403 대신 404
```

- 내 계정 정보처럼 대상이 자명하면 ID 를 받지 말고 세션에서 꺼낸다(`/me/invoices`).
- UUID·난수 ID 는 추측을 어렵게 할 뿐 **인가를 대신하지 않는다.** URL 은 로그·리퍼러·공유로 샌다.
- 테스트: 권한이 다른 계정 두 개로 읽기·생성·수정·삭제·내보내기를 교차로 시도하는 자동 테스트를 둔다.

## 해법 3: 권한 모델 고르기

| 모델 | 판단 근거 | 예 | 강점 | 약점 |
| --- | --- | --- | --- | --- |
| **RBAC** (역할) | 사용자에게 붙은 역할 → 역할의 권한 | `admin`, `editor`, `viewer` | 이해·감사 쉬움 | 객체 단위·조건부 규칙을 못 담음. 예외마다 역할을 만들다 **역할 폭발** |
| **ABAC** (속성) | 주체·자원·행동·환경의 속성으로 정책 평가 | "같은 부서 + 업무 시간 + 회사 기기" | 세밀하고 유연 | 정책이 흩어지면 "왜 거부됐나" 추적이 어려움 |
| **ReBAC** (관계) | 주체와 자원 사이 관계 그래프 | "문서의 owner 이거나, 문서가 속한 폴더의 editor" | 공유·계층·멀티테넌트에 자연스러움 | 관계 저장소·그래프 탐색 인프라 필요 |

OWASP 는 앱 개발에서 RBAC 단독보다 ABAC·ReBAC 를 선호한다고 적는다. 실제로는 **섞어 쓴다**: 거친 기능 접근은 역할, 객체 접근은 관계·속성.

```ts
// 정책을 한 곳에: 핸들러는 can() 만 부른다
type Action = 'read' | 'update' | 'delete';
function can(user: User, action: Action, doc: Doc): boolean {
  if (user.tenantId !== doc.tenantId) return false;          // 테넌트 경계 (속성)
  if (user.roles.includes('admin')) return true;             // 역할
  if (doc.ownerId === user.id) return true;                  // 관계: 소유자
  if (action === 'read') return doc.sharedWith.includes(user.id); // 관계: 공유
  return false;                                              // 기본 거부
}
```

ReBAC 의 대표 사례는 Google Zanzibar(USENIX ATC 2019)다. 관계 튜플("doc:1#editor@user:7")을 저장하고 그래프를 따라가 판정한다. SpiceDB, OpenFGA 등이 이 모델을 구현한다. 정책을 코드 밖 언어로 두는 엔진으로는 OPA(Rego), Cedar 등이 있다.

## 언제 무엇을

- 내부 도구, 역할이 몇 개 안 되고 객체 단위 공유가 없다 → **RBAC** + 테넌트 필터로 충분.
- 규칙이 시간·위치·데이터 등급 같은 조건에 의존 → **ABAC** 정책 엔진.
- 문서·폴더·조직처럼 공유와 상속이 핵심(Google Drive, Notion, GitHub 같은 구조) → **ReBAC**.

## 주의

- **목록 API 와 검색**을 잊기 쉽다. 단건 조회는 막았는데 `/search?q=` 가 남의 것을 돌려준다. 필터를 쿼리 단계에 넣는다.
- **대량 할당(mass assignment)**: 요청 본문의 `ownerId`, `role`, `tenantId` 를 그대로 저장하면 권한을 스스로 올린다. 쓸 수 있는 필드를 허용 목록으로.
- JWT 안에 권한을 넣으면 회수가 토큰 만료까지 늦는다. [세션 vs JWT](/develop-wiki/knowledge/security/session-vs-jwt/) 참고.
- 정책 엔진을 외부 서비스로 두면 그것이 지연·장애 지점이 된다. 캐시하면 권한 회수가 늦어진다(Zanzibar 는 이 일관성 문제를 별도 설계로 다룬다).
- 인가 로직은 단위 테스트로 "거부되어야 할 경우"를 반드시 포함한다. 허용 케이스만 테스트하는 경우가 많다.
- 서버 간 호출도 인가 대상이다. 내부망이라 믿으면 [SSRF](/develop-wiki/knowledge/security/ssrf/) 한 번에 다 열린다.
