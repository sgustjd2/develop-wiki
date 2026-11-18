---
name: GORM
url: https://gorm.io
docs: https://gorm.io/docs/
repo: https://github.com/go-gorm/gorm
domain: backend
category: orm-query
description: Go 의 대표 ORM. 구조체를 테이블에 매핑하고 연관관계, 훅, 트랜잭션, 자동 마이그레이션을 제공하며 v1.30 부터 제네릭 API 를 지원한다.
pricing: oss
tags: [go, orm, sql]
languages: [go]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
GORM 은 Go 구조체를 테이블로 매핑해 CRUD·연관관계(Has One/Many, Belongs To, Many2Many)·Preload·훅·트랜잭션을 제공하는 ORM 이다. 드라이버는 `gorm.io/driver/postgres`, `mysql`, `sqlite`, `sqlserver` 처럼 별도 모듈로 붙인다. v1.30.0 부터 `gorm.G[T](db)` **제네릭 API** 가 추가돼 결과 타입이 컴파일 시점에 정해지고 `context.Context` 를 첫 인자로 받는다. 기존 체이닝 API 도 계속 지원된다.

2026-11 기준 최신은 **v1.31.2**(2026-06). 릴리스 간격이 긴 편이지만 저장소는 유지보수 중이다. [Go](/develop-wiki/languages/go/) 생태계에서는 ORM 대신 SQL 을 직접 쓰는 sqlc·sqlx(Go)·pgx 도 많이 쓰므로 함께 비교한다.

## 설치
```bash
go get -u gorm.io/gorm
go get -u gorm.io/driver/postgres     # 또는 gorm.io/driver/sqlite 등
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 모델 | 구조체. `gorm.Model` 을 임베드하면 `ID`, `CreatedAt`, `UpdatedAt`, `DeletedAt` 추가 |
| 태그 | `gorm:"uniqueIndex;size:255;not null"` 으로 컬럼 옵션 지정 |
| 소프트 삭제 | `DeletedAt` 필드가 있으면 `Delete` 가 UPDATE 로 바뀌고 조회에서 제외 |
| `AutoMigrate` | 구조체 기준으로 테이블·컬럼·인덱스 생성(컬럼 삭제는 하지 않음) |
| Preload / Joins | 연관 데이터 즉시 로딩 |
| 제네릭 API | `gorm.G[User](db).Where(...).Find(ctx)` — 타입이 정해진 결과 반환 |

## 기본 사용법
```go
package main

import (
	"context"
	"fmt"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	Email string `gorm:"uniqueIndex"`
	Posts []Post
}

type Post struct {
	gorm.Model
	Title  string
	UserID uint
}

func main() {
	ctx := context.Background()
	db, err := gorm.Open(sqlite.Open("app.db"), &gorm.Config{})
	if err != nil {
		panic(err)
	}
	db.AutoMigrate(&User{}, &Post{})

	_ = gorm.G[User](db).Create(ctx, &User{Email: "a@example.com", Posts: []Post{{Title: "hello"}}})

	user, err := gorm.G[User](db).Preload("Posts", nil).Where("email = ?", "a@example.com").First(ctx)
	fmt.Println(user.Email, len(user.Posts), err)
}
```

## 자주 쓰는 패턴
- **트랜잭션**: `db.Transaction(func(tx *gorm.DB) error { ... })` — 콜백이 오류를 반환하면 롤백.
- **컨텍스트 전파**: 기존 API 는 `db.WithContext(ctx)` 로 요청 취소·타임아웃을 전달한다. 제네릭 API 는 메서드 인자로 받는다.
- **운영 마이그레이션**: `AutoMigrate` 는 개발용으로 두고, 운영은 golang-migrate·Atlas 같은 버전 관리형 마이그레이션 도구를 쓴다.
- **SQL 로깅**: `gorm.Config{Logger: logger.Default.LogMode(logger.Info)}` 로 생성된 SQL 을 확인해 N+1 을 찾는다.
- **웹 연동**: [Gin](/develop-wiki/backend/web-framework/gin/) 핸들러에서 앱 시작 시 만든 `*gorm.DB` 를 공유한다(내부에 연결 풀이 있다).

## 언제 쓰나 / 피할 때
- 쓸 때: CRUD 위주 Go 서비스, 관리자 도구, 연관관계·소프트 삭제·훅을 빠르게 쓰고 싶을 때.
- 피할 때(대안): 쿼리 성능·명시성이 중요하면 SQL 에서 코드를 생성하는 sqlc 나 pgx 직접 사용, 스키마 우선 코드 생성 ORM 을 원하면 ent.

## 공식 문서
- [GORM 가이드](https://gorm.io/docs/) · [모델 선언](https://gorm.io/docs/models.html) · [연관관계](https://gorm.io/docs/belongs_to.html) · [트랜잭션](https://gorm.io/docs/transactions.html)
