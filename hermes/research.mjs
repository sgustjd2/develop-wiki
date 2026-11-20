// 주간 조사: research/backlog.md 의 knowledge 주제를 골라, 원문을 내려받아 읽고 지식 노트 "초안"을 만든다.
// 로컬 모델은 (1) 검색어·후보 URL 제안 (2) 원문 발췌에서 사실 추출 (3) 추출된 사실만으로 초안 구성 에만 쓴다.
// 스크립트가 지키는 것:
//  - 사실은 원문 인용(quote)이 내려받은 텍스트에 그대로 있을 때만 채택한다.
//  - 초안 문단의 숫자는 그 문단이 인용한 근거 안에 있어야 한다. 아니면 문단을 빼고 "뺀 문장"에 남긴다.
//  - 초안은 research/drafts/ 에만 쓴다. 사이트(content/)에는 쓰지 않는다. 공개는 Claude Code `review-drafts` 가 검증 후 한다.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import YAML from 'yaml';
import { ROOT, parseMd, today, walk } from './lib.mjs';
import { askJson } from './llm.mjs';
import { MODEL } from './summarize.mjs';

const UA = { 'User-Agent': 'devhub-hermes-weekly' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const LEVELS = ['beginner', 'intermediate', 'advanced'];
const DENY_HOST = /(medium\.com|dev\.to|reddit\.com|quora\.com|stackoverflow\.com|youtube\.com|twitter\.com|x\.com|linkedin\.com|velog\.io|tistory\.com|blog\.naver\.com|grokipedia\.com|geeksforgeeks\.org|statology\.org|tutorialspoint\.com|javatpoint\.com|w3schools\.com|xueshu\.baidu\.com|researchgate\.net)/i;
const SUPERLATIVE = /(최고의|혁신적|완벽한|유일한|가장 강력|압도적)/;
const MIN_FACTS = 4;

// ── 주제 고르기 ─────────────────────────────────────────────────────────
/** 괄호 밖의 쉼표로만 나눈다: "A(x, y), B" → ["A(x, y)", "B"] */
export function splitTopics(s) {
  const out = []; let depth = 0, cur = '';
  for (const ch of s) {
    if ('(（'.includes(ch)) depth++;
    if (')）'.includes(ch)) depth = Math.max(0, depth - 1);
    if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out.filter(Boolean);
}

const knowledgeCats = () => readdirSync(join(ROOT, 'content/knowledge'), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);

/** backlog 의 knowledge 행에서, 아직 초안을 만들지 않은 주제를 행마다 번갈아 n 개 고른다 */
export function pickTopics(index, n) {
  const cats = new Set(knowledgeCats());
  const rows = [];
  for (const line of readFileSync(join(ROOT, 'research/backlog.md'), 'utf8').split('\n')) {
    const cells = line.split('|').map((c) => c.trim());
    if (cells.length < 6 || !cells[2]?.startsWith('knowledge/')) continue;
    const areas = cells[2].replace('knowledge/', '').split('·').map((c) => c.trim()).filter((c) => cats.has(c));
    if (!areas.length) continue;
    const topics = splitTopics(cells[1]).filter((t) => {
      const st = index[t];
      return !st || (st.status === 'insufficient' && (st.attempts ?? 1) < 2);
    });
    if (topics.length) rows.push({ areas, topics });
  }
  const picked = [];
  for (let i = 0; picked.length < n && rows.some((r) => r.topics[i]); i++) {
    for (const r of rows) if (r.topics[i] && picked.length < n) picked.push({ topic: r.topics[i], areas: r.areas });
  }
  return picked;
}

// ── 원문 수집 ───────────────────────────────────────────────────────────
function htmlToText(html) {
  return html
    .replace(/<(script|style|nav|header|footer|svg|noscript)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>|<\/(p|div|li|h\d|tr|pre|section)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
    .replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();
}

async function fetchText(url) {
  try {
    const r = await fetch(url, { headers: UA, redirect: 'follow', signal: AbortSignal.timeout(30000) });
    if (!r.ok) return null;
    const type = r.headers.get('content-type') ?? '';
    if (/pdf|octet-stream|image|video|zip/.test(type)) return null; // PDF 는 읽을 도구가 없어 건너뛴다
    const raw = await r.text();
    const text = /html/.test(type) ? htmlToText(raw) : raw.replace(/[ \t]+/g, ' ');
    return { url: r.url || url, text };
  } catch { return null; }
}

const keywords = (topic) => [...new Set(topic.replace(/[()（）·,/]/g, ' ').split(/\s+/).filter((w) => w.length >= 3 && !/^(and|the|vs|for|with)$/i.test(w)))];

/** 긴 문서는 주제어 주변 창만 모아 길이를 줄인다 */
function excerpt(text, kws, max = 12000) {
  if (text.length <= max) return text;
  const low = text.toLowerCase();
  const hits = [];
  for (const k of kws) { let i = -1; while ((i = low.indexOf(k.toLowerCase(), i + 1)) !== -1 && hits.length < 200) hits.push(i); }
  if (!hits.length) return text.slice(0, max);
  hits.sort((a, b) => a - b);
  let out = '', last = -1;
  for (const h of hits) {
    const s = Math.max(h - 700, last), e = Math.min(h + 800, text.length);
    if (e <= s) continue;
    out += (s > last + 1 ? '\n…\n' : '') + text.slice(s, e); last = e;
    if (out.length >= max) break;
  }
  return out.slice(0, max);
}

async function arxivSearch(terms) {
  // 필수 용어를 따옴표 구문의 AND 로 묶어야 무관한 논문이 덜 걸린다
  const q = terms.slice(0, 3).map((t) => `all:"${t.replace(/"/g, '')}"`).join(' AND ');
  try {
    const r = await fetch(`https://export.arxiv.org/api/query?search_query=${encodeURIComponent(q)}&max_results=4`, { headers: UA, signal: AbortSignal.timeout(30000) });
    const xml = await r.text();
    return [...xml.matchAll(/<id>http:\/\/arxiv\.org\/abs\/([^<]+)<\/id>/g)].map((m) => m[1].replace(/v\d+$/, ''));
  } catch { return []; }
}
async function wikiSearch(q) {
  try {
    const r = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&srlimit=2&srsearch=${encodeURIComponent(q)}`, { headers: UA, signal: AbortSignal.timeout(30000) });
    return (await r.json()).query.search.map((s) => `https://en.wikipedia.org/wiki/${encodeURIComponent(s.title.replace(/ /g, '_'))}`);
  } catch { return []; }
}

// 웹 검색: Hermes 가 쓰는 ddgs CLI(메타검색). 없으면 건너뛴다. 검색어에는 주제 외 정보를 넣지 않는다.
const DDGS = process.env.DEVHUB_DDGS ?? `${homedir()}/.local/share/uv/tools/ddgs/bin/ddgs`;
function webSearch(q) {
  if (!existsSync(DDGS)) return [];
  // 검색 백엔드가 가끔 시간 초과로 실패해서 2번까지 다시 시도한다
  for (const backend of ['bing', 'bing', 'auto']) {
    const r = spawnSync(DDGS, ['text', '-q', q, '-m', '6', '-b', backend, '-nc'], { encoding: 'utf8', timeout: 60000 });
    const urls = [...(r.stdout ?? '').matchAll(/^href\s+(https:\/\/\S+)/gm)].map((m) => m[1]).filter((u) => !DENY_HOST.test(u) && new URL(u).pathname.length > 1);
    if (urls.length) return urls;
    spawnSync('sleep', ['3']);
  }
  return [];
}

async function arxivDoc(id) {
  return (await fetchText(`https://arxiv.org/html/${id}`)) ?? (await fetchText(`https://arxiv.org/abs/${id}`));
}

/** 출처가 주제를 직접 다루는지: 필수 용어가 본문에 모두, 앞부분(제목·초록)에 하나 이상 있고, 모델도 관련 있다고 판정해야 한다 */
async function isRelevant(doc, plan) {
  const low = doc.text.toLowerCase(), head = low.slice(0, 4000);
  const squash = (x) => x.replace(/[-\s]/g, '');
  const lowS = squash(low), headS = squash(head);
  const has = (t, inHead) => (inHead ? headS : lowS).includes(squash(t.toLowerCase()));
  // 주제에 적힌 식별자(RFC 번호)는 반드시, 모델이 고른 용어는 절반 이상이 본문에, 하나 이상이 앞부분에 있어야 한다
  const ids = plan.ids ?? [], terms = plan.must_terms;
  const missId = ids.filter((t) => !has(t));
  if (missId.length) return `식별자 없음: ${missId.join(', ')}`;
  // 용어 검사는 값싼 1차 거름망이다(주제 영어 명칭이나 필수 용어 하나가 앞부분에 있으면 통과). 최종 판정은 아래 모델이 한다
  const any = [plan.topic_en, ...ids, ...terms];
  if (![...ids, ...terms].some((t) => has(t))) return `필수 용어 없음: ${terms.join(', ')}`;
  if (!any.some((t) => has(t, true))) return '앞부분에 주제 용어 없음';
  const v = await askJson(
    `주제: "${plan.topic_en}" (개발 지식 분류: ${plan.areas.join(', ')}; 관련 용어: ${plan.must_terms.join(', ')}). 아래는 어떤 문서의 앞부분이다. 이 문서가 이 기술 주제를 직접 다루는 자료(그 주제의 원 논문·사양·공식 문서·백과사전 항목)인가? 단어만 겹치거나, 이름만 같은 다른 회사·제품·분야의 문서면 false.\n\n${doc.text.slice(0, 2000)}`,
    { type: 'object', properties: { relevant: { type: 'boolean' } }, required: ['relevant'] },
    { predict: 50, ctx: 4096 },
  );
  return v?.relevant === true ? true : '모델이 무관하다고 판정';
}

async function gatherSources(topic, areas) {
  const plan = await askJson(
    `너는 개발 지식 노트 조사 보조다. 주제: "${topic}" (분류: ${areas.join(', ')}).\n- topic_en: 이 주제의 정확한 영어 명칭\n- must_terms: 이 주제를 다루는 문서라면 반드시 나올 구별력 있는 영어 용어 2~3개(고유명·기법명 위주, 'method' 같은 일반어 금지)\n- queries: 1차 출처를 찾을 짧은 영어 웹 검색어 2개(2~5단어, 공식 문서·사양·원 논문이 걸리도록)\n- urls: 존재한다고 확신하는 1차 출처(원 논문, 표준·사양, 공식 문서, 공식 저장소) URL 최대 4개. 확신이 없으면 비워라. 블로그·Q&A·영상 제외.`,
    { type: 'object', properties: { topic_en: { type: 'string' }, must_terms: { type: 'array', items: { type: 'string' } }, queries: { type: 'array', items: { type: 'string' } }, urls: { type: 'array', items: { type: 'string' } } }, required: ['topic_en', 'must_terms', 'queries', 'urls'] },
    { predict: 1200 },
  );
  if (!plan?.topic_en || !plan.must_terms?.length) return { sources: [], tried: ['검색 계획(JSON) 생성 실패'], plan };
  plan.must_terms = plan.must_terms.map((t) => String(t).trim()).filter((t) => t.length >= 3).slice(0, 3);
  plan.areas = areas;
  // 주제에 적힌 식별자(RFC 번호, arXiv id)는 필수 용어로 삼는다(연도는 제외)
  plan.ids = (topic.match(/RFC\s?\d{3,5}/gi) ?? []).map((n) => `RFC ${n.replace(/\D/g, '')}`);

  const cand = new Map(); // url → loader
  for (const id of topic.match(/\b\d{4}\.\d{4,5}\b/g) ?? []) cand.set(`arxiv:${id}`, () => arxivDoc(id));
  for (const n of topic.match(/RFC\s?(\d{3,5})/gi) ?? []) { const d = n.replace(/\D/g, ''); cand.set(`https://www.rfc-editor.org/rfc/rfc${d}.txt`, null); }
  for (const q of [...(plan.queries ?? []).slice(0, 2), plan.topic_en]) {
    for (const u of webSearch(q).slice(0, 4)) {
      // 버전이 박힌 문서 주소(/v1.12.4/)면 최신판(/latest/)을 먼저 시도한다
      if (/\/v\d+(\.\d+)+\//.test(u)) cand.set(u.replace(/\/v\d+(\.\d+)+\//, '/latest/'), null);
      cand.set(u, null);
    }
  }
  for (const u of (plan.urls ?? []).slice(0, 4)) if (/^https:\/\//.test(u) && !DENY_HOST.test(u)) cand.set(u, null);
  for (const id of await arxivSearch(plan.must_terms)) cand.set(`arxiv:${id}`, () => arxivDoc(id));
  for (const u of await wikiSearch(plan.topic_en)) cand.set(u, null);

  const kws = [...plan.ids, ...plan.must_terms, ...keywords(plan.topic_en)];
  const sources = [], why = [];
  let checked = 0;
  for (const [key, loader] of cand) {
    if (sources.length >= 5 || checked++ >= 14) break;
    const doc = loader ? await loader() : await fetchText(key);
    if (!doc || doc.text.length < 800) { why.push(`${key}: 내려받기 실패·짧음`); continue; }
    const ok = await isRelevant(doc, plan);
    if (ok !== true) { why.push(`${key}: ${ok}`); continue; }
    sources.push({ url: doc.url, text: doc.text, excerpt: excerpt(doc.text, kws) });
  }
  return { sources, tried: why, plan };
}

// ── 사실 추출과 인용 검증 ───────────────────────────────────────────────
const norm = (s) => s.toLowerCase().replace(/[‘’`´]/g, "'").replace(/[“”]/g, '"').replace(/[‐-―−]/g, '-').replace(/\s+/g, ' ').trim();

async function extractFacts(topic, src) {
  const res = await askJson(
    `주제: "${topic}". 아래는 출처 ${src.url} 의 발췌다. 이 주제에 관한 핵심 사실(정의, 동작, 조건, 수치, 권고)을 최대 8개 뽑아라.\n규칙: quote 에는 발췌에 있는 문장을 한 글자도 바꾸지 말고 그대로 복사하라(25~300자). claim 은 그 인용만 근거로 한 한국어 한 문장이다. 발췌에 없는 내용은 쓰지 마라. 주제와 무관한 발췌면 relevant=false.\n\n발췌:\n${src.excerpt}`,
    { type: 'object', properties: { relevant: { type: 'boolean' }, facts: { type: 'array', items: { type: 'object', properties: { claim: { type: 'string' }, quote: { type: 'string' } }, required: ['claim', 'quote'] } } }, required: ['relevant', 'facts'] },
  );
  if (!res?.relevant) return [];
  const hay = norm(src.text);
  return (res.facts ?? []).filter((f) => f.quote?.length >= 25 && f.quote.length <= 400 && hay.includes(norm(f.quote)) && /[가-힣]/.test(f.claim ?? ''))
    .map((f) => ({ claim: f.claim.trim(), quote: f.quote.trim(), url: src.url }));
}

// ── 초안 구성 ───────────────────────────────────────────────────────────
// 숫자 비교: 천 단위 쉼표는 지우고, 0~12 는 원문이 영어 단어(one, two …)로 쓴 경우도 인정한다
const numbersIn = (s) => (s.replace(/(\d),(?=\d{3}\b)/g, '$1').match(/\d+(?:\.\d+)?/g) ?? []);
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const numberInQuotes = (x, quotes) => {
  const q = quotes.replace(/(\d),(?=\d{3}\b)/g, '$1').toLowerCase();
  if (new RegExp(`(^|[^\\d.])${x.replace('.', '\\.')}(?![\\d])`).test(q)) return true;
  const n = Number(x);
  return Number.isInteger(n) && n <= 12 && new RegExp(`\\b${WORDS[n]}\\b`).test(q);
};

function existingIds() {
  const ids = new Set();
  for (const p of walk(join(ROOT, 'content/knowledge'))) ids.add(p.split('/').pop().replace(/\.md$/, ''));
  const dd = join(ROOT, 'research/drafts');
  if (existsSync(dd)) for (const p of walk(dd)) ids.add(p.split('/').pop().replace(/\.md$/, ''));
  return ids;
}

function titlesIn(areas) {
  return areas.flatMap((c) => walk(join(ROOT, 'content/knowledge', c)).map((p) => `${c}/${p.split('/').pop().replace(/\.md$/, '')}: ${parseMd(readFileSync(p, 'utf8')).fm.title}`));
}

async function composeDraft(topic, areas, facts) {
  const factList = facts.map((f, i) => `[${i + 1}] ${f.claim} (원문: "${f.quote}")`).join('\n');
  const d = await askJson(
    `너는 한국어 개발 지식 노트 초안을 쓴다. 주제: "${topic}". 아래 번호 붙은 사실만 근거로 쓴다. 사실에 없는 내용·수치·버전은 절대 쓰지 마라.\n스타일: 한국어 평서문, 설명은 짧게, 홍보·최상급 표현 금지, 고유명사·코드는 원문 그대로, 번역이 애매한 용어는 원문 영어를 괄호로 병기(authorization server 는 '인가 서버', authentication 은 '인증', authorization 은 '인가'). 원문이 MUST·SHOULD·MAY 이면 '(MUST)' 처럼 병기하고, 원문이 단순 서술이면 '~해야 한다'로 강하게 바꾸지 마라. 본문에 [1] 같은 번호를 쓰지 말고 facts 필드에만 적어라.\n- id: 영어 소문자 kebab-case (예: friedman-test-repeated-ordinal)\n- category: ${areas.join(' 또는 ')} 중 하나\n- level: beginner|intermediate|advanced\n- summary: 무엇이고 언제 쓰는지 한국어 1~2문장, 160자 이내\n- sections: 3~5개 절. 각 문단은 근거로 쓴 사실 번호(facts)를 반드시 단다.\n\n사실:\n${factList}`,
    {
      type: 'object',
      properties: {
        id: { type: 'string' }, title: { type: 'string' }, aka: { type: 'array', items: { type: 'string' } },
        category: { type: 'string' }, level: { type: 'string' }, summary: { type: 'string' }, tags: { type: 'array', items: { type: 'string' } },
        sections: { type: 'array', items: { type: 'object', properties: { heading: { type: 'string' }, paragraphs: { type: 'array', items: { type: 'object', properties: { text: { type: 'string' }, facts: { type: 'array', items: { type: 'integer' } } }, required: ['text', 'facts'] } } }, required: ['heading', 'paragraphs'] } },
      },
      required: ['id', 'title', 'category', 'level', 'summary', 'tags', 'sections'],
    },
    { predict: 4000 },
  );
  if (!d) return { error: '초안 JSON 생성 실패' };

  // frontmatter 검증 — 고칠 수 없는 값은 안전한 기본값으로
  const ids = existingIds();
  let id = String(d.id ?? '').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
  if (!id) return { error: 'id 없음' };
  while (ids.has(id)) id += '-draft';
  const category = areas.includes(d.category) ? d.category : areas[0];
  const summary = String(d.summary ?? '').trim();
  const problems = [];
  if (summary.length > 160 || (summary.match(/[가-힣]/g) ?? []).length < 8) problems.push('summary 길이·언어 규칙 위반');
  if (!/[가-힣]/.test(d.title ?? '')) problems.push('title 에 한국어 없음');

  // 문단 근거 검증
  const kept = [], dropped = [], citedAll = [];
  for (const s of d.sections ?? []) {
    const paras = [];
    for (const p of s.paragraphs ?? []) {
      // 모델이 본문에 "[1, 9]" 처럼 근거 번호를 써 넣으면 떼어 내고 근거 목록에 합친다
      const inline = [...p.text.matchAll(/\[(\d+(?:\s*,\s*\d+)*)\]/g)].flatMap((m) => m[1].split(',').map(Number));
      const text = p.text.replace(/\s*\[\d+(?:\s*,\s*\d+)*\]/g, '').trim();
      const cited = [...new Set([...(p.facts ?? []), ...inline])].filter((n) => n >= 1 && n <= facts.length).sort((x, y) => x - y);
      const quotes = cited.map((n) => facts[n - 1].quote).join(' ');
      const missing = numbersIn(text).filter((x) => !numberInQuotes(x, quotes));
      if (!cited.length) dropped.push({ text, why: '근거 번호 없음' });
      else if (missing.length) dropped.push({ text, why: `근거에 없는 수치 ${missing.join(', ')}` });
      else if (SUPERLATIVE.test(text)) dropped.push({ text, why: '최상급·홍보 표현' });
      else { citedAll.push(...cited); paras.push(`${text} (근거 ${cited.join(', ')})`); }
    }
    if (paras.length) kept.push(`## ${String(s.heading).replace(/^#+\s*/, '')}\n\n${paras.join('\n\n')}`);
  }
  if (!kept.length) return { error: '근거 검증을 통과한 문단 없음', dropped };

  const used = [...new Set(citedAll.map((n) => facts[n - 1].url))]; // 본문 문단이 실제로 인용한 출처만
  const fm = {
    title: String(d.title).trim(), aka: (d.aka ?? []).map((a) => String(a).trim()).filter((a) => /[A-Za-z가-힣]/.test(a) && a.length <= 60 && a.split(/\s+/).length <= 6 && a !== String(d.title).trim()).slice(0, 8), category,
    level: LEVELS.includes(d.level) ? d.level : 'intermediate',
    summary, tags: (d.tags ?? []).map((t) => String(t).toLowerCase().replace(/\s+/g, '-')).slice(0, 8),
    related: [], sources: used, updatedAt: today,
  };
  const body = [
    `> ⚠ 로컬 모델(${MODEL}) 자동 초안 — ${today} 주간 조사. 사이트에 공개되지 않았다. 공개 전 Claude Code \`review-drafts\` 로 원문 대조·보강이 필요하다.`,
    `> 주제(backlog): ${topic}`,
    '', ...kept.flatMap((k) => [k, '']),
    '## 검토용 근거 (공개 전 삭제)', '',
    ...facts.map((f, i) => `${i + 1}. ${f.claim}\n   - "${f.quote.replace(/\n/g, ' ')}" — ${f.url}`),
    '', ...(dropped.length ? ['## 근거 검증에서 뺀 문장 (공개 전 삭제)', '', ...dropped.map((x) => `- (${x.why}) ${x.text}`), ''] : []),
    ...(problems.length ? ['## 형식 문제 (공개 전 수정)', '', ...problems.map((x) => `- ${x}`), ''] : []),
  ].join('\n');
  return { id, category, file: `research/drafts/${category}/${id}.md`, content: `---\n${YAML.stringify(fm).trim()}\n---\n\n${body}`, kept: kept.length, dropped: dropped.length, problems };
}

// ── 주제 하나 처리 ──────────────────────────────────────────────────────
export async function researchTopic({ topic, areas }) {
  const dup = await askJson(
    `새 지식 노트 주제: "${topic}". 아래는 같은 분류의 기존 노트(id: 제목)다. 이 주제를 이미 주로 다루는 노트가 있으면 그 id(분류/id 형식)를, 없으면 빈 문자열을 답하라. 일부만 겹치면 빈 문자열.\n\n${titlesIn(areas).join('\n')}`,
    { type: 'object', properties: { duplicate_of: { type: 'string' } }, required: ['duplicate_of'] },
    { predict: 100 },
  );
  const dupId = dup?.duplicate_of?.trim();
  const dupPath = dupId && join(ROOT, 'content/knowledge', `${dupId}.md`);
  if (dupPath && existsSync(dupPath)) {
    // 모델 판정만 믿지 않는다: 주제의 식별 토큰(숫자가 든 것)은 모두, 나머지 주제어는 60% 이상이 그 노트에 있어야 중복으로 본다
    const low = readFileSync(dupPath, 'utf8').toLowerCase();
    const kws = keywords(topic);
    const has = (k) => low.includes(k.toLowerCase());
    if (kws.filter((k) => /\d/.test(k)).every(has) && kws.filter(has).length >= Math.ceil(kws.length * 0.6)) return { status: 'duplicate', note: dupId };
  }

  const { sources, tried, plan } = await gatherSources(topic, areas);
  const label = plan?.topic_en ? `${topic} (${plan.topic_en})` : topic;
  const facts = [];
  const seenQ = new Set();
  for (const s of sources) for (const f of await extractFacts(label, s)) { const k = norm(f.quote); if (!seenQ.has(k)) { seenQ.add(k); facts.push(f); } }
  if (facts.length < MIN_FACTS) return { status: 'insufficient', reason: sources.length ? `검증된 사실 ${facts.length}개 (최소 ${MIN_FACTS})` : `관련 출처 없음 — ${tried.slice(-3).join(' / ')}`, facts: facts.length, sources: sources.map((s) => s.url), tried, plan };

  const draft = await composeDraft(label, areas, facts.slice(0, 30));
  if (draft.error) return { status: 'insufficient', reason: draft.error, dropped: draft.dropped, facts: facts.length, sources: sources.map((s) => s.url), tried };
  return { status: 'drafted', ...draft, facts: facts.length, sources: sources.map((s) => s.url) };
}
