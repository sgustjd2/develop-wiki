# dev.hub

프론트엔드·백엔드·AI 기술, 오픈 웨이트 모델, 개발 지식을 분류해 정리하는 개발자 레퍼런스 허브.
→ https://sgustjd2.github.io/develop-wiki/

Claude Code 에이전트 하네스(`.claude/`)로 조사·분류·검증하고, Astro 로 빌드해 GitHub Pages 에 배포합니다.
구조와 규칙은 [CLAUDE.md](CLAUDE.md), 분류 체계는 [src/taxonomy.ts](src/taxonomy.ts).

```bash
npm install
npm run dev
```

## 업데이트하기 (Claude Code)

```
/survey-category models/vlm        # 카테고리 하나 조사·반영
/survey-category backend/database
/refresh-hub                        # 오래된 카테고리부터 골라 병렬 업데이트
/add-model Qwen/Qwen3-VL-8B-Instruct
/write-knowledge 옵저버 패턴
```
