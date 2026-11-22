---
title: 클라우드 컴퓨팅 — NIST 정의, 서비스·배포 모델과 빅데이터 인프라
aka: [NIST SP 800-145, IaaS, PaaS, SaaS, Public Cloud, Private Cloud, Hybrid Cloud, Community Cloud, Virtualization, Container]
category: data-analytics
group: platform
level: beginner
summary: NIST SP 800-145 의 필수 특성 5·서비스 모델 3·배포 모델 4를 원문 기준으로 정리하고, 가상화·컨테이너·분산 저장·분산 컴퓨팅이 클라우드 위 빅데이터 플랫폼에서 어디에 놓이는지 연결한다.
tags: [cloud, nist, iaas, paas, saas, virtualization, container, deployment-model, big-data]
related: [data-analytics/hadoop-hdfs-mapreduce-yarn, data-analytics/spark-rdd-dataframe-vs-mapreduce, data-analytics/data-warehouse-data-mart-lake-lakehouse, data-analytics/etl-elt-cdc-eai-integration, data-analytics/hadoop-ecosystem-hive-hbase-sqoop-flume, data-analytics/exam-map-adsp-adp-bigdata-analyst]
sources:
  - https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-145.pdf
  - https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/
  - https://learn.microsoft.com/en-us/azure/virtual-machines/overview
  - https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-what-is-emr.html
  - https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html
  - https://docs.cloud.google.com/bigquery/docs/introduction
  - https://learn.microsoft.com/en-us/azure/architecture/data-guide/scenarios/data-lake
updatedAt: 2026-11-23
---

## 개요

- 클라우드 컴퓨팅은 설정 가능한 공유 컴퓨팅 자원 풀(네트워크·서버·저장소·애플리케이션·서비스)에 편리하게 필요할 때 네트워크로 접근하는 모델이다. 최소한의 관리 노력이나 사업자 개입으로 빠르게 할당·반납할 수 있다(NIST SP 800-145, 2011-09, Mell & Grance).
- NIST 정의는 **필수 특성 5 + 서비스 모델 3 + 배포 모델 4** 로 이뤄진다. 서비스 모델 3종의 이름(SaaS·PaaS·IaaS)은 이 정의에서 나온 것이다.
- 빅데이터 맥락: 분산 저장·분산 컴퓨팅 클러스터를 직접 구축하지 않고 클라우드 자원과 관리형 서비스로 쓰는 경우가 있다(필자 일반론). 이는 NIST 분류의 어느 층(IaaS/PaaS/SaaS)에서 쓰느냐의 문제다.

## 시험 범위 대응

- ADP 필기 "데이터 처리 기술 이해 > 데이터 처리 기술 > 클라우드 인프라 기술"(가상화·컨테이너 등 세부 항목 이름은 공식 출제범위에 없음). 빅데이터분석기사 1과목 "빅데이터 플랫폼"과 관련. ADsP 에는 직접 항목 없음.
- 분산 데이터 저장 기술 → [HDFS](/develop-wiki/knowledge/data-analytics/hadoop-hdfs-mapreduce-yarn/), 분산 컴퓨팅 기술 → [MapReduce·Spark](/develop-wiki/knowledge/data-analytics/spark-rdd-dataframe-vs-mapreduce/). 이 노트는 그 아래 인프라 층(클라우드·가상화·컨테이너)을 다룬다. 시험에서 가상화·컨테이너를 어떻게 묻는지는 미확인.

## 핵심 용어

| 한국어 | 영어 | 정의(NIST 원문 의역) |
| --- | --- | --- |
| 온디맨드 셀프서비스 | On-demand self-service | 소비자가 서버 시간·네트워크 저장소 같은 능력을 사업자와 사람 간 접촉 없이 필요할 때 일방적으로 자동 확보 |
| 광범위한 네트워크 접근 | Broad network access | 표준 방식으로 네트워크를 통해 다양한 씬(thin)·씩(thick) 클라이언트(휴대폰·태블릿·노트북·워크스테이션)가 접근 |
| 자원 풀링 | Resource pooling | 멀티테넌트 모델로 자원을 풀링해 수요에 따라 물리·가상 자원을 동적으로 할당·재할당. 위치 독립감(국가·데이터센터 수준 지정 가능) |
| 신속한 탄력성 | Rapid elasticity | 수요에 맞춰 능력을 탄력적으로 확보·반납(경우에 따라 자동). 소비자에게는 무한해 보이는 경우가 많음 |
| 측정 가능한 서비스 | Measured service | 서비스 유형에 맞는 추상 수준에서 계량해 자원 사용을 자동 제어·최적화하고 보고 |
| 서비스형 소프트웨어 | SaaS | 소비자가 사업자의 클라우드 인프라에서 도는 애플리케이션을 사용. 기반 인프라는 관리·통제하지 않음(제한된 사용자 설정 정도 예외) |
| 서비스형 플랫폼 | PaaS | 소비자가 만들었거나 확보한 애플리케이션을 사업자가 지원하는 언어·라이브러리·서비스·도구로 클라우드에 배포. 기반 인프라(네트워크·서버·OS·저장소)는 관리 안 하고 배포한 앱과 호스팅 환경 설정은 통제 |
| 서비스형 인프라 | IaaS | 소비자가 처리·저장·네트워크 등 기본 컴퓨팅 자원을 확보해 OS 와 앱을 포함한 임의 소프트웨어를 배포·실행. 기반 클라우드 인프라는 통제 안 하고 OS·저장소·배포 앱은 통제 |

