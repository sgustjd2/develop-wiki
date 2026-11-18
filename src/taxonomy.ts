/**
 * 분류 체계의 단일 원천(Single Source of Truth).
 * 콘텐츠 스키마(src/content.config.ts), UI(/taxonomy 페이지 포함), 에이전트·스킬이 모두 이 파일을 따른다.
 * 카테고리를 바꾸면 기존 데이터가 깨지지 않는지 npm run validate 로 확인한다.
 */

type Cat = { label: string; desc: string };

// ─── 리소스(도구·라이브러리·서비스·레퍼런스) ───────────────────────────
export const DOMAINS = {
  frontend: {
    label: '프론트엔드',
    desc: 'UI 프레임워크, 스타일링, 빌드 도구, 테스트까지 브라우저 쪽 기술',
    categories: {
      framework: { label: '프레임워크·라이브러리', desc: 'React, Vue, Svelte 같은 UI 런타임' },
      'meta-framework': { label: '메타 프레임워크', desc: '라우팅·렌더링 전략을 포함한 풀스택 프레임워크' },
      styling: { label: '스타일링·CSS', desc: 'CSS 프레임워크, CSS-in-JS, 디자인 토큰' },
      'ui-kit': { label: 'UI 컴포넌트', desc: '컴포넌트 라이브러리, 헤드리스 UI' },
      'state-data': { label: '상태·데이터 패칭', desc: '상태 관리, 서버 상태 캐시, 폼' },
      'build-tooling': { label: '빌드·툴링', desc: '번들러, 린터, 포매터, 모노레포' },
      testing: { label: '테스트', desc: '유닛·E2E·비주얼 테스트' },
      animation: { label: '애니메이션·인터랙션', desc: '모션, 3D, 캔버스' },
      'performance-a11y': { label: '성능·접근성', desc: '웹 바이탈, 접근성 검사' },
      learning: { label: '레퍼런스·학습', desc: '문서, 가이드, 강의' },
    },
  },
  backend: {
    label: '백엔드',
    desc: '런타임, 프레임워크, 데이터베이스, 인프라와 운영',
    categories: {
      'runtime-language': { label: '런타임·언어', desc: 'Node, Bun, Go, Rust, JVM 등' },
      'web-framework': { label: '웹 프레임워크', desc: 'HTTP 서버·API 프레임워크' },
      database: { label: '데이터베이스', desc: 'RDBMS, NoSQL, 캐시, 검색엔진' },
      'orm-query': { label: 'ORM·쿼리', desc: 'ORM, 쿼리 빌더, 마이그레이션' },
      api: { label: 'API·프로토콜', desc: 'REST, GraphQL, gRPC, 스키마 도구' },
      auth: { label: '인증·인가', desc: 'OAuth, 세션, 권한 관리' },
      messaging: { label: '메시징·스트리밍', desc: '큐, 이벤트 스트리밍, 워크플로 엔진' },
      'infra-devops': { label: '인프라·DevOps', desc: '컨테이너, IaC, CI/CD, 배포' },
      observability: { label: '관측성', desc: '로그, 메트릭, 트레이싱' },
      learning: { label: '레퍼런스·학습', desc: '문서, 가이드, 강의' },
    },
  },
  ai: {
    label: 'AI 엔지니어링',
    desc: 'LLM 앱을 만드는 데 쓰는 도구·프레임워크·인프라 (모델 자체는 "오픈 웨이트 모델"에서)',
    categories: {
      'model-platform': { label: '모델 API·플랫폼', desc: '상용 모델 API, 모델 허브' },
      'inference-serving': { label: '추론·서빙', desc: '로컬 실행, 고성능 서빙 엔진, 양자화' },
      'agent-framework': { label: '에이전트 프레임워크', desc: '에이전트·워크플로 오케스트레이션' },
      'mcp-tooling': { label: 'MCP·툴 연동', desc: 'MCP 서버/클라이언트, 툴 호출' },
      'rag-retrieval': { label: 'RAG·검색', desc: '문서 파싱, 청킹, 검색 파이프라인' },
      'vector-db': { label: '벡터 DB', desc: '벡터 검색 엔진·확장' },
      'fine-tuning': { label: '파인튜닝·학습', desc: 'LoRA, RLHF, 학습 프레임워크' },
      evaluation: { label: '평가·LLMOps', desc: '평가, 트레이싱, 프롬프트 관리' },
      'coding-agent': { label: 'AI 코딩 도구', desc: '코딩 에이전트, IDE 어시스턴트' },
      learning: { label: '레퍼런스·학습', desc: '논문 정리, 강의, 리더보드' },
    },
  },
} as const satisfies Record<string, { label: string; desc: string; categories: Record<string, Cat> }>;

