---
name: Google Cloud Run
url: https://cloud.google.com/run
docs: https://docs.cloud.google.com/run/docs
domain: cloud
category: serverless
description: 컨테이너 이미지나 소스 코드를 올리면 HTTPS 엔드포인트와 자동 확장(0까지)을 제공하는 Google Cloud 의 서버리스 컨테이너 실행 서비스. 언어 제약 없이 웹·API·배치 작업을 돌릴 때 쓴다.
pricing: freemium
tags: [gcp, cloud-run, serverless, containers, scale-to-zero]
languages: []
koreanDocs: true
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Cloud Run 은 컨테이너를 기본 단위로 하는 서버리스 플랫폼이다. 함수가 아니라 **임의의 HTTP 서버 컨테이너**를 실행하므로 언어·프레임워크·바이너리 제약이 거의 없고, 요청량에 따라 인스턴스를 늘리고 유휴 시 줄인다. TLS·고유 URL·WebSocket·HTTP/2·gRPC 를 기본 지원하고, 리비전별 트래픽 분할로 점진 배포·롤백을 한다. 실행 형태는 **서비스**(요청 처리), **잡**(끝나면 종료하는 작업, 병렬 태스크), **워커 풀**(요청을 받지 않는 상시 백그라운드), 그리고 함수 형태로 배포하는 **Cloud Run functions** 가 있다.

## 설치·준비
```bash
gcloud init
gcloud config set project "$PROJECT_ID"
gcloud config set run/region asia-northeast3       # 서울
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Service | 요청을 처리하는 단위. 안정적인 URL 과 리비전 목록을 가진다 |
| Revision | 배포마다 생기는 불변 스냅샷. 트래픽을 리비전별 비율로 나눌 수 있다 |
| Instance | 컨테이너 실행 인스턴스. 인스턴스당 동시 요청 수(concurrency) 설정 |
| 컨테이너 계약 | 서비스는 `PORT` 환경 변수 포트에서 수신해야 한다. 잡은 포트를 열지 않는다 |
| min/max instances | 최소 인스턴스로 콜드 스타트 완화, 최대 인스턴스로 비용·다운스트림 보호 |
| Job / Task | 끝나는 작업. 배열 잡으로 태스크를 병렬 실행 |
| Worker pool | 요청 없이 계속 도는 백그라운드 처리용 리소스 |
| Service identity | 서비스가 다른 Google Cloud API 를 호출할 때 쓰는 서비스 계정 |
| Invoker IAM check | 비공개 서비스는 `roles/run.invoker` 필요. 공개 서비스는 이 검사를 끈다 |

## 기본 사용법
```ts
// server.ts — PORT 를 읽어 수신하는 최소 HTTP 서버 (Node.js)
import { createServer } from "node:http";

const port = Number(process.env.PORT ?? 8080);
createServer((req, res) => {
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify({ ok: true, revision: process.env.K_REVISION }));
}).listen(port);
```
```bash
# 소스에서 바로 배포 (Dockerfile 이 있으면 사용, 없으면 buildpacks 로 빌드)
gcloud run deploy hello-api --source . --no-invoker-iam-check   # 공개 API

# 이미지로 배포 + 비밀값은 Secret Manager 에서 주입
gcloud run deploy hello-api --image "$IMAGE_URI" \
  --update-secrets=DATABASE_URL=database-url:latest --min-instances=0 --max-instances=10

# 잡 생성·실행
gcloud run jobs create nightly-report --image "$IMAGE_URI" --tasks 4
gcloud run jobs execute nightly-report
```

## 자주 쓰는 패턴
- **점진 배포**: 새 리비전을 태그로 배포해 1%→50%→100% 로 트래픽 이동, 문제 시 이전 리비전으로 즉시 복귀.
- **이벤트 처리**: Pub/Sub 푸시 구독·Eventarc 로 Cloud Storage·Firebase 이벤트를 서비스로 전달.
- **비동기 작업**: 응답 후 처리가 필요하면 Cloud Tasks 로 작업을 넣고 별도 서비스가 처리.
- **DB 연결**: Cloud SQL 커넥터·VPC 연결을 쓰고, 최대 인스턴스 수로 DB 커넥션 폭주를 막는다.
- **컨테이너 이식성**: 같은 [Docker](/develop-wiki/backend/infra-devops/docker/) 이미지를 로컬·GKE·다른 클라우드에서도 실행할 수 있다.

## 언제 쓰나 / 피할 때
- 쓸 때: 상태 없는 웹·API 를 언어 제약 없이 서버리스로 운영하고 싶을 때, 트래픽이 들쭉날쭉한 서비스, 컨테이너 배치 작업.
- 피할 때(대안): 노드·네트워크 수준 제어나 상태 있는 워크로드가 많으면 GKE·[Kubernetes](/develop-wiki/backend/infra-devops/kubernetes/). AWS 이벤트 중심이면 [AWS Lambda](/develop-wiki/cloud/serverless/aws-lambda/), 프론트엔드 프리뷰 중심이면 [Vercel](/develop-wiki/cloud/paas-edge/vercel/). 인스턴스 로컬 디스크는 휘발성이므로 파일은 Cloud Storage 에 저장한다.
- 요금: 무료 사용량과 CPU·메모리·요청 기반 과금. 수치는 [가격 페이지](https://cloud.google.com/run/pricing)에서 확인한다.

## 공식 문서
- [문서 홈](https://docs.cloud.google.com/run/docs) · [Cloud Run 이란](https://docs.cloud.google.com/run/docs/overview/what-is-cloud-run) · [소스 배포](https://docs.cloud.google.com/run/docs/deploying-source-code) · [컨테이너 계약](https://docs.cloud.google.com/run/docs/container-contract) · [공개 접근 설정](https://docs.cloud.google.com/run/docs/authenticating/public) · [잡 만들기](https://docs.cloud.google.com/run/docs/create-jobs)
