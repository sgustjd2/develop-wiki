---
name: Unstructured
url: https://unstructured.io
docs: https://docs.unstructured.io/open-source/introduction/overview
repo: https://github.com/Unstructured-IO/unstructured
stars: 15787
domain: ai
category: rag-retrieval
description: PDF·HTML·Word·이메일 등 다양한 문서를 요소(Element) 단위로 분할·정제·청킹하는 오픈소스 전처리 라이브러리. 상용 API 도 있다.
pricing: oss
tags: [document-parsing, etl, chunking, preprocessing]
languages: [python]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
`unstructured` 는 문서를 읽어 제목·본문·목록·표·이미지 캡션 같은 **요소(Element)** 목록으로 쪼개는 Python 라이브러리다. `partition()` 하나가 파일 형식을 감지해 형식별 파서로 보내고, 이어서 정제(cleaning)·청킹·메타데이터 부착까지 이어지는 LLM 전처리 흐름을 제공한다.
오픈소스 라이브러리는 Apache-2.0 이며 README 에 "앞으로도 무료"라고 명시돼 있다. 회사는 별도로 상용 Transform API·플랫폼을 운영하며, 표 인식 품질은 상용 쪽이 더 높다고 자체 벤치마크로 밝힌다. 대량 배치 수집용 커넥터는 별도 패키지 `unstructured-ingest` 로 분리돼 있다.
PDF 레이아웃·표 복원 품질을 우선한다면 [Docling](/develop-wiki/ai/rag-retrieval/docling/) 과 함께 비교한다.

## 설치
기준: unstructured 0.27.37 (2026-11-06), Python 3.11~3.13.

```bash
pip install unstructured                   # 텍스트·HTML·XML·JSON·이메일
pip install "unstructured[pdf,docx,pptx]"  # 필요한 형식만 extra 로
pip install "unstructured[all-docs]"       # 전체 형식
```

형식에 따라 시스템 패키지가 필요하다: `libmagic`(형식 감지), `poppler`·`tesseract`(PDF·이미지), `libreoffice`(MS Office). 의존성이 번거로우면 공식 Docker 이미지 `downloads.unstructured.io/unstructured-io/unstructured:latest` 를 쓴다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `partition()` | 파일 형식을 자동 감지해 요소 목록 반환. `partition_pdf`, `partition_html` 등 형식별 함수도 있다 |
| Element | `Title`, `NarrativeText`, `ListItem`, `Table` 등 타입이 붙은 텍스트 조각 + 메타데이터(페이지, 파일명 …) |
| PDF 전략 | `strategy` 로 `auto`, `fast`(텍스트 추출), `hi_res`(레이아웃 모델), `ocr_only` 선택 |
| 청킹 | `chunk_by_title`(섹션 경계 유지), `chunk_elements`(기본). `max_characters` 기본 500 |
| 분할 시 청킹 | `partition(..., chunking_strategy="by_title")` 처럼 분할과 동시에 청킹 |
| 텔레메트리 | 기본으로 가벼운 사용 통계를 보낸다. `DO_NOT_TRACK` 또는 `SCARF_NO_ANALYTICS` 를 설정하면 끈다 |

## 기본 사용법
1) 문서를 요소로 나누기

```python
from unstructured.partition.auto import partition

elements = partition(filename="./docs/contract.pdf", strategy="hi_res")
for el in elements[:10]:
    print(type(el).__name__, el.metadata.page_number, str(el)[:60])
```

2) 섹션 단위로 청킹해 RAG 에 넣기

```python
from unstructured.chunking.title import chunk_by_title
from unstructured.partition.auto import partition

elements = partition(filename="./docs/handbook.docx")
chunks = chunk_by_title(elements, max_characters=1000)
records = [{"text": str(c), "page": c.metadata.page_number} for c in chunks]
print(len(records))
```

## 자주 쓰는 패턴
- **형식별 extra 만 설치**: 컨테이너 크기를 줄이려면 `all-docs` 대신 실제로 쓰는 형식의 extra 만 설치한다.
- **전략 선택**: 텍스트 레이어가 있는 디지털 PDF 는 `fast` 로 빠르게, 스캔본이나 다단 레이아웃은 `hi_res`(느리지만 정확)로 처리한다.
- **요소 타입으로 필터링**: 머리글·바닥글·페이지 번호 같은 요소를 타입·위치로 걸러낸 뒤 청킹하면 검색 노이즈가 줄어든다.
- **메타데이터 활용**: 청크에 남은 페이지 번호·원본 파일명을 벡터 DB 페이로드로 저장해 답변의 출처 표시에 쓴다.
- **프레임워크 연동**: [LangChain](/develop-wiki/ai/agent-framework/langchain/)·[LlamaIndex](/develop-wiki/ai/rag-retrieval/llamaindex/) 에 Unstructured 로더가 있다.

## 언제 쓰나 / 피할 때
- 쓸 때: 이메일·HTML·Office·PDF 가 섞인 문서 더미를 한 가지 인터페이스로 전처리할 때, 요소 타입·메타데이터 기반으로 청킹을 세밀하게 제어할 때.
- 피할 때(대안): 복잡한 표·읽기 순서 복원이 핵심이면 [Docling](/develop-wiki/ai/rag-retrieval/docling/) 이나 상용 파싱 API 를 비교한다. 시스템 의존성 설치가 어려운 환경에서는 Docker 이미지나 상용 API 를 쓴다.

## 공식 문서
- [오픈소스 개요](https://docs.unstructured.io/open-source/introduction/overview) · [Quick Start](https://docs.unstructured.io/open-source/introduction/quick-start) · [청킹](https://docs.unstructured.io/open-source/core-functionality/chunking)
- [분할(partitioning)](https://docs.unstructured.io/open-source/core-functionality/partitioning) · [unstructured-ingest](https://github.com/Unstructured-IO/unstructured-ingest)
