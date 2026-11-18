---
name: visionOS 디자인 지침 (HIG)
url: https://developer.apple.com/design/human-interface-guidelines/designing-for-visionos
docs: https://developer.apple.com/design/human-interface-guidelines/designing-for-visionos
domain: xr
category: learning
description: Apple Human Interface Guidelines 중 visionOS 공간 앱 디자인 부분. 창·볼륨·몰입 공간 선택, 시선·손 입력, 편안함 원칙을 설명하며 Vision Pro 앱 설계의 출발점이다.
pricing: free
tags: [apple, visionos, hig, spatial-design, guidelines]
languages: []
koreanDocs: true
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
visionOS 디자인 지침은 [Apple HIG](/develop-wiki/mobile/learning/apple-human-interface-guidelines/)의 일부로, 공간 컴퓨팅 앱을 설계할 때 따를 원칙과 패턴을 다룬다. 핵심은 "사용자의 방 안에서 편안하게 쓰는 앱"이다. 코드는 [visionOS 개발](/develop-wiki/xr/vr-platform/apple-vision-pro-visionos/) 항목을 본다.

- 문서 사이트는 영어 외에 한국어 판(`/kr/design/human-interface-guidelines`)도 제공한다. HIG 전체가 한국어로 번역돼 있다고 알려져 있으나 visionOS 페이지의 번역 최신성은 확인하지 못했다.
- 페이지 수정 시각은 문서마다 다르다(Designing for visionOS 페이지의 마지막 수정 헤더는 2025-10). 최신 27 세대 변경은 [What's new](https://developer.apple.com/visionos/whats-new/)를 병행해 본다.

## 이렇게 읽는다
| 주제 | 정리 |
| --- | --- |
| 창(Window) | 2D UI의 기본 단위. 처음에는 창에서 시작하고 크기·위치는 사용자가 조절 |
| 볼륨(Volume) | 3D 객체를 담는 경계 영역. 모든 방향에서 볼 수 있어야 함 |
| 몰입 공간 | 공간 전체 사용. 혼합(mixed)·점진(progressive)·완전(full) 몰입을 구분해 필요한 만큼만 |
| 시선·손 입력 | 시선으로 대상을 가리키고 집기로 선택. 대상은 충분히 크게, 호버 효과 제공 |
| 오너먼트 | 창 가장자리 보조 컨트롤 |
| 편안함 | 목·눈 피로 방지: 콘텐츠를 시선 높이 앞쪽에 두고, 급격한 움직임·강제 이동 지양 |
| 소재(Material) | 유리 재질 배경으로 주변과 어울리게 |

## 예제: 지침을 코드에 옮기기
지침의 "창에 오너먼트로 보조 컨트롤" 원칙을 SwiftUI로 옮긴 최소 예.

```swift
import SwiftUI

struct ContentView: View {
    var body: some View {
        Text("공간 앱")
            .font(.extraLargeTitle)
            .padding(40)
            .ornament(attachmentAnchor: .scene(.bottom)) {
                HStack {
                    Button("이전") {}
                    Button("다음") {}
                }
                .padding()
                .glassBackgroundEffect()
            }
    }
}
```
지침을 읽을 때는 "그 원칙이 어느 SwiftUI 수정자로 구현되는가"를 같이 찾아 두면 기억에 남는다.

## 학습 순서 제안
1. Designing for visionOS 개요에서 입력과 공간 개념을 익힌다.
2. 창 → 볼륨 → 몰입 공간 순으로 어떤 단계가 필요한지 정한다.
3. 접근성(VoiceOver, 시선 대체 입력)과 편안함 항목을 체크리스트로 쓴다.
4. 시뮬레이터에서 레이아웃을 확인하고 실기기로 편안함을 검증한다.

## 언제 쓰나 / 피할 때
- 쓸 때: Vision Pro 앱 기획·디자인 리뷰, App Store 심사 전 점검.
- 피할 때(대안): Quest·Android XR 디자인은 각 플랫폼 가이드([Meta](/develop-wiki/xr/learning/meta-horizon-design-guidelines/), [Android XR](/develop-wiki/xr/learning/android-xr-design/))를 본다.

## 공식 문서
- [Designing for visionOS](https://developer.apple.com/design/human-interface-guidelines/designing-for-visionos) · [visionOS What's new](https://developer.apple.com/visionos/whats-new/) · [HIG 전체](https://developer.apple.com/design/human-interface-guidelines)
