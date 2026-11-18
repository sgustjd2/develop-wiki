// 신규 모델·라이브러리 "후보"를 모은다. 파일은 만들지 않는다 — research/backlog.md 에 쌓고 Claude Code(/refresh-hub)가 검증 후 반영한다.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, daysAgo, gh, json, parseMd, walk } from './lib.mjs';

const ORGS = ['deepseek-ai', 'Qwen', 'meta-llama', 'google', 'mistralai', 'openai', 'nvidia', 'zai-org', 'LiquidAI', 'microsoft',
  'ibm-granite', 'allenai', 'BAAI', 'moonshotai', 'MiniMaxAI', 'tencent', 'baidu', 'CohereLabs', 'HuggingFaceTB', 'stepfun-ai',
  'LGAI-EXAONE', 'upstage', 'naver-hyperclovax', 'kakaocorp', 'skt', 'jinaai', 'nomic-ai', 'Alibaba-NLP',
  'lerobot', 'physical-intelligence', 'openvla']; // 로보틱스 정책 모델 조직 포함
const SKIP = /gguf|awq|gptq|fp8|nvfp4|fp4|w4a16|mlx|bnb|int4|int8|-base$|eagle|draft|onnx|dspine|distill-spec|nfe\d/i;
const HINT = {
  'text-generation': 'language(text/code/reasoning)', 'image-text-to-text': 'text-llm 또는 vlm', 'text-to-image': 'image-gen', 'image-to-image': 'image-gen',
  'text-to-video': 'video-gen', 'automatic-speech-recognition': 'asr', 'text-to-speech': 'tts', 'feature-extraction': 'embedding',
  'sentence-similarity': 'embedding', 'text-ranking': 'reranker', 'text-classification': 'classifier/guard/reward',
  robotics: 'vla (로보틱스 정책 모델; modalities.output 에 action)',
};
const IGNORE_PIPELINES = new Set(['reinforcement-learning', 'other']);
// 신규 라이브러리 후보를 찾는 GitHub 토픽 (영역별). 새 영역을 추가하면 여기에도 토픽을 넣는다.
const TOPICS = [
  'llm', 'ai-agents', 'mcp', 'react', 'typescript', 'database', 'rust', 'golang', 'python',
  'ros2', 'robotics', 'slam', 'robot-learning', 'embodied-ai', 'mujoco',          // 로보틱스
  'openxr', 'webxr', 'augmented-reality', 'virtual-reality', 'unity3d', 'godot',  // XR
  'swiftui', 'jetpack-compose', 'flutter', 'react-native', 'kotlin-multiplatform', // 모바일
];

const text = (...p) => { try { return readFileSync(join(ROOT, ...p), 'utf8'); } catch { return ''; } };

export async function collectCandidates() {
  const models = walk(join(ROOT, 'content/models')).map((p) => parseMd(readFileSync(p, 'utf8')).fm);
  const resources = walk(join(ROOT, 'content/resources')).map((p) => parseMd(readFileSync(p, 'utf8')).fm);
  const known = new Set(models.map((m) => (m.huggingface ?? '').replace('https://huggingface.co/', '').toLowerCase()));
  const knownRepos = new Set(resources.map((r) => (r.repo ?? '').toLowerCase().replace(/\/$/, '')));
  // 이미 백로그·제외 목록에 있는지: 전체 키뿐 아니라 owner/repo, repo 이름만 적힌 경우도 걸러낸다
const seen = (key) => {
  const hay = (text('research/backlog.md') + text('research/excluded.md')).toLowerCase();
  const k = key.toLowerCase().replace('https://github.com/', '');
  return hay.includes(k) || hay.includes(k.split('/').pop());
};

  const mods = [];
  for (const org of ORGS) {
    try {
      for (const m of await json(`https://huggingface.co/api/models?author=${org}&sort=createdAt&direction=-1&limit=8`)) {
        if (m.createdAt?.slice(0, 10) < daysAgo(14) || SKIP.test(m.id) || known.has(m.id.toLowerCase()) || m.private || m.gated === 'manual') continue;
        if (IGNORE_PIPELINES.has(m.pipeline_tag) || seen(m.id)) continue;
        mods.push(m);
      }
    } catch { /* 조직 하나 실패는 무시 */ }
  }
  mods.sort((a, b) => (b.downloads ?? 0) + (b.likes ?? 0) * 50 - ((a.downloads ?? 0) + (a.likes ?? 0) * 50));
  const modelRows = [];
  for (const m of mods.slice(0, 5)) {
    let c = {}; let total;
    try { const d = await json(`https://huggingface.co/api/models/${m.id}`); c = d.cardData ?? {}; total = d.safetensors?.total; } catch {}
    modelRows.push({
      key: m.id, area: `models/${HINT[m.pipeline_tag] ?? '분류 미정'}`,
      memo: `https://huggingface.co/${m.id} · ${m.createdAt.slice(0, 10)} · license=${c.license ?? '?'} · params=${total ? (total / 1e9).toFixed(1) + 'B' : '?'} · ♥${m.likes ?? 0} ↓${m.downloads ?? 0}`,
    });
  }

  const repos = new Map();
  for (const t of TOPICS) {
    try {
      for (const it of gh(`search/repositories?q=topic:${t}+created:>${daysAgo(45)}+stars:>1000&sort=stars&per_page=5`).items) {
        const d = it.description ?? '';
        const libLike = /(library|framework|sdk|toolkit|cli\b|server|engine|runtime|orm\b|database|protocol|agent|simulator|simulation|slam|\bros\b|openxr|webxr|controller|planner|driver)/i.test(d);
        const appLike = /(desktop app|application|\bgame\b|\bIDE\b|\bCAD\b|editor|download manager|extension for)/i.test(d) && !/(sdk|framework|library|toolkit|engine)/i.test(d);
        if (!knownRepos.has(it.html_url.toLowerCase()) && !it.archived && libLike && !appLike && !/awesome|^learn-/i.test(it.name) && !seen(it.html_url)) repos.set(it.full_name, it);
      }
    } catch { /* 주제 하나 실패는 무시 */ }
  }
  const repoRows = [...repos.values()].sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 5).map((it) => ({
    key: it.html_url, area: `resources/${it.language ?? '?'}`,
    memo: `★${it.stargazers_count} · license=${it.license?.spdx_id ?? '?'} · ${(it.description ?? '').replace(/\|/g, '/').slice(0, 100)}`,
  }));
  return [...modelRows, ...repoRows];
}
