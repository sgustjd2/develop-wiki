---
name: C/C++
summary: 하드웨어를 직접 다루는 시스템 언어 C와, 여기에 클래스·템플릿·RAII를 더한 C++. OS·임베디드·게임 엔진·고성능 라이브러리의 기반이다.
paradigms: [절차적, 객체지향, 제네릭, 함수형]
typing: static
execution: compiled
firstAppeared: 1972
officialSite: https://isocpp.org/
docs: https://en.cppreference.com/
useCases: [운영체제·드라이버, 임베디드 펌웨어, 게임 엔진, 고성능 라이브러리·런타임, 브라우저·DB 엔진]
sources:
  - https://isocpp.org/std/status
  - https://herbsutter.com/2026/03/
  - https://en.cppreference.com/w/c
  - https://en.cppreference.com/w/cpp
updatedAt: 2026-11-18
---

## 개요
C(1972년, Bell Labs)는 메모리와 하드웨어를 거의 그대로 노출하는 작은 시스템 언어이고, C++(1985년 첫 상용 공개)는 C에 클래스·템플릿·예외·RAII를 더해 추상화 비용을 컴파일 타임으로 옮긴 언어다. 둘 다 ISO가 표준을 관리하며, 여러 벤더 컴파일러(GCC, Clang, MSVC)가 같은 표준을 구현한다. `firstAppeared` 는 C 기준이다.

| 언어 | 현재 표준 | 다음 표준 |
| --- | --- | --- |
| C | C23 (C17의 후속) | C2y 작업 중 |
| C++ | C++23 (isocpp.org 기준 공식 발행된 최신판) | C++26 — 2026년 3월 위원회 기술 작업 완료, ISO 국제 승인 절차 진행 중 |

## 언어의 특징
- **타입 시스템:** 정적 타입. C는 암시적 변환이 많고 타입 안전성이 약하다. C++는 템플릿·`auto`·`concept`(C++20)로 강한 제네릭 프로그래밍을 지원한다.
- **메모리 관리:** 가비지 컬렉터가 없다. C는 `malloc`/`free` 로 직접 관리, C++는 RAII(소멸자에서 자원 해제)와 스마트 포인터(`std::unique_ptr`, `std::shared_ptr`)가 기본 관용구.
- **정의되지 않은 동작(UB):** 범위 밖 접근, 해제 후 사용 등은 컴파일러가 아무 일이나 해도 되는 UB다. 대부분의 보안 취약점이 여기서 나온다.
- **동시성:** C11 `<threads.h>`·`<stdatomic.h>`, C++11 이후 `std::thread`, `std::atomic`, `std::jthread`(C++20), 코루틴(C++20).
- **C++26 주요 내용:** 컴파일 타임 리플렉션, 계약(`pre`/`post`/`contract_assert`), `std::execution`(sender/receiver 비동기 모델), 초기화되지 않은 지역 변수 읽기의 UB 제거, 경계 검사를 더한 hardened 표준 라이브러리.

## 개발 환경 시작하기
컴파일러 + 빌드 시스템(CMake) + 패키지 매니저(vcpkg 또는 Conan)가 일반적인 조합이다. 언어 차원의 공식 패키지 매니저는 없다.

```bash
# macOS: Apple Clang + 빌드 도구
xcode-select --install
brew install cmake

# Ubuntu/Debian: GCC + CMake
sudo apt install build-essential cmake

# Windows: Visual Studio(“C++를 사용한 데스크톱 개발” 워크로드) 설치 → MSVC + CMake 포함
```

최소 CMake 프로젝트:
```cmake
# CMakeLists.txt
cmake_minimum_required(VERSION 3.20)
project(hello CXX)
set(CMAKE_CXX_STANDARD 23)
add_executable(hello main.cpp)
```
```bash
cmake -S . -B build && cmake --build build && ./build/hello
```

## 문법 한눈에 보기
C:
```c
#include <stdio.h>
#include <stdlib.h>

int sum(const int *xs, size_t n) {
    int total = 0;
    for (size_t i = 0; i < n; i++) total += xs[i];
    return total;
}

int main(void) {
    int *xs = malloc(3 * sizeof *xs);
    if (xs == NULL) return 1;          // 에러는 반환값으로 확인
    xs[0] = 1; xs[1] = 2; xs[2] = 3;
    printf("%d\n", sum(xs, 3));
    free(xs);                          // 직접 해제
    return 0;
}
```

C++:
```cpp
#include <iostream>
#include <memory>
#include <stdexcept>
#include <string>
#include <vector>

struct User {
    std::string name;
    int age;
};

int checked_age(int age) {
    if (age < 0) throw std::invalid_argument("negative age");
    return age;
}

int main() {
    auto users = std::vector<User>{{"kim", 30}, {"lee", 25}};
    auto p = std::make_unique<User>("park", checked_age(41)); // 스코프를 벗어나면 자동 해제
    for (const auto& u : users) std::cout << u.name << ' ' << u.age << '\n';
    try { checked_age(-1); } catch (const std::exception& e) { std::cout << e.what() << '\n'; }
}
```

## 생태계
| 분야 | 대표 도구 |
| --- | --- |
| 컴파일러 | GCC, Clang/LLVM, MSVC |
| 빌드 | CMake, Meson, Bazel, Ninja |
| 패키지 | vcpkg, Conan |
| 범용 라이브러리 | Boost, Abseil, fmt |
| 테스트 | GoogleTest, Catch2 |
| 분석 | clang-tidy, AddressSanitizer/UBSan, Valgrind |
| 게임·그래픽 | Unreal Engine, SDL, Dear ImGui |

## 언제 쓰나 / 약점
- **쓸 때:** 지연 시간·메모리 사용을 직접 통제해야 할 때, 기존 C/C++ 코드베이스·SDK와 연동할 때, 임베디드처럼 런타임을 둘 수 없을 때. C는 다른 언어와의 FFI 공용어(ABI) 역할도 한다.
- **약점:** 메모리 안전성을 언어가 보장하지 않아 UB·취약점 위험이 크다. 빌드·의존성 관리가 표준화되지 않아 프로젝트 셋업 비용이 높다. C++는 기능이 많아 학습 곡선이 길다.
- **대안:** 새 시스템 코드에서 메모리 안전성이 중요하면 [Rust](/develop-wiki/languages/rust/), 서버·도구 개발이면 [Go](/develop-wiki/languages/go/)를 검토한다.

## 공식 문서·학습 자료
- [isocpp.org](https://isocpp.org/) — 표준화 현황, C++ Core Guidelines 링크
- [cppreference.com](https://en.cppreference.com/) — C·C++ 표준 라이브러리 레퍼런스(표준별 지원 여부 표기)
- [C++ Core Guidelines](https://isocpp.github.io/CppCoreGuidelines/) — 현대 C++ 작성 지침
- [CMake 문서](https://cmake.org/cmake/help/latest/) · [vcpkg](https://learn.microsoft.com/vcpkg/) · [Conan](https://docs.conan.io/)
