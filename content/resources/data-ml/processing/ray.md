---
name: Ray
url: https://www.ray.io
docs: https://docs.ray.io/en/latest/
repo: https://github.com/ray-project/ray
stars: 44352
domain: data-ml
category: processing
description: Python 함수와 클래스를 클러스터로 분산 실행하는 컴퓨팅 프레임워크. 분산 데이터 처리, 모델 학습·튜닝, 배치 추론과 서빙에 쓴다.
pricing: oss
tags: [distributed, python, ml, ray-data, ray-train, ray-serve, gpu]
languages: [python]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Ray 는 일반 Python 함수(task)와 상태를 가진 클래스(actor)를 데코레이터 하나로 원격 실행하게 해 주는 분산 런타임이다. 그 위에 데이터 처리(Ray Data), 분산 학습(Ray Train), 하이퍼파라미터 탐색(Ray Tune), 모델 서빙(Ray Serve) 라이브러리가 올라가 있다. CPU·GPU 를 함께 스케줄링해 ML 파이프라인에 많이 쓰인다.

**버전(2026-11 기준):** 2.60.0(2026-11-04). 라이선스 Apache-2.0.

SQL·DataFrame 중심 ETL 은 [Apache Spark](/develop-wiki/data-ml/processing/apache-spark/)가, 임의 Python 코드와 GPU 작업 분산은 Ray 가 잘 맞는다.

## 설치
```bash
pip install -U ray                 # 코어
pip install -U "ray[data,train,tune,serve]"
pip install -U "ray[default]"      # 대시보드·클러스터 런처 포함
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Task (`@ray.remote` 함수) | 상태 없는 원격 함수 호출. 즉시 `ObjectRef` 반환 |
| Actor (`@ray.remote` 클래스) | 상태를 가진 원격 워커 프로세스 |
| `ObjectRef` / `ray.get` | 미래 결과 참조 / 결과 대기·조회 |
| Object Store | 노드 공유 메모리. 큰 객체를 복사 없이 전달 |
| 리소스 | `num_cpus`, `num_gpus` 로 작업별 자원 요청 |
| Ray Data | 스트리밍 방식 분산 데이터 처리·배치 추론 |
| Ray Train / Tune / Serve | 분산 학습 / 하이퍼파라미터 탐색 / 모델 서빙 |

## 기본 사용법
```python
import ray

ray.init()   # 로컬 클러스터 시작 (클러스터에서는 ray.init(address="auto"))

@ray.remote
def square(x):
    return x * x

@ray.remote
class Counter:
    def __init__(self):
        self.n = 0
    def add(self, k):
        self.n += k
        return self.n

refs = [square.remote(i) for i in range(8)]
print(ray.get(refs))                 # [0, 1, 4, ...]

c = Counter.remote()
print(ray.get(c.add.remote(5)))      # 5
```

Ray Data 로 파일 변환:
```python
import ray

ds = ray.data.read_parquet("s3://bucket/events/")
ds = ds.filter(lambda r: r["amount"] > 0).map_batches(lambda b: {**b, "x2": b["amount"] * 2})
ds.write_parquet("out/")
```

## 자주 쓰는 패턴
- **GPU 배치 추론**: `map_batches` 에 모델을 담은 callable 클래스를 넘기고 `num_gpus` 를 지정한다.
- **병렬 실험**: Ray Tune 으로 하이퍼파라미터 조합을 클러스터에 분산.
- **큰 객체 공유**: `ray.put(obj)` 로 한 번 올린 뒤 참조를 여러 task 에 넘긴다.
- **클러스터 운영**: Kubernetes 에서는 KubeRay, 대시보드(기본 8265 포트)로 작업·자원 상태를 본다.

## 언제 쓰나 / 피할 때
- 쓸 때: Python 코드를 그대로 여러 머신·GPU 로 확장, ML 학습·튜닝·추론 파이프라인 통합, 이질적 작업 스케줄링.
- 피할 때(대안): SQL 위주 대규모 ETL 은 [Apache Spark](/develop-wiki/data-ml/processing/apache-spark/). 단일 머신 데이터프레임 작업은 [Polars](/develop-wiki/data-ml/processing/polars/). 단순 작업 스케줄링은 [Apache Airflow](/develop-wiki/data-ml/orchestration/apache-airflow/) 같은 오케스트레이터.

## 공식 문서
- [문서 홈](https://docs.ray.io/en/latest/) · [Ray Core 시작하기](https://docs.ray.io/en/latest/ray-core/walkthrough.html) · [Ray Data](https://docs.ray.io/en/latest/data/data.html)
- [Ray Train](https://docs.ray.io/en/latest/train/train.html) · [Ray Tune](https://docs.ray.io/en/latest/tune/index.html) · [Ray Serve](https://docs.ray.io/en/latest/serve/index.html)
