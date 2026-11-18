---
name: PocketBase
url: https://pocketbase.io/
docs: https://pocketbase.io/docs/
repo: https://ganigeorgiev.com/pocketbase/pocketbase
domain: cloud
category: baas
description: SQLite 내장 DB·인증·파일·실시간 구독·관리자 UI 를 Go 단일 실행 파일에 담은 오픈소스 백엔드. 작은 서비스·사이드 프로젝트·사내 도구의 백엔드를 서버 한 대로 운영할 때 쓴다.
pricing: oss
tags: [pocketbase, sqlite, baas, go, realtime, single-binary, self-hosted]
languages: [go, typescript, dart]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
PocketBase 는 실행 파일 하나를 띄우면 SQLite 데이터베이스, REST 스타일 API, 실시간 구독, 사용자·파일 관리, 관리자 대시보드가 한 번에 열리는 백엔드다. 그대로 독립 앱으로 쓰거나, Go 프레임워크로 임포트하거나, `pb_hooks` 의 JavaScript(goja 엔진)로 확장한다. MIT 라이선스이며 2026-11 기준 최신은 **v0.42.3**. 아직 v1.0 전이라 하위 호환이 보장되지 않으므로 업그레이드 시 변경 로그를 읽고 수동 마이그레이션이 필요할 수 있다고 공식 문서가 밝힌다.

> **저장소 이전**: 2026-10 부터 개발 저장소가 GitHub(`pocketbase/pocketbase`, 현재 archived)에서 작성자 자체 호스팅(`ganigeorgiev.com/pocketbase/pocketbase`)으로 옮겨졌다. GitHub 의 마지막 릴리스는 v0.40.6 이고, 이후 버전(예: v0.42.3)은 새 호스트에서 내려받는다. JS·Dart SDK 저장소도 같은 곳으로 이동했다.

## 설치
```bash
# 1) https://pocketbase.io/docs/ 에서 OS 별 zip 을 받아 압축 해제
./pocketbase serve
#   http://127.0.0.1:8090/_/   관리자 대시보드 (첫 실행 시 superuser 설정 링크)
#   http://127.0.0.1:8090/api/ REST API
#   pb_public/ 이 있으면 정적 파일 서빙
./pocketbase superuser create "$PB_ADMIN_EMAIL" "$PB_ADMIN_PASSWORD"   # 수동 생성
./pocketbase update      # 실행 파일 업데이트

npm install pocketbase   # JS SDK (브라우저·Node.js·React Native)
```
`pb_data/`(DB·업로드 파일)는 Git 에서 제외하고, `pb_migrations/`(컬렉션 변경 JS 마이그레이션)는 커밋한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Collection | 테이블에 해당. **Base**(일반 데이터), **Auth**(사용자·로그인 필드 포함), **View**(SQL SELECT 기반 읽기 전용) |
| Record | 컬렉션의 한 행. 파일 필드·관계 필드 지원 |
| API Rules | 컬렉션별 list/view/create/update/delete 필터식. 예: `@request.auth.id != ""` |
| Superuser | 규칙을 무시하는 관리자. 클라이언트 앱에서는 쓰지 않는다 |
| Realtime | 컬렉션 전체(`*`) 또는 레코드 단위 변경 구독(SSE). View 컬렉션은 이벤트 없음 |
| Hooks | Go 이벤트 훅 또는 `pb_hooks/*.pb.js` 로 요청·레코드 이벤트 가로채기, 커스텀 라우트 |
| Migrations | 대시보드에서 바꾼 스키마가 `pb_migrations` 에 자동 기록 |

## 기본 사용법
```ts
import PocketBase from "pocketbase";

const pb = new PocketBase(import.meta.env.VITE_PB_URL);   // 예: http://127.0.0.1:8090

await pb.collection("users").authWithPassword(
  import.meta.env.VITE_TEST_EMAIL, import.meta.env.VITE_TEST_PASSWORD,
);

await pb.collection("todos").create({ title: "백과사전 쓰기", done: false, owner: pb.authStore.record?.id });
const page = await pb.collection("todos").getList(1, 20, { filter: "done = false", sort: "-created" });
console.log(page.items);

pb.collection("todos").subscribe("*", (e) => console.log(e.action, e.record));
```
`todos` 컬렉션의 API Rule 을 `owner = @request.auth.id` 로 두면 사용자 자신의 레코드만 조회·수정된다.

## 자주 쓰는 패턴
- **클라이언트 직접 호출**: SPA·모바일 앱이 SDK 로 API 를 직접 부르고, 권한은 API Rules 로 통제한다(공식 권장 방식).
- **서버 작업은 별도 프로세스**: 결제 웹훅 등은 Node.js·Bun·Deno 서비스가 superuser 로 PocketBase 를 호출하거나 Go/JS 훅으로 처리한다.
- **SSR 주의**: 공식 문서는 SSR 에서 SDK 인스턴스 공유·OAuth2 처리 함정이 있어 경험이 없으면 SPA 를 권한다.
- **모바일**: `AsyncAuthStore` 같은 영속 auth store 를 넘겨 재시작 후에도 로그인 유지.
- **백업**: `pb_data` 를 주기적으로 백업(대시보드 백업 기능 또는 파일 복사). [SQLite](/develop-wiki/backend/database/sqlite/) 특성상 서버 한 대 구성이 기본이다.

## 언제 쓰나 / 피할 때
- 쓸 때: 사이드 프로젝트·MVP·사내 도구, VPS 한 대에 백엔드 전체를 올리고 싶을 때, 오프라인·폐쇄망 배포처럼 의존성을 최소화해야 할 때.
- 피할 때(대안): 수평 확장·다중 노드·대규모 쓰기가 필요하면 [Supabase](/develop-wiki/cloud/baas/supabase/)(Postgres)나 [Appwrite](/develop-wiki/cloud/baas/appwrite/), 관리형 서비스를 원하면 [Firebase](/develop-wiki/cloud/baas/firebase/). v1.0 전이라 호환성 깨짐을 감수하기 어려운 핵심 운영 시스템에는 신중히 쓴다.
- 요금: 오픈소스 셀프 호스팅만 제공(관리형 공식 서비스 없음). 호스팅 비용은 서버 비용뿐이다.

## 공식 문서
- [문서 홈](https://pocketbase.io/docs/) · [사용 방식 권장](https://pocketbase.io/docs/how-to-use/) · [Collections](https://pocketbase.io/docs/collections/) · [API Rules·필터](https://pocketbase.io/docs/api-rules-and-filters/) · [Records API](https://pocketbase.io/docs/api-records/) · [JS 확장](https://pocketbase.io/docs/js-overview/) · [저장소](https://ganigeorgiev.com/pocketbase/pocketbase)
