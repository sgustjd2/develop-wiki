#!/usr/bin/env node
// dev.hub 매일 업데이트용 결정적 데이터 수집 (읽기 전용, LLM 없음).
// 결과를 사람이 읽기 쉬운 작업 목록으로 stdout 에 출력 → Hermes cron 이 에이전트 프롬프트에 주입한다.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = new URL('..', import.meta.url).pathname;
const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
const daysAgo = (n) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.md') ? [p] : [];
  });
}
function front(p) {
  const s = readFileSync(p, 'utf8');
  const m = s.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  const fm = {};
  for (const line of (m?.[1] ?? '').split('\n')) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].trim();
  }
  return { fm, body: (m?.[2] ?? '').trim(), path: p.replace(ROOT, '') };
}
async function json(url) {
  const r = await fetch(url, { headers: { 'User-Agent': 'devhub-collector' } });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
}
const gh = (path) => JSON.parse(execFileSync('gh', ['api', path], { encoding: 'utf8' }));

const models = walk(join(ROOT, 'content/models')).map(front);
const resources = walk(join(ROOT, 'content/resources')).map(front);
const known = new Set(models.map((m) => (m.fm.huggingface ?? '').replace('https://huggingface.co/', '').toLowerCase()));
const knownRepos = new Set(resources.map((r) => (r.fm.repo ?? '').toLowerCase().replace(/\/$/, '')));

console.log(`# dev.hub 일일 작업 — ${today} (KST)`);

// 1) 신규 오픈 웨이트 모델 후보: 감시 조직의 최근 14일 저장소
const ORGS = ['deepseek-ai', 'Qwen', 'meta-llama', 'google', 'mistralai', 'openai', 'nvidia', 'zai-org', 'LiquidAI', 'microsoft',
  'ibm-granite', 'allenai', 'BAAI', 'moonshotai', 'MiniMaxAI', 'tencent', 'baidu', 'CohereLabs', 'HuggingFaceTB', 'stepfun-ai',
  'LGAI-EXAONE', 'upstage', 'naver-hyperclovax', 'kakaocorp', 'skt', 'jinaai', 'nomic-ai', 'Alibaba-NLP'];
const SKIP = /gguf|awq|gptq|fp8|nvfp4|fp4|w4a16|mlx|bnb|int4|int8|-base$|eagle|draft|onnx|dspine/i;
const HINT = {
  'text-generation': 'language 계열(text-llm/code-llm/reasoning-llm)', 'image-text-to-text': 'text-llm 또는 vlm (classify-model 규칙)',
  'text-to-image': 'image-gen', 'image-to-image': 'image-gen', 'text-to-video': 'video-gen', 'automatic-speech-recognition': 'asr',
  'text-to-speech': 'tts', 'feature-extraction': 'embedding', 'sentence-similarity': 'embedding', 'text-ranking': 'reranker',
  'text-classification': 'classifier/guard/reward', 'robotics': '대상 아님(로보틱스 정책 모델)',
};
const fresh = [];
for (const org of ORGS) {
  try {
    const list = await json(`https://huggingface.co/api/models?author=${org}&sort=createdAt&direction=-1&limit=8`);
    for (const m of list) {
      if (m.createdAt?.slice(0, 10) < daysAgo(14) || SKIP.test(m.id) || known.has(m.id.toLowerCase())) continue;
      if (m.private || m.gated === 'manual') continue;
      fresh.push(m);
    }
  } catch (e) { console.log(`- (HF 조회 실패: ${org} — ${e.message})`); }
}
fresh.sort((a, b) => (b.downloads ?? 0) + (b.likes ?? 0) * 50 - ((a.downloads ?? 0) + (a.likes ?? 0) * 50));
console.log(`\n## A. 신규 모델 후보 (최근 14일, 인기순 상위 3 — 오늘은 **최대 1개**만 추가. 기준에 맞는 게 없으면 0개)`);
if (!fresh.length) console.log('- 없음');
for (const m of fresh.slice(0, 3)) {
  let detail = {};
  try { detail = await json(`https://huggingface.co/api/models/${m.id}`); } catch {}
  const c = detail.cardData ?? {};
  console.log(`- ${m.id} | pipeline=${m.pipeline_tag ?? '?'}(분류 힌트: ${HINT[m.pipeline_tag] ?? '불명 — 카드 보고 결정'}) | createdAt=${m.createdAt?.slice(0, 10)} | license=${c.license ?? '?'}${c.license_name ? `(${c.license_name})` : ''} | params=${detail.safetensors?.total ?? '?'} | downloads=${m.downloads ?? 0} likes=${m.likes ?? 0}\n  카드: https://huggingface.co/${m.id}  커밋: https://huggingface.co/api/models/${m.id}/commits/main`);
}

