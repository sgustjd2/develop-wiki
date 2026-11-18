---
title: 로드 밸런싱
aka: [Load Balancing, Round Robin, Least Connections, Consistent Hashing, Power of Two Choices, Health Check, L4/L7 Load Balancer]
category: performance
level: intermediate
summary: 요청을 여러 백엔드에 나누는 알고리즘(라운드 로빈, 최소 연결, 가중치, 해시)과 헬스 체크·드레이닝 같은 운영 장치, 그리고 각 방식이 실제로 고르게 분산하지 못하는 이유.
tags: [load-balancer, scalability, availability, nginx, sre]
related: [performance/backpressure-load-shedding, performance/rate-limiting, performance/connection-pool, data-modeling/sharding-partitioning]
sources:
  - https://sre.google/sre-book/load-balancing-datacenter/
  - https://docs.nginx.com/nginx/admin-guide/load-balancer/http-load-balancer/
updatedAt: 2026-11-18
---

## 문제

서버를 여러 대 두어도 요청이 고르게 가지 않으면 한 대가 먼저 포화되어 전체 지연이 나빠진다. 요청마다 비용이 다르고, 서버마다 성능이 다르고, 죽거나 막 뜬 서버도 섞여 있다.

## 해법: 분배 알고리즘

| 알고리즘 | 방식 | 맞는 곳 | 약점 |
| --- | --- | --- | --- |
| 라운드 로빈 | 차례로 | 요청 비용이 비슷하고 서버가 동질적 | 요청 비용 차이를 무시. Google 측정에서 가장 바쁜 태스크가 가장 한가한 태스크의 약 2배 CPU |
| 가중 라운드 로빈 | 서버별 가중치 비율로 | 사양이 다른 서버 혼재 | 정적 가중치는 실제 부하를 반영 못 함 |
| 최소 연결 | 진행 중 요청이 가장 적은 곳 | 처리 시간이 들쭉날쭉한 요청 | 각 LB 는 자기 연결만 앎. 빠르게 에러를 내는 고장 서버로 몰림(sinkhole) |
| 무작위 둘 중 선택 | 둘을 무작위로 뽑아 덜 바쁜 쪽 | LB 가 여러 대인 분산 환경 | 부하 정보 수집 필요 |
| IP·키 해시 | 같은 키는 같은 서버로 | 서버 로컬 캐시·세션 활용 | 핫 키 쏠림. 일관 해싱이 아니면 서버 증감 시 대량 재배치 |
| 부하 보고 기반 가중치 | 서버가 보고하는 사용률·에러율로 동적 가중치 | 대규모 서비스 | 구현 복잡. Google 은 이 방식으로 편차를 크게 줄였다고 보고 |

```nginx
upstream api {
  least_conn;
  server 10.0.0.11 weight=2 max_fails=3 fail_timeout=10s;
  server 10.0.0.12 max_fails=3 fail_timeout=10s;
  server 10.0.0.13 backup;            # 나머지가 모두 불가할 때만
}
```

## 해법: 운영 장치

- **헬스 체크**: 능동(주기적 프로브) + 수동(실제 요청 실패 횟수). `/health` 는 의존성까지 깊게 검사하지 않는다. DB 가 잠깐 느려지면 전 서버가 동시에 빠지는 사고가 난다.
- **드레이닝(lame duck)**: 종료 예정 서버는 새 요청을 받지 않고 진행 중 요청만 끝낸 뒤 내려간다. SRE 책은 10~150초 정도를 언급한다.
- **슬로 스타트**: 막 복구된 서버에 가중치를 점진적으로 올려 콜드 캐시·JIT 워밍업 동안 몰리지 않게 한다.
- **서브셋팅**: 클라이언트·백엔드가 아주 많으면 각 클라이언트가 일부 백엔드에만 연결한다. 무작위 서브셋은 불균형이 크므로 결정적 서브셋팅을 쓴다.

## L4 vs L7

| | L4 (TCP/UDP) | L7 (HTTP) |
| --- | --- | --- |
| 보는 것 | IP·포트 | 경로, 헤더, 쿠키 |
| 분배 단위 | 연결 | 요청 |
| 장점 | 빠르고 단순, 프로토콜 무관 | 경로 라우팅, 재시도, TLS 종료, 요청 단위 분산 |
| 주의 | HTTP/2·gRPC 처럼 연결을 오래 유지하면 한 서버에 쏠림 | 처리 비용, 설정 복잡 |

## 언제 쓰나

- 서버가 2대 이상인 모든 서비스. 무엇보다 **가용성**(장애 서버 우회, 무중단 배포) 때문에 쓴다.

## 주의 (비용)

- **스티키 세션**은 분산을 깨고 배포·장애 때 세션을 잃는다. 상태는 외부 저장소로 빼는 것이 낫다.
- LB 재시도는 장애 시 부하를 곱한다. 재시도 예산과 함께 쓴다 → [백프레셔·부하 차단](/develop-wiki/knowledge/performance/backpressure-load-shedding/).
- 긴 연결(gRPC, WebSocket)은 L4 에서 재분배되지 않는다. 클라이언트 측 분산이나 연결 수명 제한을 둔다.
- LB 자체도 단일 장애점이다. 이중화하고 용량을 따로 계획한다.
- "진행 중 요청 수"는 용량의 좋은 척도가 아니다(I/O 대기 요청도 1로 센다). 가능하면 서버의 실제 사용률을 신호로 쓴다.
