---
name: Ruby on Rails
url: https://rubyonrails.org
docs: https://guides.rubyonrails.org
repo: https://github.com/rails/rails
stars: 59153
domain: backend
category: web-framework
description: 설정보다 관례를 따르는 Ruby 풀스택 웹 프레임워크. ORM·마이그레이션·뷰·잡·메일까지 포함해 웹 서비스를 빠르게 만들 때 쓴다.
pricing: oss
tags: [mvc, full-stack, active-record, convention-over-configuration]
languages: [ruby]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Ruby on Rails 는 [Ruby](/develop-wiki/languages/ruby/) MVC 풀스택 프레임워크로, 파일 위치·이름 규칙만 맞추면 라우트·컨트롤러·모델·테이블이 자동으로 연결되는 "설정보다 관례(convention over configuration)"가 핵심이다. ORM(Active Record), 마이그레이션, 뷰(Action View)와 Hotwire, 백그라운드 잡(Active Job), 메일, 파일 업로드(Active Storage), WebSocket(Action Cable)이 기본 포함된다.

현재 버전은 8.1 계열(최신 8.1.4.1)이고 Ruby 3.2 이상이 필요하다. 8.x 에서는 DB 기반 잡·캐시·케이블 백엔드(Solid Queue·Solid Cache·Solid Cable)와 배포 도구 Kamal 이 기본 구성에 들어갔다. `--api` 옵션으로 뷰·쿠키를 뺀 API 전용 앱도 만든다. PHP 쪽 대응은 [Laravel](/develop-wiki/backend/web-framework/laravel/), Python 쪽은 [Django](/develop-wiki/backend/web-framework/django/) 다.

## 설치
```bash
gem install rails
rails new todo_api --api          # API 전용. 풀스택은 --api 없이
cd todo_api
bin/rails server                  # http://127.0.0.1:3000
```
기본 DB 는 SQLite 이며 `rails new app -d postgresql` 처럼 바꿀 수 있다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 라우팅 | `config/routes.rb`. `resources :todos` 한 줄로 CRUD 7개 라우트 생성 |
| 컨트롤러 | `app/controllers`. API 앱은 `ActionController::API` 를 상속. `render json:` |
| Active Record | 모델 클래스 = 테이블. `Todo.find`, `Todo.create`, 연관(`has_many`), 검증(`validates`) |
| 마이그레이션 | `bin/rails generate model Todo title:string` → `bin/rails db:migrate` |
| Strong Parameters | `params.expect(todo: [:title])` 로 허용한 키만 모델에 넘긴다(Rails 8 방식) |
| 콜백·필터 | `before_action` 으로 컨트롤러 공통 처리, 모델은 `before_save` 등 |
| Rack 미들웨어 | `config.middleware.use` 로 요청 파이프라인에 추가 |
| 제너레이터 | `bin/rails generate scaffold/controller/model` 로 코드·테스트 골격 생성 |

## 기본 사용법
`bin/rails generate model Todo title:string && bin/rails db:migrate` 후 아래 세 파일을 작성한다.
```ruby
# config/routes.rb
Rails.application.routes.draw do
  resources :todos, only: [:show, :create]
end

# app/models/todo.rb
class Todo < ApplicationRecord
  validates :title, presence: true
end

# app/controllers/todos_controller.rb
class TodosController < ApplicationController
  def show
    render json: Todo.find(params[:id])   # 없으면 404
  end

  def create
    todo = Todo.new(params.expect(todo: [:title]))
    if todo.save
      render json: todo, status: :created
    else
      render json: todo.errors, status: :unprocessable_entity
    end
  end
end
```
`POST /todos` 본문은 `{"todo": {"title": "a"}}` 형태다. API 앱은 JSON 본문을 컨트롤러 이름 키로 감싸 주는 파라미터 래핑이 켜져 있어 `{"title": "a"}` 도 받는다.

## 자주 쓰는 패턴
- **리소스 라우팅**: `namespace :api do namespace :v1 do resources :todos end end` 로 버전을 나누고, 중첩 리소스(`resources :projects do resources :todos end`)로 관계를 표현한다.
- **공통 처리**: 인증·로딩은 `before_action :authenticate`, 예외 응답은 `rescue_from ActiveRecord::RecordNotFound, with: :not_found` 로 통일한다. 요청 단위 처리는 Rack 미들웨어로 추가한다.
- **검증**: 모델에 `validates :title, presence: true, length: { maximum: 100 }` 을 두고, 컨트롤러는 Strong Parameters 로 입력 키를 제한한다. 실패하면 `errors` 를 422 로 반환한다.
- **DB**: 쿼리는 `Todo.where(done: false).order(:created_at)` 같은 체인으로, N+1 은 `includes(:project)` 로 막는다. 운영 DB 는 [PostgreSQL](/develop-wiki/backend/database/postgresql/)·[MySQL](/develop-wiki/backend/database/mysql/) 이 흔하다.
- **백그라운드 잡**: `TodoReminderJob.perform_later(todo)`. Rails 8 기본 백엔드는 DB 를 쓰는 Solid Queue 다.
- **테스트**: 기본은 Minitest. 통합 테스트는 실제 라우팅·미들웨어를 거친다(`bin/rails test`).
  ```ruby
  class TodosTest < ActionDispatch::IntegrationTest
    test "creates todo" do
      post todos_url, params: { todo: { title: "a" } }, as: :json
      assert_response :created
    end
  end
  ```

## 언제 쓰나 / 피할 때
- 쓸 때: 서버 렌더링 웹 앱·관리 도구·SaaS 를 소수 인원이 빠르게 만들고 유지할 때, ORM·잡·메일·업로드를 한 프레임워크 관례로 통일하고 싶을 때.
- 피할 때(대안): 정적 타입과 컴파일 타임 검사가 중요하면 [Spring Boot](/develop-wiki/backend/web-framework/spring-boot/)·[ASP.NET Core](/develop-wiki/backend/web-framework/aspnet-core/), 실시간 연결이 매우 많은 서비스는 [Phoenix](/develop-wiki/backend/web-framework/phoenix/), Ruby 로 작은 API 만 필요하면 Sinatra·Hanami 같은 가벼운 선택지도 있다.

## 공식 문서
- [Getting Started](https://guides.rubyonrails.org/getting_started.html) · [API 전용 앱](https://guides.rubyonrails.org/api_app.html) · [Routing](https://guides.rubyonrails.org/routing.html) · [Active Record Validations](https://guides.rubyonrails.org/active_record_validations.html) · [Testing](https://guides.rubyonrails.org/testing.html) · [API 문서](https://api.rubyonrails.org)
