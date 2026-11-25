---
name: Caddy
url: https://caddyserver.com
docs: https://caddyserver.com/docs/
repo: https://github.com/caddyserver/caddy
stars: 79534
domain: backend
category: infra-devops
description: Go 로 작성된 웹 서버·리버스 프록시로, 도메인만 적으면 HTTPS 인증서를 자동 발급·갱신한다. 짧은 설정으로 TLS 가 붙은 프록시나 정적 사이트를 띄울 때 쓴다.
pricing: oss
tags: [web-server, reverse-proxy, https, tls, acme, caddyfile]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Caddy 는 단일 Go 바이너리로 동작하는 웹 서버이자 리버스 프록시다. 가장 큰 특징은 **자동 HTTPS**: 설정에 공개 도메인을 적으면 Let's Encrypt·ZeroSSL 같은 ACME CA 에서 인증서를 받아 갱신까지 처리하고, HTTP→HTTPS 리디렉트도 기본으로 켠다. `localhost` 같은 내부 이름에는 자체 로컬 CA 로 인증서를 발급한다. 설정은 사람이 쓰기 쉬운 **Caddyfile** 또는 내부 표준 형식인 **JSON** 으로 하며, 실행 중에 관리 API(`localhost:2019`)로 설정을 무중단 교체할 수 있다. HTTP/1.1·HTTP/2·HTTP/3 를 기본 지원한다.

라이선스 Apache-2.0. 2026-11 기준 최신 릴리스는 v2.11.9(2026-11-05). 설정 문법이 짧은 대신, 대규모 트래픽 튜닝 자료와 운영 사례는 [NGINX](/develop-wiki/backend/infra-devops/nginx/) 쪽이 많다. 컨테이너 라벨 기반 동적 라우팅이 필요하면 [Traefik](/develop-wiki/backend/infra-devops/traefik/) 이 대안이다.

## 설치
```bash
brew install caddy                 # macOS
sudo apt install caddy             # Debian/Ubuntu (공식 Cloudsmith 저장소 등록 후)
docker run -p 80:80 -p 443:443 -v $PWD/Caddyfile:/etc/caddy/Caddyfile caddy:2

caddy version
```
플러그인(DNS 챌린지 provider 등)이 필요하면 `xcaddy build --with <모듈>` 로 커스텀 바이너리를 빌드하거나 공식 다운로드 페이지에서 모듈을 골라 받는다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Caddyfile | 사이트 주소 블록 + 디렉티브로 구성된 설정 파일. 내부적으로 JSON 으로 변환(adapt)된다 |
| 사이트 주소 | `example.com`, `:8080`, `localhost` 등. 도메인이면 자동 HTTPS 대상 |
| 디렉티브 | `reverse_proxy`, `file_server`, `encode`, `handle`, `route`, `header`, `redir` 등 |
| Matcher | `@api path /api/*` 처럼 요청 조건에 이름을 붙여 디렉티브에 적용 |
| 자동 HTTPS | ACME 로 인증서 발급·갱신, On-Demand TLS(요청 시 발급)도 지원 |
| Admin API | `:2019` 의 REST API. `caddy reload` 가 이 API 로 설정을 교체 |
| 모듈 | Caddy 는 모듈 구조라 플러그인을 컴파일해 넣어 기능을 확장 |

## 기본 사용법
`Caddyfile`:
```caddyfile
example.com {
	encode zstd gzip
	handle /api/* {
		reverse_proxy app1:3000 app2:3000 {
			lb_policy round_robin
			health_uri /healthz
		}
	}
	handle {
		root * /srv/www
		try_files {path} /index.html
		file_server
	}
}
```
```bash
caddy run                    # 현재 디렉터리의 Caddyfile 로 포그라운드 실행
caddy reload                 # 설정 무중단 교체
caddy fmt --overwrite        # Caddyfile 포맷 정리
caddy adapt --config Caddyfile --pretty   # JSON 으로 변환해 확인
```
한 줄 명령도 있다: `caddy reverse-proxy --from example.com --to localhost:3000`, `caddy file-server --browse`.

## 자주 쓰는 패턴
- **SPA 배포**: `try_files {path} /index.html` + `file_server` 로 클라이언트 라우팅을 처리한다.
- **로컬 HTTPS 개발**: `localhost { reverse_proxy :5173 }` 처럼 쓰면 로컬 CA 인증서로 HTTPS 개발 환경이 생긴다(`caddy trust` 로 루트 인증서 설치).
- **와일드카드 인증서**: `*.example.com` 은 DNS-01 챌린지가 필요하므로 DNS provider 모듈을 넣어 빌드한다.
- **보안 헤더·압축**: `header` 로 HSTS·CSP 를 넣고 `encode zstd gzip` 으로 응답 압축.
- **Docker Compose**: `caddy_data` 볼륨(인증서 저장 위치)을 반드시 영속화해야 재시작 때 재발급 한도에 걸리지 않는다.

## 언제 쓰나 / 피할 때
- 쓸 때: 소규모~중규모 서비스에 TLS 가 붙은 리버스 프록시를 빠르게 세울 때, 인증서 갱신 작업을 없애고 싶을 때, 멀티테넌트 SaaS 의 커스텀 도메인 TLS(On-Demand TLS).
- 피할 때(대안): 기존 NGINX 설정·모듈 자산이 많거나 세밀한 성능 튜닝 사례가 필요하면 [NGINX](/develop-wiki/backend/infra-devops/nginx/). Docker·Kubernetes 에서 서비스 발견으로 라우팅을 자동 구성하려면 [Traefik](/develop-wiki/backend/infra-devops/traefik/). Kubernetes 인그레스는 해당 컨트롤러 생태계를 우선 검토한다.

## 공식 문서
- [문서 홈](https://caddyserver.com/docs/) · [설치](https://caddyserver.com/docs/install) · [Caddyfile](https://caddyserver.com/docs/caddyfile) · [자동 HTTPS](https://caddyserver.com/docs/automatic-https) · [GitHub 릴리스](https://github.com/caddyserver/caddy/releases)
