import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import {
  ARCHITECTURES, COMMERCIAL, DOMAINS, DOMAIN_IDS, KNOWLEDGE, KOREAN, LANGUAGES, LEVELS,
  MODALITIES, MODEL_TYPES, PRICING, THINKING,
} from './taxonomy';

const keys = <T extends object>(o: T) => Object.keys(o) as [string, ...string[]];

/** 도구·라이브러리·서비스·레퍼런스 링크. 파일: src/content/resources/<domain>/<id>.yaml */
const resources = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/resources' }),
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

/** 오픈 웨이트 모델. 파일: src/content/models/<org>/<id>.yaml */
const models = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/models' }),
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

/** 개발 지식 노트(디자인 패턴, 아키텍처, 원칙 …). 파일: src/content/knowledge/<category>/<id>.md */
const knowledge = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/knowledge' }),
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
      sources: z.array(z.url()).min(1),
      updatedAt: z.coerce.date(),
    })
    .superRefine((d, ctx) => {
      const groups = KNOWLEDGE[d.category as keyof typeof KNOWLEDGE].groups as Record<string, string>;
      if (d.group && !(d.group in groups))
        ctx.addIssue({ code: 'custom', message: `group "${d.group}" 는 ${d.category} 에 없음. 허용: ${Object.keys(groups).join(', ') || '(없음)'}` });
    }),
});

export const collections = { resources, models, knowledge };
