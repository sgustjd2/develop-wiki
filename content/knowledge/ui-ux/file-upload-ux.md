---
title: 파일 업로드 UX (선택·검증·진행·접근성)
aka: [File Upload, input type=file, Drag and Drop Upload, Upload Progress, 첨부 파일]
category: ui-ux
group: patterns
level: intermediate
summary: 네이티브 file input 을 기반으로 선택·드래그 앤 드롭·검증·오류·진행 표시·재시도를 설계하는 방법과, accept 가 검증이 아니라는 점 등의 함정.
tags: [ux, forms, file-upload, accessibility, validation]
related: [ui-ux/form-inline-validation, ui-ux/error-messages, ui-ux/loading-states, ui-ux/live-regions-announcements, ui-ux/keyboard-focus-management, ui-ux/toast-notification-banner]
sources:
  - https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/file
  - https://design-system.service.gov.uk/components/file-upload/
  - https://owasp.org/www-community/vulnerabilities/Unrestricted_File_Upload
updatedAt: 2026-11-19
---

## 문제

- 드래그 앤 드롭 영역만 있고 키보드로 파일을 고를 방법이 없다.
- `accept="image/*"` 만 믿고 서버 검증을 생략한다.
- 대용량 업로드가 진행·실패 안내 없이 멈춘 것처럼 보인다.

## 해법

### 1. 기반은 네이티브 `<input type="file">`

- 드롭 영역은 **보조 수단**이다. 항상 "파일 선택" 버튼(네이티브 input)이 동작해야 한다. GOV.UK 컴포넌트도 네이티브 input 을 유지하고, 개선판은 스크립트로 버튼·드롭 영역을 덧씌운다.
- MDN 정리: `accept` 는 확장자·MIME·와일드카드 힌트일 뿐 **파일 형식 검증이 아니다**(사용자가 "모든 파일" 로 바꿀 수 있다). `multiple` 은 여러 파일, `capture` 는 카메라 지정, `input.files`(FileList)의 각 `File` 은 `name`·`size`·`type`·`lastModified` 를 가진다. 크기 단위(SI 1KB=1000B 등)는 어떤 쪽을 쓰는지 정해 표기한다.
- 선택 취소는 `cancel` 이벤트로 감지할 수 있다.

### 2. 클라이언트 검증은 UX, 서버 검증은 보안

```ts
const rules = { maxBytes: 5e6, types: ['image/png', 'image/jpeg', 'application/pdf'], maxFiles: 3 };

export function validate(files: File[]): string[] {
  const errs: string[] = [];
  if (files.length === 0) errs.push('파일을 선택하세요.');
  if (files.length > rules.maxFiles) errs.push(`파일은 최대 ${rules.maxFiles}개까지 선택할 수 있습니다.`);
  for (const f of files) {
    if (f.size === 0) errs.push(`${f.name}: 빈 파일입니다.`);
    else if (!rules.types.includes(f.type)) errs.push(`${f.name}: PNG, JPEG, PDF 파일만 올릴 수 있습니다.`);
    else if (f.size > rules.maxBytes) errs.push(`${f.name}: ${rules.maxBytes / 1e6}MB 이하여야 합니다.`);
  }
  return errs;
}
```

- node 로 실행해 확인: 4개 파일(정상 PNG, 빈 PDF, 6MB JPEG, `.exe`)에 대해 개수 초과·빈 파일·용량 초과·형식 오류 메시지가 각각 나왔다. `File.type` 은 브라우저가 확장자 기반으로 채우는 값이라 위조 가능하다.
- 서버는 형식(내용 시그니처), 크기, 파일명, 저장 경로, 바이러스 검사 등을 독립적으로 검증한다. OWASP 의 "Unrestricted File Upload" 가 대표 위험으로 알려져 있다(링크 생존만 확인했고 본문은 읽지 못했다).

### 3. 오류 문구 (GOV.UK 패턴 참고)

선택 안 함 / 형식 오류 / 용량 초과 / 빈 파일 / 업로드 실패 / 개수 초과를 구분해 **무엇이 문제고 어떻게 고치는지** 쓴다. 형식 오류에는 허용 형식을, 용량 초과에는 허용 크기를 포함한다.

### 4. 진행·완료·재시도

- 업로드 시작 시 파일명 목록과 개별 상태(대기/업로드 중/완료/실패)를 보여 준다.
- 진행률은 `<progress value max>` 와 텍스트 퍼센트를 함께. 완료·실패는 [라이브 영역](/develop-wiki/knowledge/ui-ux/live-regions-announcements/)으로 알린다(진행률 숫자를 매번 낭독시키지 않는다).
- 실패한 파일만 **재시도**할 수 있게 하고, 성공한 파일은 유지한다. 취소와 삭제 버튼(파일명이 들어간 접근 가능한 이름)을 둔다.
- 이미지는 업로드 전에 미리보기로 잘못 고른 파일을 줄일 수 있다(`URL.createObjectURL`, 사용 후 `revokeObjectURL`).
- 큰 파일은 분할·재개 업로드(예: tus 프로토콜 같은 방식)를 검토하되, 구현 비용이 크므로 필요가 분명할 때만.

## 언제 쓰나

- 프로필 이미지, 증빙 서류, 첨부 파일 등 모든 업로드 화면.
- 드래그 앤 드롭은 다수·대용량 파일을 자주 다루는 업무형 화면에서 가치가 크고, 단일 파일 폼에는 필수가 아니다.

## 체크리스트

- [ ] 키보드로 파일 선택 가능, 버튼에 보이는 라벨
- [ ] `accept`·`multiple` 설정 + JS 검증 + **서버 검증**
- [ ] 허용 형식·크기·개수를 입력 전에 힌트로 안내
- [ ] 개별 진행·실패·재시도·삭제, 완료 알림
- [ ] 모바일에서 카메라·사진 보관함·파일 앱 선택 동작 확인
- [ ] 폼 제출 시 "업로드 중" 상태에서 이중 제출 방지

## 흔한 실수

- `display:none` 한 input 을 라벨 클릭으로만 열어 키보드 포커스가 사라진다. 시각적으로만 숨기고 포커스 링은 라벨에 표시한다.
- 파일명을 그대로 저장 경로로 쓴다(경로 조작).
- 큰 이미지를 서버로 보내기 전에 압축·리사이즈하지 않아 모바일 데이터와 시간을 낭비한다(품질 요구가 없다면).
- 오류가 토스트로만 나와 사라진다([토스트](/develop-wiki/knowledge/ui-ux/toast-notification-banner/)에 중요한 오류를 두지 않는다).

## 한계

- 브라우저 `webkitdirectory`·`capture` 의 세부 동작과 낭독기 호환은 이 노트에서 직접 시험하지 못했다.
