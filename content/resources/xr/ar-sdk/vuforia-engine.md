---
name: Vuforia Engine
url: https://developer.vuforia.com/
docs: https://developer.vuforia.com/library
repo: https://github.com/PTCInc/vuforia-engine
domain: xr
category: ar-sdk
description: PTC의 상용 AR SDK. 이미지·모델·영역 타깃 인식으로 산업·교육용 AR을 만들며 Unity와 네이티브를 지원하고, 기능별로 무료 Basic과 유료 Premium 플랜을 나눈다.
pricing: freemium
tags: [ar, ptc, model-target, image-target, enterprise]
languages: [csharp, cpp]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Vuforia Engine은 PTC가 제공하는 AR SDK로, 카메라 영상에서 미리 등록한 대상(이미지, 3D 모델, 공간)을 인식해 그 위에 콘텐츠를 겹친다. 평면 추적 중심인 [ARKit](/develop-wiki/xr/ar-sdk/arkit/)·[ARCore](/develop-wiki/xr/ar-sdk/arcore/)와 달리 **타깃 인식**이 주 강점이며 제조·정비·교육 등 기업 사례가 많다.

- 현재 메이저는 **Vuforia Engine 11**(2025년 2월 발표 보도). 이후 11.x 점검 릴리스가 이어지며, 개발자 포털 문서가 가장 정확한 최신 번호를 갖는다. (이 항목 작성 시 공식 포털의 정확한 최신 번호는 확인하지 못했다.)
- 11 계열 보도 기준: 온프레미스 Advanced Model Targets(클라우드 학습 없이 CAD 로컬 처리), 상태 기반(State-Based) Model Targets. 11.4에서 Magic Leap 2 개발 지원과 Intel Mac 지원 중단, 최소 iOS 16·macOS 13으로 상향됐다는 릴리스 노트 보도가 있다.
- 지원 환경은 Unity 플러그인, Android·iOS 네이티브, 일부 안경형 기기다. 기기 목록은 버전마다 바뀌므로 문서의 Supported Versions를 본다.

## 라이선스
| 플랜 | 요점 |
| --- | --- |
| Basic | 무료. Model Target·Area Target을 쓰지 않는 앱에 사용 |
| Premium | 유료(가격 협의). Model Targets, Area Targets 사용 시 필요 |
| Cloud / Cloud Plus | 클라우드 이미지 인식 애드온 |
| Enterprise | PTC 페이지에 언급되나 조건은 확인하지 못했다 |

개발·평가는 무료로 시작하되 배포 시 플랜과 워터마크·사용량 조건을 공식 가격 페이지에서 확인해야 한다. 오픈소스가 아니다.

## 설치 (Unity)
Unity 패키지 매니저에서 Vuforia 공식 패키지를 추가한다(`com.ptc.vuforia.engine`). 또는 Unity 설치 시 Vuforia 모듈을 함께 받는다. 개발자 포털에서 라이선스 키를 발급해 프로젝트의 Vuforia 설정에 입력한다. **키는 저장소에 커밋하지 않는다.** 정확한 절차는 [Getting Started](https://developer.vuforia.com/library/getting-started/getting-started-vuforia-engine-unity) 문서를 따른다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Image Target | 평면 이미지(포스터·카드)를 인식. 특징점이 풍부할수록 안정적 |
| Model Target | 3D CAD/스캔 모델 형상으로 물체를 인식. 특정 시점에서 시작하는 Guide View |
| Area Target | 스캔한 실내 공간 단위로 위치 인식 |
| VuMark | 디자인 가능한 마커 겸 고유 ID 코드 |
| Vuforia Behaviour | Unity에서 AR 카메라를 구성하는 컴포넌트 |
| Observer | 타깃 감시·추적 상태 이벤트를 발생시키는 개체 |

## 기본 사용법 (Unity C#)
이미지 타깃이 인식될 때 콘텐츠를 켜는 스크립트.

```csharp
using UnityEngine;
using Vuforia;

public class ShowOnTarget : MonoBehaviour
{
    [SerializeField] GameObject content;

    void Start()
    {
        var observer = GetComponent<ObserverBehaviour>();
        observer.OnTargetStatusChanged += OnStatus;
        content.SetActive(false);
    }

    void OnStatus(ObserverBehaviour b, TargetStatus s)
    {
        bool tracked = s.Status == Status.TRACKED || s.Status == Status.EXTENDED_TRACKED;
        content.SetActive(tracked);
    }
}
```

## 자주 쓰는 패턴
- **타깃 품질.** Image Target은 대비·텍스처가 풍부하고 반복 무늬가 없는 이미지를 쓴다. 개발자 포털이 별점으로 인식 품질을 알려 준다.
- **Model Target 가이드 뷰.** 사용자가 맞춰 볼 시점을 정해 주면 인식이 빨라진다.
- **상태 처리.** `TRACKED`, `EXTENDED_TRACKED`, `LIMITED`를 구분해 콘텐츠 유지·숨김을 결정한다.
- **보안.** 민감한 CAD는 온프레미스 처리 옵션을 검토한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 산업 장비·제품·포스터 같은 **특정 대상 인식** AR, 기업용 지원과 CAD 파이프라인이 필요할 때.
- 피할 때(대안): 평면 배치 위주면 ARKit/ARCore(무료). 브라우저 AR은 [8th Wall](/develop-wiki/xr/ar-sdk/8th-wall/)·WebXR.

## 공식 문서
- [Vuforia 라이브러리](https://developer.vuforia.com/library) · [릴리스 저장소](https://github.com/PTCInc/vuforia-engine/releases) · [가격](https://developer.vuforia.com/pricing)
