---
name: NestJS
url: https://nestjs.com
docs: https://docs.nestjs.com
repo: https://github.com/nestjs/nest
stars: 77202
domain: backend
category: web-framework
description: 모듈·컨트롤러·프로바이더와 의존성 주입으로 구조를 잡는 Node.js 서버 프레임워크. 규모가 큰 TypeScript 백엔드나 팀 단위 API 서버에 쓴다.
pricing: oss
tags: [nodejs, dependency-injection, decorators, rest, microservices]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
NestJS 는 [TypeScript](/develop-wiki/languages/typescript/) 데코레이터와 의존성 주입(DI) 컨테이너 위에 모듈·컨트롤러·프로바이더 구조를 강제하는 Node.js 서버 프레임워크다. HTTP 계층은 어댑터로 분리돼 있어 기본은 [Express](/develop-wiki/backend/web-framework/express/)(`@nestjs/platform-express`), 선택으로 Fastify 나 Node 내장 `node:http` 기반 `NodeAdapter`(`@nestjs/platform-node`)를 쓴다. 공식 문서는 `NodeAdapter` 가 v13 에서 기본값이 될 예정이라고 밝힌다.

현재 메이저는 v12(2026-08 출시)이며, 핵심 패키지가 ESM 전용으로 바뀌었다. CommonJS 앱은 Node 의 `require(esm)` 으로 계속 동작한다. 앱 실행에는 Node.js 20.19+ 또는 22.12+, CLI 생성기(`nest new`)에는 22.22.3+/24.15+/26+ 가 필요하다. v11 계열도 패치가 계속 나온다.

라우터만 필요한 작은 서비스라면 [Express](/develop-wiki/backend/web-framework/express/)·[Hono](/develop-wiki/backend/web-framework/hono/)·[Fastify](/develop-wiki/backend/web-framework/fastify/) 가 가볍고, 구조·DI·테스트 규약이 필요한 큰 코드베이스에서 Nest 가 맞다.

## 설치
```bash
npm i -g @nestjs/cli
nest new todo-api        # ESM(기본, Vitest) 또는 CommonJS(Jest) 선택
cd todo-api
npm run start:dev        # 감시 모드, 기본 포트 3000 (PORT 환경 변수로 변경)
```
v12 CLI 는 새 프로젝트에 oxlint 를 기본으로 넣고, 패키지 매니저로 bun 도 고를 수 있다. 기존 v11 프로젝트는 `nest upgrade` 로 올린다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 모듈 `@Module` | `controllers`·`providers`·`imports`·`exports` 로 기능 단위를 묶는다. 루트는 `AppModule` |
| 컨트롤러 `@Controller` | 경로 접두사와 `@Get`·`@Post` 핸들러. `@Param`·`@Query`·`@Body` 로 입력을 받는다 |
| 프로바이더 `@Injectable` | 서비스·리포지토리 등 DI 대상. 생성자 매개변수로 주입된다 |
| 파이프 | 입력 변환·검증. `ParseIntPipe`, `ValidationPipe`, v12 의 `StandardSchemaValidationPipe` |
| 가드 | `CanActivate` 구현. 인증·인가 판단 |
| 인터셉터 | 핸들러 전후 처리(응답 변환, 캐시, 로깅) |
| 예외 필터 | `HttpException` 계열을 HTTP 응답으로 바꾼다. `NotFoundException` 등 내장 |
| 미들웨어 | Express/Fastify 스타일 `(req, res, next)`. 모듈의 `configure()` 에서 경로별로 적용 |

요청은 미들웨어 → 가드 → 인터셉터(전) → 파이프 → 핸들러 → 인터셉터(후) → 예외 필터 순으로 지난다.

