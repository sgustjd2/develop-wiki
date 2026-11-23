---
name: Dio
url: https://pub.dev/packages/dio
docs: https://pub.dev/documentation/dio/latest/
repo: https://github.com/cfug/dio
stars: 12842
domain: mobile
category: cross-platform
description: Dart·Flutter 용 HTTP 클라이언트. 인터셉터, 요청 취소, 폼 데이터·파일 업로드, 타임아웃, 어댑터 교체를 지원해 http 패키지보다 많은 기능이 필요할 때 쓴다.
pricing: oss
tags: [flutter, http, networking, interceptor]
languages: [dart]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Dio 는 공통 설정(`BaseOptions`)과 인터셉터 체인, 취소 토큰, 업로드·다운로드 진행률을 갖춘 Dart HTTP 클라이언트다. Flutter 모바일·웹·데스크톱과 서버 Dart 에서 모두 쓴다. 단순 호출에는 공식 `http` 패키지로 충분하고, 인증 토큰 갱신·로깅·재시도 같은 공통 처리가 필요할 때 Dio 를 선택한다.

- 최신 **5.11.1**(2026-09-04, pub.dev), MIT. 저장소는 CFUG(Chinese Flutter User Group) 조직이 유지한다.

## 설치
```bash
flutter pub add dio   # Dart 전용이면 dart pub add dio
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `Dio` / `BaseOptions` | 클라이언트와 기본 URL·타임아웃·헤더 |
| `Interceptor` | `onRequest`/`onResponse`/`onError` 훅 체인 |
| `Response<T>` | `data`, `statusCode`, `headers` |
| `DioException` | 오류 타입(`type`: 타임아웃, 응답 오류, 취소 등) |
| `CancelToken` | 진행 중 요청 취소 |
| `FormData` | multipart 업로드 |
| `HttpClientAdapter` | 실제 전송 계층 교체(테스트·플랫폼별) |

## 기본 사용법
```dart
import 'package:dio/dio.dart';

final dio = Dio(BaseOptions(
  baseUrl: 'https://example.com/api',
  connectTimeout: const Duration(seconds: 5),
  receiveTimeout: const Duration(seconds: 10),
));

Future<void> main() async {
  dio.interceptors.add(InterceptorsWrapper(
    onRequest: (options, handler) {
      options.headers['Authorization'] = 'Bearer <token>';
      handler.next(options);
    },
  ));

  try {
    final res = await dio.get<Map<String, dynamic>>('/todos/1');
    print(res.data?['title']);
    await dio.post('/todos', data: {'title': '공부'});
  } on DioException catch (e) {
    print('실패: ${e.type} ${e.response?.statusCode}');
  }
}
```

## 자주 쓰는 패턴
- **토큰 갱신.** `onError` 에서 401 이면 토큰을 갱신하고 `dio.fetch(e.requestOptions)` 로 재시도한다(동시 갱신 방지를 위해 잠금 필요).
- **취소.** 화면 이탈 시 `cancelToken.cancel()`, 요청에 `cancelToken:` 전달.
- **업로드.** `FormData.fromMap({'file': await MultipartFile.fromFile(path)})` 와 `onSendProgress`.
- **로깅.** 개발 모드에서만 로깅 인터셉터를 추가한다. 인증 헤더는 마스킹한다.
- **테스트.** 어댑터를 가짜로 바꾸거나 Dio 를 인터페이스 뒤에 숨겨 주입한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 인터셉터·취소·업로드 진행률이 필요한 앱 API 클라이언트.
- 피할 때(대안): 요청이 몇 개뿐이면 `package:http`. 타입 안전한 REST 클라이언트 코드 생성은 Retrofit(Dart) 같은 도구를 위에 얹는다.

## 공식 문서
- [pub.dev dio](https://pub.dev/packages/dio) · [API 문서](https://pub.dev/documentation/dio/latest/) · [GitHub](https://github.com/cfug/dio)
