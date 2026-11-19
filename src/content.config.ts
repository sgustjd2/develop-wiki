import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import {
  ARCHITECTURES, COMMERCIAL, DOMAINS, DOMAIN_IDS, KNOWLEDGE, KOREAN, LANGUAGES, LEVELS,
  MODALITIES, MODEL_TYPES, PRICING, THINKING,
} from './taxonomy';

const keys = <T extends object>(o: T) => Object.keys(o) as [string, ...string[]];

/**
 * 도구·라이브러리·서비스. 파일: content/resources/<domain>/<category>/<id>.md
 * frontmatter = 메타데이터, 본문 = 백과사전 항목(개요·설치·핵심 개념·사용법). 본문은 비어 있어도 된다.
 */
const resources = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './content/resources',
    generateId: ({ entry, data }) => {
      const id = entry.replace(/\.md$/, '');
      const [domain, category] = id.split('/');
      if (data.domain !== domain || data.category !== category)
        throw new Error(`${entry}: 폴더(${domain}/${category})와 frontmatter(domain: ${data.domain}, category: ${data.category})가 다름`);
      return id;
    },
  }),
  schema: z
    .object({
      name: z.string(),
      url: z.url(),
      domain: z.enum(DOMAIN_IDS as [string, ...string[]]),
      category: z.string(),
      description: z.string().min(10).max(160), // 한국어 1~2문장
      pricing: z.enum(keys(PRICING)),
      tags: z.array(z.string()).default([]),
      languages: z.array(z.enum(keys(LANGUAGES))).default([]), // 비어 있으면 언어 무관
      repo: z.url().optional(), // GitHub 등 소스 저장소
      stars: z.number().int().nonnegative().optional(), // GitHub 별 수 (Hermes 가 매일 갱신)
      docs: z.url().optional(), // 공식 문서 (백과사전 본문의 1차 출처)
      koreanDocs: z.boolean().default(false), // 한국어 문서/자료 존재
      addedAt: z.coerce.date(),
      verifiedAt: z.coerce.date(),
    })
    .superRefine((d, ctx) => {
      const cats = DOMAINS[d.domain as keyof typeof DOMAINS].categories;
      if (!(d.category in cats))
        ctx.addIssue({ code: 'custom', message: `category "${d.category}" 는 domain "${d.domain}" 에 없음. 허용: ${Object.keys(cats).join(', ')}` });
    }),
});

/** 오픈 웨이트 모델. 파일: content/models/<org>/<id>.md (본문: 선택, 사용 가이드) */
const models = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/models' }),
  schema: z
    .object({
      name: z.string(),
      org: z.string(),
      family: z.string().optional(),
      type: z.enum(MODEL_TYPES), // 주 분류 1개 (group 은 type 에서 파생)
      thinking: z.enum(keys(THINKING)).default('none'),
      modalities: z.object({
        input: z.array(z.enum(MODALITIES)).min(1),
        output: z.array(z.enum(MODALITIES)).min(1),
      }),
      architecture: z.enum(keys(ARCHITECTURES)),
      paramsB: z.number().positive().optional(), // 총 파라미터(B)
      activeParamsB: z.number().positive().optional(), // MoE 활성 파라미터(B)
      contextLength: z.number().int().positive().optional(), // 토큰
      license: z.string(), // 예: Apache-2.0, MIT, Llama 3.1 Community License
      commercialUse: z.enum(keys(COMMERCIAL)),
      korean: z.enum(keys(KOREAN)).default('unknown'),
      releaseDate: z.coerce.date(),
      huggingface: z.url().optional(),
      summary: z.string().min(10).max(200),
      useCases: z.array(z.string()).min(1), // "이럴 때 쓴다"
      strengths: z.array(z.string()).default([]),
      limitations: z.array(z.string()).default([]),
      capabilities: z.array(z.enum(['tool-calling', 'long-context', 'multilingual', 'structured-output', 'fim', 'grounding'])).default([]),
      sources: z.array(z.url()).min(1), // 근거 링크 (모델 카드, 공식 블로그, 테크 리포트)
      verifiedAt: z.coerce.date(),
    })
    .superRefine((d, ctx) => {
      if (d.architecture === 'moe' && !d.activeParamsB)
        ctx.addIssue({ code: 'custom', message: 'MoE 모델은 activeParamsB 필요' });
      if (d.type === 'reasoning-llm' && d.thinking !== 'native')
        ctx.addIssue({ code: 'custom', message: 'reasoning-llm 은 thinking: native 여야 함 (하이브리드면 text-llm/code-llm)' });
    }),
});

