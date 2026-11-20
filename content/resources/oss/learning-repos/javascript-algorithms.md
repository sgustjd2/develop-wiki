---
name: JavaScript Algorithms and Data Structures
url: https://github.com/trekhleb/javascript-algorithms
repo: https://github.com/trekhleb/javascript-algorithms
stars: 196755
domain: oss
category: learning-repos
description: 주요 자료 구조와 알고리즘을 JavaScript 로 구현하고 각각 설명 README 와 테스트를 붙인 학습 저장소. JS 개발자가 알고리즘을 코드로 읽고 실행해 보며 익힐 때 쓴다.
pricing: oss
tags: [algorithms, data-structures, javascript, interview]
languages: [typescript]
koreanDocs: true
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Oleksii Trekhleb 의 저장소로, 연결 리스트부터 그래프·동적 계획법·머신러닝 기초까지 **구현 코드 + 개념 README + Jest 테스트**를 한 폴더에 묶었다. 항목마다 난이도 표시(`B` 입문, `A` 고급)가 있다. 2026-11 기준 별 약 19.7만, 라이선스 MIT. 최근 6개월 커밋 19건, 마지막 2026-07-26.

README 번역이 20개 언어에 있고 한국어 README(README.ko-KR.md)와 알고리즘별 한국어 README 가 일부 있다. 한국어 README 는 2025-02 이후 갱신되지 않아 최신 항목은 영어판과 대조한다.

## 무엇이 들어 있나
| 섹션 | 내용 |
| --- | --- |
| Data Structures | Linked List, Queue, Stack, Hash Table, Heap, Priority Queue, Trie, Tree(BST, AVL, Red-Black, Segment, Fenwick), Graph, Disjoint Set, Bloom Filter, LRU Cache |
| Algorithms by Topic | Math(비트 연산, 소수, 행렬), Sets(조합·순열·부분집합), Strings, Searches, Sorting, Linked Lists, Trees, Graphs(다익스트라, 벨만-포드, 크루스칼 등), Cryptography, Machine Learning 등 |
| Algorithms by Paradigm | Brute Force, Greedy, Divide and Conquer, Dynamic Programming, Backtracking, Branch & Bound |
| How to use this repository | 설치, 린트, 테스트 실행 방법 |
| Useful Information | Big-O 그래프, 자료 구조 연산 복잡도 표, 정렬 알고리즘 복잡도 표 |

## 이렇게 활용하라
1. **클론하고 테스트부터 돌린다.**
   ```bash
   git clone https://github.com/trekhleb/javascript-algorithms.git
   cd javascript-algorithms && npm install
   npm test -- 'LinkedList'    # 이름으로 특정 테스트만 실행
   ```
2. **README → 테스트 → 구현 순서로 읽는다.** 테스트가 사용 예시 역할을 한다.
3. **구현을 지우고 다시 짠다.** 해당 폴더의 구현 파일을 비우고 테스트가 통과할 때까지 직접 작성한다.
4. **복잡도 표로 복습한다.** README 하단의 자료 구조·정렬 복잡도 표를 이 사이트의 [Big-O](/develop-wiki/knowledge/algorithms/big-o-complexity/) · [정렬 비교](/develop-wiki/knowledge/algorithms/sorting-comparison/) 노트와 함께 본다.

## 주의
- 학습용 구현이다. 실무에서는 언어 내장 기능(`Array.prototype.sort`, `Map`, `Set`)이나 검증된 라이브러리를 쓴다.
- 코드는 JavaScript(ES 모듈 이전 스타일 포함)이며 TypeScript 타입은 없다.

## 링크
- [저장소 README](https://github.com/trekhleb/javascript-algorithms) · [한국어 README](https://github.com/trekhleb/javascript-algorithms/blob/master/README.ko-KR.md)
- 이 사이트: [TheAlgorithms/Python](/develop-wiki/oss/learning-repos/the-algorithms-python/)(Python 판) · [Coding Interview University](/develop-wiki/oss/learning-repos/coding-interview-university/)
