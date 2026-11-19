---
title: 사용자 여정 지도와 서비스 블루프린트
aka: [User Journey Map, Customer Journey Map, Service Blueprint, Frontstage, Backstage, Line of Visibility]
category: ui-ux
group: research
level: intermediate
summary: 여정 지도는 한 사용자가 목표를 이루는 과정의 행동·생각·감정을 시간순으로, 서비스 블루프린트는 그 뒤에서 움직이는 직원·시스템·프로세스를 함께 그린다.
tags: [ux, journey-map, service-blueprint, service-design, research, cx]
related: [ui-ux/personas-jobs-to-be-done, ui-ux/ux-research-method-selection, ui-ux/ux-metrics-sus-heart-ab-test, ui-ux/response-time-feedback, mobile-dev/push-notification-architecture]
sources:
  - https://www.nngroup.com/articles/journey-mapping-101/
  - https://www.nngroup.com/articles/service-blueprints-definition/
updatedAt: 2026-11-19
---

## 문제

- 화면 단위로 개선하면 각 화면은 괜찮은데 전체 경험이 끊긴다. 예: 앱 주문은 쉬운데 배송 지연 알림이 이메일로만 와서 고객센터 문의가 폭증.
- 사용자가 겪는 불편의 원인이 화면이 아니라 뒤쪽 시스템(재고 동기화 지연, 수작업 승인)에 있으면 프론트엔드 수정으로는 해결되지 않는다.

## 해법

### 여정 지도 (사용자 관점)

NN/g 가 정리한 구성 요소:

1. **행위자**: 지도 하나에 퍼소나 하나.
2. **시나리오와 기대**: 어떤 목표를 어떤 기대로 이루려 하는가.
3. **단계**: 큰 흐름(인지 → 비교 → 구매 → 사용 → 문의 등).
4. **행동·생각·감정**: 단계별로 무엇을 하고 생각하고 느끼는가. 감정은 오르내리는 선으로 표현.
5. **기회**: 개선 아이디어와 담당자·성공 지표.

### 서비스 블루프린트 (조직 관점)

여정 지도를 확장해 그 경험을 만드는 뒤쪽을 그린다.

| 층 | 내용 | 예 (음식 배달) |
| --- | --- | --- |
| 고객 행동 | 고객이 하는 일 | 주문, 상태 확인, 수령 |
| 전면(frontstage) | 고객에게 보이는 접점 | 앱 화면, 푸시, 배달원 |
| ↕ 가시선(line of visibility) | 위는 보이고 아래는 안 보임 | |
| 후면(backstage) | 보이지 않는 직원 행동 | 가게 접수, 배차 |
| 지원 프로세스 | 내부 시스템·정책 | 결제 승인, 재고, 위치 추적 API |
| 증거(evidence) | 고객이 만나는 물리·디지털 흔적 | 영수증, 알림 문구, 포장 |

선은 상호작용선(고객-조직 접촉), 가시선, 내부 상호작용선(접점 직원과 지원 인력 사이)의 세 가지다.

```ts
// 블루프린트 한 칸을 데이터로 두면 이벤트·알림 설계와 바로 연결된다
type BlueprintStep = {
  customer: string;                 // "주문 상태 확인"
  frontstage: string[];             // ["주문 상세 화면", "푸시: 조리 시작"]
  backstage: string[];              // ["가게 접수"]
  support: string[];                // ["order-service: ACCEPTED 이벤트"]
  painPoints?: string[];            // ["접수 후 10분간 상태 변화 없음"]
};
```

## 언제 쓰나

- 여정 지도: 여러 단계·여러 채널에 걸친 경험(가입~첫 사용, 구매~환불), 팀 간 공통 그림이 필요할 때.
- 블루프린트: 여러 부서·시스템이 얽힌 서비스, 옴니채널, 내부 비효율이 고객 불편으로 이어질 때. 개발자에게는 **어느 이벤트가 어느 사용자 알림·화면 상태를 만드는지** 추적하는 도구가 된다.

## 체크리스트

- [ ] 지도의 각 단계에 근거(인터뷰, 로그, 문의 데이터)가 표시돼 있다
- [ ] 리서치 없이 그린 부분은 "가정"으로 표시돼 있다
- [ ] 감정 저점마다 원인이 전면인지 후면인지 구분했다
- [ ] 기회 항목마다 담당자와 성공 지표가 있다
- [ ] 블루프린트의 지원 프로세스가 실제 시스템·이벤트 이름과 연결돼 있다

## 흔한 실수·주의

- **가정으로만 그린다.** NN/g 는 지도는 근거만큼만 믿을 수 있다고 강조한다. 워크숍 산출물은 가설이다.
- **한 지도에 여러 행위자.** 목표가 다른 사용자를 섞으면 감정 곡선이 의미를 잃는다.
- **예쁜 포스터로 끝난다.** 기회 → 백로그 항목 → 지표로 이어지지 않으면 비용만 든다.
- **범위가 너무 넓다.** "고객 생애 전체"보다 특정 시나리오 하나가 실행 가능하다.
- 서비스 블루프린트의 기원(Shostack, 1980년대 HBR)은 이 노트에서 원문을 확인하지 못해 출처에 넣지 않았다.
