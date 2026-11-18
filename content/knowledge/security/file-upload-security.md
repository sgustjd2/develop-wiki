---
title: 파일 업로드 보안
aka: [File Upload Security, Unrestricted File Upload, Magic Bytes, Content Disarm and Reconstruct, Presigned URL Upload]
category: security
level: intermediate
summary: 사용자가 올린 파일을 안전하게 받고 저장하고 내려주는 방법. 확장자 허용 목록, 서버 생성 파일명, 시그니처 확인, 크기 제한, 격리된 저장소, 악성코드 검사, 안전한 서빙.
tags: [upload, validation, owasp, xss, path-traversal, storage, malware]
related: [security/xss, security/csrf, security/ssrf, security/access-control-design, security/owasp-top-10, cs-fundamentals/csp-security-headers]
sources:
  - https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html
updatedAt: 2026-11-19
---

## 문제

업로드는 "공격자가 바이트를 서버에 올려 두는 기능"이다. 위험은 두 갈래다.

- **올리는 순간**: 파서 취약점(이미지 라이브러리, XML), 압축 폭탄·거대 파일로 디스크·CPU 고갈, 기존 파일 덮어쓰기, `../` 경로 조작.
- **내려받는 순간**: 올린 HTML·SVG 가 같은 출처에서 열려 [XSS](/develop-wiki/knowledge/security/xss/)가 되거나, 서버가 업로드 파일을 코드로 실행(웹셸), 다른 사용자의 파일 노출, 피싱 문서 배포.

## 해법: 계층 방어

한 겹으로 막으려 하지 않는다. OWASP 도 개별 검사는 모두 우회될 수 있다는 전제로 겹쳐 쓰라고 한다.

1. **인증·권한**: 로그인한 사용자만, 사용자별 용량·횟수 제한. 내려받을 때도 소유권 검사([접근 제어](/develop-wiki/knowledge/security/access-control-design/)).
2. **확장자 허용 목록**: 업무상 필요한 소수만 허용. 차단 목록은 우회가 쉽다(`.pHp`, `.phtml`, `a.jpg.php`, 널 바이트, NTFS `:` 대체 스트림). 디코딩 후 검사.
3. **Content-Type 은 참고만**: 클라이언트가 보내는 값이라 위조된다.
4. **파일 시그니처(매직 바이트)** 가 확장자와 일치하는지. 단독으로는 쉽게 우회되므로 보조 수단.
5. **파일명은 서버가 생성**(UUID 등). 원본 이름은 메타데이터로 DB 에만 두고 표시 때 이스케이프. 꼭 써야 하면 길이·문자 집합 제한, 선행 점·연속 점 금지, 최종 경로가 업로드 디렉터리 안인지 확인.
6. **크기 제한**: 요청 크기, 파일 크기, 압축 파일은 **해제 후** 크기. ZIP 은 종류·공격 경로가 많아 가능하면 받지 않는다.
7. **저장 위치**(강한 순): 별도 호스트/도메인(스토리지 버킷 등) > 웹 루트 밖 > 웹 루트 안(쓰기 전용 + 읽기는 핸들러 경유). 디렉터리별 설정(`.htaccess`, `web.config`) 덮어쓰기를 끄고, 실행 권한을 없앤다.
8. **내용 처리**: 이미지는 디코드 후 **재인코딩**(메타데이터 제거, 폴리글랏 무력화). 재인코딩이 만능은 아니므로 최신 라이브러리, 자원 한도, 샌드박스에서 실행. 문서(PDF, Office)는 CDR 이나 격리 환경 검사. 백신·샌드박스 스캔은 **격리된 큐 워커**에서 비동기로 하고, 통과 전에는 다운로드 불가 상태로 둔다.
9. **업로드 엔드포인트 CSRF 방어**, 악성 콘텐츠 신고 경로.

```ts
const ALLOWED = { 'image/png': [0x89, 0x50, 0x4e, 0x47], 'image/jpeg': [0xff, 0xd8, 0xff] } as const;

async function acceptUpload(file: File, userId: string) {
  if (file.size > 5 * 1024 * 1024) throw new Error('too large');
  const head = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  const type = Object.entries(ALLOWED).find(([, sig]) => sig.every((b, i) => head[i] === b))?.[0];
  if (!type) throw new Error('unsupported type');          // 매직 바이트로 판정 (file.type 불신)
  const key = `${userId}/${crypto.randomUUID()}`;           // 서버가 이름 생성, 확장자 없음
  await storage.put(key, file, { contentType: type });      // 웹 루트 밖/별도 버킷
  await db.files.insert({ key, owner: userId, original: file.name, status: 'pending_scan' });
  await scanQueue.add({ key });                             // 스캔·재인코딩 후 'ready'
  return key;
}
```

서빙은 내용을 해석하지 못하게 한다(OWASP 문서가 직접 다루지는 않지만 [XSS](/develop-wiki/knowledge/security/xss/) 방어의 일반 원칙): `X-Content-Type-Options: nosniff`, 신뢰할 수 없는 파일은 `Content-Disposition: attachment`, 사용자 콘텐츠는 앱과 **다른 출처**(별도 도메인)에서 제공.

## 언제 쓰나

프로필 이미지, 첨부 문서, CSV 가져오기처럼 사용자 파일을 받는 모든 곳. 대용량이면 서버를 거치지 않고 스토리지 **사전 서명 URL** 로 직접 올리게 하되, 서명에 키·크기·타입 조건을 넣고 업로드 후 서버가 다시 검증·스캔한다.

## 주의 (비용)

- 시그니처 검사와 Content-Type 검사만으로 "안전"하다고 판단하지 않는다. 파일이 여러 형식을 동시에 만족하는 폴리글랏도 있다.
- SVG 는 스크립트를 담을 수 있는 이미지다. 허용하려면 정제하거나 래스터로 변환한다.
- 스캔·재인코딩은 지연과 비용이 든다. 비동기 파이프라인과 상태 관리(`pending → ready`)가 필요하다.
- 직접 업로드(사전 서명 URL)는 서버 부하를 줄이는 대신 "서버가 본 적 없는 파일"이 저장소에 먼저 생긴다. 검증 전에는 공개하지 않는다.
- URL 로 파일을 가져오는 기능(원격 가져오기)은 별도로 [SSRF](/develop-wiki/knowledge/security/ssrf/) 위험이 있다.
- 법적 위험(저작권, 불법 콘텐츠)은 기술이 아니라 신고·삭제 절차로 다룬다.