## 필수 특성 5

- 위 표의 앞 5개다: 온디맨드 셀프서비스, 광범위한 네트워크 접근, 자원 풀링, 신속한 탄력성, 측정 가능한 서비스.
- 각주: 계량은 보통 사용량 과금(pay-per-use)으로 이뤄진다. "클라우드 인프라"는 5개 특성을 가능케 하는 하드웨어·소프트웨어의 모음으로, 물리 계층과 그 위의 추상화 계층으로 본다.

## 서비스 모델 3 — 누가 무엇을 관리하나

| 관리 대상 | IaaS | PaaS | SaaS |
| --- | --- | --- | --- |
| 기반 클라우드 인프라(물리 계층; IaaS 소비자는 운영체제·저장소·배포한 앱을 통제) | 사업자 | 사업자 | 사업자 |
| 운영체제 | **소비자** | 사업자 | 사업자 |
| 애플리케이션 | 소비자 | **소비자(배포한 앱 + 호스팅 환경 설정)** | 사업자(소비자는 제한된 사용자 설정만) |

- 위 표는 NIST 문장에서 "소비자가 관리·통제하는 범위"를 정리한 것이다. NIST 는 소비자가 IaaS 에서는 OS·저장소·배포 앱(및 일부 네트워크 구성 요소)을, PaaS 에서는 배포 앱과 호스팅 환경 설정을, SaaS 에서는 제한된 사용자 설정만 다룬다고 쓴다. 런타임·미들웨어 같은 중간 층은 NIST 문장에 나오지 않아 표에 넣지 않았다(교재의 층 그림은 별도).
- NIST 는 이 분류가 "단순한 분류 체계이며 특정 배포·제공·사업 방식을 규정하거나 제한하려는 것이 아니다"라고 밝힌다. 그래서 FaaS·CaaS 같은 후속 용어는 NIST 원문에 없다.

## 배포 모델 4

| 모델 | 요지 |
| --- | --- |
| 프라이빗 | 단일 조직(여러 소비자 포함)이 독점 사용. 소유·운영 주체는 조직·제3자·혼합, 온/오프 프레미스 모두 가능 |
| 커뮤니티 | 공통 관심(임무·보안 요건·정책·규정 준수)을 가진 특정 공동체가 독점 사용 |
| 퍼블릭 | 일반 대중 개방. 클라우드 사업자 부지에 존재 |
| 하이브리드 | 둘 이상의 서로 다른 클라우드(프라이빗·커뮤니티·퍼블릭)가 각각 독립적으로 남되 표준·독자 기술로 묶여 데이터·애플리케이션 이식성을 가짐(예: 부하 분산용 클라우드 버스팅) |

- "하이브리드 클라우드"를 "온프레미스 + 클라우드"라고만 외우면 NIST 정의보다 좁다. 원문은 서로 다른 클라우드 인프라의 조합이다.

## 가상화·컨테이너

