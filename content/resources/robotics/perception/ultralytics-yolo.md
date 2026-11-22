---
name: Ultralytics YOLO
url: https://www.ultralytics.com
docs: https://docs.ultralytics.com
repo: https://github.com/ultralytics/ultralytics
stars: 63668
domain: robotics
category: perception
description: YOLO 계열 객체 검출·분할·자세 추정·추적 모델의 학습·추론·내보내기 프레임워크. AGPL-3.0 이며 상용 이용은 별도 Enterprise 라이선스다.
pricing: oss
tags: [yolo, object-detection, segmentation, pose, tracking, pytorch, agpl]
languages: [python]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Ultralytics 패키지는 YOLO 모델(YOLOv8, YOLO11, YOLO26 등)로 검출·인스턴스 분할·분류·자세 추정·OBB·추적을 하고, 학습, 검증, ONNX·TensorRT·OpenVINO·TFLite 등으로의 내보내기를 통일된 API 로 제공한다. 로봇에서는 카메라 영상에서 물체·사람 위치를 얻어 파지·내비게이션·안전 정지에 쓴다. PyPI 최신 버전 8.4.215(2026-11), 문서 모델 목록에는 YOLO26 이 최신이며 YOLO27 은 "Coming Soon" 으로 표시돼 있다.

**라이선스 주의**: 코드와 사전 학습 가중치는 AGPL-3.0 이다. AGPL 은 OSI 승인 오픈소스라 `pricing: oss` 로 표기하지만, 이를 포함한 제품·네트워크 서비스를 배포하면 해당 소스 공개 의무가 생긴다. 비공개 상용 제품에는 저장소 README 가 안내하는 **Ultralytics Enterprise License** 를 별도 구매해야 한다. 도입 전 법무 확인이 필요하다.

## 설치
```bash
pip install ultralytics        # Python 3.8+ , PyTorch 필요(자동 설치)
yolo checks                    # 환경 점검
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 모델 파일 | `yolo26n.pt` 처럼 이름+크기(n/s/m/l/x). 작업별 접미사(`-seg`, `-pose`, `-obb`, `-cls`) |
| Task | detect, segment, classify, pose, obb |
| Mode | train, val, predict, export, track, benchmark |
| `Results` | 박스·마스크·키포인트·확률을 담은 결과 객체 |
| 데이터셋 YAML | 학습 이미지·라벨 경로와 클래스 이름 |
| Export | ONNX, TensorRT, OpenVINO, CoreML, TFLite 등 |

## 기본 사용법
```python
from ultralytics import YOLO

model = YOLO("yolo26n.pt")                 # 사전 학습 모델 로드
results = model("bus.jpg")                 # 추론
for r in results:
    for box in r.boxes:
        print(int(box.cls), float(box.conf), box.xyxy.tolist())

model.train(data="my_dataset.yaml", epochs=50, imgsz=640)   # 커스텀 학습
model.export(format="onnx")                                  # 엣지 배포용
```
CLI: `yolo predict model=yolo26n.pt source=0` (웹캠).

## 자주 쓰는 패턴
- **ROS 2 노드로 감싸기**: `sensor_msgs/Image` 를 [OpenCV](/develop-wiki/robotics/perception/opencv/) 로 변환해 추론하고 결과를 `vision_msgs/Detection2DArray` 로 발행(공식 ROS 노드는 아니므로 직접 작성).
- **깊이와 결합**: 검출 박스 중심의 깊이값으로 3D 위치를 구해 [MoveIt 2](/develop-wiki/robotics/navigation-planning/moveit2/) 목표로 전달.
- **엣지 최적화**: Jetson 은 TensorRT 로 내보내 FP16/INT8 사용, 작은 모델(n)부터 시작.
- **추적**: `model.track(source=..., persist=True)` 로 객체 ID 유지.
- **데이터 부족**: 현장 이미지를 라벨링해 소규모 커스텀 학습이 사전 학습 그대로보다 보통 낫다.

## 언제 쓰나 / 피할 때
- 쓸 때: 빠른 프로토타입, 학습-내보내기까지 한 도구로 묶고 싶을 때, 연구·사내 도구(AGPL 조건 충족 시).
- 피할 때: 비공개 상용 제품에 라이선스 없이 포함하는 경우, AGPL 이 불가능한 배포. 이 경우 Enterprise 라이선스를 구매하거나 Apache-2.0 계열 대안(MediaPipe 는 Apache-2.0, 별도 조사 필요)을 검토한다. 고전 비전은 [OpenCV](/develop-wiki/robotics/perception/opencv/). 언어 [Python](/develop-wiki/languages/python/).

## 공식 문서
- [Ultralytics 문서](https://docs.ultralytics.com) · [Quickstart](https://docs.ultralytics.com/quickstart/) · [모델 목록](https://docs.ultralytics.com/models/) · [라이선스](https://ultralytics.com/license)
