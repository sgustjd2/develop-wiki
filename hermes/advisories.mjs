// 버전·보안 이슈 파일 생성·갱신 (LLM 은 요약 한 문장 함수로만 사용, 파일은 이 스크립트가 쓴다)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import YAML from 'yaml';
import { ROOT, d10, gh, parseMd, repoOf, today, walk } from './lib.mjs';

const MAX = 10;
const advPath = (rel) => join(ROOT, 'content/advisories', rel);

/** @returns {Promise<{file:string,name:string,newVersions:number,newSecurity:number,secOk:boolean,fallbacks:number}[]>} */
export async function refreshAdvisories({ limit = 5, summarize }) {
  const resources = walk(join(ROOT, 'content/resources'))
    .map((p) => ({ rel: p.replace(join(ROOT, 'content/resources') + '/', ''), ...parseMd(readFileSync(p, 'utf8')) }))
    .filter((r) => /github\.com\/[^/]+\/[^/]+/.test(r.fm.repo ?? ''));
  const checked = (rel) => (existsSync(advPath(rel)) ? d10(parseMd(readFileSync(advPath(rel), 'utf8')).fm.checkedAt ?? '0000') : '');
  const targets = resources.map((r) => ({ r, at: checked(r.rel) })).sort((a, b) => a.at.localeCompare(b.at)).slice(0, limit);

  const report = [];
  for (const { r } of targets) {
    const full = repoOf(r.fm.repo);
    const file = advPath(r.rel);
    const prev = existsSync(file) ? parseMd(readFileSync(file, 'utf8')) : { fm: {}, body: '' };
    let rels, secs, secOk = true;
    try { rels = gh(`repos/${full}/releases?per_page=8`).filter((x) => !x.draft && !x.prerelease).slice(0, 5); }
    catch { report.push({ file: r.rel, name: r.fm.name, skipped: '릴리스 조회 실패' }); continue; }
    try { secs = gh(`repos/${full}/security-advisories?per_page=10`); } catch { secOk = false; secs = []; }

    const versions = (prev.fm.versions ?? []).map((v) => ({ ...v, releasedAt: d10(v.releasedAt) }));
    let newVersions = 0, fallbacks = 0;
    for (const x of rels) {
      if (versions.some((v) => v.version === x.tag_name)) continue;
      const s = await summarize(r.fm.name, x.tag_name, x.body);
      if (!s.ok) fallbacks++;
      versions.push({
        version: x.tag_name, releasedAt: d10(x.published_at), summary: s.text,
        breaking: /\bbreaking\b/i.test(x.body ?? ''), // 릴리스 노트에 breaking 이 명시된 경우만
        url: x.html_url,
      });
      newVersions++;
    }
    versions.sort((a, b) => b.releasedAt.localeCompare(a.releasedAt));

    const security = (prev.fm.security ?? []).map((s) => ({ ...s, publishedAt: d10(s.publishedAt) }));
    let newSecurity = 0;
    for (const a of secs) {
      if (security.some((s) => s.id.startsWith(a.ghsa_id))) continue;
      const v = a.vulnerabilities?.[0] ?? {};
      security.push({
        id: a.cve_id ? `${a.ghsa_id} (${a.cve_id})` : a.ghsa_id,
        severity: ['low', 'moderate', 'high', 'critical'].includes(a.severity) ? a.severity : 'unknown',
        title: String(a.summary ?? '').slice(0, 160), // 원문 제목 그대로(번역하지 않음)
        affected: v.vulnerable_version_range || 'unknown',
        ...(v.patched_versions ? { fixedIn: v.patched_versions } : {}),
        publishedAt: d10(a.published_at), url: a.html_url,
      });
      newSecurity++;
    }
    security.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

    const fm = {
      checkedAt: secOk ? today : prev.fm.checkedAt ? d10(prev.fm.checkedAt) : '2000-01-01', // 보안 조회 실패 시 다음 실행에서 재시도
      latestVersion: rels[0] && !/==/.test(rels[0].tag_name) ? rels[0].tag_name : undefined, // 모노레포는 표시하지 않음
      latestReleasedAt: rels[0] ? d10(rels[0].published_at) : prev.fm.latestReleasedAt && d10(prev.fm.latestReleasedAt),
      versions: versions.slice(0, MAX),
      security: security.slice(0, MAX),
    };
    for (const k of Object.keys(fm)) if (fm[k] === undefined) delete fm[k];
    mkdirSync(dirname(file), { recursive: true });
    const body = prev.body.trim() ? prev.body : secOk && !security.length ? '확인 시점에 GitHub 공개 보안 권고가 없었다.\n' : '';
    writeFileSync(file, `---\n${YAML.stringify(fm, { lineWidth: 0 })}---\n${body}`);
    report.push({ file: r.rel, name: r.fm.name, newVersions, newSecurity, secOk, fallbacks });
  }
  return report;
}