export type DomainId = keyof typeof DOMAINS;
export const DOMAIN_IDS = Object.keys(DOMAINS) as DomainId[];

/**
 * 개발 언어. 리소스의 languages 필드에 쓴다.
 * "그 언어로 쓰는 도구"(SDK·라이브러리·프레임워크)만 붙이고, 언어와 무관한 것(DB, 표준, SaaS)은 비워 둔다.
 * 여러 언어 SDK 를 공식 지원하면 주요 언어를 모두 적는다.
 */
export const LANGUAGES = {
  typescript: 'TypeScript/JS',
  python: 'Python',
  go: 'Go',
  rust: 'Rust',
  java: 'Java',
  kotlin: 'Kotlin',
  csharp: 'C#/.NET',
  cpp: 'C/C++',
  swift: 'Swift',
  dart: 'Dart',
  php: 'PHP',
  ruby: 'Ruby',
  elixir: 'Elixir',
  sql: 'SQL',
} as const;
export type LanguageId = keyof typeof LANGUAGES;

export const PRICING = {
  oss: '오픈소스',
  free: '무료',
  freemium: '부분 무료',
  paid: '유료',
} as const;

// ─── 개발 지식(디자인 패턴·아키텍처·원칙 등 정리 노트) ─────────────────
export const KNOWLEDGE = {
  'design-patterns': {
    label: '디자인 패턴',
    desc: 'GoF 등 객체지향 설계 패턴',
    groups: { creational: '생성', structural: '구조', behavioral: '행위' },
  },
  architecture: {
    label: '아키텍처 패턴',
    desc: '레이어드, 헥사고날, 마이크로서비스, 이벤트 드리븐, CQRS 등',
    groups: { 'app-structure': '애플리케이션 구조', 'system-style': '시스템 스타일', integration: '통합·통신' },
  },
  principles: {
    label: '설계 원칙',
    desc: 'SOLID, DRY, KISS, YAGNI, 결합도·응집도',
    groups: {},
  },
  'distributed-systems': {
    label: '분산 시스템',
    desc: 'CAP, 합의, 멱등성, 사가, 일관성 모델',
    groups: {},
  },
  'data-modeling': {
    label: '데이터·DB 설계',
    desc: '정규화, 인덱스, 트랜잭션 격리, 샤딩',
    groups: {},
  },
  'testing-practice': {
    label: '테스트 전략',
    desc: '테스트 피라미드, TDD, 테스트 더블, 계약 테스트',
    groups: {},
  },
  security: {
    label: '보안',
    desc: 'OWASP Top 10, 인증 설계, 비밀 관리',
    groups: {},
  },
  performance: {
    label: '성능·확장성',
    desc: '캐싱 전략, 부하 분산, 프로파일링',
    groups: {},
  },
  'engineering-practice': {
    label: '협업·운영 관행',
    desc: '브랜치 전략, 코드 리뷰, CI/CD, 장애 대응',
    groups: {},
  },
  'ai-patterns': {
    label: 'AI 엔지니어링 패턴',
    desc: 'RAG 패턴, 에이전트 패턴, 프롬프트·평가 설계',
    groups: { rag: 'RAG', agent: '에이전트', prompting: '프롬프트', evaluation: '평가' },
  },
} as const satisfies Record<string, { label: string; desc: string; groups: Record<string, string> }>;

export type KnowledgeCategory = keyof typeof KNOWLEDGE;

export const LEVELS = { beginner: '입문', intermediate: '중급', advanced: '고급' } as const;

