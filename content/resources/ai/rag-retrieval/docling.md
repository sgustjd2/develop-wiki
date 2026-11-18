---
name: Docling
url: https://docling-project.github.io/docling/
docs: https://docling-project.github.io/docling/
repo: https://github.com/docling-project/docling
domain: ai
category: rag-retrieval
description: PDF·Office·HTML·이미지 등을 레이아웃·표·읽기 순서를 살려 마크다운·JSON 으로 변환하는 문서 파싱 라이브러리. RAG 전처리에 쓴다.
pricing: oss
tags: [document-parsing, pdf, ocr, chunking]
languages: [python]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Docling 은 IBM Research 에서 시작해 LF AI & Data 재단이 호스팅하는 문서 변환 라이브러리다. PDF 의 페이지 레이아웃, 읽기 순서, 표 구조, 수식, 코드를 인식해 `DoclingDocument` 라는 통일된 표현으로 만들고, 이를 Markdown·HTML·JSON 등으로 내보낸다.
PDF 외에 DOCX·PPTX·XLSX·HTML·EPUB·이미지·이메일·오디오(ASR)·영상(전사+키프레임)까지 다루며, 로컬에서 돌기 때문에 민감 문서나 폐쇄망에도 쓸 수 있다. 라이선스는 MIT(사용하는 개별 모델은 각자 라이선스).
RAG 파이프라인에서는 "문서 → 깨끗한 구조화 텍스트 → 청크" 단계를 맡고, 색인·검색은 [LlamaIndex](/develop-wiki/ai/rag-retrieval/llamaindex/)·[Haystack](/develop-wiki/ai/rag-retrieval/haystack/)·[LangChain](/develop-wiki/ai/agent-framework/langchain/) 등에 넘긴다.

## 설치
기준: docling 2.150.1 (2026-11-14), Python 3.10 이상. macOS·Linux·Windows, x86_64·arm64.

```bash
pip install docling
```

처음 변환할 때 레이아웃·표 인식 모델을 내려받는다. 서비스로 띄우려면 별도 패키지 `docling-serve`(API 서버), 에이전트 연동은 MCP 서버를 쓴다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `DocumentConverter` | 입력 형식을 감지해 변환하는 진입점. 로컬 경로·URL 을 받는다 |
| `DoclingDocument` | 제목·문단·표·그림·캡션을 계층과 위치 정보까지 담은 통일 표현 |
| 내보내기 | `export_to_markdown()`, `export_to_html()`, 무손실 JSON, DocTags |
| 파이프라인 | 기본 PDF 파이프라인(레이아웃·표 모델 + 선택적 OCR) 또는 VLM 파이프라인(예: GraniteDocling) |
| OCR | 스캔 PDF·이미지용. 여러 OCR 엔진 중 선택 |
| `HybridChunker` | 문서 구조로 먼저 나누고 토크나이저 기준으로 크기를 맞추는 청커 |
| `HierarchicalChunker` | 문서 요소 하나당 청크 하나를 만드는 구조 기반 청커 |

## 기본 사용법
1) CLI 로 바로 변환

```bash
docling https://arxiv.org/pdf/2408.09869            # 현재 폴더에 .md 생성
docling --vlm-model granite_docling ./scan.pdf      # VLM 파이프라인 사용
```

2) Python 에서 변환 후 마크다운 얻기

```python
from docling.document_converter import DocumentConverter

converter = DocumentConverter()
result = converter.convert("./reports/q3.pdf")   # 경로 또는 URL
markdown = result.document.export_to_markdown()
print(markdown[:500])
```

3) RAG 용 청크 만들기

```python
from docling.chunking import HybridChunker
from docling.document_converter import DocumentConverter

doc = DocumentConverter().convert("./manual.pdf").document
chunker = HybridChunker()   # 임베딩 모델과 같은 토크나이저를 지정하는 것을 권장
for chunk in chunker.chunk(dl_doc=doc):
    text = chunker.contextualize(chunk=chunk)   # 제목 등 맥락을 붙인 문자열
    print(len(text), text[:80])
```

## 자주 쓰는 패턴
- **표가 중요한 문서**: 재무제표·사양서처럼 표가 핵심이면 Markdown 으로 내보내 표 구조를 유지한 채 LLM 에 넣는다. 표가 청크 경계에서 잘리면 `HybridChunker` 가 기본으로 표 헤더를 반복한다.
- **청크와 임베딩 모델 맞추기**: `HybridChunker` 의 토크나이저를 실제 임베딩 모델(예: [BGE-M3](/develop-wiki/models/baai/bge-m3/))과 같게 두면 청크가 임베딩 최대 길이를 넘지 않는다.
- **`contextualize` 로 임베딩**: 원문 청크 대신 제목·섹션 경로를 붙인 문자열을 임베딩하면 검색 정확도가 올라가는 경우가 많다.
- **프레임워크 연동**: LlamaIndex·LangChain·Haystack·CrewAI 용 공식 연동이 있어 Reader/Loader 로 바로 꽂는다.
- **OCR 전용 모델과 비교**: 스캔 문서 비중이 크면 [GLM-OCR](/develop-wiki/models/zai/glm-ocr/) 같은 문서 특화 모델과 품질·속도를 비교해 본다.

## 언제 쓰나 / 피할 때
- 쓸 때: PDF·Office 문서를 로컬에서 구조를 살려 변환해야 할 때, RAG 전처리 품질(표·읽기 순서)이 검색 품질을 좌우할 때.
- 피할 때(대안): 텍스트만 빠르게 뽑으면 되는 단순 문서라면 가벼운 PDF 텍스트 추출기로 충분하다. 수십 개 커넥터와 관리형 처리 파이프라인이 필요하면 [Unstructured](/develop-wiki/ai/rag-retrieval/unstructured/)(오픈소스 + 상용 API)를 비교한다.

## 공식 문서
- [문서 홈](https://docling-project.github.io/docling/) · [지원 형식](https://docling-project.github.io/docling/usage/supported_formats/) · [청킹](https://docling-project.github.io/docling/concepts/chunking/)
- [연동](https://docling-project.github.io/docling/integrations/) · [기술 보고서](https://arxiv.org/abs/2408.09869)
