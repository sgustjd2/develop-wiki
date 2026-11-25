---
name: Nix
url: https://nixos.org/
docs: https://nix.dev/
repo: https://github.com/NixOS/nix
stars: 18075
domain: devtools
category: environment
description: 패키지를 입력 해시로 격리된 경로에 빌드해 재현 가능한 개발 환경과 빌드를 만드는 함수형 패키지 관리자. 팀·CI 환경을 정확히 고정할 때 쓴다.
pricing: oss
tags: [package-manager, reproducible, flakes, nixpkgs, devshell]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Nix는 모든 패키지를 `/nix/store/<해시>-이름` 아래에 설치한다. 해시는 소스·의존성·빌드 스크립트 전체로 정해지므로 같은 입력이면 같은 결과가 나오고, 여러 버전이 충돌 없이 공존한다. 공식 패키지 모음은 nixpkgs다. 2026-11 기준 Nix **2.35.6**(LGPL-2.1). 의존성을 잠그는 flakes와 새 `nix` 명령은 여전히 실험 기능 플래그로 켜야 한다.

- Linux 배포판 NixOS는 같은 방식으로 OS 전체 설정을 관리한다. 이 항목은 macOS·Linux에서 개발 도구로 쓰는 경우를 다룬다.

## 설치
```bash
# 공식 설치 스크립트 (macOS, 다중 사용자)
curl --proto '=https' --tlsv1.2 -L https://nixos.org/nix/install | sh
# Linux 다중 사용자
curl --proto '=https' --tlsv1.2 -L https://nixos.org/nix/install | sh -s -- --daemon

# flakes / nix 명령 활성화
mkdir -p ~/.config/nix
echo "experimental-features = nix-command flakes" >> ~/.config/nix/nix.conf
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Nix 언어 | 패키지·환경을 정의하는 지연 평가 함수형 언어 |
| store | `/nix/store`. 불변, 해시로 구분 |
| derivation | 빌드 방법 명세. 같은 입력 = 같은 출력 경로 |
| nixpkgs | 공식 패키지 모음 (GitHub 저장소) |
| flake | `flake.nix` + `flake.lock`으로 입력 버전을 잠근 프로젝트 단위 |
| devShell | `nix develop`으로 들어가는 개발 셸 |
| GC | `nix-collect-garbage`로 참조되지 않는 store 경로 삭제 |

## 기본 사용법
```bash
nix shell nixpkgs#nodejs nixpkgs#jq   # 임시로 도구 추가된 셸
nix run nixpkgs#cowsay -- hello       # 설치 없이 실행
nix search nixpkgs ripgrep
```

프로젝트 개발 셸 `flake.nix`:

```nix
{
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  outputs = { nixpkgs, ... }:
    let
      system = "aarch64-darwin";
      pkgs = nixpkgs.legacyPackages.${system};
    in {
      devShells.${system}.default = pkgs.mkShell {
        packages = [ pkgs.nodejs_24 pkgs.pnpm pkgs.postgresql ];
      };
    };
}
```

```bash
nix develop        # flake.lock 생성 후 개발 셸 진입
nix flake update   # 입력(nixpkgs) 버전 갱신
```

## 자주 쓰는 패턴
- **direnv 연동.** `.envrc`에 `use flake`를 두고 nix-direnv를 쓰면 디렉터리 진입 때 자동으로 개발 셸이 켜진다.
- **여러 시스템 지원.** 위 예시는 Apple Silicon 고정이다. 실무에서는 flake-utils 등으로 `x86_64-linux`까지 함께 정의.
- **도트파일 관리.** home-manager로 사용자 패키지·설정 파일을 선언형으로 관리.
- **디스크 정리.** 주기적으로 `nix-collect-garbage -d`.

## 언제 쓰나 / 피할 때
- 쓸 때: "내 컴퓨터에선 되는데" 문제를 없애야 할 때, CI와 로컬의 도구 버전을 완전히 일치시킬 때.
- 피할 때(대안): 학습 곡선이 가파르다. 런타임 버전만 맞추면 [mise](/develop-wiki/devtools/environment/mise/), 컨테이너 기반 공유 환경은 [Dev Containers](/develop-wiki/devtools/environment/dev-containers/).

## 공식 문서
- [nix.dev (공식 학습 문서)](https://nix.dev/) · [Nix 레퍼런스 매뉴얼](https://nix.dev/manual/nix/latest/) · [다운로드](https://nixos.org/download/)
- [패키지 검색](https://search.nixos.org/packages) · [flakes](https://nix.dev/concepts/flakes)
