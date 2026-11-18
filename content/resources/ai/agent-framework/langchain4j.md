---
name: LangChain4j
url: https://docs.langchain4j.dev
repo: https://github.com/langchain4j/langchain4j
domain: ai
category: agent-framework
description: LLM 공급자·벡터 저장소를 통합 API로 감싸고 도구 호출·에이전트·RAG를 지원하는 Java 라이브러리. Spring Boot·Quarkus 같은 JVM 앱에 LLM 기능을 넣을 때 쓴다.
pricing: oss
tags: [agent, llm, jvm, rag]
languages: [java]
docs: https://docs.langchain4j.dev/get-started
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
LangChain4j 는 Java 애플리케이션에 LLM 기능을 넣기 위한 라이브러리다. OpenAI·Anthropic·Gemini·Ollama 등 여러 모델 공급자와 벡터 저장소를 같은 인터페이스로 감싸고, 그 위에서 도구 호출·대화 메모리·RAG·에이전트를 제공한다. 이름은 LangChain 에서 따왔지만 별도로 개발되는 Java 프로젝트다.
가장 특징적인 것은 **AI Services** 다. 원하는 메서드를 가진 Java 인터페이스를 선언하면 LangChain4j 가 프롬프트 조립·도구 호출·응답 변환을 맡는 구현체를 만들어 준다. [Spring Boot](/develop-wiki/backend/web-framework/spring-boot/)·Quarkus 통합도 있다.
2026-11 기준 1.23.0 (최소 JDK 17). 일부 모듈은 아직 `1.23.0-beta33` 처럼 beta 버전으로 배포된다.

## 설치
Maven — BOM 으로 버전을 맞추고 필요한 모듈만 추가한다.

```xml
<dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>dev.langchain4j</groupId>
      <artifactId>langchain4j-bom</artifactId>
      <version>1.23.0</version>
      <type>pom</type>
      <scope>import</scope>
    </dependency>
  </dependencies>
</dependencyManagement>
<dependencies>
  <dependency><groupId>dev.langchain4j</groupId><artifactId>langchain4j</artifactId></dependency>
  <dependency><groupId>dev.langchain4j</groupId><artifactId>langchain4j-open-ai</artifactId></dependency>
</dependencies>
```

Gradle: `implementation 'dev.langchain4j:langchain4j:1.23.0'`, `implementation 'dev.langchain4j:langchain4j-open-ai:1.23.0'`.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `ChatModel` | 공급자별 채팅 모델 (`OpenAiChatModel` 등). `model.chat("...")` 로 바로 호출 |
| AI Services | 인터페이스 + `AiServices.create/builder` 로 고수준 클라이언트 자동 생성 |
| `@SystemMessage` / `@UserMessage` | 인터페이스 메서드에 프롬프트 템플릿 지정 (`{{변수}}`) |
| `@Tool` | 일반 Java 메서드를 모델이 호출할 수 있는 도구로 노출 |
| `ChatMemory` | 대화 기록 보관. `MessageWindowChatMemory.withMaxMessages(n)` |
| `@MemoryId` | 사용자·대화별로 메모리를 분리하는 파라미터 |
| RAG | 문서 로더·분할기·임베딩 모델·`EmbeddingStore` 로 검색 증강 |
| Agentic 모듈 | `langchain4j-agentic`: `@Agent`, `AgenticServices` 의 sequence·loop·parallel·supervisor (실험적) |

## 기본 사용법
도구 하나를 가진 AI Service (`OPENAI_API_KEY` 환경 변수 필요):

```java
import dev.langchain4j.agent.tool.Tool;
import dev.langchain4j.memory.chat.MessageWindowChatMemory;
import dev.langchain4j.model.openai.OpenAiChatModel;
import dev.langchain4j.service.AiServices;
import dev.langchain4j.service.SystemMessage;

public class App {
    static class Calculator {
        @Tool("두 정수를 더한다")
        int add(int a, int b) { return a + b; }
    }

    interface Assistant {
        @SystemMessage("계산 질문에는 도구를 써서 한국어로 답한다.")
        String chat(String message);
    }

    public static void main(String[] args) {
        OpenAiChatModel model = OpenAiChatModel.builder()
            .apiKey(System.getenv("OPENAI_API_KEY"))
            .modelName("gpt-4o-mini")
            .build();
        Assistant assistant = AiServices.builder(Assistant.class)
            .chatModel(model)
            .tools(new Calculator())
            .chatMemory(MessageWindowChatMemory.withMaxMessages(10))
            .build();
        System.out.println(assistant.chat("1234 더하기 5678은?"));
    }
}
```

## 자주 쓰는 패턴
- **간단 호출**: 도구·메모리가 필요 없으면 `AiServices.create(Assistant.class, model)` 한 줄로 만든다.
- **사용자별 기억**: 메서드를 `String chat(@MemoryId int userId, @UserMessage String msg)` 로 선언하고 메모리 공급자를 설정해 사용자마다 대화를 분리한다.
- **구조화 출력**: 메서드 반환 타입을 POJO·`enum`·`List<String>` 등으로 선언하면 응답을 해당 타입으로 변환한다.
- **Spring Boot**: `langchain4j-open-ai-spring-boot-starter` + `langchain4j-spring-boot-starter` 를 추가하고, `application.properties` 에 `langchain4j.open-ai.chat-model.api-key=${OPENAI_API_KEY}` 를 둔 뒤 인터페이스에 `@AiService` 를 붙여 빈으로 주입받는다.
- **로컬 모델**: Ollama 통합 모듈로 [Ollama](/develop-wiki/ai/inference-serving/ollama/) 의 오픈 웨이트 모델을 같은 AI Service 에 연결한다.
- **멀티 에이전트**: `AgenticServices.sequenceBuilder()`·`loopBuilder()`·`parallelBuilder()` 로 하위 에이전트를 조합한다. 모듈 전체가 실험 단계라 API 변경 가능성을 감안한다.

## 언제 쓰나 / 피할 때
- 쓸 때: [Java](/develop-wiki/languages/java/) 백엔드(특히 Spring Boot·Quarkus)에 챗봇·RAG·도구 호출을 넣을 때, 기존 서비스 메서드를 `@Tool` 로 그대로 모델에 노출하고 싶을 때.
- 피할 때(대안): Python 생태계가 가능하면 자료가 더 많은 [LangChain](/develop-wiki/ai/agent-framework/langchain/)·[LangGraph](/develop-wiki/ai/agent-framework/langgraph/). 상태 그래프·체크포인트 기반 장기 실행 에이전트가 핵심이면 Java 에서는 [Google ADK](/develop-wiki/ai/agent-framework/google-adk/)(Java SDK)도 비교한다.

## 공식 문서
- [시작하기](https://docs.langchain4j.dev/get-started) · [AI Services](https://docs.langchain4j.dev/tutorials/ai-services) · [Spring Boot 통합](https://docs.langchain4j.dev/tutorials/spring-boot-integration) · [Agents](https://docs.langchain4j.dev/tutorials/agents) · [GitHub](https://github.com/langchain4j/langchain4j)
