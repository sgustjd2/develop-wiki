---
title: 결합도와 응집도
aka: [Coupling and Cohesion, Low Coupling High Cohesion]
category: principles
level: beginner
summary: 모듈 사이의 의존 정도(결합도)는 낮게, 모듈 안 요소들의 관련성(응집도)은 높게 유지하라는 모듈 설계의 기본 척도.
tags: [design, modularity, structured-design]
related: [principles/solid, principles/dry-kiss-yagni, principles/composition-over-inheritance, architecture/layered-clean-hexagonal]
sources:
  - https://en.wikipedia.org/wiki/Coupling_(computer_programming)
  - https://en.wikipedia.org/wiki/Cohesion_(computer_science)
updatedAt: 2026-11-18
---

Larry Constantine 이 1960년대 말 구조적 설계(structured design)에서 정리했고, Stevens·Myers·Constantine(1974), Yourdon·Constantine(1979)이 용어를 정착시켰다.

- **결합도(coupling)**: 모듈 **사이**가 얼마나 서로를 알고 의존하는가 → 낮을수록 좋다.
- **응집도(cohesion)**: 모듈 **안**의 요소들이 얼마나 하나의 목적에 모여 있는가 → 높을수록 좋다.

둘은 보통 함께 움직인다. 관련된 것을 한곳에 모으면(응집도↑) 바깥과 주고받을 것이 줄어든다(결합도↓).

## 문제

- 결합도가 높으면 한 모듈의 변경이 연쇄적으로 다른 모듈 수정을 부르고, 테스트하려면 의존 모듈을 다 띄워야 한다.
- 응집도가 낮으면 `utils.ts` 처럼 무관한 기능이 한 파일에 모여, 무엇을 고칠 때 어디를 봐야 할지 알기 어렵다.

## 결합도 종류 (강함 → 약함)

| 종류 | 의미 | 예 |
| --- | --- | --- |
| 내용 | 다른 모듈의 내부를 직접 건드림 | private 필드를 리플렉션으로 수정 |
| 공통 | 같은 전역 데이터를 공유 | 여러 모듈이 전역 `config` 객체를 읽고 씀 |
| 외부 | 외부에서 정한 형식·프로토콜·장치를 공유 | 둘 다 같은 CSV 포맷에 의존 |
| 제어 | 플래그를 넘겨 상대의 동작 흐름을 지시 | `render(data, isAdmin, skipCache)` |
| 스탬프 | 큰 구조체를 넘기지만 일부만 씀 | `sendMail(user)` 에서 `user.email` 만 사용 |
| 자료 | 필요한 단순 값만 주고받음 | `sendMail(email)` |

## 응집도 종류 (약함 → 강함)

| 종류 | 묶인 이유 |
| --- | --- |
| 우연적 | 이유 없음 (`Utils`, `Helpers`) |
| 논리적 | 같은 범주라서 (모든 입력 처리 함수) |
| 시간적 | 같은 시점에 실행돼서 (초기화 코드 모음) |
| 절차적 | 정해진 순서로 실행돼서 |
| 통신적 | 같은 데이터를 다뤄서 |
| 순차적 | 앞 단계 출력이 다음 단계 입력이라서 |
| 기능적 | 하나의 잘 정의된 작업에 모두 기여해서 |

## 해법

```ts
// 제어 결합 + 스탬프 결합
function notifyUser(user: User, viaSms: boolean) { /* user 전체를 받고 플래그로 분기 */ }

// 자료 결합 + 기능적 응집: 필요한 값만, 분기는 호출자가 고른 구현으로
interface Channel { send(to: string, msg: string): Promise<void>; }
const notify = (ch: Channel, to: string, msg: string) => ch.send(to, msg);
```

- 함께 바뀌는 것은 같은 모듈에, 따로 바뀌는 것은 다른 모듈에 둔다(SRP 와 같은 방향).
- 모듈 경계에는 작은 인터페이스를 두고 구현 세부를 숨긴다.
- 기술 계층(controller/service/repository)보다 기능(주문/결제) 단위로 폴더를 나누면 응집도가 오르기 쉽다.

## 언제 쓰나

- 모듈·패키지·서비스 경계를 정할 때의 판단 기준
- 리뷰에서 "이 변경 때문에 몇 군데를 고쳐야 했나?"를 따질 때

## 주의

- 결합도 0 은 불가능하다. 목표는 **필요한 결합만, 안정적인 쪽으로** 두는 것이다.
- 결합을 줄이려고 이벤트·메시지로 바꾸면 의존이 사라지는 게 아니라 **보이지 않게** 될 수 있다(암묵적 결합). 흐름 추적 비용이 늘어난다.
- 마이크로서비스로 쪼개도 서로 동기 호출이 많고 같이 배포해야 한다면 결합도는 그대로다(분산 모놀리스).
