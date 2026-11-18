#!/usr/bin/env node
// dev.hub 일일 갱신 — 에이전트 없이 스크립트가 전부 수행한다. (Hermes cron 의 --no-agent 작업으로 실행)
//  1) 버전·보안 이슈 갱신 (로컬 모델은 릴리스 노트 한 문장 요약 함수로만)
//  2) 재검증: 저장소가 정상이면 verifiedAt 만 갱신, 폐기·접근 불가는 보고
//  3) 신규 모델·라이브러리 후보를 research/backlog.md 에 적립 (실제 추가는 Claude Code /refresh-hub)
//  4) 로그 작성 → publish.sh (lint·validate·build 통과 시에만 main push → Pages 배포)
// 옵션: --dry  (pull/배포 없이 파일만 만들고 결과 출력. 변경은 그대로 남긴다)
import { appendFileSync, cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { ROOT, d10, gh, parseMd, repoOf, today, walk } from './lib.mjs';
import { koSummary, MODEL, ollamaUp } from './summarize.mjs';
import { refreshAdvisories } from './advisories.mjs';
import { collectCandidates } from './candidates.mjs';

const DRY = process.argv.includes('--dry');
process.chdir(ROOT);
const git = (...a) => execFileSync('git', a, { cwd: ROOT, encoding: 'utf8' }).trim();
const out = [];
const say = (s = '') => { out.push(s); console.log(s); };

say(`# dev.hub 일일 갱신 — ${today}${DRY ? ' (dry-run)' : ''}`);

// 0) 사전 점검
if (!DRY) {
  if (git('status', '--porcelain')) { say('REPO: 작업 트리에 커밋 안 된 변경이 있어 오늘은 건너뜀'); say(git('status', '--short')); process.exit(0); }
  try { git('pull', '--ff-only', '-q', 'origin', 'main'); } catch (e) { say(`REPO: pull 실패 — 중단 (${e.message.split('\n')[0]})`); process.exit(0); }
  if (!existsSync(join(ROOT, 'node_modules'))) execFileSync('npm', ['ci', '--silent'], { cwd: ROOT, stdio: 'ignore' });
}
say(`REPO: ok (${git('rev-parse', '--short', 'HEAD')})`);
const up = await ollamaUp();
say(`로컬 모델: ${MODEL} — ${up ? '연결됨' : '연결 안 됨 (요약은 폴백 문구로 대체)'}`);
const summarize = up ? koSummary : async () => ({ text: '릴리스 노트 참고 (자동 요약 실패)', ok: false });

// 1) 버전·보안 이슈
const adv = await refreshAdvisories({ limit: 5, summarize });
say('\n## 버전·보안 이슈');
for (const a of adv) say(a.skipped ? `- ${a.name}: 건너뜀 (${a.skipped})` : `- ${a.name}: 새 버전 ${a.newVersions}, 새 보안 권고 ${a.newSecurity}${a.secOk ? '' : ' (보안 조회 실패→미확인)'}${a.fallbacks ? `, 요약 실패 ${a.fallbacks}건` : ''}`);

// 2) 재검증 (verifiedAt 이 가장 오래된 5개)
say('\n## 재검증');
const reverify = [];
const resources = walk(join(ROOT, 'content/resources')).map((p) => ({ p, ...parseMd(readFileSync(p, 'utf8')) })).filter((r) => /github\.com/.test(r.fm.repo ?? ''));
for (const r of resources.sort((a, b) => d10(a.fm.verifiedAt).localeCompare(d10(b.fm.verifiedAt))).slice(0, 5)) {
  const rel = r.p.replace(ROOT, '');
  try {
    const g = gh(`repos/${repoOf(r.fm.repo)}`);
    if (g.archived) { say(`- ⚠ ${rel}: 저장소가 archived — 폐기 후보 (파일은 그대로 둠)`); reverify.push(`${rel} archived`); continue; }
    const text = readFileSync(r.p, 'utf8');
    const next = text.replace(/^verifiedAt: .*$/m, `verifiedAt: ${today}`);
    if (next !== text) writeFileSync(r.p, next);
    say(`- ${rel}: 저장소 정상(archived=false, push ${String(g.pushed_at).slice(0, 10)}) → verifiedAt 갱신`);
  } catch { say(`- ⚠ ${rel}: 저장소 조회 실패 — 건드리지 않음`); reverify.push(`${rel} 조회 실패`); }
}

// 2-1) GitHub 별 수 갱신: frontmatter 에 stars 가 있는 항목 전부
say('\n## GitHub ★ 갱신');
let starUpdated = 0, starFailed = 0;
for (const r of resources.filter((x) => x.fm.stars !== undefined)) {
  try {
    const n = gh(`repos/${repoOf(r.fm.repo)}`).stargazers_count;
    const text = readFileSync(r.p, 'utf8');
    const next = text.replace(/^stars: \d+$/m, `stars: ${n}`);
    if (next !== text) { writeFileSync(r.p, next); starUpdated++; }
  } catch { starFailed++; }
}
say(`- ${starUpdated}개 갱신${starFailed ? `, 조회 실패 ${starFailed}개` : ''}`);

// 3) 후보 적립
say('\n## 신규 후보 → research/backlog.md');
let cands = [];
try { cands = await collectCandidates(); } catch (e) { say(`- 후보 수집 실패: ${e.message}`); }
const BL = join(ROOT, 'research/backlog.md');
for (const c of cands) {
  appendFileSync(BL, `| ${c.key} | ${c.area} | ${c.memo} (Hermes 후보, 검증 전) | ${today} |\n`);
  say(`- ${c.key} (${c.area})`);
}
if (!cands.length) say('- 새 후보 없음');

// 4) 로그
mkdirSync(join(ROOT, 'research/log'), { recursive: true });
const log = [
  `# Hermes 일일 갱신 — ${today}`, '',
  '## 갱신 (로컬 모델 요약 포함 — Claude Code /refresh-hub 때 fact-checker 로 재검증)',
  ...adv.filter((a) => !a.skipped).map((a) => `- content/advisories/${a.file} — 새 버전 ${a.newVersions}, 새 보안 권고 ${a.newSecurity}${a.fallbacks ? `, 요약 실패 ${a.fallbacks}` : ''}`),
  '', '## 재검증 (verifiedAt 만 갱신; 저장소 정상 여부만 확인)',
  ...(reverify.length ? reverify.map((x) => `- ⚠ ${x}`) : ['- 이상 없음']),
  '', '## 신규 후보 (backlog.md 에 적립, 아직 항목으로 만들지 않음)',
  ...(cands.length ? cands.map((c) => `- ${c.key} — ${c.area}`) : ['- 없음']), '',
].join('\n');
writeFileSync(join(ROOT, `research/log/${today}-hermes.md`), log);

// 5) 배포
if (DRY) { say('\n(dry-run: 배포하지 않음)'); process.exit(0); }
say('\n## 배포');
const p = spawnSync('bash', ['hermes/publish.sh'], { cwd: ROOT, encoding: 'utf8' });
say((p.stdout + p.stderr).trim().split('\n').slice(0, 25).join('\n'));
if (p.status !== 0) {
  // 실패한 변경은 보관하고 작업 트리를 되돌려, 다음 실행이 막히지 않게 한다
  const keep = join(ROOT, 'hermes/.failed', today);
  mkdirSync(keep, { recursive: true });
  for (const d of ['content', 'research']) cpSync(join(ROOT, d), join(keep, d), { recursive: true });
  git('checkout', '--', 'content', 'research');
  git('clean', '-fdq', 'content', 'research');
  say(`\n배포 실패 → 변경은 hermes/.failed/${today}/ 에 보관하고 작업 트리를 되돌렸다.`);
  process.exit(0);
}
