---
name: Monado
url: https://monado.freedesktop.org
docs: https://monado.freedesktop.org/getting-started.html
repo: https://gitlab.freedesktop.org/monado/monado
domain: xr
category: standards-runtimes
description: Collabora가 주도하는 Boost 라이선스 오픈소스 OpenXR 런타임. 리눅스 중심으로 VR 헤드셋 드라이버와 추적을 제공한다.
pricing: oss
tags: [openxr, runtime, linux, open-source, freedesktop]
languages: [cpp]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Monado는 OpenXR 표준을 구현한 오픈소스 런타임이다. freedesktop.org GitLab에서 개발되고(GitHub 저장소가 아니라 GitLab 프로젝트), 리눅스에서 SteamVR 없이 OpenXR 앱을 돌리는 용도로 널리 쓰이며 Android 지원도 있다. 헤드셋 드라이버(여러 기기·시뮬레이션 포함), 위치 추적, 컴포지터를 한 코드베이스로 제공한다.

- 확인 기준: GitLab 최신 릴리스 태그 `v25.1.0`, 프로젝트 별 151개, 최근 활동 2026-11-18. 라이선스는 저장소 LICENSE 본문이 Boost Software License 형식(BSL-1.0)이다.
- 별 수는 GitLab 기준이라 `stars` 필드에는 쓰지 않았다.

## 설치
배포판 패키지를 쓰거나 소스에서 빌드한다. 패키지 이름은 배포판마다 다르니 [공식 시작 문서](https://monado.freedesktop.org/getting-started.html)를 따른다.
```bash
git clone https://gitlab.freedesktop.org/monado/monado.git
cmake -S monado -B build -G Ninja && cmake --build build
```
빌드 시 지원할 드라이버·기능은 CMake 옵션으로 고른다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `monado-service` | 런타임의 서비스 프로세스(컴포지터·장치 관리) |
| OpenXR 런타임 매니페스트 | 로더가 런타임을 찾는 JSON(`active_runtime.json`) |
| Out-of-process 컴포지터 | 서비스가 프레임 합성, 앱은 클라이언트 라이브러리로 연결 |
| 드라이버 | 헤드셋·컨트롤러·추적 장치 지원 모듈 |
| Simulated(`qwerty`) 드라이버 | 헤드셋 없이 키보드·마우스로 시험 |

## 기본 사용법
```bash
# 1) 서비스 실행
monado-service &
# 2) 해당 런타임을 활성으로 지정(필요할 때)
export XR_RUNTIME_JSON=/usr/share/openxr/1/openxr_monado.json
# 3) OpenXR 앱 실행 (예: OpenXR-SDK-Source 의 hello_xr)
hello_xr -g Vulkan2
```
`XR_RUNTIME_JSON` 경로는 설치 위치에 따라 다르다. 헤드셋 없이는 시뮬레이션 드라이버를 활성화해 확인한다.

## 자주 쓰는 패턴
- 런타임 개발 중에는 `XR_RUNTIME_JSON`으로 Monado와 다른 런타임을 번갈아 시험한다.
- OpenXR 앱 CI에서 시뮬레이션 드라이버로 헤드리스에 가깝게 검증한다.
- 새 기기 드라이버를 만들고 싶으면 `src/xrt/drivers/`를 참고한다.
- 로그는 `XRT_*` 환경변수(예: `XRT_COMPOSITOR_LOG`)로 상세도를 조절한다. 변수 이름은 문서를 확인한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 리눅스 VR, 오픈소스 스택, 런타임·드라이버 연구, OpenXR 호환성 검증.
- 피할 때: 상용 헤드셋의 전체 기능·안정성이 필요하면 해당 벤더 런타임이나 SteamVR이 더 완성도 높다.

## 공식 문서
- [시작하기](https://monado.freedesktop.org/getting-started.html) · [저장소](https://gitlab.freedesktop.org/monado/monado)
- 관련: [OpenXR](/develop-wiki/xr/standards-runtimes/openxr/)
