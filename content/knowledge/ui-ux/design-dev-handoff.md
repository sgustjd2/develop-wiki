---
title: 디자인-개발 핸드오프
aka: [Design Handoff, Design to Development Handoff, Dev Mode, Code Connect, Design Spec, Redlines]
category: ui-ux
group: design-system
level: beginner
summary: 시안을 개발로 넘길 때 픽셀 값이 아니라 토큰·컴포넌트·상태·예외 상황·반응형 규칙을 함께 전달해, 구현 중 질문과 재작업을 줄이는 협업 방식.
tags: [design-system, handoff, collaboration, figma, design-tokens]
related: [ui-ux/design-tokens, ui-ux/component-api-variants-slots, ui-ux/design-system-structure, engineering-practice/code-review, ui-ux/loading-states, ui-ux/empty-states]
sources:
  - https://help.figma.com/hc/en-us/articles/15023124644247-Guide-to-Dev-Mode
  - https://www.designtokens.org/TR/2025.10/format/
  - https://atomicdesign.bradfrost.com/chapter-5/
  - https://www.w3.org/TR/WCAG22/
updatedAt: 2026-11-19
---

## 문제

- 개발자가 시안에서 `#3B5CA8`, `margin 18px` 를 읽어 그대로 옮기면 토큰·컴포넌트와 어긋난 "거의 비슷한" 화면이 생긴다.
- 시안은 행복 경로(데이터 적당히, 오류 없음)만 그려져 있어 로딩·빈 상태·긴 텍스트·오류는 개발 중 즉석에서 결정된다.
- "핸드오프"를 한 번의 전달로 생각해 이후 변경이 슬랙 메시지로 흩어진다.

## 해법

### 1. 값이 아니라 이름을 넘긴다

| 전달 항목 | 나쁜 예 | 좋은 예 |
| --- | --- | --- |
| 색 | `#3B5CA8` | `color.primary` |
| 간격 | `18px` | `space.4` (스케일 밖이면 시안을 고친다) |
| 글자 | `Pretendard 15/22 Medium` | `typescale.body-medium` |
| UI | 사각형+텍스트 레이어 | `Button intent=primary size=md` 인스턴스 |

디자인 도구의 변수·스타일 이름과 코드 토큰 이름이 같아야 이 방식이 동작한다([디자인 토큰](/develop-wiki/knowledge/ui-ux/design-tokens/)).

### 2. 상태·예외 목록

```
화면: 주문 내역
- 상태: 로딩(스켈레톤) / 빈 목록 / 오류(재시도) / 부분 실패
- 데이터 극단: 상품명 80자, 수량 999+, 금액 1억 이상, 번역으로 길어진 문자열
- 상호작용: 호버·포커스·눌림·비활성, 키보드 순서, 스크린리더 라벨
- 반응형: compact / medium / expanded 각 구간 레이아웃
- 모션: 사용 토큰, 모션 줄이기 시 대안
- 접근성: 대비 확인 결과, 포커스 표시, 터치 영역(최소 24×24 CSS px)
```

### 3. 도구 기능 활용 (Figma Dev Mode 예)

- **Ready for dev** 상태로 넘길 프레임을 명확히 표시.
- **Inspect**: 레이아웃·간격·색·적용된 변수/스타일 확인.
- **Code Connect**: 자동 생성 코드 대신 디자인 시스템의 실제 컴포넌트 코드 스니펫을 보여 준다.
- **Compare changes**: 이전 버전과 비교해 무엇이 바뀌었는지 확인.
- **Annotations**: 측정값·동작 설명을 시안 위에 기록.

요금제에 따라 쓸 수 있는 기능이 다르다(Dev Mode 는 유료 플랜, Code Connect 는 Professional 이상 등).

## 언제 쓰나

- 모든 기능 개발에서. 다만 깊이는 조절한다 — 시스템 컴포넌트만 조합한 화면은 상태 목록만으로 충분하고, 새 컴포넌트는 상세 명세가 필요하다.

## 체크리스트

- [ ] 시안의 모든 색·간격·글자가 토큰/스타일에 연결돼 있다 (분리된 값 0개)
- [ ] 로딩·빈·오류·극단 데이터 상태가 그려져 있다
- [ ] 반응형 구간별 동작이 정의돼 있다
- [ ] 새 컴포넌트가 필요한지, 기존 변형으로 되는지 핸드오프 전에 시스템 팀과 확인
- [ ] 구현 후 디자이너가 실제 빌드(스테이징)에서 검수 — 시안 대조가 아닌 동작 확인
- [ ] 변경은 시안 버전·이슈에 기록하고 메신저로만 전달하지 않는다

## 흔한 실수

- 시안의 소수점 값(17.5px)을 그대로 구현.
- 자동 생성 CSS 를 복사해 붙임 → 절대 위치·고정 크기 코드가 들어온다.
- 개발자가 핸드오프 때 처음 시안을 봄 → 기술 제약(데이터 구조, API 지연)이 늦게 발견. 설계 단계부터 개발자가 참여한다.
- 접근성 요구(포커스 순서, 라벨)를 개발 몫으로만 남김.

## 주의 (비용)

- 상세 명세 작성은 디자이너 시간을 많이 쓴다. 시스템이 성숙할수록 명세는 짧아져야 정상이다.
- 도구 기능(Dev Mode·Code Connect)은 디자인 파일이 변수·컴포넌트로 잘 구조화돼 있을 때만 효과가 있다. 정리 안 된 파일에는 잘못된 값을 더 빨리 퍼뜨린다.
