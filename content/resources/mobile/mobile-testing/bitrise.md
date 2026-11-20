---
name: Bitrise
url: https://bitrise.io
docs: https://docs.bitrise.io/en/bitrise-ci
repo: https://github.com/bitrise-io/bitrise
stars: 903
domain: mobile
category: mobile-testing
description: 모바일 앱 빌드·테스트·코드 서명·배포를 워크플로(bitrise.yml)로 구성하는 호스팅 CI/CD 서비스. 오픈소스 Bitrise CLI 로 워크플로를 로컬에서도 실행한다.
pricing: freemium
tags: [ci-cd, mobile, workflow, code-signing, bitrise-cli, ios, android]
languages: []
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Bitrise 는 모바일 팀을 위한 CI/CD 서비스다. 저장소를 연결하면 빌드 머신(macOS·Linux 스택)에서 **워크플로**가 실행되고, 워크플로는 순서대로 실행되는 **스텝**(Git 클론, 빌드, 테스트, 서명, 배포 등)의 모음이다. 설정은 루트 파일 `bitrise.yml` 에 저장되며 웹의 Workflow Editor 로 편집하거나 YAML 을 직접 고칠 수 있다.

- 서비스는 상용이고, 워크플로 러너인 **Bitrise CLI**(`bitrise-io/bitrise`)는 MIT 오픈소스다(최신 v3.4.1, 2026-11-03). 서비스 가격은 `freemium` 으로 분류한다.
- 가격(확인일 기준): 가격 페이지에는 무료 Hobby(월 500 빌드 분, 비공개 앱 1개), Starter(월 $89부터, 연 결제), Pro(월 $200부터, 연 결제), Enterprise(협의)가 표시된다. 반면 시작하기 문서는 가입 후 30일 체험 또는 Pro 구독이 있어야 CI 빌드를 시작할 수 있다고 안내한다. 두 페이지가 어긋나므로 도입 전에 [가격 페이지](https://bitrise.io/pricing)와 계정 화면에서 직접 확인한다.
- 대안: [Codemagic](/develop-wiki/mobile/mobile-testing/codemagic/)(모바일 특화 SaaS), GitHub Actions(macOS 러너), 직접 구성한 [Fastlane](/develop-wiki/mobile/mobile-testing/fastlane/) 파이프라인.

## 설치
호스팅 서비스는 설치할 것이 없다. 가입 후 Dashboard 에서 **New project → Configure Bitrise CI** 마법사로 저장소·CI 설정·빌드 설정을 마치면 첫 빌드가 시작된다. 워크플로를 로컬에서 검증·실행하려면 CLI 를 설치한다.
```bash
brew install bitrise        # 또는 nix-shell -p bitrise, GitHub 릴리스의 바이너리
bitrise yml validate        # bitrise.yml 검증
bitrise local run <워크플로 id>   # 워크플로 로컬 실행
bitrise :workflow-editor    # localhost 에서 Workflow Editor 실행
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Workflow | 스텝을 순서대로 실행하는 단위. 하나의 빌드는 기본적으로 한 워크플로를 실행 |
| Step | 스크립트 실행 블록. 스텝 라이브러리(`bitrise-steplib`)에서 가져옴 |
| Pipeline / Stage | 워크플로를 단계(Stage)로 묶어, 한 Stage 안의 워크플로를 병렬로 실행 |
| `bitrise.yml` | 위 모든 설정을 담은 루트 설정 파일 |
| Stack | 빌드가 도는 OS·Xcode·Android 도구 이미지 |
| Code signing | iOS 인증서·프로비저닝 프로필, Android keystore 관리 |

## 기본 사용법
최소 구성은 워크플로 하나와 스크립트 스텝이다. 아래는 구조를 보이기 위해 직접 작성한 예시이며, 실제 스텝 이름·입력은 스텝 라이브러리 문서로 확인한다.
```yaml
format_version: "17"
default_step_lib_source: https://github.com/bitrise-io/bitrise-steplib.git

workflows:
  primary:
    steps:
    - script:
        title: Hello
        inputs:
        - content: echo "build on Bitrise"
```
워크플로를 이어 붙일 때는 `before_run` 에 먼저 실행할 워크플로 id 를 나열한다(Bitrise 공식 샘플 `bitrise.yml` 이 이 방식으로 인증서 설치 워크플로를 재사용한다). 코드 이벤트 자동 실행은 빌드 설정의 웹훅·트리거에서 구성한다.

## 자주 쓰는 패턴
- **PR 검증용 / 배포용 워크플로 분리**: 테스트 워크플로와 서명·스토어 업로드 워크플로를 나눠 트리거를 다르게 건다.
- **로컬 사전 검증**: 푸시 전에 `bitrise yml validate` 로 YAML 을 확인한다.
- **서명 정보는 서비스에 보관**: 인증서·keystore 는 코드 서명 설정에 올리고 저장소에 커밋하지 않는다.
- **테스트 확장**: 안드로이드 단위 테스트, iOS 단위·UI 테스트, Firebase 를 통한 기기 테스트 옵션이 공식 문서에 소개된다.

## 언제 쓰나 / 피할 때
- 쓸 때: 모바일 빌드·서명·스토어 배포를 한 곳에서 관리하고 싶고 macOS 빌드 머신을 직접 운영하기 싫을 때.
- 피할 때(대안): 모든 CI 를 GitHub Actions 로 통일하고 싶거나, 사용량 과금 구조가 부담스러운 소규모 프로젝트는 대안을 비교한다.

## 공식 문서
- [Bitrise CI 시작하기](https://docs.bitrise.io/en/bitrise-ci/getting-started/getting-started) · [워크플로 개요](https://docs.bitrise.io/en/bitrise-ci/workflows-and-pipelines/workflows/workflows-overview) · [iOS 코드 서명](https://docs.bitrise.io/en/bitrise-ci/code-signing/ios-code-signing/ios-code-signing) · [CLI 저장소](https://github.com/bitrise-io/bitrise)
