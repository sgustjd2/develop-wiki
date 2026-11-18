---
name: Jupyter (JupyterLab·Notebook)
url: https://jupyter.org
docs: https://docs.jupyter.org/en/latest/
repo: https://github.com/jupyterlab/jupyterlab
stars: 15410
domain: data-ml
category: analytics-bi
description: 코드·실행 결과·그래프·설명을 한 문서(.ipynb)에 담는 대화형 노트북 환경. 데이터 탐색, 분석 보고, ML 실험 기록에 쓴다.
pricing: oss
tags: [notebook, ipynb, interactive, data-analysis, ipython]
languages: [python]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Project Jupyter 는 브라우저에서 셀 단위로 코드를 실행하고 결과(표, 그림, 위젯)를 바로 아래에 보여 주는 노트북 도구 모음이다. 노트북 파일(`.ipynb`)은 JSON 으로 코드·출력·마크다운을 함께 저장한다. 실행은 "커널" 이 맡아 Python(ipykernel) 외에 R·Julia 등 여러 언어 커널을 붙일 수 있다.

**버전(2026-11 기준):** JupyterLab 4.6.6, Jupyter Notebook 7.6.5(둘 다 2026-11-06). Notebook 7 은 JupyterLab 컴포넌트 위에 만든 단일 문서 인터페이스다. 라이선스 BSD-3-Clause.

## 설치
```bash
pip install jupyterlab        # 탭·파일 브라우저·터미널이 있는 IDE 형 UI
jupyter lab                   # http://localhost:8888 (토큰 포함 URL 출력)

pip install notebook          # 클래식 형태의 단일 노트북 UI
jupyter notebook
```
VS Code·PyCharm 도 `.ipynb` 를 직접 열어 실행할 수 있다(ipykernel 필요).

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 노트북 `.ipynb` | 셀 목록 + 출력 + 메타데이터를 담은 JSON |
| 셀 | 코드 셀(실행) / 마크다운 셀(설명) |
| 커널 | 코드를 실행하는 별도 프로세스. 변수 상태를 유지 |
| 실행 순서 `[n]` | 셀 실행 순서 번호. 위에서 아래 순서와 다를 수 있음 |
| 매직 명령 | `%timeit`, `%%time`, `%pip install` 등 IPython 기능 |
| 확장 | JupyterLab 확장(pip 로 설치), 위젯(ipywidgets) |
| JupyterHub | 여러 사용자에게 노트북 서버를 제공하는 멀티유저 서버 |

## 기본 사용법
```python
# 셀 1: 커널이 쓰는 환경에 패키지 설치
%pip install pandas matplotlib

# 셀 2: 데이터 로드 — 마지막 표현식은 자동으로 표로 렌더링
import pandas as pd
df = pd.read_csv("sales.csv")
df.describe()

# 셀 3: 그래프는 셀 출력에 그려짐
ax = df.groupby("region")["amount"].sum().plot.bar()
```

```bash
jupyter nbconvert --to html report.ipynb                 # HTML 보고서로 변환
jupyter nbconvert --to notebook --execute report.ipynb   # 처음부터 다시 실행
```

## 자주 쓰는 패턴
- **재현성 확인**: 공유 전 "Restart Kernel and Run All" 로 순서 의존 버그를 없앤다.
- **가상환경 커널 등록**: `python -m ipykernel install --user --name myenv` 로 프로젝트 환경을 커널로 추가.
- **버전 관리**: 출력이 diff 를 어지럽히므로 커밋 전 출력 제거(`nbstripout`)나 Jupytext 로 `.py` 동기화를 쓴다.
- **노트북 → 파이프라인**: 탐색이 끝난 코드는 모듈로 옮기고 [Prefect](/develop-wiki/data-ml/orchestration/prefect/)·[Dagster](/develop-wiki/data-ml/orchestration/dagster/) 로 스케줄링한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 데이터 탐색, 시각화하며 가설 검증, 분석 과정을 설명과 함께 공유, 교육 자료.
- 피할 때(대안): 다른 사람이 쓰는 대화형 앱은 [Streamlit](/develop-wiki/data-ml/analytics-bi/streamlit/), 정기 대시보드는 [Apache Superset](/develop-wiki/data-ml/analytics-bi/apache-superset/)·[Metabase](/develop-wiki/data-ml/analytics-bi/metabase/). 운영 코드는 노트북 대신 테스트 가능한 모듈로.

## 공식 문서
- [Jupyter 문서 허브](https://docs.jupyter.org/en/latest/) · [JupyterLab 문서](https://jupyterlab.readthedocs.io/en/stable/) · [Notebook 7 문서](https://jupyter-notebook.readthedocs.io/en/stable/)
- [IPython 매직 명령](https://ipython.readthedocs.io/en/stable/interactive/magics.html) · [nbconvert](https://nbconvert.readthedocs.io/en/latest/)