## 기본 사용법
`nest new` 로 만든 프로젝트에서 `todos.controller.ts` 를 만들고 `AppModule` 의 `controllers` 에 등록한다.
```ts
import { Body, Controller, Get, NotFoundException, Param, ParseIntPipe, Post } from '@nestjs/common';
import { IsString, MinLength } from 'class-validator';

class CreateTodoDto {
  @IsString() @MinLength(1) title!: string;
}

@Controller('todos')
export class TodosController {
  private todos = new Map<number, { id: number; title: string }>();

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    const todo = this.todos.get(id);
    if (!todo) throw new NotFoundException();
    return todo;
  }

  @Post() // 기본 상태 코드 201
  create(@Body() dto: CreateTodoDto) {
    const todo = { id: this.todos.size + 1, title: dto.title };
    this.todos.set(todo.id, todo);
    return todo;
  }
}
```
`main.ts` 에서 `app.useGlobalPipes(new ValidationPipe({ whitelist: true }))` 를 걸면 DTO 규칙에 맞지 않는 본문은 400 으로 거절되고, 선언하지 않은 필드는 제거된다. `class-validator`·`class-transformer` 를 따로 설치해야 한다.

## 자주 쓰는 패턴
- **기능 모듈 분리**: `nest g resource todos` 로 모듈·컨트롤러·서비스·DTO 를 한 번에 생성하고, 비즈니스 로직은 서비스(`@Injectable`)에 둔다.
- **Standard Schema 검증(v12)**: Zod 같은 Standard Schema 라이브러리로 스키마를 만들고 `@Body({ schema: createTodoSchema })` 처럼 매개변수에 붙인 뒤 `app.useGlobalPipes(new StandardSchemaValidationPipe())` 를 건다. 스키마가 없는 매개변수는 그대로 통과한다.
- **미들웨어·가드**: 요청 로깅은 `NestMiddleware` 를 `consumer.apply(LoggerMiddleware).forRoutes('todos')` 로, 인증은 가드를 `@UseGuards(AuthGuard)` 또는 전역 `APP_GUARD` 프로바이더로 건다.
- **설정**: `@nestjs/config` 의 `ConfigModule.forRoot()` 로 `.env` 를 읽는다. v12 부터 `validationSchema` 에 Standard Schema 라이브러리를 넣을 수 있다.
- **DB 연동**: TypeORM(`@nestjs/typeorm`)·Mongoose 공식 통합이 있고, [Prisma](/develop-wiki/backend/orm-query/prisma/)·[Drizzle](/develop-wiki/backend/orm-query/drizzle-orm/) 클라이언트는 프로바이더로 감싸 주입하는 방식이 흔하다.
- **테스트**: `@nestjs/testing` 으로 테스트 모듈을 만들고 의존성을 바꿔 끼운다. 새 ESM 프로젝트의 기본 러너는 Vitest 다.
  ```ts
  const moduleRef = await Test.createTestingModule({ imports: [TodosModule] })
    .overrideProvider(TodosService).useValue(fakeService)
    .compile();
  const app = moduleRef.createNestApplication();
  await app.init();
  await request(app.getHttpServer()).get('/todos/1').expect(200); // supertest
  ```
  Fastify 어댑터를 쓰면 supertest 대신 `app.inject()` 를 쓴다.

## 언제 쓰나 / 피할 때
- 쓸 때: 여러 명이 장기간 유지하는 TypeScript 백엔드, Spring·Angular 식 계층 구조와 DI 가 익숙한 팀, REST·GraphQL·WebSocket·마이크로서비스 전송 계층을 한 프레임워크로 맞추고 싶을 때.
- 피할 때(대안): 엔드포인트 몇 개짜리 서비스나 엣지 런타임 배포에는 [Hono](/develop-wiki/backend/web-framework/hono/), 최소 추상화를 원하면 [Fastify](/develop-wiki/backend/web-framework/fastify/)·[Express](/develop-wiki/backend/web-framework/express/). 데코레이터·DI 보일러플레이트가 부담인 소규모 팀에도 과할 수 있다.

## 공식 문서
- [First steps](https://docs.nestjs.com/first-steps) · [Validation](https://docs.nestjs.com/techniques/validation) · [Testing](https://docs.nestjs.com/fundamentals/testing) · [v11→v12 마이그레이션](https://docs.nestjs.com/migration-guide) · [릴리스](https://github.com/nestjs/nest/releases)
