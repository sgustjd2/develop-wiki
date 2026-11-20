---
name: Spring AI
url: https://spring.io/projects/spring-ai
docs: https://docs.spring.io/spring-ai/reference/
repo: https://github.com/spring-projects/spring-ai
stars: 9664
domain: ai
category: agent-framework
description: Spring Boot 앱에서 여러 모델 공급자·벡터 저장소를 같은 추상화(ChatClient, Advisor, VectorStore)로 쓰게 해 주는 Spring 공식 AI 프레임워크. Java 백엔드에 LLM·RAG·도구 호출을 넣을 때 쓴다.
pricing: oss
tags: [java, spring-boot, chat-client, rag, tool-calling, mcp]
languages: [java]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
Spring AI 는 Spring 팀이 만든 AI 엔지니어링용 애플리케이션 프레임워크다. OpenAI·Anthropic·Gemini·Bedrock·Ollama 등 모델과 pgvector·Redis·Milvus 등 벡터 저장소를 **이식 가능한 인터페이스**로 감싸고, Spring Boot 자동 설정·스타터로 의존성만 추가하면 빈으로 주입받아 쓰게 한다. 핵심 진입점은 fluent API 인 `ChatClient` 이고, 대화 메모리·RAG·로깅 같은 횡단 관심사는 `Advisor` 체인으로 끼워 넣는다.
2026-11-18 기준 최신 안정 버전은 **2.0.2**(2026-10-23, Apache-2.0)이고 2.1.0 은 RC2 단계다. 2.0.x 는 **Spring Boot 4.0.x·4.1.x** 를 지원한다. 1.x 에서 올라오려면 Spring Boot 4 로의 마이그레이션도 함께 해야 한다.
Java 진영의 다른 선택지인 [LangChain4j](/develop-wiki/ai/agent-framework/langchain4j/)가 독립 라이브러리라면, Spring AI 는 Spring 생태계(설정, 관측성, 테스트) 통합이 강점이다.

## 설치
Maven 에서 BOM 을 가져오고 공급자 스타터를 추가한다.

```xml
<dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>org.springframework.ai</groupId>
      <artifactId>spring-ai-bom</artifactId>
      <version>2.0.2</version>
      <type>pom</type>
      <scope>import</scope>
    </dependency>
  </dependencies>
</dependencyManagement>
<!-- dependencies 에 spring-ai-starter-model-openai (또는 -anthropic, -ollama 등) 추가 -->
```
```properties
# application.properties — 키는 환경 변수에서 읽는다
spring.ai.openai.api-key=${OPENAI_API_KEY}
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `ChatClient` | `prompt().user(...).call().content()` 형태의 fluent API. 자동 설정된 `ChatClient.Builder` 를 주입받아 생성 |
| `ChatModel` | 공급자별 저수준 모델 인터페이스. 스타터 `spring-ai-starter-model-<공급자>` 가 등록 |
| 구조화 출력 | `.call().entity(MyRecord.class)` 로 응답을 Java 레코드/클래스로 변환 |
| 도구 호출 | `@Tool` 메서드를 가진 POJO 를 `.tools(...)`/`defaultTools(...)` 로 전달 |
| Advisor | 요청·응답을 가로채는 체인. `MessageChatMemoryAdvisor`, `QuestionAnswerAdvisor`, `SimpleLoggerAdvisor` 등 |
| `ChatMemory` | 대화 기록 저장소. `ChatMemory.CONVERSATION_ID` 파라미터로 대화를 구분 |
| `VectorStore` | 벡터 저장소 추상화. 문서 적재·유사도 검색 |
| MCP | MCP 클라이언트·서버 스타터로 외부 도구 연결 또는 Spring 앱을 MCP 서버로 노출 |
| 관측성 | Micrometer 기반 메트릭·트레이스 |

## 기본 사용법
REST 엔드포인트에서 구조화 출력 받기:

```java
@RestController
class MovieController {
    record Recommendation(String title, int year, String reason) {}

    private final ChatClient chatClient;

    MovieController(ChatClient.Builder builder) {
        this.chatClient = builder.defaultSystem("한국어로 답한다.").build();
    }

    @GetMapping("/recommend")
    Recommendation recommend(@RequestParam String genre) {
        return chatClient.prompt()
                .user(u -> u.text("{genre} 영화 한 편을 추천해줘").param("genre", genre))
                .call()
                .entity(Recommendation.class);
    }
}
```

## 자주 쓰는 패턴
- **도구 호출**: `class DateTimeTools { @Tool(description = "현재 날짜") String today() { ... } }` 를 만들고 `.tools(new DateTimeTools())` 로 넘긴다. 도구 실행 어드바이저는 자동 등록된다.
- **대화 메모리**: `.advisors(a -> a.advisors(MessageChatMemoryAdvisor.builder(chatMemory).build()).param(ChatMemory.CONVERSATION_ID, id))`. 메모리 어드바이저를 쓰면 대화 id 가 필수다.
- **RAG**: `QuestionAnswerAdvisor.builder(vectorStore).build()` 를 어드바이저로 추가해 검색 문서를 프롬프트에 붙인다. 벡터 저장소는 [pgvector](/develop-wiki/ai/vector-db/pgvector/) 등 스타터로 설정.
- **스트리밍**: `.stream().content()` 로 `Flux<String>` 을 받아 SSE 로 내보낸다.
- **로컬 모델**: `spring-ai-starter-model-ollama` 로 [Ollama](/develop-wiki/ai/inference-serving/ollama/) 서버를 같은 `ChatClient` 코드로 쓴다.

## 언제 쓰나 / 피할 때
- 쓸 때: 이미 Spring Boot 로 운영하는 백엔드에 챗봇·RAG·요약·분류 기능을 넣을 때, 설정·관측성·테스트를 Spring 방식으로 통일하고 싶을 때.
- 피할 때(대안): Spring 없이 순수 Java·Quarkus 에서 쓰려면 [LangChain4j](/develop-wiki/ai/agent-framework/langchain4j/), 복잡한 멀티 에이전트 그래프가 핵심이면 Python 의 [LangGraph](/develop-wiki/ai/agent-framework/langgraph/), .NET 이면 [Microsoft Agent Framework](/develop-wiki/ai/agent-framework/microsoft-agent-framework/).

## 공식 문서
- [레퍼런스](https://docs.spring.io/spring-ai/reference/) · [시작하기](https://docs.spring.io/spring-ai/reference/getting-started.html) · [ChatClient](https://docs.spring.io/spring-ai/reference/api/chatclient.html)
- [도구 호출](https://docs.spring.io/spring-ai/reference/api/tools.html) · [Advisors](https://docs.spring.io/spring-ai/reference/api/advisors.html) · [릴리스](https://github.com/spring-projects/spring-ai/releases)
