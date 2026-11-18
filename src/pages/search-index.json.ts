import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { DOMAINS, KNOWLEDGE, LANGUAGES, MODEL_GROUPS, modelTypeLabel } from '../taxonomy';
import { href, knowledgePath, languagePath, modelPath, resourcePath } from '../lib';

/** 헤더 전역 검색용 인덱스. t=제목, s=부제, u=URL, k=종류, x=검색 대상(소문자) */
export const GET: APIRoute = async () => {
  const items: { t: string; s: string; u: string; k: string; x: string }[] = [];
  const push = (t: string, s: string, u: string, k: string, extra: string[] = []) =>
    items.push({ t, s, u, k, x: [t, s, k, ...extra].join(' ').toLowerCase() });

  for (const e of await getCollection('resources')) {
    const dom = DOMAINS[e.data.domain as keyof typeof DOMAINS];
    const cat = (dom.categories as Record<string, { label: string }>)[e.data.category].label;
    push(e.data.name, e.data.description, resourcePath(e.id), `${dom.label}·${cat}`, [...e.data.tags, ...e.data.languages, e.body ? e.body.slice(0, 400) : '']);
  }
  for (const e of await getCollection('models'))
    push(e.data.name, e.data.summary, modelPath(e.id), `모델·${modelTypeLabel(e.data.type)}`, [e.data.org, e.data.family ?? '', ...e.data.useCases]);
  for (const e of await getCollection('knowledge'))
    push(e.data.title, e.data.summary, knowledgePath(e.id), `지식·${KNOWLEDGE[e.data.category as keyof typeof KNOWLEDGE].label}`, [...e.data.aka, ...e.data.tags]);
  const langDocs = await getCollection('languages');
  for (const [id, label] of Object.entries(LANGUAGES))
    push(label, langDocs.find((d) => d.id === id)?.data.summary ?? '개발 언어', languagePath(id), '언어', [id]);

  // 카테고리 페이지도 검색되게
  for (const [did, d] of Object.entries(DOMAINS))
    for (const [cid, c] of Object.entries(d.categories as Record<string, { label: string; desc: string }>))
      push(c.label, c.desc, href(`${did}/${cid}/`), `카테고리·${d.label}`);
  for (const g of Object.values(MODEL_GROUPS))
    for (const [tid, t] of Object.entries(g.types as Record<string, { label: string; desc: string }>))
      push(t.label, t.desc, href(`models/type/${tid}/`), `모델 분류·${g.label}`);
  for (const [kid, k] of Object.entries(KNOWLEDGE)) push(k.label, k.desc, href(`knowledge/${kid}/`), '지식 분류');

  return new Response(JSON.stringify(items), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