// 2) 신규 라이브러리 후보: 최근 45일 생성 + 별 1000+ 인 주제별 저장소
const TOPICS = ['llm', 'ai-agents', 'mcp', 'react', 'typescript', 'database', 'rust', 'golang', 'python'];
const repos = new Map();
for (const t of TOPICS) {
  try {
    const r = gh(`search/repositories?q=topic:${t}+created:>${daysAgo(45)}+stars:>1000&sort=stars&per_page=5`);
    for (const it of r.items) {
      const d = it.description ?? '';
      const libLike = /(library|framework|sdk|toolkit|cli\b|server|engine|runtime|orm\b|database|protocol|agent)/i.test(d);
      const appLike = /(desktop app|application|\bgame\b|\bIDE\b|editor|download manager|android|\bios\b|extension for)/i.test(d);
      if (!knownRepos.has(it.html_url.toLowerCase()) && !it.archived && libLike && !appLike) repos.set(it.full_name, it);
    }
  } catch (e) { console.log(`- (GitHub 검색 실패: ${t})`); }
}
console.log(`\n## B. 신규 라이브러리 후보 (최근 45일 생성, ★1000+ — 오늘은 **최대 1개**. 개발자가 코드에서 쓰는 라이브러리·프레임워크·SDK·서버·CLI 만. 기준 미달은 research/excluded.md 에 사유 한 줄)`);
const top = [...repos.values()].sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 6);
if (!top.length) console.log('- 없음');
for (const it of top) console.log(`- ${it.full_name} ★${it.stargazers_count} | ${it.language ?? '?'} | license=${it.license?.spdx_id ?? '?'} | ${it.html_url}\n  ${it.description ?? ''}`);

// 3) 재검증: verifiedAt 이 가장 오래된 리소스 5개의 저장소 상태
console.log(`\n## C. 재검증 대상 (verifiedAt 오래된 순 5개) — 저장소 상태가 정상이면 verifiedAt 만 오늘로`);
const stale = resources.filter((r) => r.fm.repo?.includes('github.com')).sort((a, b) => (a.fm.verifiedAt ?? '').localeCompare(b.fm.verifiedAt ?? '')).slice(0, 5);
for (const r of stale) {
  const full = r.fm.repo.replace(/^https:\/\/github.com\//, '').replace(/\/$/, '');
  try {
    const g = gh(`repos/${full}`);
    let rel = '';
    try { rel = gh(`repos/${full}/releases/latest`).tag_name; } catch {}
    console.log(`- ${r.path} | archived=${g.archived} | pushed=${g.pushed_at?.slice(0, 10)} | license=${g.license?.spdx_id} | latest=${rel || '-'} | stars=${g.stargazers_count} | verifiedAt=${r.fm.verifiedAt}`);
  } catch (e) { console.log(`- ${r.path} | 조회 실패(${full}) — 수정하지 말고 로그에 기록`); }
}

// 4) 백과사전 본문 1건: 본문이 빈 항목 중 DB → 백엔드 → 나머지 순
const empty = resources.filter((r) => !r.body);
const pick = empty.find((r) => r.fm.category === 'database') ?? empty.find((r) => r.fm.domain === 'backend') ?? empty[0];
console.log(`\n## D. 백과사전 본문 작성 1건 (본문 없는 항목 ${empty.length}개 중)`);
console.log(pick ? `- ${pick.path} (${pick.fm.name}) — 공식 문서: ${pick.fm.docs ?? pick.fm.url}` : '- 없음');

