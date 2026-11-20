---
name: TheAlgorithms/Python
url: https://the-algorithms.com/
repo: https://github.com/TheAlgorithms/Python
stars: 226344
domain: oss
category: learning-repos
description: 알고리즘과 자료 구조를 Python 으로 구현해 모은 커뮤니티 저장소. 정렬·그래프·DP·암호·수치 계산 등 다양한 알고리즘의 Python 구현 예를 찾아 읽을 때 쓴다.
pricing: oss
tags: [algorithms, data-structures, python, education]
languages: [python]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
TheAlgorithms 조직은 언어별(Python, Java, C++, Go, Rust, JavaScript 등) 저장소에 같은 알고리즘을 구현해 모으는데, 그중 Python 저장소가 가장 크다. README 는 "교육용이며 표준 라이브러리 구현보다 비효율적일 수 있다"고 명시한다. 기여 가이드가 엄격해 doctest·타입 힌트·ruff 포맷을 요구하고, pre-commit 과 CI 로 검사한다. 2026-11 기준 별 약 22.6만, 라이선스 MIT. 커밋이 매우 활발하다(마지막 2026-11-11).

## 무엇이 들어 있나
| 폴더(일부) | 내용 |
| --- | --- |
| sorts · searches | 정렬·탐색 알고리즘 수십 가지 |
| data_structures | 연결 리스트, 스택·큐, 힙, 트리, 해시, 트라이, 그래프 표현 |
| graphs | BFS·DFS, 최단 경로, 최소 신장 트리, 위상 정렬, 강한 연결 요소 |
| dynamic_programming · backtracking · greedy_methods · divide_and_conquer | 패러다임별 문제 풀이 |
| strings | 문자열 매칭(KMP 등), 회문, 편집 거리 |
| maths · linear_algebra · matrix | 수학·선형대수 구현 |
| ciphers · hashes | 고전 암호, 해시 함수 구현 |
| machine_learning · neural_network · computer_vision | 기초 ML·신경망 구현 |
| project_euler | Project Euler 문제 풀이 |
| DIRECTORY.md | 전체 파일 색인 |

## 이렇게 활용하라
1. **DIRECTORY.md 나 웹사이트에서 알고리즘을 찾는다.** the-algorithms.com 은 같은 알고리즘의 다른 언어 구현도 함께 보여 준다.
2. **doctest 를 실행해 동작을 확인한다.** 대부분 파일에 예시 입력·출력이 doctest 로 들어 있다.
   ```bash
   python3 -m doctest -v sorts/quick_sort.py
   ```
3. **개념 노트와 함께 본다.** 예: [KMP](/develop-wiki/knowledge/algorithms/kmp-string-search/), [최단 경로](/develop-wiki/knowledge/algorithms/shortest-path/), [위상 정렬](/develop-wiki/knowledge/algorithms/topological-sort/)
4. **첫 오픈소스 기여 연습장으로 쓴다.** CONTRIBUTING 의 규칙(테스트, 타입 힌트, 설명 주석)을 지켜 새 알고리즘이나 doctest 를 추가해 본다.

## 주의
- 기여자가 많아 같은 알고리즘의 구현 스타일·품질이 파일마다 다르다.
- 학습용이다. 실무 정렬·탐색은 `sorted`, `bisect`, `heapq` 같은 표준 라이브러리를 쓴다.
- 한국어 번역은 없다.

## 링크
- [저장소 README](https://github.com/TheAlgorithms/Python) · [DIRECTORY.md](https://github.com/TheAlgorithms/Python/blob/master/DIRECTORY.md) · [기여 가이드](https://github.com/TheAlgorithms/Python/blob/master/CONTRIBUTING.md) · [웹사이트](https://the-algorithms.com/)
- 이 사이트: [JavaScript Algorithms](/develop-wiki/oss/learning-repos/javascript-algorithms/) · [Python 언어](/develop-wiki/languages/python/)
