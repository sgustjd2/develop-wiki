---
name: SwiftData
url: https://developer.apple.com/documentation/swiftdata
docs: https://developer.apple.com/documentation/swiftdata
domain: mobile
category: ios
description: Swift 매크로로 모델을 선언하는 Apple의 로컬 영속성 프레임워크(iOS 17+). SwiftUI와 바로 연결되며 Core Data를 대신해 앱 데이터를 기기에 저장할 때 쓴다.
pricing: free
tags: [persistence, database, orm, apple]
languages: [swift]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
SwiftData는 Swift 클래스에 `@Model` 매크로를 붙이면 그대로 저장 가능한 모델이 되는 영속성 프레임워크다. Core Data의 저장 엔진 위에서 동작하지만 `.xcdatamodeld` 파일 없이 코드만으로 스키마를 정의하고, SwiftUI의 `@Query`로 화면과 연결된다. iOS 17 / macOS 14 이상에서 쓸 수 있다.

- iCloud(CloudKit) 동기화, 스키마 버전 관리·마이그레이션을 지원한다.
- 언어는 [Swift](/develop-wiki/languages/swift/). 순수 SQL을 직접 다루려면 [SQLite](/develop-wiki/backend/database/sqlite/) 계열 라이브러리가 대안이다.

## 설치
Xcode에 포함된 시스템 프레임워크다. `import SwiftData` 후 앱 진입점에 컨테이너를 붙인다. 새 프로젝트 생성 시 Storage를 **SwiftData**로 고르면 기본 코드가 만들어진다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `@Model` | 클래스를 영속 모델로 만드는 매크로. 저장 프로퍼티가 곧 스키마 |
| `@Attribute` | `.unique`, `.externalStorage` 등 속성 옵션 |
| `@Relationship` | 관계와 삭제 규칙(`deleteRule: .cascade`), 역관계 지정 |
| `ModelContainer` | 스키마와 저장소 설정(파일 위치, 메모리 전용, CloudKit) |
| `ModelContext` | 객체 삽입·삭제·변경 추적·저장 단위. SwiftUI에서는 `@Environment(\.modelContext)` |
| `@Query` | SwiftUI 뷰에서 정렬·필터 조건으로 모델을 가져오고 변경 시 자동 갱신 |
| `#Predicate` | 타입 안전한 필터 조건 매크로 |
| `FetchDescriptor` | 뷰 밖에서 조회할 때 쓰는 조건·정렬·개수 제한 묶음 |
| `VersionedSchema` / `SchemaMigrationPlan` | 스키마 버전과 마이그레이션 단계 정의 |
| `@ModelActor` | 백그라운드 작업용 액터. 자체 `ModelContext`를 가진다 |

## 기본 사용법
모델 정의와 앱 연결.

```swift
import SwiftUI
import SwiftData

@Model final class Note {
    var title: String
    var createdAt: Date
    init(title: String, createdAt: Date = .now) {
        self.title = title
        self.createdAt = createdAt
    }
}

@main struct NotesApp: App {
    var body: some Scene {
        WindowGroup { NoteListView() }
            .modelContainer(for: Note.self)
    }
}
```

뷰에서 조회·추가·삭제.

```swift
struct NoteListView: View {
    @Environment(\.modelContext) private var context
    @Query(sort: \Note.createdAt, order: .reverse) private var notes: [Note]

    var body: some View {
        List {
            ForEach(notes) { Text($0.title) }
                .onDelete { idx in idx.forEach { context.delete(notes[$0]) } }
        }
        .toolbar { Button("추가") { context.insert(Note(title: "새 메모")) } }
    }
}
```

## 자주 쓰는 패턴
- **필터 조회.** `@Query(filter: #Predicate<Note> { $0.title.contains("회의") })`. 조건이 동적이면 뷰 `init`에서 `_notes = Query(filter:...)`로 만든다.
- **뷰 밖 조회.** `try context.fetch(FetchDescriptor<Note>(predicate: ..., sortBy: [SortDescriptor(\.createdAt)]))`.
- **자동 저장.** 메인 컨텍스트는 변경을 자동 저장한다. 즉시 반영이 필요하면 `try context.save()`.
- **미리보기·테스트는 메모리 저장소.** `ModelConfiguration(isStoredInMemoryOnly: true)`로 컨테이너를 만든다.
- **대량 작업은 `@ModelActor`.** 메인 스레드를 막지 않도록 가져오기·동기화는 백그라운드 컨텍스트에서.

## 언제 쓰나 / 피할 때
- 쓸 때: iOS 17+ 대상 SwiftUI 앱의 로컬 데이터, iCloud 개인 데이터 동기화.
- 피할 때(대안): iOS 16 이하 지원이 필요하면 Core Data. 복잡한 SQL·서버와 같은 스키마 공유가 필요하면 SQLite 기반 라이브러리. Android와 데이터 계층을 공유하려면 [Kotlin Multiplatform](/develop-wiki/mobile/cross-platform/kotlin-multiplatform/) + Room.

## 공식 문서
- [SwiftData 문서](https://developer.apple.com/documentation/swiftdata) · [Preserving your app's model data across launches](https://developer.apple.com/documentation/swiftdata/preserving-your-apps-model-data-across-launches)