- NIST SP 800-145 는 가상화와 컨테이너를 정의하지 않는다. 자원 풀링의 "물리·가상 자원"이라는 표현만 있다. 아래는 사업자 공식 문서 서술이다.
- **가상 머신(VM)**: Azure 문서는 VM 을 물리 하드웨어를 사지 않고도 가상화의 유연성을 주는 컴퓨팅 자원으로 설명하며, 구성·패치·소프트웨어 설치는 사용자가 한다고 적는다(IaaS 성격).
- **컨테이너**: Docker 문서는 컨테이너를 격리되어 실행되는 일반 프로세스로 설명한다. 자체 파일·시스템 뷰·선택적 메모리/CPU 제한을 갖고 앱 실행에 필요한 모든 것을 담는다.
- VM 과 컨테이너(같은 문서): VM 은 컴퓨터 전체를 모방해 자체 커널을 가진 OS 를 부팅한다. 컨테이너는 호스트 커널을 공유해 시작이 빠르고 작다. VM 이 하드웨어 경계로 분리되어 격리가 더 강하다고 서술한다.
- YARN 의 "컨테이너"는 메모리·CPU 등을 묶은 자원 단위로, Docker 컨테이너와 같은 말이지만 다른 개념이다 → [YARN](/develop-wiki/knowledge/data-analytics/hadoop-hdfs-mapreduce-yarn/).

## 빅데이터 플랫폼의 클라우드 서비스 예(이름·역할만 공식 문서로 확인)

| 사업자 | 서비스 | 공식 문서 서술(의역) | 층 |
| --- | --- | --- | --- |
| AWS | Amazon S3 | 객체 저장소 서비스. 데이터 레이크·빅데이터 분석 등에 사용 | 저장 |
| AWS | Amazon EMR | Hadoop·Spark 같은 빅데이터 프레임워크 실행을 단순화하는 관리형 클러스터 플랫폼 | 처리 |
| Azure | Azure Data Lake Storage | Blob Storage 에 하둡 호환 접근·계층 네임스페이스를 더한 저장소 | 저장 |
| Azure | Azure Databricks | Spark 를 Azure 와 통합한 분석·머신러닝 플랫폼 | 처리 |
| Google Cloud | BigQuery | SQL·Python 으로 데이터를 분석하는 완전 관리형 서버리스 데이터 플랫폼, 저장과 컴퓨팅 분리 | 질의 |

- 이 서비스가 NIST 의 IaaS/PaaS/SaaS 중 정확히 어디인지는 각 사 문서가 규정하지 않아 구분하지 않았다. 관리형일수록 PaaS 쪽에 가깝다는 해석은 필자의 추정이다.
- Google Cloud 의 하둡·Spark 관리형 서비스(과거 이름 Dataproc)는 문서 페이지가 새 명칭으로 안내되어 현재 서비스명을 확인하지 못했다. 목록에서 제외한다.
- 서비스 목록은 대표 예이며 가격·기능 비교가 아니다.

## 언제 쓰나 / 주의

- 빅데이터 클러스터를 직접 운영하면 통제가 크고 운영 부담도 크다. 관리형 서비스를 쓰면 운영 부담이 준다. 그 대가로 벤더 종속·비용 구조 파악이 필요하다.
- 클라우드 저장소(객체 저장)로 HDFS 를 대체하는 흐름은 레이크 구조와 관련이 깊다 → [레이크·레이크하우스](/develop-wiki/knowledge/data-analytics/data-warehouse-data-mart-lake-lakehouse/). 개인정보·규제가 걸린 데이터는 배포 모델(프라이빗·커뮤니티)과 위치 지정 가능성을 먼저 본다.
- 컨테이너는 격리가 VM 보다 약하다는 문서 서술을 보안 요구와 함께 판단한다.
- "누가 무엇을 관리하나"로 IaaS/PaaS/SaaS 를 구분하고 배포 모델 4종·필수 특성 5종의 이름을 정확히 구분해 두는 것이 도움이 될 것이다(필자 추정, 출제 방식은 미확인).
- 수집·적재 방식은 [ETL·ELT](/develop-wiki/knowledge/data-analytics/etl-elt-cdc-eai-integration/), 도구 목록은 [생태계 노트](/develop-wiki/knowledge/data-analytics/hadoop-ecosystem-hive-hbase-sqoop-flume/).

## 검증 범위

- 읽은 것: NIST SP 800-145 전문(PDF 텍스트 추출, 본문 2쪽 분량), Docker 컨테이너 개념 페이지, Azure VM 개요, AWS EMR·S3 소개, BigQuery 소개, Azure 데이터 레이크 문서.
- 미확인: ADP 교재가 말하는 "클라우드 인프라 기술" 세부(가상화 종류·하이퍼바이저·Docker 이외 컨테이너 기술 등), 사업자별 서비스가 NIST 모델의 어느 층인지, Azure Databricks·Data Lake Storage 의 별도 제품 페이지(Azure 데이터 레이크 문서의 서술을 사용). Google Cloud 하둡/Spark 서비스명.
- 실행: 없음.
