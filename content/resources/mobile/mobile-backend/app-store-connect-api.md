---
name: App Store Connect API
url: https://developer.apple.com/app-store-connect/api/
docs: https://developer.apple.com/documentation/appstoreconnectapi
domain: mobile
category: mobile-backend
description: App Store Connect의 앱·빌드·TestFlight·심사 제출·판매 리포트를 REST로 자동화하는 Apple 공식 API. JWT(ES256)로 인증하며 CI에서 배포 작업을 스크립트화할 때 쓴다.
pricing: free
tags: [app-store-connect, ci, testflight, release-automation, rest-api]
languages: []
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
App Store Connect API는 웹 콘솔에서 하던 일을 REST(JSON:API 형식)로 수행하게 해 준다. 앱 메타데이터·스크린샷, 빌드와 TestFlight 테스터·그룹, 심사 제출, 인앱 상품과 구독 설정, 사용자·기기·인증서·프로비저닝, 판매·분석 리포트가 대상이다. [Fastlane](/develop-wiki/mobile/mobile-testing/fastlane/)과 Xcode Cloud, 대부분의 모바일 CI가 내부적으로 이 API를 사용한다.

- 사용에 추가 비용은 없고 Apple Developer Program 계정이 필요하다.
- 엔드포인트 목록과 필드는 자주 늘어나므로, 쓰기 전에 공식 문서의 OpenAPI 명세를 확인한다.
- 구매 영수증·구독 이벤트는 이 API가 아니라 **App Store Server API**를 쓴다([StoreKit 2](/develop-wiki/mobile/mobile-backend/storekit-2/)).

## 설치
설치할 것은 없다. App Store Connect의 **사용자 및 액세스 → 통합 → App Store Connect API**에서 키를 만든다(키 생성은 계정 홀더·관리자 권한). 발급되는 항목은 **Issuer ID**, **Key ID**, 한 번만 내려받을 수 있는 `.p8` 개인 키이다. 키는 저장소에 커밋하지 말고 CI 시크릿에 둔다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Issuer ID / Key ID / `.p8` | 토큰 서명에 쓰는 자격 증명 |
| JWT | `ES256`으로 서명한 짧은 수명 토큰. 헤더 `kid`, 클레임 `iss`·`iat`·`exp`·`aud` |
| `Authorization: Bearer` | 요청마다 JWT를 실어 보냄 |
| Base URL | `https://api.appstoreconnect.apple.com/v1/` (일부 리소스는 v2) |
| 리소스 | `apps`, `builds`, `betaGroups`, `betaTesters`, `appStoreVersions`, `reviewSubmissions` 등 |
| 필터·include | `filter[...]`, `include`, `limit`으로 조회 범위 제어, `links.next`로 페이지 이동 |
| 키 역할 | 키마다 Admin·App Manager 등 권한 범위 지정 |

## 기본 사용법
토큰 생성과 앱 목록 조회(Python, `pip install pyjwt cryptography requests`):

```python
import time, jwt, requests

KEY_ID, ISSUER_ID = "ABC123DEFG", "00000000-0000-0000-0000-000000000000"
private_key = open("AuthKey_ABC123DEFG.p8").read()

now = int(time.time())
token = jwt.encode(
    {"iss": ISSUER_ID, "iat": now, "exp": now + 15 * 60, "aud": "appstoreconnect-v1"},
    private_key, algorithm="ES256", headers={"kid": KEY_ID, "typ": "JWT"},
)
r = requests.get("https://api.appstoreconnect.apple.com/v1/apps",
                 headers={"Authorization": f"Bearer {token}"}, params={"limit": 5})
for app in r.json()["data"]:
    print(app["id"], app["attributes"]["name"])
```
토큰 유효 시간은 최대 20분으로 알려져 있어 15분으로 잡았다(공식 문서에서 재확인할 것).

## 자주 쓰는 패턴
- **빌드 처리 대기**: 업로드 후 `builds`의 `processingState`가 `VALID`가 될 때까지 폴링하고 TestFlight 그룹에 배포한다.
- **테스터 관리**: `betaTesters`·`betaGroups`로 초대·제거를 스크립트화한다.
- **심사 제출 자동화**: `appStoreVersions`에 빌드를 연결하고 `reviewSubmissions`로 제출한다. 심사 거절 사유는 가이드라인 기준으로 대응한다([App Store 심사 가이드라인](/develop-wiki/mobile/learning/app-store-review-guidelines/)).
- **리포트 수집**: 판매·분석 리포트를 정기 다운로드해 데이터 웨어하우스에 적재한다.
- **CI 시크릿 처리**: `.p8`는 CI의 암호화 변수로 주입하고 토큰은 실행마다 새로 만든다(Fastlane은 `app_store_connect_api_key` 액션 사용).
- **Android 대응**: Google Play는 [Google Play Developer API](/develop-wiki/mobile/mobile-backend/google-play-developer-api/).

## 언제 쓰나 / 피할 때
- 쓸 때: 배포·TestFlight·메타데이터 갱신을 CI로 자동화하거나 여러 앱을 일괄 관리할 때.
- 피할 때(대안): 단발성 수동 작업(웹 콘솔), 복잡한 상태를 직접 구현하기 싫다면 Fastlane·Xcode Cloud 같은 상위 도구.

## 공식 문서
- [API 문서](https://developer.apple.com/documentation/appstoreconnectapi) · [토큰 생성](https://developer.apple.com/documentation/appstoreconnectapi/generating-tokens-for-api-requests) · [API 개요](https://developer.apple.com/app-store-connect/api/)
