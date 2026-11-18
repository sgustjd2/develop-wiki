---
title: 트라이 (접두사 트리)
aka: [Trie, Prefix Tree, Digital Tree, Radix Tree, Patricia Trie, 래딕스 트리]
category: algorithms
group: data-structure
level: intermediate
summary: 문자열을 한 글자씩 간선으로 나눠 저장해 공통 접두사를 공유하는 트리. 길이 L 인 키 조회가 원소 수와 무관하게 O(L)이고 접두사 검색·자동완성에 강하다.
tags: [trie, prefix, radix-tree, autocomplete, routing]
related: [algorithms/hash-table, algorithms/bst-balanced-tree, algorithms/kmp-string-search, algorithms/bfs-dfs]
sources:
  - https://en.wikipedia.org/wiki/Trie
  - https://en.wikipedia.org/wiki/Radix_tree
  - https://cp-algorithms.com/string/aho_corasick.html
  - https://github.com/julienschmidt/httprouter
updatedAt: 2026-11-18
---

## 개념

루트에서 아래로 내려가며 간선마다 글자 하나를 소비한다. 루트→노드 경로가 그 노드의 접두사이고, "여기서 단어가 끝남" 표시를 노드에 둔다. `car`, `cat`, `cart` 는 `ca` 경로를 공유한다.

이름은 Fredkin(1960)이 retrieval 의 가운데 음절에서 따왔고, 컴퓨팅 맥락의 첫 기술은 de la Briandais(1959)다.

## 연산 복잡도 (L = 키 길이, Σ = 알파벳 크기)

| 연산 | 트라이 | 해시 테이블 | 균형 트리 |
| --- | --- | --- | --- |
| 정확히 조회 | O(L) | 평균 O(L) (해시 계산) | O(L log n) |
| 접두사 p 로 시작하는 k 개 나열 | O(\|p\| + 출력 크기) | O(n·L) 전수 | O(L log n + k) |
| 최장 접두사 일치 | O(L) | 접두사마다 조회 O(L²) | 어려움 |
| 공간 | 최악 O(총 글자 수 × Σ) (배열 자식) | O(총 글자 수) | O(총 글자 수) |

## 구현

```ts
class TrieNode {
  children = new Map<string, TrieNode>();
  end = false;
}

class Trie {
  private root = new TrieNode();

  insert(word: string): void {
    let n = this.root;
    for (const ch of word) {
      let next = n.children.get(ch);
      if (!next) { next = new TrieNode(); n.children.set(ch, next); }
      n = next;
    }
    n.end = true;
  }

  private find(prefix: string): TrieNode | undefined {
    let n: TrieNode | undefined = this.root;
    for (const ch of prefix) {
      n = n.children.get(ch);
      if (!n) return undefined;
    }
    return n;
  }

  has(word: string): boolean { return this.find(word)?.end ?? false; }

  // 자동완성: 접두사 아래를 DFS 하며 최대 limit 개
  complete(prefix: string, limit = 10): string[] {
    const out: string[] = [];
    const start = this.find(prefix);
    const dfs = (n: TrieNode, acc: string): void => {
      if (out.length >= limit) return;
      if (n.end) out.push(acc);
      for (const [ch, child] of [...n.children].sort((a, b) => a[0].localeCompare(b[0]))) dfs(child, acc + ch);
    };
    if (start) dfs(start, prefix);
    return out;
  }
}

const t = new Trie();
["car", "cart", "cat", "dog"].forEach((w) => t.insert(w));
console.log(t.complete("ca")); // ["car", "cart", "cat"]
```

자식 저장 방식은 트레이드오프다. 고정 배열(`Array(26)`)은 빠르지만 대부분 비어 공간 낭비가 크고, `Map` 은 공간 효율적이지만 느리다.

## 변형

- **래딕스 트리(압축 트라이)**: 자식이 하나뿐인 노드 사슬을 간선 하나(문자열 라벨)로 합친다. 노드 수가 크게 준다.
- **Patricia 트리**: 키를 비트열로 보고 건너뛸 비트 수를 저장하는 이진 래딕스 트리.
- **Aho-Corasick**: 트라이에 실패 링크를 더해 여러 패턴을 텍스트에서 한 번에 찾는다 → [KMP](/develop-wiki/knowledge/algorithms/kmp-string-search/)의 다중 패턴 일반화.

## 언제 쓰나

- 접두사 질의가 핵심일 때: 자동완성, 검색어 제안, 맞춤법 후보.
- 최장 접두사 일치: IP 라우팅 테이블, URL 라우터.
- 금칙어·다중 키워드 필터링(Aho-Corasick).

## 주의

- **메모리가 크다.** 노드·맵 객체가 글자 수만큼 생긴다. 정확한 일치 조회만 필요하면 해시 테이블(`Set`)이 단순하고 작다.
- 정렬된 배열 + 이분 탐색으로도 접두사 범위를 찾을 수 있다(`lower_bound(p)` ~ `lower_bound(p + '￿')`). 데이터가 정적이면 이쪽이 더 작고 빠를 수 있다.
- 유니코드: JS 문자열 `for...of` 는 코드 포인트 단위다. 정규화(NFC/NFD)가 다르면 같은 글자도 다른 경로가 된다. 한글을 초성 검색하려면 자모 분해 키를 따로 넣는다.
- 대규모 검색은 직접 트라이를 만들기보다 검색 엔진(Elasticsearch completion suggester, FST)을 쓴다.

## 실무에서

- 라우터는 압축 트라이로 IP 접두사를 저장하고 최장 접두사 일치로 경로를 고른다(Wikipedia "Trie" 응용 절).
- Go `httprouter` 는 경로 매칭에 압축 접두사 트리(래딕스 트리)를 쓴다고 README 에 밝힌다. 여러 웹 프레임워크 라우터가 같은 방식을 따른다.
- Linux 커널의 radix tree / XArray(페이지 캐시 인덱스), Lucene 의 FST(용어 사전)도 같은 계열이다.
