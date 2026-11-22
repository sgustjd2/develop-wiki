---
name: Django
url: https://www.djangoproject.com
repo: https://github.com/django/django
stars: 91931
docs: https://docs.djangoproject.com/en/6.1/
domain: backend
category: web-framework
description: ORM, 관리자 화면, 인증, 마이그레이션을 내장한 Python 풀스택 웹 프레임워크. 데이터 중심 웹 서비스를 한 프레임워크로 만들 때 쓴다.
pricing: oss
tags: [fullstack, orm, admin, mvc]
languages: [python]
koreanDocs: true
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Django 는 ORM, 마이그레이션, 인증, 관리자 화면(admin), 폼, 템플릿을 한 패키지에 담은 Python 풀스택 웹 프레임워크다. 프로젝트(설정) 안에 여러 앱(기능 단위)을 두는 구조와 DRY·느슨한 결합 같은 설계 원칙을 따르며, 모델을 정의하면 DB 스키마·admin·폼까지 이어진다. 현재 문서 기준 버전은 **Django 6.1** 이고 Python 3.12 이상을 지원한다.

API 만 빠르게 만들 때는 [FastAPI](/develop-wiki/backend/web-framework/fastapi/), 데이터 모델 중심의 웹 서비스 전체를 만들 때는 Django 가 맞다.

## 설치
```bash
python -m venv .venv && source .venv/bin/activate
python -m pip install Django
django-admin startproject mysite .     # 현재 폴더에 프로젝트 생성
python manage.py startapp todos        # 앱 생성 후 settings.INSTALLED_APPS 에 추가
python manage.py migrate               # 기본 테이블(auth, admin 등) 생성
python manage.py runserver             # http://127.0.0.1:8000 (개발 전용)
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 프로젝트 / 앱 | 프로젝트는 설정·루트 URL, 앱은 `models.py`·`views.py`·`admin.py` 를 가진 기능 단위 |
| URLconf | `urls.py` 의 `urlpatterns` 에 `path()` 로 경로→뷰를 연결. `include()` 로 앱 URL 위임 |
| 뷰 | 요청을 받아 `HttpResponse`(또는 `JsonResponse`, `render()`)를 반환하는 함수·클래스 |
| 모델·ORM | `models.Model` 서브클래스. `Todo.objects.filter(...)` 같은 QuerySet 으로 조회 |
| 마이그레이션 | `makemigrations` 로 모델 변경을 파일로 만들고 `migrate` 로 적용 |
| 미들웨어 | `settings.MIDDLEWARE` 목록 순서대로 요청·응답을 감싼다(세션, CSRF, 인증 등) |
| admin | 모델을 `admin.site.register()` 하면 CRUD 관리 화면이 생긴다 |

## 기본 사용법
`todos` 앱에 GET·POST 를 처리하는 JSON 뷰를 만든다.
```python
# todos/views.py
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from .models import Todo

@csrf_exempt  # 예제용. 브라우저 폼은 CSRF 토큰을 쓴다
@require_http_methods(["GET", "POST"])
def todo_list(request):
    if request.method == "POST":
        data = json.loads(request.body)
        todo = Todo.objects.create(title=data["title"])
        return JsonResponse({"id": todo.id, "title": todo.title}, status=201)
    return JsonResponse({"items": list(Todo.objects.values("id", "title"))})
```
```python
# todos/models.py
from django.db import models

class Todo(models.Model):
    title = models.CharField(max_length=200)
    done = models.BooleanField(default=False)
```
```python
# mysite/urls.py
from django.urls import path
from todos.views import todo_list

urlpatterns = [path("todos/", todo_list)]
```
모델을 바꾼 뒤에는 `python manage.py makemigrations && python manage.py migrate` 를 실행한다.

## 자주 쓰는 패턴
- **라우팅**: 앱마다 `urls.py` 를 두고 루트에서 `path("todos/", include("todos.urls"))`. `<int:pk>` 같은 경로 변환기로 타입을 지정한다.
- **검증**: `forms.Form`/`ModelForm` 의 `is_valid()` 와 `cleaned_data` 를 쓴다. 모델 필드 제약(`max_length`, `unique`)도 검증에 참여한다.
- **미들웨어**: `def middleware(get_response)` 형태의 함수나 클래스를 만들어 `MIDDLEWARE` 에 추가한다.
- **DB 연동**: `settings.DATABASES` 에 엔진을 지정한다. 운영에서는 [PostgreSQL](/develop-wiki/backend/database/postgresql/) 이 흔하고, N+1 은 `select_related`/`prefetch_related` 로 줄인다.
- **REST API**: 큰 API 는 Django REST framework 나 django-ninja 같은 서드파티를 얹는 경우가 많다(별도 패키지).
- **테스트**: `django.test.TestCase` 는 테스트마다 트랜잭션을 롤백하고, `self.client` 로 요청을 보낸다. `python manage.py test` 로 실행.
  ```python
  from django.test import TestCase

  class TodoTests(TestCase):
      def test_create(self):
          res = self.client.post("/todos/", {"title": "a"}, content_type="application/json")
          self.assertEqual(res.status_code, 201)
  ```

## 6.x 에서 추가된 것
- **CSP 지원**: `ContentSecurityPolicyMiddleware` 와 `SECURE_CSP` 설정으로 Content-Security-Policy 헤더를 내장 기능으로 붙인다(6.0).
- **Tasks 프레임워크**: `@task` 로 정의하고 `.enqueue()` 로 큐에 넣는 백그라운드 작업 API(6.0). 실행할 워커는 별도로 필요하다.
- **템플릿 partial**: `{% partialdef %}`/`{% partial %}` 로 한 템플릿 안에 재사용 조각을 정의(6.0).
- `DEFAULT_AUTO_FIELD` 기본값이 `BigAutoField` 가 됐다(6.0).

## 언제 쓰나 / 피할 때
- 쓸 때: 관리자 화면이 필요한 데이터 중심 서비스(CMS, 백오피스, 커머스), 인증·폼·ORM 을 프레임워크 기본값으로 빠르게 갖추고 싶을 때.
- 피할 때(대안): 순수 JSON API·비동기 I/O 중심이면 [FastAPI](/develop-wiki/backend/web-framework/fastapi/), 아주 작은 서비스라 프로젝트 구조가 부담스러우면 마이크로 프레임워크가 낫다.

## 공식 문서
- [튜토리얼](https://docs.djangoproject.com/en/6.1/intro/tutorial01/) · [설치](https://docs.djangoproject.com/en/6.1/topics/install/) · [모델·DB](https://docs.djangoproject.com/en/6.1/topics/db/) · [테스트](https://docs.djangoproject.com/en/6.1/topics/testing/) · [6.0 릴리스 노트](https://docs.djangoproject.com/en/6.1/releases/6.0/)
