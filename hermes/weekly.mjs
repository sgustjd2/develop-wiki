#!/usr/bin/env node
// dev.hub 주간 조사 — 에이전트 없이 스크립트가 수행한다. (Hermes cron 의 --no-agent 작업, 일요일 04:00)
//  1) research/backlog.md 의 knowledge 주제를 몇 개 고른다
//  2) 로컬 모델로 원문을 읽고 노트 "초안"을 research/drafts/ 에 쓴다 (사이트에는 공개하지 않음)
//  3) research/drafts/index.json·README.md, 로그 갱신 → publish.sh (research/ 만 바뀌므로 사이트는 그대로)
// 공개는 Claude Code 의 `review-drafts` 스킬이 원문 대조 후 content/knowledge 로 옮겨서 한다.
// 옵션: --dry (pull·배포 없이 결과만 남김)  --topics N (기본 6)  --topic "주제" --area 카테고리 (한 주제만 시험)
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { ROOT, today } from './lib.mjs';
import { MODEL, ollamaUp } from './summarize.mjs';
import { pickTopics, researchTopic } from './research.mjs';

const argv = process.argv.slice(2);
const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : undefined; };
const DRY = argv.includes('--dry');
const N = Number(opt('--topics') ?? process.env.DEVHUB_WEEKLY_TOPICS ?? 6);
process.chdir(ROOT);
const git = (...a) => execFileSync('git', a, { cwd: ROOT, encoding: 'utf8' }).trim();
const out = [];
const say = (s = '') => { out.push(s); console.log(s); };

say(`# dev.hub 주간 조사 — ${today}${DRY ? ' (dry-run)' : ''}`);
if (!DRY) {
  if (git('status', '--porcelain')) { say('REPO: 작업 트리에 커밋 안 된 변경이 있어 이번 주는 건너뜀'); say(git('status', '--short')); process.exit(0); }
  try { git('pull', '--ff-only', '-q', 'origin', 'main'); } catch (e) { say(`REPO: pull 실패 — 중단 (${e.message.split('\n')[0]})`); process.exit(0); }
}
if (!(await ollamaUp())) { say(`로컬 모델: ${MODEL} — 연결 안 됨. 이번 주는 건너뜀`); process.exit(0); }
say(`로컬 모델: ${MODEL} — 연결됨`);

const DRAFTS = join(ROOT, 'research/drafts');
const INDEX = join(DRAFTS, 'index.json');
mkdirSync(DRAFTS, { recursive: true });
const index = existsSync(INDEX) ? JSON.parse(readFileSync(INDEX, 'utf8')) : {};

const topics = opt('--topic') ? [{ topic: opt('--topic'), areas: [opt('--area') ?? 'principles'] }] : pickTopics(index, N);
say(`\n## 주제 ${topics.length}개`);
if (!topics.length) say('- 백로그에 남은 knowledge 주제 없음');

const results = [];
for (const t of topics) {
  const started = Date.now();
  let r;
  try { r = await researchTopic(t); } catch (e) { r = { status: 'insufficient', reason: `오류: ${e.message}` }; }
  const min = ((Date.now() - started) / 60000).toFixed(1);
  if (r.status === 'drafted') {
    mkdirSync(dirname(join(ROOT, r.file)), { recursive: true });
    writeFileSync(join(ROOT, r.file), r.content);
    say(`- ✓ ${t.topic} → ${r.file} (사실 ${r.facts}, 문단 ${r.kept}, 뺀 문장 ${r.dropped}${r.problems.length ? `, 형식 문제 ${r.problems.length}` : ''}, ${min}분)`);
  } else if (r.status === 'duplicate') {
    say(`- = ${t.topic} → 기존 노트 ${r.note} 와 겹친다고 판단 (사람 확인 필요)`);
  } else {
    say(`- ✗ ${t.topic} → 초안 못 만듦: ${r.reason ?? `검증된 사실 ${r.facts ?? 0}개 (최소 4)`}, 읽은 출처 ${r.sources?.length ?? 0}개 (${min}분)`);
  }
  const prev = index[t.topic];
  index[t.topic] = {
    status: r.status, date: today, areas: t.areas,
    ...(r.file && { file: r.file }), ...(r.note && { duplicateOf: r.note }),
    ...(r.status === 'insufficient' && { attempts: (prev?.attempts ?? 0) + 1, reason: r.reason ?? `facts=${r.facts ?? 0}`, sources: r.sources ?? [] }),
  };
  results.push({ ...t, ...r });
}

// 인덱스와 사람용 목록
writeFileSync(INDEX, JSON.stringify(index, null, 2) + '\n');
const rows = Object.entries(index).sort((a, b) => b[1].date.localeCompare(a[1].date));
writeFileSync(join(DRAFTS, 'README.md'), [
  '# 로컬 모델 초안 (사이트 미공개)', '',
  '매주 일요일 04:00 Hermes 주간 조사(`hermes/weekly.mjs`)가 `research/backlog.md` 의 knowledge 주제를 골라 원문을 읽고 초안을 쓴다.',
  '초안은 원문 인용이 내려받은 텍스트와 일치한 사실만 쓰지만, **번역·해석 오류는 걸러지지 않는다.** Claude Code 에서 `review-drafts` 로 원문 대조 후 `content/knowledge/` 로 옮겨 공개한다.', '',
  '| 주제 | 상태 | 파일·사유 | 날짜 |', '| --- | --- | --- | --- |',
  ...rows.map(([k, v]) => `| ${k.replace(/\|/g, '/')} | ${{ drafted: '초안', duplicate: '중복 의심', insufficient: `출처 부족(${v.attempts ?? 1}회)`, published: '공개됨', rejected: '버림' }[v.status] ?? v.status} | ${v.file ?? v.duplicateOf ?? v.reason ?? ''} | ${v.date} |`),
  '',
].join('\n'));

mkdirSync(join(ROOT, 'research/log'), { recursive: true });
writeFileSync(join(ROOT, `research/log/${today}-hermes-weekly.md`), [
  `# Hermes 주간 조사 — ${today}`, '', `로컬 모델: ${MODEL}. 초안은 research/drafts/ 에만 있고 사이트에는 공개되지 않았다.`, '',
  ...results.map((r) => `- ${r.topic} — ${r.status}${r.file ? ` → ${r.file}` : ''}${r.note ? ` (기존 ${r.note})` : ''}${r.reason ? ` (${r.reason})` : ''}`), '',
].join('\n'));

if (DRY) { say('\n(dry-run: 배포하지 않음)'); process.exit(0); }
say('\n## 커밋');
const p = spawnSync('bash', ['hermes/publish.sh', `chore(hermes): weekly research drafts ${today}`], { cwd: ROOT, encoding: 'utf8' });
say((p.stdout + p.stderr).trim().split('\n').slice(0, 15).join('\n'));
if (p.status !== 0) {
  const keep = join(ROOT, 'hermes/.failed', `${today}-weekly`);
  mkdirSync(keep, { recursive: true });
  cpSync(join(ROOT, 'research'), join(keep, 'research'), { recursive: true });
  git('checkout', '--', 'research');
  git('clean', '-fdq', 'research');
  say(`\n커밋 실패 → 변경은 hermes/.failed/${today}-weekly/ 에 보관하고 작업 트리를 되돌렸다.`);
}
