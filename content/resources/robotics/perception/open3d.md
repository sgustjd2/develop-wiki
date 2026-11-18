---
name: Open3D
url: https://www.open3d.org
docs: https://www.open3d.org/docs/release/
repo: https://github.com/isl-org/Open3D
stars: 14225
domain: robotics
category: perception
description: 3D 데이터 처리 라이브러리. 포인트 클라우드·메시·RGB-D 처리, 정합(ICP), 재구성, 시각화를 Python·C++ 로 제공한다.
pricing: oss
tags: [3d, point-cloud, mesh, icp, reconstruction, visualization]
languages: [python, cpp]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Open3D 는 포인트 클라우드, 삼각 메시, RGB-D 이미지, 복셀을 다루는 라이브러리로 C++ 코어 위에 Python API 를 제공한다. 정합(ICP·전역 정합), 법선 추정, 포인트 클라우드 세그멘테이션, TSDF 재구성, 시각화, 그리고 GPU 를 쓰는 Tensor 기반 API 를 포함한다. MIT 라이선스. 최신 릴리스 **0.20.0**(2026-09-16), PyPI 휠은 CPython 3.10~3.14 용이다.

## 설치
```bash
pip install open3d          # Python 3.10~3.14 (플랫폼별 휠 제공 여부는 PyPI 확인)
```
C++ 는 공식 바이너리 패키지나 소스 빌드(CMake). ROS 2 연동은 `open3d_conversions` 등 서드파티 패키지를 쓴다(공식 지원은 아님).

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `o3d.geometry.PointCloud` | 점군. `points`, `colors`, `normals` 속성 |
| `o3d.t.geometry` | Tensor 기반(GPU 가능) 지오메트리·파이프라인 |
| `TriangleMesh` | 메시와 Poisson 복원 등 |
| Registration | `registration_icp`, 특징 기반 전역 정합(FPFH + RANSAC) |
| `RGBDImage` | 색·깊이 영상 → 점군 변환 |
| Visualizer | 인터랙티브 3D 뷰어(`draw_geometries`) |

## 기본 사용법
두 점군을 ICP 로 정합(Python):
```python
import numpy as np
import open3d as o3d

src = o3d.io.read_point_cloud("scan_a.pcd").voxel_down_sample(0.05)
dst = o3d.io.read_point_cloud("scan_b.pcd").voxel_down_sample(0.05)
for pc in (src, dst):
    pc.estimate_normals(o3d.geometry.KDTreeSearchParamHybrid(radius=0.15, max_nn=30))

result = o3d.pipelines.registration.registration_icp(
    src, dst, max_correspondence_distance=0.2, init=np.eye(4),
    estimation_method=o3d.pipelines.registration.TransformationEstimationPointToPlane())
print(result.fitness, result.transformation)
src.transform(result.transformation)
o3d.visualization.draw_geometries([src, dst])
```

## 자주 쓰는 패턴
- **복셀 다운샘플 → 법선 추정 → ICP** 순서로 속도와 정확도를 맞춘다.
- **NumPy 연동**: `np.asarray(pc.points)` 로 직접 접근, `o3d.utility.Vector3dVector(arr)` 로 생성.
- **RGB-D → 점군**: `create_from_rgbd_image` 에 카메라 내부 파라미터를 넣는다([OpenCV](/develop-wiki/robotics/perception/opencv/) 캘리브레이션 결과 사용).
- **헤드리스 서버**: 오프스크린 렌더링 또는 결과를 파일로 저장해 [RViz2](/develop-wiki/robotics/ros/rviz2/) 등으로 확인.

## 언제 쓰나 / 피할 때
- 쓸 때: Python 에서 점군·메시 실험, 정합·재구성 프로토타입, 데이터 시각화. 언어 [Python](/develop-wiki/languages/python/).
- 피할 때: 기존 ROS C++ 코드와 깊게 통합된 실시간 점군 파이프라인은 [PCL](/develop-wiki/robotics/perception/pcl/) 이 생태계 호환이 낫다. 로봇 SLAM 시스템 전체를 대체하지는 않는다.

## 공식 문서
- [Open3D 문서](https://www.open3d.org/docs/release/) · [시작하기](https://www.open3d.org/docs/release/getting_started.html) · [GitHub](https://github.com/isl-org/Open3D)
