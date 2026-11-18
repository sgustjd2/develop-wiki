// 로컬 모델(Ollama)을 "한 문장 요약 함수"로만 쓴다. 파일은 스크립트가 쓰고, 모델 출력은 검증을 통과해야 쓰인다.
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';

const OLLAMA = process.env.OLLAMA_URL ?? 'http://127.0.0.1:11434';
function configuredModel() {
  try {
    const m = readFileSync(`${homedir()}/.hermes/config.yaml`, 'utf8').match(/^model:\n(?:[ \t]+.*\n)*?[ \t]+default:\s*(\S+)/m);
    return m?.[1];
  } catch { return undefined; }
}
export const MODEL = process.env.DEVHUB_MODEL ?? configuredModel() ?? 'gemma4:26b-a4b-64k';
export const FALLBACK = '릴리스 노트 참고 (자동 요약 실패)';
export const NO_NOTES = '릴리스 노트 없음';

export async function ollamaUp() {
  try { return (await fetch(`${OLLAMA}/api/tags`, { signal: AbortSignal.timeout(5000) })).ok; } catch { return false; }
}

/** 릴리스 노트에서 요약할 만한 내용만 남긴다 (링크·기여자·변경 이력 링크 제거) */
export function usefulNotes(raw) {
  return String(raw ?? '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\*\*Full Changelog\*\*:?/gi, '')
    .replace(/#+\s*(What's Changed|Contributors|New Contributors)/gi, '')
    .replace(/(new contributors?|contributors)[^#]*/gi, '')
    .replace(/@[\w-]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const valid = (s) =>
  s && !s.includes('\n') && s.length >= 6 && s.length <= 160 && (s.match(/[가-힣]/g) ?? []).length >= 4 && !/^[#*\-`>]/.test(s) && !/TODO/.test(s);

async function ask(prompt) {
  const r = await fetch(`${OLLAMA}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, stream: false, think: false, messages: [{ role: 'user', content: prompt }], options: { temperature: 0.2, num_ctx: 8192, num_predict: 200 } }),
    signal: AbortSignal.timeout(240000),
  });
  if (!r.ok) throw new Error(`ollama ${r.status}`);
  return (await r.json()).message?.content ?? '';
}

/** @returns {{text: string, ok: boolean}} ok=false 면 폴백 문구 */
export async function koSummary(name, tag, rawNotes) {
  const notes = usefulNotes(rawNotes);
  if (notes.length < 25) return { text: NO_NOTES, ok: true };
  const prompt = `다음은 소프트웨어 "${name}" ${tag} 릴리스 노트(영어)다. 사용자에게 영향이 있는 변경(기능 추가, 버그 수정, 기본값 변경, 의존성 변경)만 골라 한국어 한 문장(80자 이내)으로 요약하라.\n규칙: 노트에 없는 내용은 쓰지 마라. 마크다운·따옴표·번호 없이 문장 하나만 출력하라. 평서문("~했다", "~한다")으로 끝내라.\n\n노트:\n${notes.slice(0, 1500)}`;
  for (let i = 0; i < 3; i++) {
    try {
      const out = (await ask(prompt)).trim().replace(/^["'“”‘’\s]+|["'“”‘’\s]+$/g, '').split('\n')[0].trim();
      if (valid(out)) return { text: out, ok: true };
    } catch { /* 재시도 */ }
  }
  return { text: FALLBACK, ok: false };
}