// ─── 오픈 웨이트 모델 ─────────────────────────────────────────────────
// group(대분류) → type(주 분류). 모델 하나는 type 을 정확히 하나 가진다.
// 분류 규칙은 .claude/skills/classify-model/SKILL.md 참고.
export const MODEL_GROUPS = {
  language: {
    label: '언어 모델',
    desc: '텍스트를 입력받아 텍스트를 생성',
    types: {
      'text-llm': { label: '텍스트 LLM', desc: '범용 대화·지시 수행. 하이브리드 thinking 모델도 여기' },
      'reasoning-llm': { label: '추론 LLM', desc: '항상 긴 사고 과정을 거치는 추론 특화 모델' },
      'code-llm': { label: '코드 LLM', desc: '코드 생성·완성·에이전트 코딩에 특화' },
    },
  },
  multimodal: {
    label: '멀티모달 이해',
    desc: '이미지·오디오·영상을 이해해 텍스트로 답함',
    types: {
      vlm: { label: 'VLM', desc: '이미지(+영상)+텍스트 → 텍스트' },
      omni: { label: '옴니', desc: '텍스트·이미지·오디오·영상 입력, 텍스트/음성 출력' },
      'ocr-document': { label: 'OCR·문서 이해', desc: '문서 파싱, 표·수식 인식 특화' },
      'gui-agent': { label: 'GUI 에이전트', desc: '화면을 보고 클릭·입력 액션을 출력' },
    },
  },
  decision: {
    label: '판단형',
    desc: '생성보다 판정·분류·점수화가 목적',
    types: {
      guard: { label: '가드레일', desc: '프롬프트/응답의 안전성 분류' },
      classifier: { label: '분류·라우팅', desc: '의도 분류, 모델 라우팅, NLI 등' },
      reward: { label: '리워드·저지', desc: '응답 품질 점수화, LLM-as-judge, PRM' },
    },
  },
  retrieval: {
    label: '검색',
    desc: 'RAG·검색 파이프라인 구성 요소',
    types: {
      embedding: { label: '임베딩', desc: '텍스트/이미지를 벡터로' },
      reranker: { label: '리랭커', desc: '질의-문서 쌍 관련도 재정렬' },
    },
  },
  speech: {
    label: '음성',
    desc: '음성 인식과 합성',
    types: {
      asr: { label: 'ASR (STT)', desc: '음성 → 텍스트' },
      tts: { label: 'TTS', desc: '텍스트 → 음성' },
    },
  },
  generation: {
    label: '미디어 생성',
    desc: '이미지·영상·오디오를 생성',
    types: {
      'image-gen': { label: '이미지 생성', desc: '텍스트/이미지 → 이미지' },
      'video-gen': { label: '영상 생성', desc: '텍스트/이미지 → 영상' },
      'audio-gen': { label: '음악·오디오 생성', desc: '텍스트 → 음악·효과음' },
    },
  },
} as const satisfies Record<string, { label: string; desc: string; types: Record<string, Cat> }>;

export type ModelGroupId = keyof typeof MODEL_GROUPS;
export const MODEL_TYPE_TO_GROUP = Object.fromEntries(
  Object.entries(MODEL_GROUPS).flatMap(([g, v]) => Object.keys(v.types).map((t) => [t, g])),
) as Record<string, ModelGroupId>;
export const MODEL_TYPES = Object.keys(MODEL_TYPE_TO_GROUP) as [string, ...string[]];
export const modelTypeLabel = (t: string) =>
  (MODEL_GROUPS[MODEL_TYPE_TO_GROUP[t]].types as Record<string, Cat>)[t].label;

export const THINKING = { none: '없음', hybrid: '하이브리드(온/오프)', native: '항상 사고' } as const;
export const ARCHITECTURES = { dense: 'Dense', moe: 'MoE', hybrid: '하이브리드(SSM 등)', diffusion: '디퓨전', other: '기타' } as const;
export const COMMERCIAL = { allowed: '상업 이용 가능', restricted: '조건부 허용', 'not-allowed': '비상업' } as const;
export const KOREAN = { good: '좋음', basic: '보통', none: '미지원', unknown: '미확인' } as const;
export const MODALITIES = ['text', 'image', 'audio', 'video', 'vector'] as const; // vector: 임베딩 출력

/** 파라미터 규모 구간 (총 파라미터, 단위 B) */
export function sizeBucket(paramsB?: number) {
  if (paramsB === undefined) return undefined;
  if (paramsB < 3) return '초소형 (<3B)';
  if (paramsB < 15) return '소형 (3–15B)';
  if (paramsB < 70) return '중형 (15–70B)';
  return '대형 (70B+)';
}
