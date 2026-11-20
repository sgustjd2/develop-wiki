// 로컬 모델(Ollama) 호출. 출력은 항상 JSON 스키마로 받고, 스크립트가 검증한 뒤에만 쓴다.
import { MODEL } from './summarize.mjs';

const OLLAMA = process.env.OLLAMA_URL ?? 'http://127.0.0.1:11434';

async function chat(prompt, schema, { ctx = 24576, predict = 2500 } = {}) {
  const r = await fetch(`${OLLAMA}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL, stream: false, think: false, format: schema,
      messages: [{ role: 'user', content: prompt }],
      options: { temperature: 0.1, num_ctx: ctx, num_predict: predict },
    }),
    signal: AbortSignal.timeout(900000),
  });
  if (!r.ok) throw new Error(`ollama ${r.status}`);
  return (await r.json()).message?.content ?? '';
}

/** JSON 스키마를 지키는 응답을 받을 때까지 최대 2번 시도. 실패하면 null */
export async function askJson(prompt, schema, opts) {
  for (let i = 0; i < 2; i++) {
    try { return JSON.parse(await chat(prompt, schema, opts)); } catch { /* 재시도 */ }
  }
  return null;
}
