---
name: Awesome-Selfhosted
url: https://awesome-selfhosted.net/
repo: https://github.com/awesome-selfhosted/awesome-selfhosted
stars: 340406
domain: oss
category: awesome-lists
description: 직접 서버에 띄워 쓸 수 있는 자유 소프트웨어 웹 서비스를 분야별로 정리한 목록. SaaS 대체재나 사내·홈랩용 서비스를 고를 때 쓴다.
pricing: oss
tags: [self-hosted, homelab, foss, saas-alternative]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
분석, 자동화, 백업, 위키, 메일, 파일 동기화, 모니터링 등 **자기 서버에서 운영할 수 있는 자유 소프트웨어 네트워크 서비스·웹 애플리케이션**을 모은 목록이다. 항목마다 라이선스와 배포 방식(Docker, Python, Go 등)을 꼬리표로 달고, 외부 독점 서비스에 의존하면 `⚠` 표시를 붙인다. 비자유 소프트웨어는 별도 non-free 페이지로 분리한다. 2026-11 기준 별 약 33.8만, 목록 라이선스 CC-BY-SA-3.0.

데이터는 `awesome-selfhosted-data` 저장소의 YAML 에서 생성되고, 죽은 링크·유지보수 중단 프로젝트를 자동으로 점검한다. 커밋이 매주 이어진다(마지막 2026-11-17). README 에도 **HTML 판(awesome-selfhosted.net)을 권장**한다고 적혀 있다.

## 무엇이 들어 있나
| 섹션 | 내용 |
| --- | --- |
| Software | 분야별 목록 (Analytics, Automation, Backup, Blogging, Calendar, CMS, CRM, DNS, Document Management, Feed Readers, File Transfer, Generative AI, Identity Management, Monitoring, Note-taking, Pastebins, Wikis 등) |
| 항목 형식 | 이름 · `⚠`(독점 서비스 의존) · 설명 · Demo/Source 링크 · 라이선스 · 배포 플랫폼 |
| non-free.md | 소스 비공개·비자유 라이선스 항목 |
| List of Licenses | 꼬리표에 쓰인 라이선스 설명 |

## 이렇게 활용하라
1. **HTML 판에서 태그·플랫폼으로 거른다.** awesome-selfhosted.net 은 분야·라이선스·플랫폼별 페이지를 제공해 README 보다 찾기 쉽다.
2. **라이선스 꼬리표를 먼저 본다.** 사내 배포·수정 계획이 있으면 AGPL/GPL 여부를 확인한다.
3. **배포 꼬리표가 `Docker` 인 것부터 시험한다.** 대부분 compose 파일 하나로 띄워 볼 수 있다.
   ```bash
   docker compose up -d   # 각 프로젝트 문서의 compose 예제로 로컬 시험
   ```
4. **Demo 링크로 먼저 써 본다.** 설치 전에 UI 와 기능이 요구와 맞는지 확인한다.
5. **운영 부담을 따진다.** 백업·업데이트·인증(SSO) 연동을 누가 맡을지 정한 뒤 도입한다.

## 주의
- 목록에 올라 있다는 것이 보안 감사나 운영 품질을 보장하지 않는다. 각 프로젝트의 최근 릴리스·이슈를 확인한다.
- `⚠` 항목은 외부 서비스가 바뀌면 동작이 깨질 수 있다.
- 영어 자료이며 한국어 번역은 없다.

## 링크
- [HTML 판](https://awesome-selfhosted.net/) · [저장소 README](https://github.com/awesome-selfhosted/awesome-selfhosted) · [데이터 저장소](https://github.com/awesome-selfhosted/awesome-selfhosted-data) · [non-free 목록](https://github.com/awesome-selfhosted/awesome-selfhosted/blob/master/non-free.md)
- 이 사이트: [Awesome Sysadmin](/develop-wiki/oss/awesome-lists/awesome-sysadmin/)(운영 도구 쪽) · [Awesome Docker](/develop-wiki/oss/awesome-lists/awesome-docker/) · [Docker](/develop-wiki/backend/infra-devops/docker/)
