---
name: Public APIs
url: https://github.com/public-apis/public-apis
repo: https://github.com/public-apis/public-apis
stars: 499964
domain: oss
category: awesome-lists
description: 무료로 쓸 수 있는 공개 API 를 분야별 표(인증 방식·HTTPS·CORS 표시)로 정리한 저장소. 토이 프로젝트·데모·학습용 데이터 소스를 찾을 때 쓴다.
pricing: oss
tags: [api, public-api, rest, sample-data, side-project]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
날씨, 환율, 도서, 공공 데이터, 테스트 데이터 등 수십 개 분야의 무료 공개 API 를 한 README 에 모은 목록이다. 각 API 를 한 줄로 설명하고 **Auth(apiKey·OAuth·없음), HTTPS 지원, CORS 허용 여부**를 표로 표시해 프런트엔드에서 바로 호출 가능한지 가늠할 수 있다. 2026-11 기준 별 약 50만, 라이선스 MIT.

archived 가 아니며 최근 6개월에도 커밋이 활발하다(마지막 커밋 2026-11-15).

## 무엇이 들어 있나
| 섹션 | 내용 |
| --- | --- |
| APILayer APIs / MCP Servers | README 맨 위의 후원사(APILayer) 제품 소개 영역 |
| Index | 분야 목차 |
| 개발용 분야 | Authentication & Authorization, Continuous Integration, Data Validation, Development, Programming, Test Data, URL Shorteners |
| 데이터 분야 | Open Data, Government, Geocoding, Weather, Currency Exchange, Finance, Transportation |
| 콘텐츠 분야 | Books, Music, Video, News, Photography, Anime, Games & Comics, Food & Drink 등 |
| 머신러닝·텍스트 | Machine Learning, Text Analysis, Dictionaries |
| 표 열 | API, Description, Auth, HTTPS, CORS |

## 이렇게 활용하라
1. **필요한 분야 섹션으로 바로 간다.** 예: 프런트엔드 연습용이면 Test Data, Open Data, Weather 부터 본다.
2. **Auth 열로 난이도를 고른다.** `No` 는 키 없이 호출 가능, `apiKey` 는 가입 후 키 발급, `OAuth` 는 인증 흐름 구현이 필요하다.
3. **CORS 열을 확인한다.** `No` 나 `Unknown` 이면 브라우저에서 직접 호출할 때 막힐 수 있으니 서버(또는 서버리스 함수)에서 프록시한다.
4. **실제로 한 번 호출해 본다.** 목록이 커서 응답이 없거나 유료로 바뀐 API 가 섞여 있다.
   ```bash
   curl -s "https://api.example.com/..." | head   # 문서의 예제 엔드포인트로 생존 확인
   ```
5. **키는 환경 변수로 둔다.** 데모라도 저장소에 키를 커밋하지 않는다.

## 주의
- 링크 생존과 약관 변경은 실시간으로 반영되지 않는다. 상용 서비스에 쓰기 전에는 각 API 의 이용 약관·요금·호출 한도를 직접 확인한다.
- README 상단의 APILayer 섹션은 후원 광고다. 공개 API 목록 본문은 Index 이후다.
- 한국 공공데이터(공공데이터포털 등)는 거의 없다. 영어 자료다.

## 링크
- [저장소 README](https://github.com/public-apis/public-apis) · [기여 가이드](https://github.com/public-apis/public-apis/blob/master/CONTRIBUTING.md)
- 이 사이트: [Awesome](/develop-wiki/oss/awesome-lists/awesome/)(다른 리스트 찾기) · [Project Based Learning](/develop-wiki/oss/learning-repos/project-based-learning/)(API 를 쓸 프로젝트 아이디어)
