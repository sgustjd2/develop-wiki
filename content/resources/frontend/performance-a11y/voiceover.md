---
name: VoiceOver
url: https://www.apple.com/accessibility/vision/
docs: https://support.apple.com/guide/voiceover/welcome/mac
domain: frontend
category: performance-a11y
description: macOS·iOS·iPadOS 에 내장된 Apple 스크린 리더. Safari 와 iPhone 에서 웹 페이지·앱이 화면 낭독으로 어떻게 읽히는지 수동 접근성 테스트할 때 쓴다.
pricing: free
tags: [accessibility, screen-reader, manual-testing, macos, ios]
languages: []
koreanDocs: true
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
VoiceOver는 Apple 기기에 기본 포함된 스크린 리더로, 추가 설치나 비용 없이 쓸 수 있다. 모바일 웹 사용자 상당수가 iPhone의 VoiceOver를 쓰므로, 웹 접근성 수동 테스트에서 Windows의 [NVDA](/develop-wiki/frontend/performance-a11y/nvda/)와 함께 확인하는 경우가 많다. Apple은 macOS 버전별 [VoiceOver 사용 설명서](https://support.apple.com/guide/voiceover/welcome/mac)를 제공하며 한국어판도 있다([한국어 설명서](https://support.apple.com/ko-kr/guide/voiceover/welcome/mac)).

## 켜고 끄기
- **Mac:** `Command+F5`. 또는 `Option+Command+F5` 로 손쉬운 사용 단축키 패널을 열어 선택한다.
- **VO 키:** 기본으로 `Control+Option` 을 함께 누르거나 `Caps Lock` 을 쓴다. 이하 `VO` 로 표기한다.
- **iPhone·iPad:** 설정 → 손쉬운 사용 → VoiceOver. 손쉬운 사용 단축키에 등록해 두면 측면(또는 홈) 버튼 세 번 누르기로 켜고 끌 수 있다.

## 핵심 사용법 (Mac + Safari)
| 키 | 동작 |
| --- | --- |
| `VO+→` / `VO+←` | 다음 / 이전 항목 읽기 |
| `VO+U` | 로터(Rotor): 제목·링크·랜드마크·폼 컨트롤 목록에서 이동 |
| `VO+Command+H` | 다음 제목 |
| `VO+Space` | 현재 항목 실행(클릭) |
| `Control` | 읽기 중지 |

- iOS 에서는 한 손가락 좌우 쓸기로 항목을 이동하고, 두 손가락 회전으로 로터를 바꾼 뒤 위아래 쓸기로 제목·링크 단위 이동을 한다.
- **캡션 패널.** 화면 아래 캡션 패널에 낭독 내용이 텍스트로 나오므로 소리 없이도 확인할 수 있다.

## 언제 쓰나
- 모달 포커스 가두기, 라이브 영역 안내, 커스텀 컨트롤의 역할·상태 낭독을 Safari·iOS 에서 확인할 때. Safari와 Chrome의 낭독 결과가 다를 수 있으므로 Safari 조합을 기본으로 테스트한다.
- 네이티브 앱의 VoiceOver 대응은 [Apple Human Interface Guidelines](/develop-wiki/mobile/learning/apple-human-interface-guidelines/)의 VoiceOver·Accessibility 항목을 함께 본다.

## 공식 문서
- [VoiceOver 사용 설명서(Mac)](https://support.apple.com/guide/voiceover/welcome/mac) · [VoiceOver 켜고 끄기](https://support.apple.com/guide/voiceover/turn-voiceover-on-or-off-vo2682/mac) · [iPhone 사용 설명서 – VoiceOver](https://support.apple.com/guide/iphone/turn-on-and-practice-voiceover-iph3e2e415f/ios)
