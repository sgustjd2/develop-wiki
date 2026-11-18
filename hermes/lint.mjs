#!/usr/bin/env node
// 배포 전 규칙 검사. 스키마(astro sync)가 못 잡는 "내용 규칙"을 막는다.
// 사용: node hermes/lint.mjs [파일...]   (없으면 git 에서 바뀐 content/ 파일 전체)
// 위반이 있으면 목록을 출력하고 exit 1.
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import YAML from 'yaml';

const ROOT = new URL('..', import.meta.url).pathname;
const args = process.argv.slice(2);
const files = (args.length
  ? args
  : execFileSync('git', ['status', '--porcelain', '-uall', 'content'], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean).map((l) => l.slice(3))
).filter((f) => f.endsWith('.md'));

// 컬렉션별 허용 frontmatter 키 — src/content.config.ts 와 맞춰 둘 것 (스키마는 모르는 키를 조용히 버려서 여기서 막는다)
const KEYS = {
  resources: ['name', 'url', 'docs', 'repo', 'stars', 'domain', 'category', 'description', 'pricing', 'tags', 'languages', 'koreanDocs', 'addedAt', 'verifiedAt'],
  models: ['name', 'org', 'family', 'type', 'thinking', 'modalities', 'architecture', 'paramsB', 'activeParamsB', 'contextLength', 'license', 'commercialUse', 'korean', 'releaseDate', 'huggingface', 'summary', 'useCases', 'strengths', 'limitations', 'capabilities', 'sources', 'verifiedAt'],
  knowledge: ['title', 'aka', 'category', 'group', 'level', 'summary', 'tags', 'related', 'sources', 'updatedAt'],
  advisories: ['checkedAt', 'latestVersion', 'latestReleasedAt', 'versions', 'security'],
};
const PERMISSIVE = /^(apache[- ]?2(\.0)?|mit|bsd[- ]?\d?(-clause)?|isc|cc0|unlicense|0bsd|mpl[- ]?2(\.0)?|openmdw[- ]?1(\.\d)?|cc[- ]by[- ]4\.0)$/i;
const hangul = (s) => (String(s).match(/[가-힣]/g) ?? []).length;
// 판단형(guard/classifier/reward)은 추론 모드가 있는 모델이 있어 제외
const NON_LANGUAGE_TYPES = /^(image-gen|video-gen|audio-gen|asr|tts|embedding|reranker)$/;
const NOT_LIBRARY = /(desktop app|\bgame\b|\bIDE\b|\bCAD\b|download manager|android app|ios app|browser extension)/i;

const bad = [];
const fail = (f, msg) => bad.push(`${f}: ${msg}`);

for (const f of files) {
  const path = existsSync(f) ? f : `${ROOT}${f}`;
  if (!existsSync(path)) continue; // 삭제된 파일
  const rel = path.replace(ROOT, '');
  const coll = rel.split('/')[1];
  const m = readFileSync(path, 'utf8').match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) { fail(rel, 'frontmatter(---) 없음'); continue; }
  let fm; try { fm = YAML.parse(m[1]) ?? {}; } catch (e) { fail(rel, `YAML 파싱 실패: ${e.message.split('\n')[0]}`); continue; }
  const body = m[2];

  if (KEYS[coll]) for (const k of Object.keys(fm)) if (!KEYS[coll].includes(k)) fail(rel, `스키마에 없는 필드 "${k}" (임의로 만들지 말 것)`);
  if (/\bTODO\b/.test(m[1]) || /\bTODO\b/.test(body)) fail(rel, 'TODO 가 남아 있음 — 모두 채우거나 삭제');

  if (coll === 'resources') {
    if (hangul(fm.description) < 8) fail(rel, 'description 이 한국어가 아님 (한국어 1~2문장으로)');
    // 개발 도구(devtools)·모바일 도메인은 IDE·앱이 정상 대상이므로 제외
    if (!['devtools', 'mobile'].includes(fm.domain) && NOT_LIBRARY.test(`${fm.description} ${(fm.tags ?? []).join(' ')}`)) fail(rel, '개발 라이브러리가 아닌 앱/도구로 보임 (포함 기준 위반 → research/excluded.md 에 기록)');
    if (fm.addedAt && String(fm.addedAt).slice(0, 4) < '2020') fail(rel, 'addedAt 이상함');
  }
  if (coll === 'models') {
    if (hangul(fm.summary) < 8) fail(rel, 'summary 가 한국어가 아님');
    if (NON_LANGUAGE_TYPES.test(fm.type) && fm.thinking && fm.thinking !== 'none') fail(rel, `type ${fm.type} 는 thinking: none 이어야 함`);
    if (/^(image-gen|video-gen|audio-gen|asr|tts|embedding|reranker)$/.test(fm.type) && fm.contextLength) fail(rel, `type ${fm.type} 에 contextLength 는 부적절 (근거 없으면 제거)`);
    if (fm.commercialUse === 'allowed' && !PERMISSIVE.test(String(fm.license).trim())) fail(rel, `license "${fm.license}" 는 허용형(Apache/MIT/BSD 등)이 아님 → commercialUse: restricted (원문 조건 확인 후 allowed 로 올릴 수 있으면 사람 확인 필요에 기록)`);
    if (!(fm.sources ?? []).some((u) => String(u).startsWith('https://huggingface.co/'))) fail(rel, 'sources 에 모델 카드 URL 없음');
  }
  if (coll === 'advisories') {
    for (const v of fm.versions ?? []) if (hangul(v.summary) < 4 && v.summary !== '릴리스 노트 없음') fail(rel, `versions ${v.version} summary 가 한국어가 아님`);
    for (const s of fm.security ?? []) if (!/^https:\/\/github\.com\//.test(s.url)) fail(rel, `security ${s.id} url 이 GitHub 가 아님`);
  }
}

if (bad.length) {
  console.log(`LINT: 거부 — 규칙 위반 ${bad.length}건`);
  for (const b of bad) console.log(`  - ${b}`);
  process.exit(1);
}
console.log(`LINT: ok (${files.length}개 파일)`);
