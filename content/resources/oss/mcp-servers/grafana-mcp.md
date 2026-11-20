---
name: Grafana MCP Server
url: https://github.com/grafana/mcp-grafana
docs: https://grafana.com/docs/grafana/latest/developer-resources/mcp/
repo: https://github.com/grafana/mcp-grafana
stars: 3689
domain: oss
category: mcp-servers
description: Grafana Labs 공식 MCP 서버. 대시보드 검색·수정, Prometheus·Loki·Tempo 질의, 알림·인시던트·OnCall 조회를 에이전트 도구로 준다. 장애 조사 때 지표와 로그를 에이전트가 직접 읽게 할 때 쓴다.
pricing: oss
tags: [mcp, grafana, observability, prometheus, loki, official]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
[Grafana](/develop-wiki/backend/observability/grafana/) 인스턴스(셀프 호스팅 또는 Grafana Cloud)에 붙는 MCP 서버로, Go 로 작성됐다. Grafana API 를 그대로 노출하기보다 대시보드·데이터 소스·알림·인시던트 같은 단위로 도구를 나누고, 데이터 소스별 질의 도구(Prometheus, Loki, Tempo, Pyroscope, Elasticsearch, CloudWatch 등)를 따로 둔다. Grafana 9.0 이상이 필요하다.
**2026-11 기준**: 별 3,678, 최신 릴리스 v2.3.0(2026-11-10), 마지막 푸시 2026-11-18. 라이선스 Apache-2.0.

## 무엇이 들어 있나
| 도구 묶음 (일부) | 하는 일 |
| --- | --- |
| `search_dashboards` · `get_dashboard_summary` · `update_dashboard` | 대시보드 검색·요약·수정 |
| `query_prometheus` · `list_prometheus_metric_names` | PromQL 질의, 지표·레이블 탐색 |
| `query_loki_logs` · `query_loki_patterns` | LogQL 로그 질의, 로그 패턴 요약 |
| `search_tempo_traces` · `get_tempo_trace` | 트레이스 검색·조회 |
| `alerting_rules_read` · `alerting_silences_write` | 알림 규칙 조회, 사일런스 관리 |
| `list_incidents` · `create_incident` · `get_current_oncall_users` | Grafana Incident·OnCall 연동 |
| `get_panel_image` · `generate_deeplink` | 패널 이미지 렌더링, Grafana 화면 링크 생성 |

SQL·CloudWatch·InfluxDB·Graphite·패널 질의 실행 같은 일부 도구는 기본으로 꺼져 있고 `--enabled-tools` 로 켠다.

## 설치·사용법
Grafana 에서 서비스 계정 토큰을 만든 뒤 MCP 클라이언트 설정에 넣는다. README 의 기본 예시는 `uvx` 로 실행한다(Docker 이미지·바이너리·Helm 차트도 있다).

```json
{
  "mcpServers": {
    "grafana": {
      "command": "uvx",
      "args": ["mcp-grafana", "--disable-write"],
      "env": {
        "GRAFANA_URL": "http://localhost:3000",
        "GRAFANA_SERVICE_ACCOUNT_TOKEN": "<서비스 계정 토큰>"
      }
    }
  }
}
```

`--disable-write` 는 대시보드 수정·폴더 생성·인시던트 생성·알림 규칙 변경 같은 쓰기 도구를 등록하지 않는 읽기 전용 모드다. Grafana Cloud 면 `GRAFANA_URL` 을 인스턴스 주소로 바꾼다.

## 언제 쓰나 / 주의
- 쓸 때: "지난 배포 이후 오류율이 오른 서비스"를 에이전트가 지표·로그·트레이스를 오가며 찾게 할 때, 대시보드·알림 규칙을 대화로 정리할 때.
- 보안: 서비스 계정은 Viewer 처럼 필요한 최소 역할로 만들고, 운영 환경에는 `--disable-write` 를 기본으로 둔다. Prometheus·Loki 질의를 특정 레이블 값으로만 허용·차단하는 질의 강제(enforcement) 옵션도 있다.
- 텔레메트리: 도구 호출 횟수 같은 익명 사용 통계를 **기본으로 Grafana Labs 에 보낸다**(질의 내용·자격 증명은 보내지 않는다고 명시). 끄려면 `--usage-stats=disabled` 또는 `DO_NOT_TRACK=1`.
- 질의 결과가 크면 컨텍스트를 빠르게 채운다. 시간 범위와 레이블을 좁혀 묻는다.

## 링크
- [저장소](https://github.com/grafana/mcp-grafana) · [Grafana MCP 문서](https://grafana.com/docs/grafana/latest/developer-resources/mcp/)
- 이 사이트: [Grafana](/develop-wiki/backend/observability/grafana/) · [Prometheus](/develop-wiki/backend/observability/prometheus/) · [Loki](/develop-wiki/backend/observability/loki/) · [Model Context Protocol](/develop-wiki/ai/mcp-tooling/model-context-protocol/)
