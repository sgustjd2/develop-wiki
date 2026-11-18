---
name: Meta Horizon 개발자 문서·디자인 가이드
url: https://developers.meta.com/horizon/design/
docs: https://developers.meta.com/horizon/design/
domain: xr
category: learning
description: Meta Quest 개발자 사이트의 문서·디자인 가이드 모음. MR·VR 앱의 상호작용, 편안함, 공간 UI 원칙과 Unity·Unreal·Spatial SDK 문서로 이어지는 학습 진입점이다.
pricing: free
tags: [meta, quest, design, mixed-reality, guidelines]
languages: []
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Meta의 개발자 사이트(developers.meta.com/horizon)는 Quest 앱을 만들 때 읽을 문서를 한곳에 모은다. 구성은 크게 (1) 엔진·SDK 문서(Unity, Unreal, Spatial SDK, 네이티브), (2) **디자인 가이드**(MR·VR 경험 원칙), (3) 배포·스토어 요건, (4) 다운로드 페이지(Meta XR SDK 패키지)다. 개발 경로 자체는 [Meta Quest 개발](/develop-wiki/xr/vr-platform/meta-quest-development/) 항목이 정리한다.

- 사이트 주소가 개편 중이라 일부 경로가 `/vr/...`나 `/horizon/documentation/...`으로 리다이렉트된다(확인 시점 기준). 북마크는 상위 주소를 쓴다.
- 문서는 영어가 기준이며 한국어 번역은 일부만 있는 것으로 보이나 범위는 확인하지 못했다.
- 일부 릴리스 노트 요약은 AI로 생성됐다는 표시가 있으므로 정확한 변경 사항은 다운로드 페이지의 버전 상세로 확인한다.

## 이렇게 쓴다
| 목적 | 볼 곳 |
| --- | --- |
| 처음 시작 | 개발 환경 설정 → Unity 또는 Spatial SDK 시작 가이드 → 샘플 빌드 |
| MR 기획 | 디자인 가이드의 MR 항목: 패스스루 사용, 공간 배치, 실내 안전, 편안함 |
| 입력 설계 | 손·컨트롤러 상호작용 가이드, Interaction SDK 문서 |
| 버전 확인 | `downloads/package/meta-xr-core-sdk/`의 What's New |
| 심사 준비 | 배포 요건·VRC(Virtual Reality Checks) 문서 |

## 예제: Spatial SDK 샘플로 학습하기
```bash
git clone https://github.com/meta-quest/Meta-Spatial-SDK-Samples.git
cd Meta-Spatial-SDK-Samples/StarterSample
# Android Studio에서 열고 Quest 기기를 개발자 모드로 연결해 실행
```
샘플은 MIT 라이선스이며 StarterSample 외에 애니메이션·바디 트래킹·커스텀 컴포넌트 등 주제별 폴더가 있다. 문서의 개념(Entity, Component, Panel)을 샘플 코드에서 찾아 읽는 방식이 빠르다.

## 학습 순서 제안
1. 디자인 가이드로 편안함·상호작용 원칙을 먼저 읽는다(멀미, 시야, 거리).
2. 선택한 경로(Unity 또는 Spatial SDK)의 Getting Started를 따라 헤드셋에서 실행한다.
3. 패스스루·앵커·씬 이해를 한 가지씩 추가한다.
4. 성능 도구(OVR Metrics, Quest Developer Hub)로 프레임을 점검한다.
5. 배포 요건 문서로 출시 전 점검한다.

## 언제 쓰나 / 피할 때
- 쓸 때: Quest 전용 기능(패스스루, 씬, Interaction SDK)을 구현하거나 스토어 심사를 준비할 때.
- 피할 때(대안): 플랫폼 중립 개념은 [OpenXR 튜토리얼](/develop-wiki/xr/learning/openxr-tutorial/), Apple·Android 기기 가이드는 [visionOS 디자인](/develop-wiki/xr/learning/visionos-design-guidelines/)·[Android XR 디자인](/develop-wiki/xr/learning/android-xr-design/).

## 공식 문서
- [디자인](https://developers.meta.com/horizon/design/) · [문서](https://developers.meta.com/horizon/documentation/) · [Meta XR Core SDK](https://developers.meta.com/horizon/downloads/package/meta-xr-core-sdk/) · [Spatial SDK 소개](https://developers.meta.com/horizon/documentation/spatial-sdk/spatial-sdk-explainer)
