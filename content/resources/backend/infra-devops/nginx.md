---
name: nginx
url: https://nginx.org
docs: https://nginx.org/en/docs/
repo: https://github.com/nginx/nginx
stars: 32849
domain: backend
category: infra-devops
description: 이벤트 기반 웹 서버이자 리버스 프록시·로드밸런서. 정적 파일 서빙, TLS 종료, 앱 서버 앞단 프록시에 쓴다. 자동 HTTPS 가 필요하면 Caddy 가 대안이다.
pricing: oss
tags: [web-server, reverse-proxy, load-balancer, tls, caddy]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
nginx 는 비동기 이벤트 루프로 많은 동시 연결을 적은 메모리로 처리하는 웹 서버다. 백엔드에서는 주로 애플리케이션 서버(Node.js, Gunicorn/Uvicorn, Spring 등) 앞에 두는 **리버스 프록시**로 쓰며 TLS 종료, 정적 파일 서빙, 로드밸런싱, 압축, 요청 제한을 맡긴다. 라이선스는 BSD-2-Clause, 개발은 F5 가 주도하고 소스 저장소는 GitHub(nginx/nginx)로 옮겨졌다. 상용 확장판 NGINX Plus 는 별도 유료 제품이다.

버전은 두 갈래다(2026-11 기준). 홀수 마이너인 **mainline 1.31.x**(최신 1.31.8, 새 기능)와 짝수 마이너인 **stable 1.30.x**(최신 1.30.6, 버그·보안 수정만).

Kubernetes 참고: 커뮤니티 프로젝트 **ingress-nginx** 컨트롤러는 2026-03 에 지원이 끝나 저장소가 archived 됐다. 이후 보안 패치가 없으므로 새 구성은 Gateway API 구현체나 다른 인그레스 컨트롤러를 검토한다(F5 의 NGINX Ingress Controller 는 별개 프로젝트).

## 설치
```bash
# Debian/Ubuntu 배포판 패키지 (최신 버전이 필요하면 nginx.org 공식 저장소 사용)
sudo apt install nginx
sudo nginx -t                 # 설정 문법 검사
sudo systemctl reload nginx   # 무중단 설정 재적용

# Docker
docker run -d -p 8080:80 -v "$PWD/default.conf:/etc/nginx/conf.d/default.conf:ro" nginx:1.30
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| master / worker | master 가 설정을 읽고 worker 프로세스들이 연결을 처리. `reload` 는 새 worker 로 교체 |
| context | `http` → `server` → `location` 계층. 지시어는 상위에서 상속 |
| `server` 블록 | `listen` 포트와 `server_name`(도메인)으로 가상 호스트 구분 |
| `location` | 경로 매칭(접두사, `=` 정확히, `~` 정규식)별 처리 규칙 |
| `proxy_pass` | 요청을 백엔드로 전달. `upstream` 블록으로 여러 서버에 분산 |
| `root` / `try_files` | 정적 파일 경로, 파일이 없을 때의 대체 경로(SPA 등) |
| 변수 | `$host`, `$remote_addr`, `$request_uri` 등 요청 정보 |

## 기본 사용법
API 서버 두 대 앞에 두는 리버스 프록시 + TLS 구성.
```nginx
upstream todo_api {
    server 10.0.0.11:3000;
    server 10.0.0.12:3000;
    keepalive 32;
}

server {
    listen 443 ssl;
    http2 on;
    server_name api.example.com;
    ssl_certificate     /etc/ssl/api/fullchain.pem;
    ssl_certificate_key /etc/ssl/api/privkey.pem;

    location / {
        proxy_pass http://todo_api;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name api.example.com;
    return 301 https://$host$request_uri;
}
```

## 자주 쓰는 패턴
- **SPA 정적 배포**: `root /var/www/app; location / { try_files $uri /index.html; }`
- **WebSocket 프록시**: `proxy_set_header Upgrade $http_upgrade;` 와 `proxy_set_header Connection "upgrade";` 를 추가한다.
- **요청 제한**: `limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;` + `location` 에서 `limit_req zone=api burst=20;`
- **업로드 크기**: 기본 `client_max_body_size` 는 1m 이라 파일 업로드 API 는 값을 늘려야 한다(413 오류 원인).
- **인증서 갱신**: certbot 등 ACME 클라이언트로 발급·갱신하고 `nginx -s reload`.
- **관측성**: `stub_status` 로 연결 수를 노출하고, 접근 로그를 JSON 형식으로 남겨 로그 수집기로 보낸다.

## Caddy (대안)
[Caddy](https://caddyserver.com/)(Go, Apache-2.0, 2026-11 기준 v2.11.9)는 도메인만 적으면 Let's Encrypt/ZeroSSL 인증서를 자동 발급·갱신하는 웹 서버다. 설정이 짧아 소규모 서비스나 사내 도구 앞단에 많이 쓴다.
```text
# Caddyfile
api.example.com {
    reverse_proxy 10.0.0.11:3000 10.0.0.12:3000
}
```

## 언제 쓰나 / 피할 때
- 쓸 때: 앱 서버 앞단의 TLS 종료·정적 파일·로드밸런싱, 세밀한 캐싱·요청 제한이 필요할 때, 오래 검증된 설정 예와 운영 자료가 많은 도구가 필요할 때.
- 피할 때(대안): 자동 HTTPS 와 짧은 설정이 우선이면 Caddy. 서비스 디스커버리·동적 설정이 중요한 컨테이너 환경이면 Traefik·Envoy. 클라우드 로드밸런서(ALB 등)가 이미 TLS 를 처리하면 별도 프록시가 필요 없을 수 있다.

## 공식 문서
- [문서 홈](https://nginx.org/en/docs/) · [초보자 가이드](https://nginx.org/en/docs/beginners_guide.html) · [지시어 목록](https://nginx.org/en/docs/dirindex.html) · [proxy 모듈](https://nginx.org/en/docs/http/ngx_http_proxy_module.html) · [리눅스 패키지](https://nginx.org/en/linux_packages.html) · [Caddy 문서](https://caddyserver.com/docs/)
