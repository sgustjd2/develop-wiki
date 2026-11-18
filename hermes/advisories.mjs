#!/usr/bin/env node
// 버전·보안 이슈 파일을 "결정적으로" 만든다 (LLM 없음).
//  - 구조·ID·날짜·URL·심각도·영향/수정 버전은 GitHub API 값을 그대로 쓴다.
//  - 사람이 읽을 한국어 요약이 필요한 곳만 summary: "TODO" 로 남긴다 → 모델은 TODO 만 채운다 (hermes/lint.mjs 가 남은 TODO 를 막는다).
//  - 기존 파일은 지우지 않고 병합한다 (새 항목은 위에 추가, 최대 10개).
// 사용: node hermes/advisories.mjs [개수=5]
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import YAML from 'yaml';

const ROOT = new URL('..', import.meta.url).pathname;
const LIMIT = Number(process.argv[2] ?? 5);
const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
const MAX = 10;

const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : p.endsWith('.md') ? [p] : []; });
const split = (text) => { const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/); return { fm: YAML.parse(m?.[1] ?? '') ?? {}, body: m?.[2] ?? '' }; };
const gh = (path) => JSON.parse(execFileSync('gh', ['api', path], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));
const d10 = (x) => (x instanceof Date ? x.toISOString() : String(x)).slice(0, 10);

const resources = walk(join(ROOT, 'content/resources')).map((p) => ({ p, rel: p.replace(join(ROOT, 'content/resources') + '/', ''), ...split(readFileSync(p, 'utf8')) }))
  .filter((r) => /github\.com\/[^/]+\/[^/]+/.test(r.fm.repo ?? ''));

const advPath = (rel) => join(ROOT, 'content/advisories', rel);
const checkedAt = (rel) => (existsSync(advPath(rel)) ? d10(split(readFileSync(advPath(rel), 'utf8')).fm.checkedAt ?? '0000') : '');
const targets = resources.map((r) => ({ r, at: checkedAt(r.rel) })).sort((a, b) => a.at.localeCompare(b.at)).slice(0, LIMIT);

console.log(`## E. 버전·보안 이슈 — 스크립트가 파일 ${targets.length}개를 준비했다. 당신이 할 일은 아래 TODO 요약을 한국어로 채우는 것뿐`);
let todoCount = 0;
for (const { r } of targets) {
  const full = r.fm.repo.replace(/^https:\/\/github.com\//, '').replace(/\/$/, '');
  const file = advPath(r.rel);
  const prev = existsSync(file) ? split(readFileSync(file, 'utf8')) : { fm: {}, body: '' };
  let rels, secs, secOk = true;
  try { rels = gh(`repos/${full}/releases?per_page=8`).filter((x) => !x.draft && !x.prerelease).slice(0, 5); }
  catch { console.log(`- ${r.fm.name}: 릴리스 조회 실패 — 건너뜀(checkedAt 갱신 안 함)`); continue; }
  try { secs = gh(`repos/${full}/security-advisories?per_page=10`); }
  catch { secOk = false; secs = []; }

  const versions = (prev.fm.versions ?? []).map((v) => ({ ...v, releasedAt: d10(v.releasedAt) }));
  const notes = [];
  for (const x of rels) {
    if (versions.some((v) => v.version === x.tag_name)) continue;
    versions.push({ version: x.tag_name, releasedAt: d10(x.published_at), summary: 'TODO', breaking: false, url: x.html_url });
    notes.push({ tag: x.tag_name, body: (x.body ?? '').replace(/\s+/g, ' ').slice(0, 600) });
  }
  versions.sort((a, b) => b.releasedAt.localeCompare(a.releasedAt));

  const security = (prev.fm.security ?? []).map((s) => ({ ...s, publishedAt: d10(s.publishedAt) }));
  for (const a of secs) {
    const id = a.cve_id ? `${a.ghsa_id} (${a.cve_id})` : a.ghsa_id;
    if (security.some((s) => s.id.startsWith(a.ghsa_id))) continue;
    const v = a.vulnerabilities?.[0] ?? {};
    security.push({
      id, severity: ['low', 'moderate', 'high', 'critical'].includes(a.severity) ? a.severity : 'unknown',
      title: String(a.summary ?? '').slice(0, 160), // 원문 제목 그대로 (번역하지 않음)
      affected: v.vulnerable_version_range || 'unknown',
      ...(v.patched_versions ? { fixedIn: v.patched_versions } : {}),
      publishedAt: d10(a.published_at), url: a.html_url,
    });
  }
  security.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  const fm = {
    // 보안 조회가 실패하면 "확인 완료"로 표시하지 않는다 → 다음 실행에서 다시 시도
    checkedAt: secOk ? today : (prev.fm.checkedAt ? d10(prev.fm.checkedAt) : '2000-01-01'),
    // 모노레포(태그가 pkg==1.2.3 형식)는 어떤 패키지가 "최신"인지 모호해서 표시하지 않는다
    latestVersion: rels[0] && !/==/.test(rels[0].tag_name) ? rels[0].tag_name : undefined,
    latestReleasedAt: rels[0] ? d10(rels[0].published_at) : prev.fm.latestReleasedAt && d10(prev.fm.latestReleasedAt),
    versions: versions.slice(0, MAX),
    security: security.slice(0, MAX),
  };
  for (const k of Object.keys(fm)) if (fm[k] === undefined) delete fm[k];
  mkdirSync(dirname(file), { recursive: true });
  const body = prev.body.trim() ? prev.body : (secOk && !security.length ? '확인 시점에 GitHub 공개 보안 권고가 없었다.\n' : '');
  writeFileSync(file, `---\n${YAML.stringify(fm, { lineWidth: 0 })}---\n${body}`);

  const todos = notes.filter((n) => fm.versions.some((v) => v.version === n.tag && v.summary === 'TODO'));
  todoCount += todos.length;
  console.log(`\n### ${r.fm.name} → content/advisories/${r.rel}  (새 버전 ${todos.length}개, 보안 권고 ${security.length}개${secOk ? '' : ', 보안 조회 실패→미확인'})`);
  for (const n of todos) console.log(`- TODO ${n.tag}: ${n.body || '(릴리스 노트 없음)'}`);
}
console.log(`\n(채울 TODO 요약 총 ${todoCount}개. 파일의 \`summary: TODO\` 줄만 한국어 1문장으로 바꾸고, 릴리스 노트에 breaking/제거/기본값 변경이 명시된 경우에만 그 항목의 breaking 을 true 로.)`);
