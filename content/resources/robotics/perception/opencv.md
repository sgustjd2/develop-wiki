---
name: OpenCV
url: https://opencv.org
docs: https://docs.opencv.org/5.x/
repo: https://github.com/opencv/opencv
stars: 91626
domain: robotics
category: perception
description: 이미지·영상 처리, 특징점, 카메라 캘리브레이션, 스테레오, 객체 검출을 제공하는 컴퓨터 비전 라이브러리. C++ 이 기본이고 Python 바인딩이 널리 쓰인다.
pricing: oss
tags: [computer-vision, image-processing, calibration, dnn, camera]
languages: [cpp, python]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
OpenCV 는 이미지 입출력, 필터·변환, 특징 검출·매칭, 카메라 캘리브레이션, 스테레오·3D 복원, 비디오 분석, DNN 추론 모듈을 하나의 C++ 라이브러리로 제공한다. 로봇에서는 카메라 영상 전처리, ArUco 마커 인식, 캘리브레이션, 특징 기반 오도메트리의 기초로 쓴다. 라이선스는 Apache-2.0(4.5.0 이후).

2026-11 기준 최신 릴리스는 **5.1.0**(2026-11-06)이고, 5.0.0 은 2026-06, 4.x 의 마지막 확인 버전은 4.14.0(2026-07)이다. PyPI `opencv-python` 도 5.1.0.95 다. 5.x 와 4.x 사이에는 API 변화가 있으므로 ROS 패키지(`cv_bridge`, `vision_opencv` 4.1.0 계열)가 링크한 OpenCV 버전을 확인하고 쓴다.

## 설치
```bash
pip install opencv-python            # GUI(imshow) 포함
pip install opencv-python-headless   # 서버·컨테이너용
sudo apt install libopencv-dev python3-opencv   # 배포판 저장소 버전(5.x 와 다를 수 있음)
```
C++ 프로젝트는 CMake `find_package(OpenCV REQUIRED)` 후 `target_link_libraries(app ${OpenCV_LIBS})`. 확장 모듈은 `opencv_contrib` 이 별도 저장소다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `cv::Mat` / `numpy.ndarray` | 이미지 행렬. BGR 채널 순서가 기본 |
| `imgproc` | 필터, 모폴로지, 색 공간, 윤곽선, 허프 변환 |
| `features2d` | 특징점 검출·기술자(ORB, AKAZE 등)와 매칭 |
| `calib3d` | 카메라 캘리브레이션, 왜곡 보정, PnP, 스테레오, 호모그래피 |
| `objdetect` / `aruco` | 마커·QR·얼굴 검출 |
| `dnn` | ONNX 등 모델 추론(학습은 하지 않음) |
| `VideoCapture` | 카메라·비디오 파일 입력 |

## 기본 사용법
ArUco 마커 검출(Python, 4.7 이후 `ArucoDetector` API):
```python
import cv2

img = cv2.imread("frame.png")
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

dictionary = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_4X4_50)
detector = cv2.aruco.ArucoDetector(dictionary, cv2.aruco.DetectorParameters())
corners, ids, _ = detector.detectMarkers(gray)

if ids is not None:
    cv2.aruco.drawDetectedMarkers(img, corners, ids)
cv2.imwrite("out.png", img)
```
ROS 2 와 연결할 때는 `cv_bridge` 로 `sensor_msgs/Image` ↔ `cv::Mat` 변환한다.

## 자주 쓰는 패턴
- **캘리브레이션**: 체커보드 여러 장으로 `cv2.calibrateCamera`, 결과를 `camera_info` 로 발행.
- **왜곡 보정 후 처리**: `cv2.undistort`/`initUndistortRectifyMap` 을 파이프라인 앞에.
- **색 임계 + 윤곽선**: HSV 변환 후 `inRange` → `findContours` 로 간단한 물체 추적.
- **DNN 추론 이식**: `cv2.dnn.readNetFromONNX` 로 가벼운 모델 배포(대규모 학습·고급 추론은 [Ultralytics](/develop-wiki/robotics/perception/ultralytics-yolo/) 등).
- **3D**: 깊이 영상을 포인트 클라우드로 바꾸면 [Open3D](/develop-wiki/robotics/perception/open3d/) 나 [PCL](/develop-wiki/robotics/perception/pcl/) 로 넘긴다.

## 언제 쓰나 / 피할 때
- 쓸 때: 고전 비전(캘리브레이션, 마커, 특징점, 영상 전처리), 임베디드 영상 파이프라인. 언어 [C++](/develop-wiki/languages/cpp/), [Python](/develop-wiki/languages/python/).
- 피할 때: 대규모 딥러닝 학습·검출 모델은 PyTorch 기반 도구, 3D 점군 처리는 Open3D·PCL, 실시간 SLAM 전체는 [RTAB-Map](/develop-wiki/robotics/perception/rtabmap/) 같은 전용 시스템이 맞다.

## 공식 문서
- [OpenCV 문서](https://docs.opencv.org/5.x/) · [GitHub 릴리스](https://github.com/opencv/opencv/releases) · [opencv.org](https://opencv.org)
