---
name: Google Play Developer API
url: https://developers.google.com/android-publisher
docs: https://developers.google.com/android-publisher/getting_started
domain: mobile
category: mobile-backend
description: Google Play 앱 릴리스 업로드, 트랙 배포, 스토어 등록정보, 리뷰 답변, 구매·구독 검증을 REST로 자동화하는 공식 API(androidpublisher v3). 서비스 계정으로 CI와 백엔드에서 호출한다.
pricing: free
tags: [google-play, ci, release-automation, subscription-verification, rest-api]
languages: []
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Google Play Developer API(`androidpublisher`)는 Play Console에서 하는 배포·운영 작업과, 서버에서 하는 결제 검증을 프로그램으로 수행하게 한다. 크게 두 영역이다.

- **퍼블리싱**: 편집(edit) 세션을 열어 빌드를 올리고 트랙(내부 테스트·비공개·공개·프로덕션)에 배정한 뒤 커밋해 반영한다. 스토어 등록정보 수정도 같은 세션에서 한다.
- **결제·구독**: 구매 토큰으로 구매와 구독 상태를 조회·승인·취소하고, 리뷰 답변 API·무효화된 구매(Voided Purchases) API를 쓴다.

사용에 별도 비용은 없다. iOS 대응은 [App Store Connect API](/develop-wiki/mobile/mobile-backend/app-store-connect-api/), 클라이언트 결제는 [Google Play Billing Library](/develop-wiki/mobile/mobile-backend/google-play-billing/)다. [Fastlane](/develop-wiki/mobile/mobile-testing/fastlane/)의 `supply`가 이 API를 감싼다.

## 설치
1. Google Cloud 프로젝트를 만들고(또는 재사용) **Google Play Android Developer API**를 활성화한다.
2. **서비스 계정**을 만들어 JSON 키를 받는다(키는 CI 시크릿으로 보관).
3. Play Console의 **사용자 및 권한**에서 서비스 계정 이메일을 초대하고 권한을 준다. 결제 API용으로는 주문·구독 관리, 재무 데이터 조회 권한이 필요하다.

공식 문서상 개발자 계정을 Cloud 프로젝트에 연결하는 절차는 더 이상 필요하지 않다고 안내한다. 클라이언트 라이브러리는 Google API 클라이언트(Java, Python, Node.js 등)를 쓴다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Edit | 배포 상태를 복사한 변경 세션. `insert`로 열고 `commit`으로 확정 |
| 한 번에 하나 | 사용자당 열린 edit는 하나. 다른 변경이 생기면 기존 edit가 무효화됨 |
| Track | `internal`, `alpha`, `beta`, `production` 등 릴리스 경로 |
| `edits.bundles` / `edits.apks` | AAB·APK 업로드 |
| `edits.tracks` | 트랙에 버전 코드를 배정, 단계적 출시 비율 설정 |
| `purchases.products` / `purchases.subscriptionsv2` | 구매·구독 조회와 승인 |
| RTDN | 실시간 개발자 알림(Pub/Sub)으로 구독 이벤트 수신 |
| inappproducts·subscriptions | edit를 쓰지 않고 즉시 반영되는 리소스(공식 문서 기준) |

## 기본 사용법
서비스 계정으로 AAB를 올려 내부 테스트 트랙에 배포한다(Python, `pip install google-api-python-client google-auth`):

```python
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

PKG = "com.example.app"
creds = service_account.Credentials.from_service_account_file(
    "play-service-account.json",
    scopes=["https://www.googleapis.com/auth/androidpublisher"],
)
svc = build("androidpublisher", "v3", credentials=creds)

edit = svc.edits().insert(packageName=PKG, body={}).execute()
bundle = svc.edits().bundles().upload(
    packageName=PKG, editId=edit["id"],
    media_body=MediaFileUpload("app-release.aab", mimetype="application/octet-stream"),
).execute()
svc.edits().tracks().update(
    packageName=PKG, editId=edit["id"], track="internal",
    body={"releases": [{"versionCodes": [str(bundle["versionCode"])], "status": "completed"}]},
).execute()
svc.edits().commit(packageName=PKG, editId=edit["id"]).execute()
```
JSON 파일 경로와 패키지 이름은 예시이며, 서비스 계정에 앱 권한을 부여한 뒤에 동작한다.

## 자주 쓰는 패턴
- **CI 배포**: 태그 푸시 시 AAB를 빌드·서명하고 내부 트랙으로 올린 뒤 수동 승격한다.
- **단계적 출시**: 트랙 릴리스에 `status: inProgress`와 `userFraction`을 지정해 일부 사용자에게 먼저 배포한다.
- **구독 검증**: 앱이 보낸 구매 토큰을 서버에서 `purchases.subscriptionsv2.get`으로 확인하고 권한을 부여한다. 구매 승인(acknowledge)도 서버에서 수행할 수 있다.
- **알림 기반 동기화**: RTDN을 Pub/Sub로 받아 갱신·취소·유예 상태를 DB에 반영한다.
- **리뷰 응대**: 리뷰 답변 API로 별점 낮은 리뷰에 템플릿 답변을 자동화한다.
- **주의**: 정책 위반으로 거절되는 항목(타깃 API 레벨, 데이터 보안 양식 등)은 API로 우회할 수 없다([Google Play 정책](/develop-wiki/mobile/learning/google-play-developer-policy/)).

## 언제 쓰나 / 피할 때
- 쓸 때: 릴리스 자동화, 여러 앱 일괄 관리, 서버 측 구독 검증.
- 피할 때(대안): 단발 수동 배포(Play Console), 배포 로직 직접 구현이 부담이면 Fastlane `supply`나 CI 플러그인 사용.

## 공식 문서
- [개요](https://developers.google.com/android-publisher) · [시작하기](https://developers.google.com/android-publisher/getting_started) · [Edits 워크플로](https://developers.google.com/android-publisher/edits)
