#!/usr/bin/env node
// PostToolUse 훅: 콘텐츠/분류 파일을 고치면 astro sync 로 스키마를 검증한다.
// 실패하면 exit 2 → 오류 메시지가 Claude 에게 전달돼 바로 고치게 한다.
import { execSync } from 'node:child_process';

let input = '';
for await (const chunk of process.stdin) input += chunk;
const file = JSON.parse(input || '{}')?.tool_input?.file_path ?? '';
if (!/(\/content\/|src\/taxonomy\.ts|src\/content\.config\.ts)/.test(file)) process.exit(0);

try {
  execSync('npx astro sync', { cwd: process.env.CLAUDE_PROJECT_DIR, stdio: 'pipe' });
} catch (e) {
  const out = `${e.stdout ?? ''}${e.stderr ?? ''}`;
  const lines = out.split('\n').filter((l) => /error|schema|허용|필요|Expected|Invalid/i.test(l)).slice(0, 20);
  console.error(`콘텐츠 스키마 검증 실패 (${file}):\n${lines.join('\n') || out.slice(-2000)}`);
  process.exit(2);
}
