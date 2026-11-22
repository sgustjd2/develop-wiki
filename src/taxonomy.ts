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
      'design-tools': { label: '디자인·프로토타이핑', desc: 'Figma 같은 UI 디자인·프로토타이핑·핸드오프 도구' },
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
  mobile: {
    label: '모바일',
    desc: 'iOS·Android 네이티브와 크로스플랫폼 앱 개발',
    categories: {
      ios: { label: 'iOS 네이티브', desc: 'Swift, SwiftUI, UIKit, Xcode 생태계' },
      android: { label: 'Android 네이티브', desc: 'Kotlin, Jetpack Compose, Android Studio 생태계' },
      'cross-platform': { label: '크로스플랫폼', desc: 'Flutter, React Native, Kotlin Multiplatform 등' },
      'mobile-backend': { label: '모바일 백엔드·서비스', desc: '푸시, 인증, 원격 설정, 분석, 크래시 리포트' },
      'mobile-testing': { label: '빌드·테스트·배포', desc: 'UI 테스트, CI 빌드, 스토어 배포 자동화' },
      learning: { label: '레퍼런스·학습', desc: '공식 가이드, 휴먼 인터페이스 가이드라인' },
    },
  },
  'data-ml': {
    label: '데이터·ML',
    desc: '데이터 엔지니어링·분석·머신러닝 기반 도구',
    categories: {
      processing: { label: '데이터 처리', desc: '배치·분산 처리, 데이터프레임 (Spark, Polars, pandas)' },
      orchestration: { label: '워크플로 오케스트레이션', desc: '파이프라인 스케줄링 (Airflow, Dagster, Prefect)' },
      'warehouse-lake': { label: '웨어하우스·레이크하우스', desc: '분석용 저장소와 테이블 포맷 (BigQuery, Iceberg, Delta)' },
      transform: { label: '변환·품질', desc: 'SQL 변환, 데이터 품질·계약 (dbt, Great Expectations)' },
      'analytics-bi': { label: '분석·BI·시각화', desc: '대시보드, 노트북, 시각화 라이브러리' },
      ml: { label: '머신러닝 프레임워크', desc: 'PyTorch, JAX, scikit-learn, 실험 관리' },
      learning: { label: '레퍼런스·학습', desc: '문서, 강의, 데이터셋' },
    },
  },
  cloud: {
    label: '클라우드',
    desc: '클라우드 플랫폼, PaaS·엣지, BaaS, 서버리스',
    categories: {
      hyperscaler: { label: '퍼블릭 클라우드', desc: 'AWS, Google Cloud, Azure 핵심 서비스' },
      'paas-edge': { label: 'PaaS·엣지', desc: 'Vercel, Cloudflare, Netlify, Fly.io 등 배포 플랫폼' },
      baas: { label: 'BaaS', desc: 'Supabase, Firebase, Appwrite 등 백엔드 서비스' },
      serverless: { label: '서버리스·컨테이너 실행', desc: 'Lambda, Cloud Run, 서버리스 프레임워크' },
      learning: { label: '레퍼런스·학습', desc: '아키텍처 센터, 자격증 자료' },
    },
  },
  devtools: {
    label: '개발 도구',
    desc: '버전 관리, 에디터, 터미널, 개발 환경 같은 일상 도구',
    categories: {
      'version-control': { label: '버전 관리·협업', desc: 'Git, GitHub, GitLab, 코드 리뷰 도구' },
      'editor-ide': { label: '에디터·IDE', desc: 'VS Code, JetBrains, Neovim, Zed' },
      terminal: { label: '터미널·셸', desc: '셸, 터미널 에뮬레이터, CLI 유틸리티' },
      environment: { label: '개발 환경·패키지', desc: '버전 관리자, 컨테이너 개발 환경, 패키지 매니저' },
      'api-client': { label: 'API 클라이언트·디버깅', desc: 'HTTP 클라이언트, 프록시, 디버거' },
      docs: { label: '문서화', desc: '정적 문서 사이트, 다이어그램, API 문서 생성' },
    },
  },
  oss: {
    label: '오픈소스·GitHub',
    desc: 'GitHub 에서 많이 쓰이는 에이전트 스킬, MCP 서버, 큐레이션 저장소, 셀프 호스팅 오픈소스',
    categories: {
      'agent-skills': { label: '에이전트 스킬', desc: 'Claude Code·Codex 등 코딩 에이전트용 스킬(SKILL.md)·플러그인·서브에이전트 모음' },
      'mcp-servers': { label: 'MCP 서버', desc: '실무에서 많이 연결하는 MCP 서버 (SDK·도구는 AI › MCP·툴 연동)' },
      'awesome-lists': { label: 'Awesome 리스트', desc: '주제별로 엄선된 링크 모음 저장소' },
      'learning-repos': { label: '학습용 저장소', desc: '무료 책, 직접 만들어 보기, 면접·로드맵 등 학습 저장소' },
      'self-hosted': { label: '셀프 호스팅', desc: '개발자가 직접 띄워 쓰는 오픈소스 서비스 (자동화, 모니터링, 협업 등)' },
    },
  },
  robotics: {
    label: '로보틱스',
    desc: 'ROS 2, 내비게이션·모션 플래닝, 시뮬레이션, SLAM·인식, 로봇 학습, 임베디드까지 로봇 개발 스택',
    categories: {
      ros: { label: 'ROS·미들웨어', desc: 'ROS 2 코어, DDS 미들웨어, 빌드·브리지 도구' },
      'navigation-planning': { label: '내비게이션·모션 플래닝', desc: 'Nav2, MoveIt, OMPL 등 경로·동작 계획' },
      simulation: { label: '시뮬레이션', desc: 'Gazebo, Isaac Sim, MuJoCo, Webots 같은 물리 시뮬레이터' },
      perception: { label: '인식·SLAM', desc: '컴퓨터 비전, 포인트 클라우드, SLAM·위치 추정' },
      'robot-learning': { label: '로봇 학습', desc: '강화학습·모방학습 프레임워크와 로봇 데이터 도구' },
      embedded: { label: '임베디드·마이크로컨트롤러', desc: 'micro-ROS, RTOS, 펌웨어 빌드·플래시 도구' },
      learning: { label: '레퍼런스·학습', desc: '공식 튜토리얼, 강의, 교재' },
    },
  },
  xr: {
    label: 'XR (VR·AR)',
    desc: '가상·증강·혼합현실 개발: 엔진, OpenXR·WebXR 표준, AR 프레임워크, 헤드셋 SDK, 3D 콘텐츠 도구',
    categories: {
      engines: { label: '엔진·3D 런타임', desc: 'Unity, Unreal, Godot, Babylon.js 등 XR 앱을 만드는 엔진' },
      'standards-runtimes': { label: '표준·런타임', desc: 'OpenXR, WebXR, Monado 같은 개방 표준과 런타임' },
      'ar-sdk': { label: 'AR 프레임워크', desc: 'ARKit, ARCore, RealityKit, Vuforia 등 모바일·스페이셜 AR' },
      'vr-platform': { label: 'VR·MR 플랫폼 SDK', desc: 'Meta Quest, Apple Vision Pro, Android XR, SteamVR, PICO 개발' },
      'content-tools': { label: '3D 콘텐츠·포맷', desc: 'Blender, glTF, OpenUSD 등 3D 제작·교환 도구' },
      learning: { label: '레퍼런스·학습', desc: '공식 가이드, 디자인 가이드라인, 강의' },
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
  'source-available': '소스 공개(비OSI)', // SSPL·BSL 등 소스는 공개지만 OSI 오픈소스가 아님
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
    groups: { rag: 'RAG', agent: '에이전트', prompting: '프롬프트', evaluation: '평가', safety: '안전·가드레일' },
  },
  algorithms: {
    label: '자료구조·알고리즘',
    desc: '복잡도, 핵심 자료구조, 정렬·탐색·그래프·DP',
    groups: { 'data-structure': '자료구조', algorithm: '알고리즘', complexity: '복잡도·기법' },
  },
  'cs-fundamentals': {
    label: 'CS 기초',
    desc: '운영체제, 네트워크, 웹 동작 원리, 동시성, 컴퓨터 구조',
    groups: { os: '운영체제', network: '네트워크', web: '웹 동작 원리', concurrency: '동시성', architecture: '컴퓨터 구조', compiler: '언어·컴파일러' },
  },
  robotics: {
    label: '로보틱스 기초',
    desc: '좌표계·기구학, 제어, 경로 계획, 상태 추정, 로봇 소프트웨어 구조',
    groups: { kinematics: '좌표계·기구학', control: '제어', planning: '경로·동작 계획', estimation: '상태 추정·SLAM', software: '로봇 소프트웨어' },
  },
  'graphics-xr': {
    label: '3D 그래픽스·XR 기초',
    desc: '렌더링 파이프라인, 좌표 변환, 셰이더, 공간 추적, XR 지연·성능',
    groups: { rendering: '렌더링', math: '3D 수학', tracking: '공간 추적', xr: 'XR 설계' },
  },
  'mobile-dev': {
    label: '모바일 앱 설계',
    desc: '앱 아키텍처, 상태 관리, 생명주기, 오프라인·동기화, 푸시, 스토어 배포',
    groups: { architecture: '아키텍처', platform: '플랫폼 동작', delivery: '배포·운영' },
  },
  'ui-ux': {
    label: 'UI·UX 디자인',
    desc: 'UX 원칙·리서치, 정보 구조·인터랙션, 비주얼, 디자인 시스템, 접근성, UI 패턴, UX 라이팅',
    groups: {
      principles: 'UX 원칙·심리',
      research: '리서치·검증',
      interaction: '정보 구조·인터랙션',
      visual: '비주얼 디자인',
      'design-system': '디자인 시스템',
      accessibility: '접근성',
      patterns: 'UI 패턴',
      writing: 'UX 라이팅',
    },
  },
  'data-analytics': {
    label: '데이터 분석·빅데이터',
    desc: '빅데이터 이해, 분석 기획·방법론, 통계 분석, 전처리·탐색, 빅데이터 기술, 시각화, 품질·개인정보 (ADsP·ADP·빅데이터분석기사 범위 포함)',
    groups: {
      understanding: '데이터·빅데이터 이해',
      planning: '분석 기획·방법론',
      statistics: '통계 분석',
      preprocessing: '전처리·탐색',
      platform: '빅데이터 기술',
      visualization: '시각화·활용',
      governance: '품질·개인정보',
    },
  },
  'machine-learning': {
    label: '머신러닝·딥러닝 기초',
    desc: '학습 방식, 지도·비지도 모델, 앙상블, 모델 평가·개선, 딥러닝, 텍스트·네트워크 분석, 모델 운영',
    groups: {
      paradigm: '학습 방식·개념',
      supervised: '지도학습 모델',
      unsupervised: '비지도·패턴 발견',
      ensemble: '앙상블',
      evaluation: '평가·개선',
      'deep-learning': '딥러닝',
      unstructured: '텍스트·네트워크 분석',
      operations: '해석·운영',
    },
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
      'text-llm': { label: '텍스트 LLM', desc: '범용 대화·지시 수행·에이전트. 항상/하이브리드 사고 범용 모델, 이미지·오디오 입력을 받는 범용 모델도 여기' },
      'reasoning-llm': { label: '추론 LLM', desc: '추론 특화로 공개된 항상 사고 모델 (R1, *-Thinking 변형 등)' },
      'code-llm': { label: '코드 LLM', desc: '코드 생성·완성·에이전트 코딩에 특화' },
    },
  },
  multimodal: {
    label: '멀티모달 이해',
    desc: '이미지·오디오·영상을 이해해 텍스트로 답함',
    types: {
      vlm: { label: 'VLM', desc: '시각 이해가 주 목적인 이미지(+영상)+텍스트 → 텍스트 모델' },
      omni: { label: '옴니', desc: '음성 상호작용 중심. 텍스트·이미지·오디오·영상 입력, 텍스트/음성 출력' },
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
  robotics: {
    label: '로보틱스',
    desc: '카메라 영상과 언어 지시를 받아 로봇 행동을 출력',
    types: {
      vla: { label: 'VLA (비전-언어-행동)', desc: '이미지·언어 입력 → 로봇 액션 출력 정책 모델' },
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
export const MODALITIES = ['text', 'image', 'audio', 'video', 'vector', 'action'] as const; // vector: 임베딩 출력, action: 로봇 제어 출력

/** 파라미터 규모 구간 (총 파라미터, 단위 B) */
export function sizeBucket(paramsB?: number) {
  if (paramsB === undefined) return undefined;
  if (paramsB < 3) return '초소형 (<3B)';
  if (paramsB < 15) return '소형 (3–15B)';
  if (paramsB < 70) return '중형 (15–70B)';
  return '대형 (70B+)';
}
