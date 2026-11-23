---
name: Kingfisher
url: https://github.com/onevcat/Kingfisher
docs: https://github.com/onevcat/Kingfisher/wiki
repo: https://github.com/onevcat/Kingfisher
stars: 24412
domain: mobile
category: ios
description: Swift 이미지 다운로드·캐싱 라이브러리. UIKit 의 kf.setImage 와 SwiftUI 의 KFImage 로 원격 이미지를 불러오고 메모리·디스크 캐시, 프로세서, 프리페치를 제공한다.
pricing: oss
tags: [image, cache, download, swiftui]
languages: [swift]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Kingfisher 는 URL 이미지를 내려받아 메모리·디스크에 캐시하고, 리사이즈·라운딩 같은 처리를 거쳐 표시하는 라이브러리다. UIKit(`UIImageView.kf`)과 SwiftUI(`KFImage`)를 모두 지원한다. 메인테이너가 한국 개발자(onevcat)라 한국어 자료가 많지만 공식 문서는 영어다.

- 최신 릴리스 **8.16.0**(2026-11-14), MIT.
- 대안: [Nuke](https://github.com/kean/Nuke)(파이프라인형), SwiftUI 기본 `AsyncImage`(캐시 제어가 약함).

## 설치
```swift
.package(url: "https://github.com/onevcat/Kingfisher.git", from: "8.16.0")
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `KingfisherManager` | 캐시 조회 → 다운로드 → 처리 → 저장 흐름을 총괄 |
| `ImageCache` | 메모리 + 디스크 이중 캐시. 용량·만료 설정 |
| `ImageProcessor` | 다운샘플링, 리사이즈, 라운드 코너 등 변환 |
| `KingfisherOptionsInfo` | 옵션 배열: `.transition`, `.processor`, `.cacheOriginalImage` |
| `ImagePrefetcher` | 스크롤 전에 미리 내려받기 |
| `KFImage` | SwiftUI 용 뷰. 모디파이어 체인으로 설정 |

## 기본 사용법
```swift
import Kingfisher
import SwiftUI

// UIKit
imageView.kf.setImage(
    with: URL(string: "https://example.com/a.jpg"),
    placeholder: UIImage(systemName: "photo"),
    options: [.transition(.fade(0.2)),
              .processor(DownsamplingImageProcessor(size: CGSize(width: 200, height: 200)))]
)

// SwiftUI
struct Avatar: View {
    let url: URL?
    var body: some View {
        KFImage(url)
            .placeholder { ProgressView() }
            .resizable()
            .fade(duration: 0.2)
            .scaledToFill()
            .frame(width: 80, height: 80)
            .clipShape(Circle())
    }
}
```

## 자주 쓰는 패턴
- **다운샘플링.** 큰 원본을 표시 크기로 줄여 메모리를 아낀다(`DownsamplingImageProcessor`).
- **캐시 정리.** `ImageCache.default.clearMemoryCache()` / `clearDiskCache()`, 설정으로 `diskStorage.config.sizeLimit` 지정.
- **프리페치.** `ImagePrefetcher(urls: urls).start()`.
- **요청 수정.** `KingfisherManager.shared.downloader.requestModifier` 로 인증 헤더 추가.
- **캐시 키 고정.** 서명된 URL 처럼 쿼리가 바뀌면 `KF.ImageResource(downloadURL:, cacheKey:)` 로 키를 지정.

## 언제 쓰나 / 피할 때
- 쓸 때: 목록·피드처럼 이미지가 많고 캐시·프리페치가 필요한 앱, UIKit·SwiftUI 혼용.
- 피할 때(대안): 이미지가 한두 장이면 `AsyncImage`. 요청 파이프라인 확장성을 중시하면 Nuke.

## 공식 문서
- [Wiki(가이드)](https://github.com/onevcat/Kingfisher/wiki) · [Cheat Sheet](https://github.com/onevcat/Kingfisher/wiki/Cheat-Sheet)
