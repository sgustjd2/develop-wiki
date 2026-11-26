---
name: MediaPipe
url: https://ai.google.dev/edge/mediapipe
docs: https://developers.google.com/edge/mediapipe/solutions/guide
repo: https://github.com/google-ai-edge/mediapipe
stars: 37878
domain: robotics
category: perception
description: Google 의 온디바이스 ML 솔루션 모음. 손·얼굴·자세 랜드마크, 객체 탐지, 분류 등을 Python·웹·Android·iOS 에서 사전 학습 모델(.task)로 실행한다.
pricing: oss
tags: [on-device, pose, hand-tracking, face, object-detection, tasks]
languages: [python, typescript, kotlin, java, swift, cpp]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
MediaPipe 는 Google AI Edge 의 온디바이스 ML 도구다. 가장 많이 쓰는 방법은 **MediaPipe Tasks** 로, 모델 번들(`.task`)과 몇 줄의 API 로 비전·텍스트·오디오 작업을 CPU·GPU 에서 실행한다. 고급 사용자는 C++ 로 계산기(calculator)와 다중 스트림 인식 그래프를 만드는 **Framework** 를 쓴다.

- 이 문서는 **v1.2.3**(GitHub 릴리스 2026-11-11, PyPI `mediapipe` 1.2.3) 기준이다. Apache-2.0.
- 공식 가이드에 정리된 Tasks 는 22개다. 비전 11개(Face Detector, Face Landmarker, Gesture Recognizer, Hand Landmarker, Holistic Landmarker, Image Classifier, Image Embedder, Image Segmenter, Interactive Segmenter, Object Detector, Pose Landmarker), 텍스트 5개, 오디오 3개, 검색 2개, Decision Maker 1개다.
- 지원 플랫폼: 웹(JavaScript), Android(Kotlin/Java), iOS(Swift), Python, Flutter.
- 위치: 사람 몸·손 랜드마크처럼 가벼운 실시간 인식에 맞다. 범용 객체 탐지·분할 학습은 [Ultralytics YOLO](/develop-wiki/robotics/perception/ultralytics-yolo/)(AGPL-3.0), 고전 비전은 [OpenCV](/develop-wiki/robotics/perception/opencv/)를 쓴다.

## 설치
```bash
pip install mediapipe
```
웹·Android·iOS 는 공식 문서의 플랫폼별 설정 페이지를 따른다. 작업별 모델 파일은 각 Task 문서의 Models 표에서 내려받는다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Task | 하나의 인식 작업(예: Hand Landmarker)을 감싼 고수준 API |
| 모델 번들 `.task` | 모델과 메타데이터를 묶은 파일. `model_asset_path` 로 지정 |
| Running mode | 정지 이미지(`IMAGE`)와 영상·실시간 스트림 모드. 작업 문서에서 모드별 호출 방식을 확인 |
| `mp.Image` | MediaPipe 의 입력 이미지 래퍼 |
| Landmark | 이미지 기준 `hand_landmarks` 와 3D 좌표 `hand_world_landmarks` 등으로 반환 |

## 기본 사용법
손 랜드마크를 정지 이미지에서 검출하는 예다. `hand_landmarker.task` 는 문서의 모델 표에서 받은 파일이다.
```python
import mediapipe as mp

options = mp.tasks.vision.HandLandmarkerOptions(
    base_options=mp.tasks.BaseOptions(model_asset_path="hand_landmarker.task"),
    running_mode=mp.tasks.vision.RunningMode.IMAGE,
    num_hands=2,
)
with mp.tasks.vision.HandLandmarker.create_from_options(options) as landmarker:
    image = mp.Image.create_from_file("input.jpg")
    result = landmarker.detect(image)
    print(result.hand_landmarks)   # 손마다 랜드마크 목록
```
결과에는 `handedness`, `hand_landmarks`, `hand_world_landmarks` 가 감지된 손마다 하나씩 들어 있다.

## 자주 쓰는 패턴
- **카메라 스트림**: 영상·실시간 모드로 프레임마다 호출한다(모드별 시그니처는 Task 문서 참조).
- **로봇 입력**: 손·자세 랜드마크를 텔레오퍼레이션 명령이나 동작 모방 입력으로 변환한다. 좌표계는 로봇 프레임으로 직접 변환해야 한다.
- **모델 교체**: 같은 Task API 에서 `.task` 파일만 바꿔 정확도·속도 트레이드오프를 조정한다.
- **이미지 변환**: OpenCV 로 읽은 배열을 쓸 때는 색 순서·형식을 `mp.Image` 요구사항에 맞춘다.

## 언제 쓰나 / 피할 때
- 쓸 때: 모바일·웹·SBC 에서 사람 포즈·손·얼굴 인식을 가볍게 실행할 때, 상용 배포에서 허용형(Apache-2.0) 라이선스가 필요할 때.
- 피할 때(대안): 사용자 정의 클래스를 대규모로 학습해야 하면 YOLO·PyTorch 계열, 3D 포인트클라우드·SLAM 은 [Open3D](/develop-wiki/robotics/perception/open3d/), [RTAB-Map](/develop-wiki/robotics/perception/rtabmap/).

## 공식 문서
- [솔루션 가이드](https://developers.google.com/edge/mediapipe/solutions/guide) · [Hand Landmarker(Python)](https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker/python) · [저장소](https://github.com/google-ai-edge/mediapipe)
