---
name: Firebase
url: https://firebase.google.com/
docs: https://firebase.google.com/docs
repo: https://github.com/firebase/firebase-tools
stars: 4489
domain: cloud
category: baas
description: Google 의 앱 개발 플랫폼. Authentication·Cloud Firestore·Cloud Storage·Cloud Functions·Hosting·SQL Connect 를 클라이언트 SDK 로 바로 쓰며, 모바일·웹 앱 백엔드를 서버 없이 만들 때 쓴다.
pricing: freemium
tags: [firebase, google, baas, firestore, auth, hosting, mobile]
languages: [typescript, kotlin, swift, dart]
koreanDocs: true
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Firebase 는 Google Cloud 프로젝트 위에서 인증, 문서형 실시간 DB(Cloud Firestore), 파일 저장, 서버리스 함수, 웹 호스팅, 푸시 알림·분석·Crashlytics 같은 앱 운영 도구를 제공하는 BaaS 다. 클라이언트가 SDK 로 DB 에 직접 접근하고, 권한은 **Security Rules** 로 서버 측에서 검사한다. 관계형 데이터가 필요하면 Cloud SQL for PostgreSQL 기반의 **SQL Connect**(2026-04 Data Connect 에서 이름 변경)를 쓴다. 모바일(Android·iOS·Flutter) 지원과 오프라인 캐시가 강점이다.

## 설치
```bash
npm install firebase                 # 웹 SDK (2026-11 기준 v13 계열, 모듈식 API)
npm install -g firebase-tools        # CLI (Node.js 18+)
firebase login
firebase init                        # 사용할 제품 선택 → firebase.json, .firebaserc 생성
firebase init emulators              # 로컬 에뮬레이터 구성
```

## 핵심 제품
| 제품 | 설명 |
| --- | --- |
| Authentication | 이메일·전화·OAuth(Google, Apple 등)·익명 로그인 |
| Cloud Firestore | 컬렉션/문서 구조 NoSQL. 실시간 리스너·오프라인 캐시 |
| Realtime Database | 초기 JSON 트리형 실시간 DB. 새 프로젝트는 보통 Firestore |
| Cloud Storage | 이미지·파일 업로드. Security Rules 로 접근 제어 |
| Cloud Functions | DB·Auth·HTTP 이벤트로 실행되는 서버 코드 |
| Hosting / App Hosting | 정적·SPA 호스팅 / Next.js·Angular 등 SSR 앱 호스팅 |
| SQL Connect | GraphQL 스키마로 Cloud SQL(PostgreSQL)을 다루는 관계형 백엔드 |
| App Check | 정상 앱에서 온 요청만 백엔드에 접근하도록 검증 |
| Firebase AI Logic | 앱에서 Gemini 등 생성형 모델 호출 |

## 기본 사용법
```ts
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, collection, addDoc, getDocs, query, where } from "firebase/firestore";

// 웹 config 의 apiKey 는 프로젝트 식별용이라 비밀이 아니다 — 보호는 Security Rules·App Check 가 담당
const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
});
const auth = getAuth(app);
const db = getFirestore(app);

const { user } = await signInAnonymously(auth);
await addDoc(collection(db, "todos"), { uid: user.uid, title: "백과사전 쓰기", done: false });
const snap = await getDocs(query(collection(db, "todos"), where("uid", "==", user.uid)));
snap.forEach((d) => console.log(d.id, d.data()));
```
```js
// firestore.rules — 자기 문서만 읽고 쓰기
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /todos/{id} {
      allow read, update, delete: if request.auth != null && resource.data.uid == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.uid == request.auth.uid;
    }
  }
}
```

## 자주 쓰는 패턴
- **에뮬레이터로 개발·테스트**: `firebase emulators:start` 로 Auth·Firestore·Functions 를 로컬에서 띄우고 앱은 `connectFirestoreEmulator` 등으로 연결. Security Rules 단위 테스트도 에뮬레이터에서.
- **부분 배포**: `firebase deploy --only hosting,firestore:rules` 처럼 필요한 대상만 배포.
- **서버 전용 로직**: 결제 검증·관리자 작업은 Cloud Functions 나 Admin SDK 를 쓰는 서버에서 처리.
- **쿼리 설계**: Firestore 는 조인이 없으므로 화면 단위로 데이터를 비정규화하고, 복합 쿼리는 인덱스를 만든다.
- **App Check 적용**: 웹 config 가 공개돼 있으므로 남용 방지를 위해 App Check 를 켠다.

## 언제 쓰나 / 피할 때
- 쓸 때: 모바일·웹 앱의 인증·실시간 데이터·푸시를 빠르게 붙일 때, 오프라인 동기화가 중요한 앱, [Google Cloud](/develop-wiki/cloud/hyperscaler/google-cloud/)와 함께 쓸 때.
- 피할 때(대안): 복잡한 관계형 쿼리·SQL 이 중심이면 [Supabase](/develop-wiki/cloud/baas/supabase/)(또는 SQL Connect), 오픈소스·셀프 호스팅이 필수면 [Appwrite](/develop-wiki/cloud/baas/appwrite/)·[PocketBase](/develop-wiki/cloud/baas/pocketbase/). 문서 읽기·쓰기 횟수 기반 과금이라 설계에 따라 비용이 커질 수 있다.
- 요금: 무료 Spark 플랜과 종량제 Blaze 플랜. 한도는 [가격 페이지](https://firebase.google.com/pricing)에서 확인한다. Extensions 는 deprecated 됐고 2027-03-31 서비스가 종료된다(이미 설치한 확장은 계속 실행되지만 관리 기능은 사라진다).

## 공식 문서
- [문서 홈](https://firebase.google.com/docs) · [웹 시작하기](https://firebase.google.com/docs/web/setup) · [CLI](https://firebase.google.com/docs/cli) · [Firestore 빠른 시작](https://firebase.google.com/docs/firestore/quickstart) · [Emulator Suite](https://firebase.google.com/docs/emulator-suite) · [SQL Connect](https://firebase.google.com/docs/sql-connect) · [한국어 문서](https://firebase.google.com/docs?hl=ko)
