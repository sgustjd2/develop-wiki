---
name: PCL (Point Cloud Library)
url: https://pointclouds.org
docs: https://pointclouds.org/documentation/
repo: https://github.com/PointCloudLibrary/pcl
stars: 11231
domain: robotics
category: perception
description: 3D 포인트 클라우드 필터링, 정합(ICP), 세그멘테이션, 특징 추출을 제공하는 C++ 템플릿 라이브러리. ROS 의 점군 처리 기반이다.
pricing: oss
tags: [point-cloud, 3d, icp, segmentation, registration, lidar]
languages: [cpp]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
PCL 은 라이다·깊이 카메라가 만드는 3D 점군을 다루는 대형 C++ 라이브러리로, 필터링, 법선·특징 추정, 정합(registration), 세그멘테이션, 표면 복원, 시각화, I/O 모듈로 구성된다. BSD 라이선스(LICENSE 파일 기준, GitHub API 는 NOASSERTION). 템플릿 기반이라 빌드 시간이 길고 API 가 `pcl::PointCloud<PointT>` 중심이다. 마지막 정식 릴리스는 **1.15.1**(2025-08)이지만 저장소는 2026-11 에도 푸시된다. ROS 2 쪽 `perception_pcl`(2.10.0)이 변환 노드를 제공한다.

## 설치
```bash
sudo apt install libpcl-dev                     # 배포판 저장소
sudo apt install ros-lyrical-perception-pcl     # ROS 2 연동(pcl_conversions, pcl_ros)
```
CMake: `find_package(PCL REQUIRED COMPONENTS common io filters)` → `target_link_libraries(app ${PCL_LIBRARIES})`.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `PointCloud<PointT>` | 점군 컨테이너. `PointXYZ`, `PointXYZRGB`, `PointXYZI` 등 |
| Filters | `VoxelGrid`(다운샘플), `PassThrough`, `StatisticalOutlierRemoval`, `CropBox` |
| KdTree / Octree | 이웃 탐색 구조 |
| Features | 법선, FPFH, SHOT 등 기술자 |
| Registration | `IterativeClosestPoint`, `NormalDistributionsTransform`, 전역 정합 |
| Segmentation | RANSAC 평면·원통 모델, 유클리드 클러스터링 |
| 변환 | `pcl_conversions` 로 `sensor_msgs/PointCloud2` ↔ PCL |

## 기본 사용법
점군을 읽어 다운샘플하고 바닥 평면을 RANSAC 으로 제거(C++):
```cpp
#include <pcl/io/pcd_io.h>
#include <pcl/filters/voxel_grid.h>
#include <pcl/segmentation/sac_segmentation.h>
#include <pcl/filters/extract_indices.h>

int main() {
  pcl::PointCloud<pcl::PointXYZ>::Ptr cloud(new pcl::PointCloud<pcl::PointXYZ>);
  pcl::io::loadPCDFile("scan.pcd", *cloud);

  pcl::VoxelGrid<pcl::PointXYZ> vg;
  vg.setInputCloud(cloud);
  vg.setLeafSize(0.05f, 0.05f, 0.05f);
  vg.filter(*cloud);

  pcl::SACSegmentation<pcl::PointXYZ> seg;
  seg.setModelType(pcl::SACMODEL_PLANE);
  seg.setMethodType(pcl::SAC_RANSAC);
  seg.setDistanceThreshold(0.03);
  seg.setInputCloud(cloud);
  pcl::PointIndices::Ptr inliers(new pcl::PointIndices);
  pcl::ModelCoefficients coeff;
  seg.segment(*inliers, coeff);

  pcl::ExtractIndices<pcl::PointXYZ> ex;
  ex.setInputCloud(cloud);
  ex.setIndices(inliers);
  ex.setNegative(true);                 // 평면 바깥 점만 남김
  ex.filter(*cloud);
  pcl::io::savePCDFileBinary("objects.pcd", *cloud);
}
```

## 자주 쓰는 패턴
- **전처리 순서**: CropBox/PassThrough → VoxelGrid → 이상치 제거 → 법선 추정.
- **ICP 정합**: 초기 추정을 주고 `setMaximumIterations`/`setTransformationEpsilon` 로 수렴 제어. 라이다 오도메트리·지도 정렬.
- **물체 분리**: 평면 제거 후 `EuclideanClusterExtraction` 으로 객체 후보.
- **ROS 2**: `pcl::fromROSMsg`/`toROSMsg` 로 `PointCloud2` 변환 후 처리.

## 언제 쓰나 / 피할 때
- 쓸 때: C++ 로 실시간 점군 처리, ROS 기반 라이다·깊이 파이프라인. 언어 [C++](/develop-wiki/languages/cpp/).
- 피할 때: Python 중심 프로토타이핑·시각화는 [Open3D](/develop-wiki/robotics/perception/open3d/) 가 편하다. 2D 영상은 [OpenCV](/develop-wiki/robotics/perception/opencv/). 릴리스 주기가 느려 최신 알고리즘은 직접 구현이나 다른 라이브러리를 본다.

## 공식 문서
- [PCL 문서·튜토리얼](https://pointclouds.org/documentation/) · [GitHub](https://github.com/PointCloudLibrary/pcl)