/** 개발 지식 노트(디자인 패턴, 아키텍처, 원칙 …). 파일: content/knowledge/<category>/<id>.md */
const knowledge = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/knowledge' }),
  schema: z
    .object({
      title: z.string(),
      aka: z.array(z.string()).default([]), // 영문명·별칭
      category: z.enum(keys(KNOWLEDGE)),
      group: z.string().optional(),
      level: z.enum(keys(LEVELS)),
      summary: z.string().min(10).max(160),
      tags: z.array(z.string()).default([]),
      related: z.array(z.string()).default([]), // 다른 knowledge id
      simulation: z.string().optional(), // src/components/sim/index.ts 의 키. 있으면 본문 아래에 시뮬레이션 렌더
      sources: z.array(z.url()).min(1),
      updatedAt: z.coerce.date(),
    })
    .superRefine((d, ctx) => {
      const groups = KNOWLEDGE[d.category as keyof typeof KNOWLEDGE].groups as Record<string, string>;
      if (d.group && !(d.group in groups))
        ctx.addIssue({ code: 'custom', message: `group "${d.group}" 는 ${d.category} 에 없음. 허용: ${Object.keys(groups).join(', ') || '(없음)'}` });
    }),
});

/** 개발 언어 백과사전. 파일: content/languages/<id>.md (id = taxonomy LANGUAGES 키) */
const languages = defineCollection({
  loader: glob({ pattern: '*.md', base: './content/languages' }),
  schema: z.object({
    name: z.string(),
    summary: z.string().min(10).max(160),
    paradigms: z.array(z.string()).default([]), // 예: 객체지향, 함수형
    typing: z.enum(['static', 'dynamic', 'gradual']),
    execution: z.enum(['compiled', 'interpreted', 'jit', 'vm', 'transpiled']),
    firstAppeared: z.number().int(),
    officialSite: z.url(),
    docs: z.url(),
    useCases: z.array(z.string()).min(1),
    sources: z.array(z.url()).min(1),
    updatedAt: z.coerce.date(),
  }),
});

/**
 * 버전별 이슈·보안 권고. 파일: content/advisories/<domain>/<category>/<id>.md — 경로가 같은 resources 항목에 붙는다.
 * 구조화 필드만 쓰고(Hermes 가 쓰기 쉽게), 본문은 선택(추가 설명).
 * 사실은 GitHub Releases / GitHub Security Advisories / 공식 릴리스 노트에서 확인한 것만.
 */
const advisories = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/advisories' }),
  schema: z.object({
    checkedAt: z.coerce.date(), // 마지막으로 출처를 확인한 날
    latestVersion: z.string().optional(),
    latestReleasedAt: z.coerce.date().optional(),
    versions: z
      .array(
        z.object({
          version: z.string(),
          releasedAt: z.coerce.date(),
          summary: z.string().max(200), // 한국어, 사용자에게 영향 있는 변경만
          breaking: z.boolean().default(false),
          url: z.url(),
        }),
      )
      .default([]),
    security: z
      .array(
        z.object({
          id: z.string(), // GHSA-xxxx / CVE-xxxx
          severity: z.enum(['low', 'moderate', 'high', 'critical', 'unknown']),
          title: z.string().max(160), // 한국어
          affected: z.string(), // 예: "< 5.2.1"
          fixedIn: z.string().optional(),
          publishedAt: z.coerce.date(),
          url: z.url(),
        }),
      )
      .default([]),
  }),
});

export const collections = { resources, models, knowledge, languages, advisories };
