---
name: Neovim
url: https://neovim.io
docs: https://neovim.io/doc/user/
repo: https://github.com/neovim/neovim
stars: 103937
domain: devtools
category: editor-ide
description: Vim을 계승해 Lua 설정, 내장 LSP 클라이언트, Tree-sitter를 더한 터미널 모달 에디터. 키보드 중심으로 에디터를 직접 구성하고 싶을 때 쓴다.
pricing: oss
tags: [editor, vim, lua, lsp, terminal]
languages: []
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Neovim은 Vim의 모달 편집(노멀·삽입·비주얼 모드)을 유지하면서 Lua를 1급 설정 언어로 쓰고, LSP 클라이언트·Tree-sitter·비동기 작업을 내장한 에디터다. 이 문서는 **0.12** 기준(2026-11 최신 v0.12.6, Apache-2.0·Vim 라이선스). 0.12에서 내장 플러그인 매니저 `vim.pack`이 추가되었고, 0.11부터 `vim.lsp.config`/`vim.lsp.enable`로 별도 플러그인 없이 LSP를 켤 수 있다.

## 설치
```bash
brew install neovim        # macOS / Linux
nvim --version
```
설정 파일: `~/.config/nvim/init.lua`.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| 모드 | Normal(이동·명령), Insert(입력), Visual(선택), Command-line(`:`) |
| 동작 + 대상 | `d`(삭제) + `w`(단어) = `dw`, `ci"`(따옴표 안 바꾸기) |
| 버퍼 / 윈도 / 탭 | 열린 파일 / 화면 분할 / 레이아웃 묶음 |
| 레지스터 | `"ayy`로 a 레지스터에 복사, `"+y`로 시스템 클립보드 |
| `vim.pack` | 0.12 내장 플러그인 매니저 |
| LSP | `vim.lsp.config()`로 서버 설정, `vim.lsp.enable()`로 활성화 |

## 자주 쓰는 키
| 키 | 동작 |
| --- | --- |
| `i` / `a` / `o` | 커서 앞 / 뒤 / 아랫줄에 입력 |
| `Esc` | 노멀 모드로 |
| `:w` / `:q` / `:wq` | 저장 / 종료 / 저장 후 종료 |
| `w` `b` `e` / `gg` `G` | 단어 이동 / 파일 처음·끝 |
| `dd` / `yy` / `p` | 줄 삭제 / 복사 / 붙여넣기 |
| `u` / `Ctrl+r` / `.` | 실행 취소 / 다시 실행 / 마지막 변경 반복 |
| `/패턴` → `n` | 검색 / 다음 결과 |
| `:%s/old/new/g` | 전체 치환 |
| `:vsplit` / `Ctrl+w w` | 세로 분할 / 창 이동 |
| `gd` / `K` / `grn` | 정의로 이동 / 문서 보기 / LSP 이름 바꾸기 |

## 기본 사용법
최소 `init.lua` (0.12):

```lua
vim.g.mapleader = ' '
vim.opt.number = true
vim.opt.relativenumber = true
vim.opt.expandtab = true
vim.opt.shiftwidth = 2

vim.pack.add({
  'https://github.com/neovim/nvim-lspconfig',  -- 서버별 기본 설정 모음
})

vim.lsp.enable({ 'ts_ls', 'pyright' })  -- 서버 실행 파일은 따로 설치
vim.keymap.set('n', '<leader>w', '<cmd>write<cr>')
```

## 자주 쓰는 패턴
- **배포판으로 시작.** LazyVim·kickstart.nvim 같은 설정 모음을 출발점으로 쓰고 필요한 부분만 고친다.
- **퍼지 탐색.** Telescope·fzf-lua 같은 플러그인과 [fzf](/develop-wiki/devtools/terminal/fzf/)·[ripgrep](/develop-wiki/devtools/terminal/ripgrep/)을 조합해 파일·내용 검색.
- **상태 점검.** `:checkhealth`로 LSP·클립보드·프로바이더 문제를 확인.
- **원격 서버.** SSH 접속 후 터미널에서 그대로 쓰며, [tmux](/develop-wiki/devtools/terminal/tmux/)와 함께 세션을 유지한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 키보드만으로 빠르게 편집하고 싶을 때, 서버·터미널 환경, 에디터를 코드로 구성하고 싶을 때.
- 피할 때(대안): 설정에 시간을 쓰기 싫으면 [VS Code](/develop-wiki/devtools/editor-ide/vscode/)(Vim 확장)나 [Zed](/develop-wiki/devtools/editor-ide/zed/)(내장 Vim 모드).

## 공식 문서
- [사용자 매뉴얼](https://neovim.io/doc/user/) · [Lua 가이드](https://neovim.io/doc/user/lua-guide.html) · [LSP](https://neovim.io/doc/user/lsp.html)
- [설치](https://github.com/neovim/neovim/blob/master/INSTALL.md) · [릴리스](https://github.com/neovim/neovim/releases)
