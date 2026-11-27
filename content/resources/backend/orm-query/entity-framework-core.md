---
name: Entity Framework Core
url: https://learn.microsoft.com/ef/core/
docs: https://learn.microsoft.com/ef/core/
repo: https://github.com/dotnet/efcore
stars: 14827
domain: backend
category: orm-query
description: .NET 의 공식 ORM. C# 클래스와 LINQ 로 DB 를 다루고 코드 우선 마이그레이션을 제공해 ASP.NET Core 서비스의 데이터 계층에 쓴다.
pricing: oss
tags: [csharp, dotnet, orm, linq, migration]
languages: [csharp]
koreanDocs: true
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Entity Framework Core(EF Core)는 Microsoft 가 만드는 .NET ORM 으로, `DbContext` 와 엔티티 클래스로 모델을 정의하고 LINQ 쿼리를 SQL 로 번역한다. 변경 추적기가 엔티티 수정 사항을 모아 `SaveChanges` 때 반영하며, 코드 우선(Code First) 마이그레이션으로 스키마를 관리한다. SQL Server, SQLite, PostgreSQL(Npgsql), MySQL, Cosmos DB 등을 공급자 패키지로 지원한다.

EF Core 는 .NET 과 같은 주기로 나온다: **EF Core 11**(2026-11, .NET 11 STS), **EF Core 10**(.NET 10 LTS). 서드파티 공급자는 출시가 늦을 수 있어, 2026-11 기준 Npgsql 공급자는 11.0 RC 단계다. 웹 계층은 [ASP.NET Core](/develop-wiki/backend/web-framework/aspnet-core/), 런타임은 [.NET](/develop-wiki/backend/runtime-language/dotnet/) 항목 참고.

## 설치
```bash
dotnet add package Microsoft.EntityFrameworkCore.Sqlite      # 또는 Npgsql.EntityFrameworkCore.PostgreSQL
dotnet add package Microsoft.EntityFrameworkCore.Design
dotnet tool install --global dotnet-ef
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `DbContext` | 연결·변경 추적·쿼리의 단위. 요청 범위(Scoped)로 등록 |
| `DbSet<T>` | 테이블에 대응하는 엔티티 집합 |
| 규칙·구성 | 이름 규칙(`Id` = 키) + 데이터 주석 + `OnModelCreating` 의 Fluent API |
| 변경 추적 | 조회한 엔티티를 수정하면 `SaveChanges` 시 UPDATE |
| 마이그레이션 | `dotnet ef migrations add`, `dotnet ef database update` |
| 로딩 | `Include`(즉시), 명시적 로딩, 지연 로딩(프록시, 선택) |
| 일괄 작업 | `ExecuteUpdateAsync`·`ExecuteDeleteAsync` 로 엔티티를 읽지 않고 SQL 한 번에 처리 |

## 기본 사용법
```csharp
using Microsoft.EntityFrameworkCore;

await using var db = new AppDb();
await db.Database.EnsureCreatedAsync();          // 실습용. 운영은 마이그레이션

db.Blogs.Add(new Blog { Url = "https://example.com", Posts = [new Post { Title = "hello" }] });
await db.SaveChangesAsync();

var blogs = await db.Blogs
    .Include(b => b.Posts)
    .Where(b => b.Url.Contains("example"))
    .AsNoTracking()
    .ToListAsync();

await db.Posts.Where(p => p.Title == "hello")
    .ExecuteUpdateAsync(s => s.SetProperty(p => p.Title, "hi"));

public class AppDb : DbContext
{
    public DbSet<Blog> Blogs => Set<Blog>();
    public DbSet<Post> Posts => Set<Post>();
    protected override void OnConfiguring(DbContextOptionsBuilder o) => o.UseSqlite("Data Source=app.db");
}
public class Blog { public int Id { get; set; } public required string Url { get; set; } public List<Post> Posts { get; set; } = []; }
public class Post { public int Id { get; set; } public required string Title { get; set; } public int BlogId { get; set; } }
```

## 자주 쓰는 패턴
- **DI 등록**: ASP.NET Core 에서 `builder.Services.AddDbContext<AppDb>(o => o.UseNpgsql(connStr))` 로 등록하고 생성자 주입. 고부하 서비스는 `AddDbContextPool`.
- **읽기 전용 조회**: `AsNoTracking()` 으로 변경 추적 비용을 없앤다.
- **마이그레이션 배포**: `dotnet ef migrations bundle` 로 실행 파일 형태 마이그레이션을 만들어 CI/CD 에서 적용하거나, `dotnet ef migrations script --idempotent` 로 SQL 을 검토 후 적용.
- **N+1·카테시안 폭발**: 여러 컬렉션을 `Include` 할 때 `AsSplitQuery()` 로 쿼리를 나눈다.
- **생성 SQL 확인**: `query.ToQueryString()` 이나 로깅(`LogTo(Console.WriteLine)`)으로 번역된 SQL 을 본다.

## 언제 쓰나 / 피할 때
- 쓸 때: .NET 서비스의 기본 데이터 계층, LINQ 로 타입 안전하게 쿼리하고 마이그레이션까지 한 도구로 관리하고 싶을 때.
- 피할 때(대안): 손으로 쓴 SQL 의 성능·통제가 우선이면 Dapper, 대량 적재·복잡한 리포팅은 원시 SQL 이나 전용 도구.

## 공식 문서
- [EF Core 개요](https://learn.microsoft.com/ef/core/) · [시작하기](https://learn.microsoft.com/ef/core/get-started/overview/first-app) · [마이그레이션](https://learn.microsoft.com/ef/core/managing-schemas/migrations/) · [EF Core 새 기능](https://learn.microsoft.com/ef/core/what-is-new/)
