import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

/** 컬렉션 전체를 JSON 으로: /data/resources.json, /data/models.json, /data/knowledge.json, /data/languages.json
 *  각 항목 = { id, path(원본 md 경로), ...frontmatter, body(마크다운 본문) } */
const COLLECTIONS = ['resources', 'models', 'knowledge', 'languages'] as const;

export function getStaticPaths() {
  return COLLECTIONS.map((collection) => ({ params: { collection } }));
}

export const GET: APIRoute = async ({ params }) => {
  const name = params.collection as (typeof COLLECTIONS)[number];
  const entries = await getCollection(name);
  const items = entries
    .map((e) => ({ id: e.id, path: `content/${name}/${e.id}.md`, ...e.data, body: e.body?.trim() || undefined }))
    .sort((a, b) => a.id.localeCompare(b.id));
  return new Response(JSON.stringify({ collection: name, count: items.length, generatedAt: new Date().toISOString(), items }, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
