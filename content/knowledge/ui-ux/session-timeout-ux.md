---
title: 세션 타임아웃 UX (WCAG 2.2.1 Timing Adjustable)
aka: [Session Timeout, Timing Adjustable, WCAG 2.2.1, WCAG 2.2.6, Idle Timeout Warning, 자동 로그아웃]
category: ui-ux
group: accessibility
level: intermediate
summary: 유휴 시간이 지나면 로그아웃·입력 소실이 생기는 서비스에서, 사용자가 시간 제한을 연장하고 데이터를 잃지 않도록 경고·연장·보존을 설계하는 기준과 구현.
tags: [accessibility, a11y, wcag, timeout, session, security, forms]
related: [ui-ux/wcag-22-overview, ui-ux/modal-dialog, ui-ux/live-regions-announcements, ui-ux/multi-step-form-wizard, ui-ux/cognitive-accessibility, ui-ux/confirmation-vs-undo]
sources:
  - https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html
  - https://www.w3.org/WAI/WCAG22/Understanding/timeouts.html
  - https://owasp.org/www-community/Session_Timeout
updatedAt: 2026-11-19
---

## 문제

- 보안 때문에 짧은 유휴 시간 뒤 자동 로그아웃을 두는 서비스가 많다(금융, 공공). 그런데 글을 천천히 읽거나, 입력이 느리거나, 낭독기를 쓰는 사용자는 같은 시간에 더 적은 일을 한다.
- 경고 없이 만료되면 긴 폼 입력이 통째로 사라진다.

## 해법

### 기준 (자기 말로 정리)

- **WCAG 2.2.1 Timing Adjustable (A)**: 콘텐츠가 만든 시간 제한은 다음 중 하나를 충족해야 한다. ① 시작 전에 끌 수 있다, ② 시작 전에 기본값의 10배 이상으로 조정할 수 있다, ③ **만료 전에 경고하고, 최소 20초 안에 간단한 동작(예: Space 키)으로 연장**할 수 있으며 **10번 이상** 반복 연장 가능하다.
- 예외: 실시간 이벤트(경매), 연장하면 활동이 무효가 되는 필수 제한, **20시간 초과 제한**.
- **WCAG 2.2.6 Timeouts (AAA)**: 비활동으로 데이터를 잃을 수 있다면 그 기간을 미리 알리거나, 20시간 넘게 데이터를 보존한다.
- 브라우저·네트워크가 만드는 제한은 범위 밖이고, 콘텐츠 제공자가 알거나 통제하는 타임아웃이 대상이다.

### 설계 규칙

1. 만료 **1~2분 전** 경고(20초는 최소선이지 권장이 아니다). 서비스 특성에 맞춰 여유를 두라.
2. 경고는 [모달 다이얼로그](/develop-wiki/knowledge/ui-ux/modal-dialog/) 또는 `role="alertdialog"` 로, 남은 시간·"계속 로그인 유지" 버튼·"로그아웃" 버튼을 둔다. 포커스를 다이얼로그로 옮긴다.
3. 카운트다운 숫자를 초마다 낭독시키지 않는다. 경고 시작 시 한 번, 이후 큰 간격으로만 알린다([라이브 영역](/develop-wiki/knowledge/ui-ux/live-regions-announcements/)).
4. 연장은 서버 세션도 함께 갱신한다(클라이언트 타이머만 리셋하면 서버에서 먼저 만료).
5. 여러 탭: 한 탭의 활동이 다른 탭 타이머에도 반영되게 하거나(`BroadcastChannel`, `localStorage` 이벤트) 서버 시간을 기준으로 한다.
6. 만료되더라도 **작성 중 데이터를 보존**하고 재로그인 뒤 복원한다. 민감 정보의 보존 범위는 보안·법무와 협의한다(W3C 도 개인정보 전문가 상담을 권한다).

### 코드: 주입형 시계로 만든 만료 로직 (node 로 확인)

```ts
class SessionTimer {
  private last: number; private warned = false;
  constructor(private o: { ttl: number; warn: number; now: () => number;
                           onWarn: (leftMs: number) => void; onExpire: () => void }) { this.last = o.now(); }
  touch() { this.last = this.o.now(); this.warned = false; }   // 사용자 연장·서버 갱신 성공 후 호출
  tick() {                                                      // setInterval 로 주기 호출
    const left = this.o.ttl - (this.o.now() - this.last);
    if (left <= 0) return this.o.onExpire();
    if (left <= this.o.warn && !this.warned) { this.warned = true; this.o.onWarn(left); }
  }
}
```

- 확인한 시나리오(ttl 600초, warn 60초): 539초에는 아무 일 없음 → 540초에 경고(남은 60초) → `touch()` 후 1100초(남은 40초)에 다시 경고 → 1140초에 만료. 시계를 주입하면 가짜 시간으로 테스트할 수 있다.
- 비활동 감지는 마우스·키 입력·서버 요청 중 무엇을 활동으로 볼지 정책으로 정한다. 폼 입력 중 타이핑은 활동에 포함한다.

## 언제 쓰나

- 로그인 세션, 장바구니·예약 좌석 홀드, 결제·본인인증 단계 제한 시간이 있는 모든 화면.
- 타임아웃을 없앨 수 있으면 가장 좋다. 위험이 낮은 서비스에는 긴 세션(또는 "로그인 유지")이 접근성과 사용성 모두에 낫다.

## 주의·비용

- 보안과 접근성이 충돌하는 지점이다. 적절한 만료 시간은 위험도에 따라 정해야 하며 이 노트는 수치를 정하지 않는다. (소스에 둔 OWASP Session Timeout 문서는 링크 생존만 확인했고 본문은 읽지 못했다.)
- 연장 UI 가 인증 정보 재입력이면 시간이 더 걸린다. 연장은 비밀번호 없이 한 번의 동작으로 가능해야 한다(보안상 불가하면 만료 후 복구 경로를 강화).
- 은행 등에서 법·규정이 요구하는 만료는 "필수 제한" 예외가 될 수 있지만, 예외 주장은 문서화한다.

## 체크리스트

- [ ] 만료 전 경고가 있고 단순 동작으로 최소 10회 연장 가능
- [ ] 경고가 낭독기에 전달되고 키보드로 조작된다
- [ ] 클라이언트·서버 타이머가 일치한다
- [ ] 만료 후 입력 복구 경로가 있다
- [ ] 제한 시간을 시작 전에 안내한다(긴 폼)

## 흔한 실수

- 경고 없이 이동(리다이렉트)해 작성 내용이 사라진다.
- 경고 모달이 포커스를 가져오지 않아 키보드·낭독기 사용자가 못 본다.
- 매초 갱신되는 타이머를 `aria-live` 에 넣어 낭독이 폭주한다.
- 백그라운드 탭에서 `setInterval` 이 지연되는 점을 무시한다. 타임스탬프 비교로 계산한다.
