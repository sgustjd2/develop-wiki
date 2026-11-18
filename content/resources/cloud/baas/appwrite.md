---
name: Appwrite
url: https://appwrite.io/
docs: https://appwrite.io/docs
repo: https://github.com/appwrite/appwrite
stars: 58171
domain: cloud
category: baas
description: Docker 로 셀프 호스팅하거나 Appwrite Cloud 로 쓰는 오픈소스 BaaS. Auth·Databases(TablesDB 등)·Storage·Functions·Messaging·Realtime·Sites 를 여러 언어 SDK 로 제공한다.
pricing: oss
tags: [appwrite, baas, self-hosted, auth, database, functions]
languages: [typescript, dart, swift, kotlin, python]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Appwrite 는 인증·데이터베이스·파일 저장·서버리스 함수·메시징(이메일·SMS·푸시)·실시간 구독·웹 호스팅(Sites)을 하나의 서버로 묶은 BaaS 다. Docker Compose 로 자체 서버에 설치하거나 관리형 Appwrite Cloud 를 쓸 수 있고, 저장소는 BSD-3-Clause 다. 데이터베이스 제품은 2026-11 기준 **TablesDB**(타입 있는 컬럼·행·관계·인덱스), **DocumentsDB**(스키마 없는 JSON 문서), **VectorsDB** 세 가지로 나뉜다. 2026-11 기준 최신 릴리스는 2.7.3.

## 설치
```bash
# 셀프 호스팅 (최소 2 CPU, 4GB RAM, 2GB 스왑, Docker Compose v2)
docker run -it --rm \
  --publish 20080:20080 \
  --volume /var/run/docker.sock:/var/run/docker.sock \
  --volume "$(pwd)"/appwrite:/usr/src/code/appwrite:rw \
  --entrypoint="install" \
  appwrite/appwrite:2.7.2      # 설치 문서에 표시된 태그 — 최신 태그는 문서에서 확인

# 웹 SDK
npm install appwrite
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Project | 앱 단위. 플랫폼(웹 도메인·앱 번들 ID)을 등록해야 클라이언트 요청 허용 |
| Account / Users | 클라이언트 측 로그인 세션 / 서버 측 사용자 관리 |
| TablesDB | 데이터베이스 → 테이블 → 행. 타입 있는 컬럼과 관계·인덱스 |
| DocumentsDB | 스키마 없는 JSON 문서 저장. 컬렉션·문서 단위 |
| Permissions | 테이블·행(문서) 단위 읽기/쓰기 권한을 역할(`any`, `users`, `user:<id>`, 팀)로 지정 |
| Storage | 버킷 단위 파일 저장, 이미지 미리보기 변환 |
| Functions | 여러 런타임의 서버리스 함수. 이벤트·스케줄·HTTP 트리거 |
| API Key | 서버 SDK 용 비밀 키. 스코프를 최소로 발급 |

## 기본 사용법
```ts
import { Client, Account, TablesDB, ID, Query } from "appwrite";

const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)   // 예: https://<REGION>.cloud.appwrite.io/v1
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

const account = new Account(client);
const tablesDB = new TablesDB(client);

await account.createEmailPasswordSession({
  email: import.meta.env.VITE_TEST_EMAIL,
  password: import.meta.env.VITE_TEST_PASSWORD,
});

await tablesDB.createRow({
  databaseId: "main", tableId: "todos", rowId: ID.unique(),
  data: { title: "백과사전 쓰기", done: false },
});
const { rows } = await tablesDB.listRows({
  databaseId: "main", tableId: "todos", queries: [Query.equal("done", false)],
});
```
`listRows` 는 기본으로 처음 25개를 돌려주므로 페이지네이션 쿼리(`Query.limit`, `Query.cursorAfter`)를 함께 쓴다.

## 자주 쓰는 패턴
- **권한은 행 단위로**: 사용자별 데이터는 생성 시 `user:<id>` 권한만 부여해 다른 사용자의 접근을 막는다.
- **서버 로직은 Functions 로**: 결제 웹훅·관리 작업은 API 키를 쓰는 Function 에서 처리하고 클라이언트에는 키를 두지 않는다.
- **CLI 로 설정 코드화**: Appwrite CLI 로 테이블·함수 설정을 파일로 관리해 환경 간 복제.
- **Realtime**: 행·파일 변경 채널을 구독해 목록을 실시간 갱신.
- **셀프 호스팅 업그레이드**: 버전 업그레이드 시 공식 업그레이드 절차·마이그레이션을 따르고 볼륨을 먼저 백업.

## 언제 쓰나 / 피할 때
- 쓸 때: 오픈소스 BaaS 를 자체 인프라에 올려야 할 때, Flutter·Swift·Kotlin 등 여러 클라이언트 SDK 가 필요한 앱, 메시징·호스팅까지 한 제품으로 묶고 싶을 때.
- 피할 때(대안): SQL·Postgres 확장을 직접 쓰고 싶다면 [Supabase](/develop-wiki/cloud/baas/supabase/), 아주 작은 서비스를 단일 바이너리로 운영하려면 [PocketBase](/develop-wiki/cloud/baas/pocketbase/), Google 생태계·오프라인 동기화가 우선이면 [Firebase](/develop-wiki/cloud/baas/firebase/). 셀프 호스팅은 여러 컨테이너를 운영해야 하므로 백업·업그레이드 부담이 있다.
- 요금: 셀프 호스팅은 무료(오픈소스), Appwrite Cloud 는 무료·유료 플랜. [가격 페이지](https://appwrite.io/pricing)에서 확인한다.

## 공식 문서
- [문서 홈](https://appwrite.io/docs) · [웹 빠른 시작](https://appwrite.io/docs/quick-starts/web) · [Databases](https://appwrite.io/docs/products/databases) · [Rows](https://appwrite.io/docs/products/databases/rows) · [셀프 호스팅 설치](https://appwrite.io/docs/advanced/self-hosting/installation)
