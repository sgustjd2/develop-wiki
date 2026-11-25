---
name: Supabase
url: https://supabase.com/
docs: https://supabase.com/docs
repo: https://github.com/supabase/supabase
stars: 115476
domain: cloud
category: baas
description: PostgreSQL 위에 인증·자동 생성 REST/GraphQL API·스토리지·Realtime·Edge Functions 를 얹은 오픈소스 BaaS. SQL 과 RLS 로 권한을 관리하며 Firebase 대안으로 앱 백엔드를 빠르게 만들 때 쓴다.
pricing: oss
tags: [supabase, postgres, baas, auth, realtime, rls, firebase-alternative]
languages: [typescript, python, dart, swift, kotlin]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Supabase 는 프로젝트마다 전용 [PostgreSQL](/develop-wiki/backend/database/postgresql/) 데이터베이스를 주고, 그 스키마에서 REST API(PostgREST)를 자동 생성하며, Auth·Storage·Realtime·Edge Functions 를 같은 권한 모델로 묶은 백엔드 플랫폼이다. 접근 제어는 Postgres **Row Level Security(RLS)** 정책으로 하므로 클라이언트가 DB 에 직접 질의해도 행 단위로 막을 수 있다. 저장소는 Apache-2.0 이고 관리형 클라우드(supabase.com)와 셀프 호스팅을 모두 지원한다. 문서 홈은 AI·벡터(pgvector), Cron, Queues 도 함께 안내한다.

## 설치
```bash
# CLI (프로젝트 로컬 설치, Node.js 20+)
npm install supabase --save-dev
npx supabase init          # supabase/config.toml 생성
npx supabase start         # Docker 등 컨테이너 런타임으로 로컬 스택 실행
# Studio http://127.0.0.1:54323, API http://127.0.0.1:54321, DB 포트 54322

# 클라이언트 라이브러리
npm install @supabase/supabase-js
```
macOS/Linux 는 `brew install supabase/tap/supabase` 로 CLI 를 전역 설치할 수도 있다. `npx supabase stop` 은 데이터를 유지하고 종료한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Database | 프로젝트 전용 Postgres. 확장(pgvector 등)·백업 포함 |
| Data API | 스키마에서 자동 생성되는 REST(PostgREST)·GraphQL API |
| RLS 정책 | `auth.uid()` 등으로 행 접근을 제한하는 SQL 정책. 공개 테이블에는 필수 |
| API 키 | 클라이언트용 **publishable key**(RLS 적용) / 서버 전용 **secret key**(RLS 우회) |
| Auth | 이메일·비밀번호, 매직 링크, OAuth, 전화 로그인. 사용자는 `auth.users` 에 저장 |
| Storage | 버킷 기반 파일 저장. 접근 정책도 RLS 로 작성 |
| Realtime | DB 변경 구독, Broadcast, Presence |
| Edge Functions | Deno 기반 서버 함수. 웹훅·비밀 키가 필요한 로직 |
| Migrations | `supabase/migrations/*.sql` 로 스키마 변경 이력 관리 |

## 기본 사용법
```sql
-- supabase/migrations/20261118000000_todos.sql
create table public.todos (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users,
  title text not null,
  done boolean not null default false
);
alter table public.todos enable row level security;
create policy "own todos" on public.todos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```
```ts
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_PUBLISHABLE_KEY!,   // 브라우저에 노출돼도 되는 키 (RLS 가 보호)
);

await supabase.auth.signInWithPassword({ email: process.env.TEST_EMAIL!, password: process.env.TEST_PASSWORD! });
await supabase.from("todos").insert({ title: "백과사전 쓰기" });
const { data, error } = await supabase.from("todos").select("id, title, done").eq("done", false);
```

## 자주 쓰는 패턴
- **마이그레이션 우선**: 로컬에서 `supabase migration new` → SQL 작성 → `supabase db push` 로 원격 반영. Studio 에서 바꾼 내용은 `supabase db diff` 로 파일화.
- **타입 생성**: `supabase gen types typescript` 로 DB 스키마 타입을 만들어 클라이언트에 적용.
- **secret key 는 서버에서만**: 관리 작업·웹훅은 Edge Functions 나 백엔드에서 secret key 로 처리하고, 브라우저에는 publishable key 만 둔다.
- **Realtime 구독**: 채팅·알림은 테이블 변경 구독이나 Broadcast 채널로 구현.
- **벡터 검색**: pgvector 확장으로 임베딩을 저장하고 SQL 로 유사도 검색.

## 언제 쓰나 / 피할 때
- 쓸 때: 관계형 데이터·SQL 을 선호하면서 인증·스토리지까지 한 번에 필요할 때, Firebase 의 잠금 효과를 피하고 싶을 때, 셀프 호스팅 가능성을 남기고 싶을 때.
- 피할 때(대안): 모바일 오프라인 동기화·Google 생태계 통합이 우선이면 [Firebase](/develop-wiki/cloud/baas/firebase/), 단일 바이너리로 작은 서비스를 운영하려면 [PocketBase](/develop-wiki/cloud/baas/pocketbase/), 문서형 DB 와 다양한 SDK 를 셀프 호스팅하려면 [Appwrite](/develop-wiki/cloud/baas/appwrite/). RLS 정책 설계가 부담이면 별도 API 서버를 두는 편이 낫다.
- 요금: 관리형 클라우드는 무료·유료 플랜이 있다. 한도는 [가격 페이지](https://supabase.com/pricing)에서 확인한다.

## 공식 문서
- [문서 홈](https://supabase.com/docs) · [로컬 개발 CLI](https://supabase.com/docs/guides/local-development/cli/getting-started) · [JavaScript 레퍼런스](https://supabase.com/docs/reference/javascript/introduction) · [RLS 가이드](https://supabase.com/docs/guides/database/postgres/row-level-security) · [셀프 호스팅](https://supabase.com/docs/guides/self-hosting)
