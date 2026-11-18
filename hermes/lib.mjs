// hermes 스크립트 공용 도구
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import YAML from 'yaml';

export const ROOT = new URL('..', import.meta.url).pathname;
export const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
export const daysAgo = (n) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
export const d10 = (x) => (x instanceof Date ? x.toISOString() : String(x)).slice(0, 10);

export const walk = (dir) => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? walk(p) : p.endsWith('.md') ? [p] : [];
});
export function parseMd(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  return { fm: YAML.parse(m?.[1] ?? '') ?? {}, body: m?.[2] ?? '' };
}
export const readMd = (p) => parseMd(readFileSync(p, 'utf8'));
export const gh = (path) => JSON.parse(execFileSync('gh', ['api', path], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 60000 }));
export async function json(url) {
  const r = await fetch(url, { headers: { 'User-Agent': 'devhub-hermes' }, signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
}
export const repoOf = (url) => (url ?? '').replace(/^https:\/\/github.com\//, '').replace(/\/$/, '');
