---
name: Symfony
url: https://symfony.com
docs: https://symfony.com/doc/current/index.html
repo: https://github.com/symfony/symfony
stars: 31456
domain: backend
category: web-framework
description: 재사용 가능한 PHP 컴포넌트 모음이자 풀스택 웹 프레임워크. 라우팅·DI 컨테이너·HttpFoundation 등을 조합해 웹앱과 API 를 만든다.
pricing: oss
tags: [php, mvc, components, dependency-injection, composer]
languages: [php]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Symfony 는 독립적으로 쓸 수 있는 PHP 컴포넌트와 이를 조합한 풀스택 프레임워크다. 라우팅, HttpFoundation(요청·응답), 의존성 주입 컨테이너, 콘솔, 폼, 보안 등을 필요한 만큼 가져다 쓸 수 있다. 기본 뼈대(`symfony/skeleton`)는 최소 구성이라 마이크로서비스·API 에, `webapp` 구성은 전통적 웹앱에 쓴다.

- 이 문서는 공식 문서 기준 **Symfony 8.1**(현재 안정판, 저장소 태그 v8.1.11)이다. 8.2 는 베타(v8.2.0-BETA2, 2026-11-13)다. MIT.
- 요구사항: PHP 8.4 이상과 Ctype, iconv, PCRE, Session, SimpleXML, Tokenizer 확장, Composer.
- 대안: 관례 중심 생산성은 [Laravel](/develop-wiki/backend/web-framework/laravel/), 다른 언어의 풀스택은 [Django](/develop-wiki/backend/web-framework/django/)·[Rails](/develop-wiki/backend/web-framework/rails/).

## 설치
Symfony CLI 로 프로젝트를 만든다(`--webapp` 은 전통적 웹앱, 생략하면 API·콘솔용 최소 구성).
```bash
symfony new my_project_directory --version="8.1.*" --webapp
```
Composer 만 쓸 때:
```bash
composer create-project symfony/skeleton:"8.1.*" my_project_directory
cd my_project_directory
composer require webapp   # 웹앱일 때만
```
개발 서버:
```bash
cd my_project_directory
symfony server:start      # 또는 symfony serve -d (백그라운드)
```
`symfony check:requirements` 로 PHP 환경이 요건을 충족하는지 점검한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Component | 독립 사용 가능한 PHP 라이브러리(예: HttpFoundation, Routing) |
| Bundle | 프레임워크에 기능을 더하는 플러그인 단위 |
| Controller | 요청을 받아 `Response` 를 반환하는 클래스·메서드 |
| `#[Route]` | 컨트롤러 메서드에 경로를 붙이는 PHP 속성 |
| Service / DI | 자동 주입되는 서비스 컨테이너 |
| Symfony CLI | 프로젝트 생성, 로컬 서버, 환경 점검 도구 |

## 기본 사용법
`src/Controller/LuckyController.php`:
```php
namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class LuckyController extends AbstractController
{
    #[Route('/lucky/number')]
    public function number(): Response
    {
        return new Response('<html><body>Lucky number</body></html>');
    }
}
```
개발 서버를 켠 뒤 `http://localhost:8000/lucky/number` 로 확인한다.

## 자주 쓰는 패턴
- **필요한 컴포넌트만 설치**: 프레임워크 없이 `composer require symfony/http-foundation` 처럼 개별 컴포넌트를 쓴다.
- **속성(attribute) 라우팅**: `#[Route]` 로 경로를 컨트롤러 옆에 선언한다.
- **의존성 주입**: 생성자에 타입 힌트를 적어 서비스를 주입받는다.
- **버전 정책**: 마이너·메이저 버전을 `8.1.*` 처럼 고정하고 새 버전은 공식 업그레이드 문서를 따라 올린다.

## 언제 쓰나 / 피할 때
- 쓸 때: 장기 유지보수가 필요한 PHP 엔터프라이즈 앱, 컴포넌트 단위로 부분 도입할 때.
- 피할 때(대안): 빠른 프로토타입·관례 중심 개발은 Laravel, PHP 8.4 를 쓸 수 없는 환경.

## 공식 문서
- [설치·설정](https://symfony.com/doc/current/setup.html) · [문서](https://symfony.com/doc/current/index.html) · [저장소](https://github.com/symfony/symfony)
