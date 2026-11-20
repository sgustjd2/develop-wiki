---
name: Alamofire
url: https://github.com/Alamofire/Alamofire
docs: https://alamofire.github.io/Alamofire/
repo: https://github.com/Alamofire/Alamofire
stars: 42397
domain: mobile
category: ios
description: Swift용 HTTP 네트워킹 라이브러리. URLSession 위에서 요청 체이닝, 응답 검증, Codable 디코딩, 인터셉터(재시도·인증), 업로드·다운로드를 제공한다.
pricing: oss
tags: [networking, http, urlsession, codable]
languages: [swift]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Alamofire 는 `URLSession` 을 감싸 요청 구성, 검증, 응답 직렬화, 재시도, 인증 갱신을 선언적으로 쓰게 하는 라이브러리다. 간단한 호출은 `URLSession` + `async/await` 로도 충분해졌으므로, 인터셉터·업로드 진행률·요청 단위 이벤트 같은 부가 기능이 필요할 때 선택한다.

- 최신 릴리스 **5.12.2**(2026-09-10), MIT.
- 대안: 표준 `URLSession`(의존성 없음), 서버 API 스펙에서 생성하는 Swift OpenAPI Generator.

## 설치
```swift
.package(url: "https://github.com/Alamofire/Alamofire.git", from: "5.12.2")
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `AF` | 기본 `Session` 싱글턴. 전용 설정이 필요하면 `Session(...)` 을 직접 만든다 |
| `Request` | `DataRequest`, `UploadRequest`, `DownloadRequest`. 체이닝으로 검증·응답 처리 |
| `validate()` | 상태 코드·Content-Type 검사. 실패는 `AFError` |
| `RequestInterceptor` | `adapt`(요청 수정, 토큰 부착) + `retry`(재시도 정책) |
| `ServerTrustManager` | 인증서 검증·핀닝 정책 |
| `serializingDecodable` | `async/await` 로 `Decodable` 응답을 받는 API |

## 기본 사용법
```swift
import Alamofire

struct Todo: Decodable { let id: Int; let title: String }

// async/await
func fetchTodo() async throws -> Todo {
    try await AF.request("https://example.com/todos/1")
        .validate()
        .serializingDecodable(Todo.self)
        .value
}

// 클로저 방식 + 파라미터
AF.request("https://example.com/todos", method: .post,
           parameters: ["title": "공부"], encoder: JSONParameterEncoder.default)
    .validate()
    .responseDecodable(of: Todo.self) { response in
        print(response.result)
    }
```

## 자주 쓰는 패턴
- **토큰 부착·갱신.** `RequestInterceptor` 에서 `adapt` 로 Authorization 헤더를 넣고, 401 이면 `retry` 에서 갱신 후 재시도한다.
- **공통 Session.** `Session(interceptor: AuthInterceptor())` 를 앱 전체에서 공유한다.
- **업로드·진행률.** `AF.upload(multipartFormData:to:)` 후 `.uploadProgress { p in ... }`.
- **다운로드.** `AF.download(url, to: destination)` 로 파일 저장, 재개 데이터 지원.
- **테스트.** `URLProtocol` 스텁을 `URLSessionConfiguration.protocolClasses` 에 넣은 Session 을 주입한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 인증 갱신·재시도·업로드 진행률 등 요청 공통 정책이 많은 앱.
- 피할 때(대안): 요청이 몇 개뿐이면 `URLSession` 의 `data(for:)`. 의존성을 줄이고 싶은 신규 프로젝트.

## 공식 문서
- [문서 사이트](https://alamofire.github.io/Alamofire/) · [Usage 가이드](https://github.com/Alamofire/Alamofire/blob/master/Documentation/Usage.md)
