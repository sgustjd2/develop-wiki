---
name: mitmproxy
url: https://mitmproxy.org
docs: https://docs.mitmproxy.org/stable/
repo: https://github.com/mitmproxy/mitmproxy
stars: 47139
domain: devtools
category: api-client
description: HTTP(S) 트래픽을 가로채 보고 수정·재전송하는 대화형 프록시. 모바일 앱·브라우저의 API 통신을 디버깅하거나 Python 애드온으로 요청을 조작할 때 쓴다.
pricing: oss
tags: [proxy, https, debugging, traffic, charles-alternative]
languages: [python]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
mitmproxy는 클라이언트와 서버 사이에 끼어드는 프록시로, 자체 CA 인증서를 설치한 기기의 HTTPS 트래픽을 복호화해 보여 준다. 터미널 UI(`mitmproxy`), 웹 UI(`mitmweb`), 비대화형 덤프(`mitmdump`) 세 가지 인터페이스가 있고, Python 애드온으로 요청·응답을 자동 수정한다. 이 문서는 **12.3** 기준(2026-10 최신 v12.3.1, MIT).

- 대안: **Charles Proxy**(유료 GUI 앱, macOS·Windows·Linux), Proxyman(macOS), 브라우저만이면 개발자 도구 Network 탭.

## 설치
```bash
brew install --cask mitmproxy    # 또는 pipx install mitmproxy
mitmweb                          # 기본 프록시 포트 8080, 웹 UI 8081
```
클라이언트(브라우저·휴대폰)의 프록시를 `<PC IP>:8080`으로 설정하고 `http://mitm.it`에서 CA 인증서를 받아 신뢰 목록에 추가한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| flow | 요청 + 응답 한 쌍. 필터·편집·재전송 단위 |
| CA 인증서 | `~/.mitmproxy/`에 생성. 클라이언트가 신뢰해야 HTTPS 복호화 |
| 모드 | regular(명시적 프록시), transparent, reverse, upstream, WireGuard, local(특정 앱 캡처) |
| 필터 식 | `~d example.com`(도메인), `~m POST`, `~c 500`, `~u /api/` |
| intercept | 조건에 맞는 flow를 멈추고 수정 후 진행 |
| 애드온 | `request`, `response` 같은 이벤트 훅을 가진 Python 스크립트 |

## 기본 사용법
응답 헤더를 추가하고 특정 API를 가짜 응답으로 바꾸는 애드온 `addon.py`:

```python
import json
from mitmproxy import http

def response(flow: http.HTTPFlow) -> None:
    if flow.request.pretty_host.endswith("example.com"):
        flow.response.headers["x-debug"] = "mitm"

def request(flow: http.HTTPFlow) -> None:
    if flow.request.path.startswith("/api/feature-flags"):
        flow.response = http.Response.make(
            200, json.dumps({"newCheckout": True}),
            {"Content-Type": "application/json"},
        )
```

```bash
mitmdump -s addon.py                          # 애드온 적용해 실행
mitmproxy --mode reverse:http://localhost:3000 -p 8080   # 리버스 프록시로 로컬 앱 앞에
mitmdump -w traffic.flows                     # 트래픽 저장
mitmproxy -r traffic.flows                    # 저장한 트래픽 열기
```

## 자주 쓰는 패턴
- **모바일 앱 디버깅.** 휴대폰 Wi-Fi 프록시를 PC로 지정하고 인증서 설치. 인증서 고정(pinning)을 쓰는 앱은 복호화되지 않는다.
- **재전송.** 웹 UI에서 flow를 골라 Replay해 서버 수정 후 같은 요청으로 확인.
- **오류 재현.** 애드온으로 지연(`time.sleep`)·5xx 응답을 주입해 클라이언트 오류 처리 확인.
- **HAR 내보내기.** 저장한 flow를 HAR로 내보내 공유(민감 정보 제거 후).

## 언제 쓰나 / 피할 때
- 쓸 때: 브라우저 밖(앱·CLI·서버 간) HTTP 통신 확인, 요청 자동 변조 테스트.
- 피할 때(대안): 단순 요청 전송은 [curl](/develop-wiki/devtools/api-client/curl/). GUI 위주로 팀이 익숙하면 Charles·Proxyman. 가로챈 트래픽에는 토큰·개인정보가 들어 있으니 저장·공유에 주의한다.

## 공식 문서
- [문서](https://docs.mitmproxy.org/stable/) · [인증서](https://docs.mitmproxy.org/stable/concepts/certificates/) · [애드온 예제](https://docs.mitmproxy.org/stable/addons/examples/)
- [Charles Proxy](https://www.charlesproxy.com/documentation/)
