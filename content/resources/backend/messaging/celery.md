---
name: Celery
url: https://docs.celeryq.dev
docs: https://docs.celeryq.dev/en/stable/
repo: https://github.com/celery/celery
stars: 29255
domain: backend
category: messaging
description: Python 분산 작업 큐. RabbitMQ·Redis·SQS 를 브로커로 써서 함수를 워커 프로세스에서 비동기·예약 실행한다. Django·Flask·FastAPI 서비스의 백그라운드 작업에 쓴다.
pricing: oss
tags: [job-queue, background-jobs, task-queue, scheduler, django]
languages: [python]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Celery 는 Python 함수를 **태스크** 로 등록해 두고, 호출 시 메시지를 브로커에 넣으면 별도 **워커** 프로세스가 꺼내 실행하는 분산 작업 큐다. 메시지 전송은 Kombu 라이브러리가 담당해 여러 브로커를 같은 API 로 쓴다. 주기 실행 스케줄러 **Celery Beat**, 작업을 엮는 **Canvas**(chain·group·chord), 결과 저장소(result backend)를 함께 제공한다.

2026-11 기준 최신은 **5.7.0**(2026-11-05). 5.7 에서 Python 3.10 이 최소 버전이 됐고(3.14 호환 작업 포함), Canvas 워크플로 안정성·워커의 브로커 재연결·종료 처리, Pydantic 모델 인자 지원, `pymemcache` 결과 백엔드 등이 추가·개선됐다. BSD-3-Clause.

브로커 지원 상태(공식 표): RabbitMQ·Redis·Amazon SQS 는 Stable, Kafka·Google Cloud Pub/Sub·ZooKeeper 는 Experimental.

## 설치
```bash
pip install "celery[redis]"          # Redis 브로커 의존성 포함. RabbitMQ 만 쓰면 pip install celery
docker run -d -p 6379:6379 redis:latest
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| App | `Celery('proj', broker=..., backend=...)` 설정과 태스크 등록의 중심 |
| Task | `@app.task` 로 등록한 함수. `delay()`/`apply_async()` 로 비동기 호출 |
| Broker | 태스크 메시지를 나르는 전송 계층(RabbitMQ 기본, Redis, SQS) |
| Worker | `celery -A proj worker` 로 띄우는 실행 프로세스. 동시성 풀: prefork(기본), threads, gevent/eventlet, solo |
| Result backend | 반환값·상태 저장소(Redis, DB, RPC 등). 기본은 비활성 |
| Beat | 주기 태스크를 정해진 시각에 브로커로 보내는 스케줄러 프로세스 |
| Canvas | `chain`(순차), `group`(병렬), `chord`(병렬 후 콜백) 조합 |
| Routing | 태스크별 큐 지정(`task_routes`), 워커는 `-Q` 로 구독 큐 선택 |

## 기본 사용법
```python
# tasks.py
from celery import Celery

app = Celery("tasks", broker="redis://localhost:6379/0", backend="redis://localhost:6379/1")
app.conf.task_acks_late = True            # 처리 후 ack → 워커가 죽으면 재전달

@app.task(bind=True, autoretry_for=(ConnectionError,), retry_backoff=True, max_retries=5)
def send_email(self, to: str) -> str:
    return f"sent to {to}"
```
```bash
celery -A tasks worker --loglevel=INFO --concurrency=8
```
```python
from tasks import send_email
r = send_email.delay("a@example.com")
print(r.get(timeout=10))                  # 결과 백엔드가 있어야 조회 가능
```
주기 작업과 Canvas:
```python
from celery import chain
from celery.schedules import crontab

app.conf.beat_schedule = {
    "daily-report": {"task": "tasks.send_email", "schedule": crontab(hour=9, minute=0),
                     "args": ("ops@example.com",)},
}
chain(send_email.s("a@example.com"), send_email.si("b@example.com")).delay()
```
```bash
celery -A tasks beat --loglevel=INFO      # Beat 는 한 인스턴스만 실행
```

## 자주 쓰는 패턴
- **Django 연동**: 프로젝트에 `celery.py` 를 두고 `app.config_from_object("django.conf:settings", namespace="CELERY")`, `app.autodiscover_tasks()` 로 앱별 `tasks.py` 를 자동 등록. [Django](/develop-wiki/backend/web-framework/django/)·[FastAPI](/develop-wiki/backend/web-framework/fastapi/) 의 요청 처리에서 무거운 일을 분리한다.
- **멱등 태스크**: `task_acks_late` 를 켜면 재전달로 같은 태스크가 두 번 실행될 수 있으므로 태스크를 멱등하게 작성한다.
- **인자는 id 로**: ORM 객체 대신 기본 키를 넘기고 워커에서 다시 조회한다(직렬화·오래된 데이터 문제 방지).
- **큐 분리**: 느린 작업과 빠른 작업을 다른 큐·워커 풀로 나눠 서로 막지 않게 한다.
- **모니터링**: Flower 로 워커·태스크 상태를 보고, `celery inspect active` 등 원격 제어 명령으로 점검.

## 언제 쓰나 / 피할 때
- 쓸 때: Python 웹 서비스의 이메일·리포트·이미지 처리 같은 백그라운드 작업과 주기 작업, RabbitMQ·[Redis](/develop-wiki/backend/database/redis/) 를 이미 운영 중일 때.
- 피할 때(대안): Node.js 서비스는 [BullMQ](/develop-wiki/backend/messaging/bullmq/). 장기 실행·보상 로직이 있는 업무 흐름은 [Temporal](/develop-wiki/backend/messaging/temporal/). 단순한 비동기 작업만 필요하면 더 작은 라이브러리(RQ, Dramatiq 등)도 고려. Redis 브로커는 비정상 종료 시 메시지 유실 가능성이 RabbitMQ 보다 크다고 공식 문서가 밝힌다.

## 공식 문서
- [문서](https://docs.celeryq.dev/en/stable/) · [첫 단계](https://docs.celeryq.dev/en/stable/getting-started/first-steps-with-celery.html) · [브로커·백엔드](https://docs.celeryq.dev/en/stable/getting-started/backends-and-brokers/index.html) · [Canvas](https://docs.celeryq.dev/en/stable/userguide/canvas.html) · [Periodic Tasks](https://docs.celeryq.dev/en/stable/userguide/periodic-tasks.html) · [Django 연동](https://docs.celeryq.dev/en/stable/django/first-steps-with-django.html) · [5.7.0 릴리스](https://github.com/celery/celery/releases/tag/v5.7.0)
