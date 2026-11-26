---
name: Appsmith
url: https://www.appsmith.com
docs: https://docs.appsmith.com
repo: https://github.com/appsmithorg/appsmith
stars: 41314
domain: oss
category: self-hosted
description: 위젯을 끌어 놓고 DB·REST API 쿼리를 연결해 관리자 화면·내부 도구를 만드는 로우코드 플랫폼. Community Edition 은 Apache-2.0, 상용 기능은 별도 Commercial 이미지로 제공된다.
pricing: oss
tags: [internal-tools, low-code, admin-panel, crud, self-hosted]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Appsmith 는 테이블·폼·차트 같은 위젯을 캔버스에 배치하고, PostgreSQL·MySQL·MongoDB·REST·GraphQL 등 데이터 소스에 대한 쿼리를 연결해 사내 관리 도구를 만드는 플랫폼이다. 위젯 속성과 로직은 `{{ }}` 안의 JavaScript 로 바인딩한다. Retool 의 오픈소스 대안 위치. 2026-11 기준 최신 릴리스는 `v2.7.0`. 저장소는 Apache-2.0 이며, Docker 이미지는 Community(`appsmith-ce`)와 Commercial(`appsmith-ee`, SSO·감사 로그 등 유료 기능) 두 가지다.

## Docker Compose 빠른 시작
```yaml
# compose.yaml — 단일 컨테이너(내부에 MongoDB·Redis 포함)
services:
  appsmith:
    image: index.docker.io/appsmith/appsmith-ce:v2.7.0
    container_name: appsmith
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./stacks:/appsmith-stacks
    restart: unless-stopped
```
```bash
docker compose up -d     # http://localhost 에서 관리자 계정 생성
```
태그를 생략하면 `latest` 가 되므로 공식 문서도 버전 태그 고정을 권한다. 설정·데이터·백업은 모두 `./stacks` 아래에 쌓인다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Application / Page | 앱 하나와 그 안의 페이지 |
| Widget | Table, Form, Input, Select, Chart, Modal 등 UI 블록 |
| Datasource | DB·API 연결 정보 (자격 증명은 서버에 저장) |
| Query / API | 데이터 소스에 보내는 SQL·HTTP 요청. 위젯 값으로 파라미터화 |
| JS Object | 여러 쿼리를 조합하는 JavaScript 함수 모음 |
| Binding | `{{ Table1.selectedRow.id }}` 처럼 위젯·쿼리 상태를 참조 |
| Git sync | 앱을 Git 저장소에 연결해 브랜치·PR 로 관리 |

## 개발에서 쓰는 방법
- **CRUD 관리자 화면:** 운영 DB 테이블을 조회·수정하는 화면을 쿼리 몇 개로 구성.
```sql
-- Query: updateUser (Run 시 Table1 에서 선택한 행 갱신)
UPDATE users SET status = {{ Select1.selectedOptionValue }}
WHERE id = {{ Table1.selectedRow.id }};
```
```javascript
// JS Object
export default {
  async save() {
    await updateUser.run();
    await getUsers.run();
    showAlert('저장했습니다', 'success');
  },
};
```
- **CS·운영 도구:** 주문 조회, 환불 처리, 기능 플래그 토글 같은 내부 화면을 API 와 연결.
- **Git 기반 협업:** 앱을 Git 에 연결해 개발·운영 환경을 브랜치로 분리.

## 운영 주의: 백업·업데이트·보안
- **백업:** `docker compose exec -it appsmith appsmithctl backup` 이 `./stacks/data/backup/` 에 암호화된 아카이브를 만든다. 입력한 암호가 있어야 복원할 수 있다. `--non-interactive` 로 만들면 암호화되지 않으므로 `APPSMITH_ENCRYPTION_PASSWORD`·`APPSMITH_ENCRYPTION_SALT` 값을 따로 보관해야 한다.
- **업데이트:** 이미지 태그를 올리고 재시작. 큰 버전 간 이동은 공식 업그레이드 가이드를 확인하고 백업 후 진행한다.
- **보안:** 데이터 소스 자격 증명이 Appsmith 에 저장되므로 DB 계정은 필요한 권한만 주고(읽기 전용 계정 분리 등), 회원가입을 막고 HTTPS 로 운영한다. 인스턴스 공개 범위는 사내망·VPN 이 안전하다.

## 언제 쓰나 / 피할 때
- 쓸 때: 프런트엔드 개발 없이 빠르게 내부 관리 화면이 필요할 때.
- 피할 때(대안): 비슷한 도구로 ToolJet(AGPL-3.0)이 있다. 고객용 제품 UI 처럼 디자인·성능 제어가 중요하면 직접 [React](/develop-wiki/frontend/framework/react/) 등으로 만든다. 데이터 탐색·차트 위주면 [Metabase](/develop-wiki/data-ml/analytics-bi/metabase/).

## 공식 문서
- [Docker 설치](https://docs.appsmith.com/getting-started/setup/installation-guides/docker) · [인스턴스 백업](https://docs.appsmith.com/getting-started/setup/instance-management/backup-and-restore/backup-instance) · [문서 홈](https://docs.appsmith.com)
