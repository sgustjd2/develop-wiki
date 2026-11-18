import type { CollectionEntry } from 'astro:content';
import { COMMERCIAL, LANGUAGES, LEVELS, PRICING, THINKING, modelTypeLabel, sizeBucket, KNOWLEDGE } from './taxonomy';
import { fmtDate, hostOf, knowledgePath, modelPath, resourcePath } from './lib';

/** 컬렉션 항목 → Card 컴포넌트 props. 페이지마다 같은 모양을 쓰기 위해 한곳에 둔다. */
export function resourceCard(e: CollectionEntry<'resources'>) {
  const d = e.data;
  return {
    href: resourcePath(e.id),
    title: d.name,
    sub: hostOf(d.url),
    desc: d.description,
    badges: [
      ...(d.stars !== undefined ? [{ label: `★ ${d.stars >= 1000 ? (d.stars / 1000).toFixed(d.stars >= 10000 ? 0 : 1) + 'k' : d.stars}` }] : []),
      ...d.languages.map((l) => ({ label: LANGUAGES[l as keyof typeof LANGUAGES], strong: true })),
      { label: PRICING[d.pricing as keyof typeof PRICING] },
      ...(d.koreanDocs ? [{ label: '한국어 문서' }] : []),
      ...(e.body?.trim() ? [{ label: '📖 가이드' }] : []),
    ],
    search: [d.name, d.description, ...d.tags, ...d.languages].join(' ').toLowerCase(),
    facets: [`pricing:${d.pricing}`, `ko:${d.koreanDocs ? 'yes' : 'no'}`, ...d.languages.map((l) => `lang:${l}`)].join(' '),
  };
}

const sizeKey = (p?: number) => (p === undefined ? 'na' : p < 3 ? 'tiny' : p < 15 ? 'small' : p < 70 ? 'medium' : 'large');

export function modelCard(e: CollectionEntry<'models'>) {
  const d = e.data;
  return {
    href: modelPath(e.id),
    title: d.name,
    sub: `${d.org} · ${fmtDate(d.releaseDate)}`,
    desc: d.summary,
    badges: [
      { label: modelTypeLabel(d.type), strong: true },
      ...(d.thinking !== 'none' ? [{ label: THINKING[d.thinking as keyof typeof THINKING] }] : []),
      ...(d.paramsB ? [{ label: d.activeParamsB ? `${d.paramsB}B (활성 ${d.activeParamsB}B)` : `${d.paramsB}B` }] : []),
      ...(sizeBucket(d.paramsB) ? [{ label: sizeBucket(d.paramsB)! }] : []),
      { label: COMMERCIAL[d.commercialUse as keyof typeof COMMERCIAL] },
    ],
    search: [d.name, d.org, d.family, d.summary, ...d.useCases].join(' ').toLowerCase(),
    facets: [
      `thinking:${d.thinking}`, `commercial:${d.commercialUse}`, `size:${sizeKey(d.paramsB)}`,
      ...d.modalities.input.map((m) => `input:${m}`),
    ].join(' '),
  };
}

export function knowledgeCard(e: CollectionEntry<'knowledge'>) {
  const d = e.data;
  const groups = KNOWLEDGE[d.category as keyof typeof KNOWLEDGE].groups as Record<string, string>;
  return {
    href: knowledgePath(e.id),
    title: d.title,
    sub: d.aka.join(' · ') || undefined,
    desc: d.summary,
    badges: [
      { label: LEVELS[d.level as keyof typeof LEVELS], strong: true },
      ...(d.group ? [{ label: groups[d.group] }] : []),
      ...d.tags.slice(0, 3).map((t) => ({ label: `#${t}` })),
    ],
    search: [d.title, ...d.aka, d.summary, ...d.tags].join(' ').toLowerCase(),
    facets: `level:${d.level}`,
  };
}

export const MODEL_CHIPS = [
  { facet: 'thinking:native', label: '추론(항상)' },
  { facet: 'thinking:hybrid', label: '추론(하이브리드)' },
  { facet: 'input:image', label: '이미지 입력' },
  { facet: 'input:audio', label: '음성 입력' },
  { facet: 'commercial:allowed', label: '상업 이용 가능' },
  { facet: 'size:tiny', label: '<3B' },
  { facet: 'size:small', label: '3–15B' },
  { facet: 'size:medium', label: '15–70B' },
  { facet: 'size:large', label: '70B+' },
];
