---
name: Laravel
url: https://laravel.com
repo: https://github.com/laravel/framework
stars: 35004
docs: https://laravel.com/framework/docs/13.x
domain: backend
category: web-framework
description: 라우팅, Eloquent ORM, 큐, 인증을 갖춘 PHP 풀스택 웹 프레임워크. PHP로 웹 서비스나 API를 만들 때 쓴다.
pricing: oss
tags: [fullstack, orm, mvc]
languages: [php]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Laravel 은 라우팅, 서비스 컨테이너(DI), Eloquent ORM, 마이그레이션, 큐, 스케줄러, 인증, 테스트 도구를 한 프레임워크에 묶은 PHP 풀스택 프레임워크다. 디렉터리 구조와 이름 규칙이 정해져 있어 `php artisan make:*` 명령이 컨트롤러·모델·마이그레이션을 정해진 위치에 만든다. Blade 템플릿이나 Inertia·Livewire 로 화면까지 만들 수도 있고, Sanctum 을 붙여 API 백엔드로만 쓸 수도 있다.

현재 메이저는 **Laravel 13**(2026-03 출시)이며 PHP 8.3~8.5 를 지원한다. 메이저는 매년 1분기에 나오고 버그 수정 18개월, 보안 수정 2년을 제공한다.

## 설치
```bash
# PHP·Composer 가 이미 있으면
composer global require laravel/installer
laravel new example-app
cd example-app
npm install && npm run build
composer run dev            # 서버 + 큐 워커 + Vite 를 함께 실행, http://localhost:8000
```
PHP 가 없다면 `php.new` 설치 스크립트나 Laravel Herd 로 PHP·Composer·설치기를 한 번에 받는다. 새 앱의 기본 DB 는 SQLite(`database/database.sqlite`)이며 `.env` 의 `DB_*` 값으로 바꾼다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 라우트 파일 | `routes/web.php`(세션·CSRF 포함 `web` 그룹), `routes/api.php`(무상태 `api` 그룹, `/api` 접두사) |
| 컨트롤러 | `php artisan make:controller` 로 생성. 라우트에 `[TodoController::class, 'store']` 로 연결 |
| 서비스 컨테이너 | 타입 힌트만으로 생성자·메서드에 의존성을 주입 |
| Eloquent | 테이블 하나에 모델 클래스 하나를 대응시키는 Active Record ORM |
| 마이그레이션 | 스키마 변경을 PHP 코드로 기록. `php artisan migrate` 로 적용 |
| 미들웨어 | 요청 전후 필터. 라우트·그룹에 `->middleware('auth')` 로 적용 |
| 검증 | `$request->validate([...])` 또는 Form Request 클래스. 실패 시 422(JSON) 또는 리다이렉트 |
| Artisan | 코드 생성·마이그레이션·큐 실행 등을 담당하는 CLI |

## 기본 사용법
API 라우트를 켜고(`php artisan install:api`, Sanctum 설치와 `routes/api.php` 생성), 모델과 마이그레이션을 만든다(`php artisan make:model Todo -m`).
```php
// routes/api.php
use App\Models\Todo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/todos/{todo}', function (Todo $todo) {
    return $todo;                     // 없으면 자동 404
});

Route::post('/todos', function (Request $request) {
    $data = $request->validate(['title' => 'required|string|max:200']);
    return response()->json(Todo::create($data), 201);
});
```
```php
// app/Models/Todo.php 에 대량 할당 허용 필드 지정
protected $fillable = ['title'];
```
`{todo}` 와 `Todo $todo` 이름이 같으면 라우트 모델 바인딩이 ID 로 조회해 주입한다. 경로는 `/api/todos/...` 가 된다.

## 자주 쓰는 패턴
- **라우트 그룹**: `Route::prefix('admin')->middleware('auth:sanctum')->group(function () { ... })` 로 접두사·미들웨어를 묶는다. 리소스 컨트롤러는 `Route::apiResource('todos', TodoController::class)`.
- **미들웨어**: `php artisan make:middleware` 로 만들고 라우트에 붙인다. Laravel 13 은 컨트롤러 클래스·메서드에 `#[Middleware('auth')]`, `#[Authorize(...)]` 속성으로 선언하는 방식도 지원한다.
- **검증**: 규칙이 길어지면 `php artisan make:request StoreTodoRequest` 로 Form Request 를 만들고 컨트롤러 매개변수 타입으로 받는다. 검증을 통과한 값만 `$request->validated()` 로 꺼낸다.
- **DB 연동**: Eloquent 관계(`hasMany`, `belongsTo`)와 `with()` 즉시 로딩으로 N+1 을 막는다. MySQL·[PostgreSQL](/develop-wiki/backend/database/postgresql/) 등은 `.env` 에서 전환한다. 응답 형태는 API Resource(13 부터 JSON:API 리소스 포함)로 다듬는다.
- **큐·스케줄**: 무거운 작업은 Job 으로 만들어 `dispatch()` 하고 `php artisan queue:work` 가 처리한다. 13 에서는 `Queue::route()` 로 Job 별 기본 큐를 한곳에 정의할 수 있다.
- **테스트**: Pest 와 PHPUnit 을 모두 지원한다. HTTP 헬퍼로 서버 없이 호출한다(아래는 Pest 문법).
  ```php
  test('creates todo', function () {
      $this->postJson('/api/todos', ['title' => 'a'])->assertCreated();
  });
  ```
  `php artisan test` 로 실행한다. 테스트마다 DB 를 되돌리려면 Pest 는 `pest()->use(RefreshDatabase::class)`, PHPUnit 은 테스트 클래스에 `use RefreshDatabase;` 를 넣는다(스키마가 최신이면 마이그레이션 없이 트랜잭션으로 감싸 롤백한다).

## 언제 쓰나 / 피할 때
- 쓸 때: PHP 로 만드는 웹 서비스·SaaS·관리 도구, 인증·큐·메일·결제까지 공식 패키지로 빠르게 갖추고 싶을 때, 공유 호스팅부터 Laravel Cloud 까지 PHP 배포 환경을 쓸 때.
- 피할 때(대안): 팀 주력 언어가 Python 이면 [Django](/develop-wiki/backend/web-framework/django/), 장시간 연결·고동시성 처리가 핵심이면 Go·Rust·Node 기반 서버가 더 자연스럽다(Laravel 은 Octane·Reverb 로 일부 보완).

## 공식 문서
- [설치](https://laravel.com/docs/13.x/installation) · [라우팅](https://laravel.com/docs/13.x/routing) · [검증](https://laravel.com/docs/13.x/validation) · [Eloquent](https://laravel.com/docs/13.x/eloquent) · [릴리스 노트](https://laravel.com/docs/13.x/releases) · [업그레이드 가이드](https://laravel.com/docs/13.x/upgrade)
