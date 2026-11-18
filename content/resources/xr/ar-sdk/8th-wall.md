---
name: 8th Wall
url: https://www.8thwall.org/
docs: https://www.8thwall.org/docs
repo: https://github.com/8thwall/8thwall
domain: xr
category: ar-sdk
description: Niantic Spatial이 오픈소스로 전환한 웹 AR·3D 도구 모음. 월드 추적(SLAM)·이미지 타깃·얼굴 효과를 A-Frame·three.js 등에 붙이고 데스크톱 에디터로 만든다.
pricing: free
tags: [webar, web, niantic, slam, open-source]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
8th Wall은 앱 설치 없이 모바일 브라우저에서 돌아가는 WebAR 제작 도구다. 예전에는 호스팅 플랫폼과 구독이 핵심이었지만, **호스팅 플랫폼은 2026-02-28에 종료**되고 유료 구독도 그날 끝났다. 현재는 저장소 `8thwall/8thwall`(MIT, 별 524 수준)에서 커뮤니티 주도로 이어지는 오픈 프로젝트이며 저작권 표기는 Niantic Spatial이다.

- **구성**: 엔진 모듈(Image Targets, Face Effects, Sky Effects 등, MIT), 게임 엔진 ECS, 데스크톱 앱(8th Wall Desktop), 이미지 타깃 CLI, 샘플. 앱 계정·로그인은 필요 없다.
- **SLAM(World Effects, Absolute Scale)** 은 오픈소스가 아니라 **바이너리로 따로 배포**(`@8thwall/engine-binary`)되고 제한적 사용 라이선스가 붙는다. 상업 프로젝트에서 쓸 수 있다고 공식 FAQ가 밝히지만 조건은 직접 확인해야 한다.
- 2026-02-28 이전에 내보낸 프로젝트는 마이그레이션 가이드로 자체 호스팅할 수 있고, 프로젝트 내보내기 기능은 더 이상 없다.
- "Niantic Spatial SDK"라는 별도 제품명으로 8th Wall을 대체하는 공개 SDK가 있는지는 이 항목 작성 시 확인하지 못했다. 공식 안내는 8th Wall 자체를 오픈 도구로 유지한다는 내용이다.

## 설치
엔진 바이너리를 CDN 스크립트나 npm으로 불러온다.

```html
<script src="https://cdn.jsdelivr.net/npm/@8thwall/engine-binary@1/dist/xr.js"
        async crossorigin="anonymous" data-preload-chunks="slam"></script>
```

```bash
npm install @8thwall/engine-binary
```
npm으로 설치하면 `dist` 안의 파일을 빌드 산출물 폴더로 복사해 `xr.js`를 직접 로드해야 한다(저장소 README의 webpack 예시 참고). 데스크톱 앱은 공식 다운로드 페이지에서 Mac·Windows용을 받는다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| XR Engine | 카메라 피드 위에서 추적·인식을 제공하는 JS 엔진 (A-Frame, three.js, Babylon.js, PlayCanvas 연동) |
| World Effects | SLAM 기반 평면·월드 추적 (바이너리 배포) |
| Image Targets | 이미지 인식·추적. 이미지 타깃 프로세서 CLI로 사전 처리 |
| Face Effects / Sky Effects | 얼굴 메시, 하늘 영역 분할 |
| 8th Wall Desktop | 3D·AR 시각 에디터, 웹 내보내기(네이티브 내보내기는 예정으로 표기) |
| XR Extras | 로딩 화면·UI·미지원 기기 안내 등 보조 모듈 |

## 기본 사용법
A-Frame에서 월드 추적을 켜는 최소 HTML(엔진 스크립트를 먼저 로드).

```html
<a-scene xrweb xrextras-loading xrextras-runtime-error>
  <a-camera position="0 1.6 0"></a-camera>
  <a-box position="0 0.1 -1" color="#4a90d9" scale="0.2 0.2 0.2"></a-box>
</a-scene>
```
A-Frame 쪽 모듈(`xrweb` 컴포넌트)과 XR Extras는 저장소 `packages`에서 번들해 쓰는 구조이므로 샘플 프로젝트의 빌드 설정을 그대로 따라 하는 편이 안전하다.

## 자주 쓰는 패턴
- **샘플에서 시작.** 저장소 `examples`의 스타터 템플릿과 기능 데모를 복사해 설정을 맞춘다.
- **자체 호스팅.** 결과물은 정적 파일이므로 어떤 정적 호스팅에도 올릴 수 있다. HTTPS가 필수(카메라 권한).
- **미지원 기기 폴백.** landing-page 패키지로 지원되지 않는 환경에 안내 화면을 보여 준다.
- **기존 3D 라이브러리 재사용.** three.js 씬을 그대로 두고 카메라 파이프라인만 엔진에 맞춘다.

## 언제 쓰나 / 피할 때
- 쓸 때: 앱 설치가 어려운 캠페인·마케팅 WebAR, 이미지 타깃·얼굴 필터를 웹으로 낼 때.
- 피할 때(대안): 고정밀 장기 추적·깊이는 네이티브 [ARKit](/develop-wiki/xr/ar-sdk/arkit/)·[ARCore](/develop-wiki/xr/ar-sdk/arcore/). 표준 기반 웹 몰입은 WebXR(예: [WebXR 샘플](/develop-wiki/xr/learning/webxr-samples/)). 호스팅 서비스가 필요하던 프로젝트는 자체 호스팅 계획이 필요하다.

## 공식 문서
- [8th Wall 문서](https://www.8thwall.org/docs) · [GitHub 저장소](https://github.com/8thwall/8thwall) · [엔진 바이너리 저장소](https://github.com/8thwall/engine)
