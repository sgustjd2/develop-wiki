---
name: FlashList
url: https://shopify.github.io/flash-list/
docs: https://shopify.github.io/flash-list/docs/
repo: https://github.com/Shopify/flash-list
stars: 7250
domain: mobile
category: cross-platform
description: Shopify 의 React Native 리스트 컴포넌트. 화면 밖 셀을 재활용해 FlatList 보다 빠르게 긴 목록을 렌더링하며, FlatList 와 거의 같은 props 로 바꿔 쓸 수 있다.
pricing: oss
tags: [react-native, list, performance, recycling]
languages: [typescript]
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
FlashList 는 스크롤 중 사라진 셀을 새 아이템에 **재활용**해 마운트·언마운트 비용을 줄이는 리스트다. `FlatList` 와 비슷한 API 라 교체 비용이 낮다. v2 는 React Native 새 아키텍처 전용으로 재작성되어 v1 에서 필수였던 `estimatedItemSize` 튜닝이 필요 없다(공식 v2 소개 문서).

- 최신 **2.3.3**(2026-10-01, npm), MIT. 마지막 푸시도 2026-10-01 로, 저장소 활동은 상대적으로 완만하다.

## 설치
```bash
npx expo install @shopify/flash-list   # Expo (Expo Go SDK 46+ 에서 사용 가능)
npm install @shopify/flash-list        # 베어 RN, iOS 는 pod install
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 셀 재활용 | 화면 밖 셀 뷰를 새 데이터로 다시 사용 |
| `data` / `renderItem` / `keyExtractor` | FlatList 와 같은 기본 props |
| `getItemType` | 레이아웃이 다른 아이템 종류를 구분해 같은 종류끼리만 재활용 |
| `numColumns`, `horizontal` | 그리드·가로 목록 |
| `onEndReached` | 무한 스크롤 |
| `ref.scrollToIndex` 등 | 프로그램적 스크롤 |
| `masonry` | 높이가 다른 항목의 메이슨리 레이아웃 지원 |

## 기본 사용법
```tsx
import { FlashList } from '@shopify/flash-list';
import { Text, View } from 'react-native';

type Row = { id: string; title: string };

export default function Feed({ rows }: { rows: Row[] }) {
  return (
    <FlashList
      data={rows}
      keyExtractor={(r) => r.id}
      renderItem={({ item }) => (
        <View style={{ padding: 16 }}>
          <Text>{item.title}</Text>
        </View>
      )}
    />
  );
}
```

## 자주 쓰는 패턴
- **종류별 셀.** 헤더·광고·일반 행이 섞이면 `getItemType={(item) => item.kind}` 로 구분한다.
- **셀 내부 상태 주의.** 셀이 재활용되므로 아이템 변경 시 로컬 `useState` 가 남지 않도록 초기화하거나 상태를 데이터에 둔다.
- **무한 스크롤.** `onEndReached` + `onEndReachedThreshold` 로 다음 페이지를 불러온다.
- **FlatList 마이그레이션.** import 만 바꾸고 동작을 확인한다. 레이아웃 관련 props 는 공식 v2 마이그레이션 문서를 따른다.
- **불필요한 리렌더 방지.** `renderItem` 안의 컴포넌트를 `React.memo` 로 감싼다.

## 언제 쓰나 / 피할 때
- 쓸 때: 수백 개 이상의 피드·채팅·상품 목록에서 스크롤 성능이 중요할 때.
- 피할 때(대안): 항목이 적으면 `FlatList`/`ScrollView`. 구 아키텍처 앱은 v1 사용.

## 공식 문서
- [소개·설치](https://shopify.github.io/flash-list/docs/) · [GitHub](https://github.com/Shopify/flash-list)
