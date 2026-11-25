---
name: Paging 3
url: https://developer.android.com/topic/libraries/architecture/paging/v3-overview
docs: https://developer.android.com/topic/libraries/architecture/paging/v3-overview
repo: https://github.com/androidx/androidx
stars: 6150
domain: mobile
category: android
description: 대량 데이터를 필요한 만큼만 불러와 목록에 공급하는 Jetpack 라이브러리. 네트워크·DB 페이지 로딩, 캐싱, 로딩/오류 상태, 새로고침을 Flow 기반으로 처리한다.
pricing: oss
tags: [pagination, jetpack, flow, lazycolumn, room]
languages: [kotlin]
koreanDocs: true
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Paging 3은 무한 스크롤 목록을 위한 라이브러리다. 데이터 소스(`PagingSource`)가 한 페이지를 읽는 법만 정의하면, `Pager`가 스크롤 위치에 맞춰 다음 페이지 로드를 요청하고 `Flow<PagingData<T>>`로 UI에 내보낸다. 중복 요청 제거, 재시도, 로딩 상태 노출을 포함한다.

- 이 문서는 `androidx.paging` **3.5.3**(Google Maven 최신 안정, Apache-2.0) 기준이다. Compose용 `paging-compose`도 3.5.3이다.
- 로컬 DB를 단일 진실 원천으로 삼으면 `RemoteMediator`로 네트워크→Room 캐시를 채운다(Room은 [Android Jetpack](/develop-wiki/mobile/android/android-jetpack/) 참고).

## 설치
```kotlin
dependencies {
    implementation("androidx.paging:paging-runtime:3.5.3")   // View 시스템(PagingDataAdapter)
    implementation("androidx.paging:paging-compose:3.5.3")   // Compose
    testImplementation("androidx.paging:paging-testing:3.5.3")
}
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `PagingSource<Key, Value>` | 키로 한 페이지를 읽는 `load()`와 새로고침 키 `getRefreshKey()` 정의 |
| `Pager` + `PagingConfig` | 페이지 크기, 프리페치 거리, 초기 로드 크기 설정 후 `flow` 생성 |
| `PagingData` | 페이지 스트림 한 세대. 새로고침하면 새 `PagingData`가 나옴 |
| `cachedIn(scope)` | 구성 변경·화면 이동 시 재로딩 방지. ViewModel 스코프에서 호출 |
| `RemoteMediator` | 로컬 DB 캐시가 끝에 닿으면 네트워크에서 더 가져와 DB에 저장 |
| `LoadState` | 세로 방향 `refresh`/`append`/`prepend`의 Loading·Error·NotLoading |
| `LazyPagingItems` | Compose에서 `PagingData`를 `LazyColumn`에 연결하는 어댑터 |

## 기본 사용법
```kotlin
class ReposSource(private val api: GitHubApi) : PagingSource<Int, Repo>() {
    override suspend fun load(params: LoadParams<Int>): LoadResult<Int, Repo> = try {
        val page = params.key ?: 1
        val data = api.repos(page = page, perPage = params.loadSize)
        LoadResult.Page(data, prevKey = null, nextKey = if (data.isEmpty()) null else page + 1)
    } catch (e: IOException) { LoadResult.Error(e) }

    override fun getRefreshKey(state: PagingState<Int, Repo>) =
        state.anchorPosition?.let { state.closestPageToPosition(it)?.prevKey?.plus(1) }
}

class ReposViewModel(api: GitHubApi) : ViewModel() {
    val repos: Flow<PagingData<Repo>> =
        Pager(PagingConfig(pageSize = 30)) { ReposSource(api) }.flow.cachedIn(viewModelScope)
}

@Composable
fun ReposList(vm: ReposViewModel) {
    val items = vm.repos.collectAsLazyPagingItems()
    LazyColumn {
        items(count = items.itemCount, key = items.itemKey { it.id }) { i ->
            items[i]?.let { Text(it.name) }
        }
    }
}
```
`GitHubApi.repos`와 `Repo.id`는 앱이 정의한 가정이다([Retrofit + OkHttp](/develop-wiki/mobile/android/retrofit-okhttp/) 참고).

## 자주 쓰는 패턴
- **로딩·오류 푸터**: `items.loadState.append`가 `Loading`이면 스피너, `Error`면 `items.retry()` 버튼을 마지막 항목으로 그린다.
- **새로고침**: `SwipeRefresh` 계열 UI에서 `items.refresh()`를 호출한다.
- **변환**: `pagingData.map { }`, `filter`, `insertSeparators`로 날짜 헤더 등을 삽입한다(ViewModel에서, `cachedIn` 이전).
- **오프라인 우선**: Room의 `PagingSource` 반환 DAO + `RemoteMediator`로 네트워크가 끊겨도 캐시를 보여 준다.
- **테스트**: `paging-testing`의 `asSnapshot { scrollTo(index) }`로 스크롤에 따른 결과를 검증한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 수백 건 이상이 서버·DB에 있는 피드·검색 결과, 오프라인 캐시가 필요한 목록.
- 피할 때: 수십 건 이하의 고정 목록(단순 리스트로 충분), 커서 대신 전체 정렬·점프가 필요한 화면(페이지 모델이 맞지 않음).

## 공식 문서
- [Paging 개요](https://developer.android.com/topic/libraries/architecture/paging/v3-overview) · [Compose에서 Paging 표시](https://developer.android.com/topic/libraries/architecture/paging/v3-paged-data) · [네트워크+DB 페이징](https://developer.android.com/topic/libraries/architecture/paging/v3-network-db)
