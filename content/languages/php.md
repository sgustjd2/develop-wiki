---
name: PHP
summary: 웹 서버 사이드 개발을 위해 태어난 동적 타입 스크립트 언어. 요청마다 실행되는 단순한 모델로 WordPress·Laravel 등 웹 백엔드에 널리 쓰인다.
paradigms: [명령형, 객체지향, 함수형]
typing: dynamic
execution: interpreted
firstAppeared: 1995
officialSite: https://www.php.net/
docs: https://www.php.net/manual/en/
useCases: [웹 백엔드·API, CMS(WordPress, Drupal), 서버 렌더링 웹 앱, 이커머스]
sources:
  - https://www.php.net/
  - https://www.php.net/releases/8.5/en.php
  - https://www.php.net/manual/en/install.php
  - https://getcomposer.org/download/
updatedAt: 2026-11-18
---

## 개요
PHP는 1995년 Rasmus Lerdorf가 만든 서버 사이드 언어로, HTML 안에 코드를 섞어 쓰던 템플릿 언어에서 출발해 지금은 클래스·열거형·타입 선언을 갖춘 범용 언어가 됐다. 웹 서버(FPM 등)가 **요청마다 스크립트를 실행하고 상태를 버리는** 공유 없는(share-nothing) 실행 모델이 특징이다.

버전 현황(2026-11-18, php.net 기준):

| 브랜치 | 상태 |
| --- | --- |
| 8.5 | 현재 안정 버전(최신 8.5.12) |
| 8.4, 8.3 | 지원 중 |
| 8.2 | 2026-12-31 지원 종료 예정 |
| 8.6 | RC 단계, 2026-11-19 정식 출시 예정 |

## 언어의 특징
- **타입 시스템:** 동적 타입. 다만 매개변수·반환·프로퍼티에 타입 선언(`int`, `?string`, 유니온 `int|string`)을 붙일 수 있고, 이는 **실행 시점에** 검사된다. 파일 맨 위 `declare(strict_types=1);` 을 쓰면 암묵적 형 변환을 막는다. 정적 검사는 PHPStan·Psalm 같은 외부 도구가 맡는다.
- **실행:** Zend 엔진이 소스를 opcode로 컴파일해 실행하고, OPcache가 opcode를 캐시한다. PHP 8.0부터 JIT도 내장.
- **메모리 관리:** 참조 카운팅 + 순환 참조 수집기. 요청이 끝나면 메모리를 통째로 비운다.
- **동시성:** 기본은 요청 단위 프로세스/스레드(PHP-FPM). 언어 내장 `Fiber`(8.1)가 있고, 비동기 I/O는 ReactPHP·Amp·Swoole 같은 라이브러리·확장으로 한다.
- **최근 기능:** 열거형·`readonly`(8.1~8.2), 프로퍼티 훅·비대칭 가시성(8.4), 파이프 연산자 `|>`·`clone` with·`#[\NoDiscard]`·URI 확장(8.5).

## 개발 환경 시작하기
```bash
# macOS
brew install php

# Ubuntu/Debian (배포판 패키지 — 버전은 배포판에 따라 다름)
sudo apt install php-cli php-mbstring php-xml

# Windows: windows.php.net 에서 zip 내려받기

php -v
php -S localhost:8000      # 개발용 내장 웹 서버
```

패키지 매니저는 **Composer**(이 글 작성 시점 2.11.x), 저장소는 [Packagist](https://packagist.org/)다. 설치는 [getcomposer.org/download](https://getcomposer.org/download/) 의 해시 검증 스크립트를 따른다(macOS는 `brew install composer` 도 가능).
```bash
composer init                    # composer.json 생성
composer require guzzlehttp/guzzle
composer install                 # composer.lock 기준 설치
# 프레임워크 프로젝트 생성 예
composer create-project laravel/laravel my-app
```
`require __DIR__.'/vendor/autoload.php';` 한 줄로 PSR-4 자동 로딩을 쓴다.

## 문법 한눈에 보기
```php
<?php
declare(strict_types=1);

enum Role: string {
    case Admin = 'admin';
    case Member = 'member';
}

final readonly class User {
    public function __construct(
        public string $name,
        public Role $role = Role::Member,
        public ?int $age = null,
    ) {}
}

function parseAge(string $text): int {
    if (!ctype_digit($text)) {
        throw new InvalidArgumentException("invalid age: $text");
    }
    return (int) $text;
}

$users = [new User('kim', Role::Admin, 30), new User(name: 'lee')];
foreach ($users as $u) {
    $label = match ($u->role) { Role::Admin => '관리자', Role::Member => '회원' };
    echo "{$u->name} {$label} " . ($u->age ?? 0) . PHP_EOL;
}

try {
    parseAge('abc');
} catch (InvalidArgumentException $e) {
    echo $e->getMessage(), PHP_EOL;
}
```

## 생태계
| 분야 | 대표 도구 |
| --- | --- |
| 웹 프레임워크 | [Laravel](/develop-wiki/backend/web-framework/laravel/), Symfony, Slim |
| CMS | WordPress, Drupal |
| ORM | Eloquent(Laravel), Doctrine |
| 테스트 | PHPUnit, Pest |
| 정적 분석·스타일 | PHPStan, Psalm, PHP-CS-Fixer |
| 런타임 | PHP-FPM, FrankenPHP, Swoole, RoadRunner |

## 언제 쓰나 / 약점
- **쓸 때:** CRUD 중심 웹 서비스·관리자 페이지를 빠르게 만들 때. 공유 호스팅까지 포함해 배포 환경이 가장 흔하다. Laravel·WordPress 생태계를 활용할 때.
- **약점:** 표준 라이브러리 함수 이름·인자 순서가 일관되지 않다. 요청 단위 모델이라 웹소켓·장시간 작업은 별도 런타임이 필요하다. 타입 오류가 실행 시점에야 드러나므로 정적 분석 도구 도입이 사실상 필수다.
- **대안:** 같은 성격의 동적 언어 웹 개발은 [Ruby](/develop-wiki/languages/ruby/)(Rails)나 [Python](/develop-wiki/languages/python/)(Django).

## 공식 문서·학습 자료
- [PHP 매뉴얼](https://www.php.net/manual/en/) · [설치 가이드](https://www.php.net/manual/en/install.php)
- [지원 버전 표](https://www.php.net/supported-versions.php) · [PHP 8.5 릴리스 안내](https://www.php.net/releases/8.5/en.php)
- [Composer 문서](https://getcomposer.org/doc/) · [PHP The Right Way](https://phptherightway.com/)
