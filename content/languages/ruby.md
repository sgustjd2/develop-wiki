---
name: Ruby
summary: 개발자 생산성과 읽기 쉬운 코드를 목표로 한 동적 타입 객체지향 언어. Ruby on Rails로 웹 개발에 널리 쓰이며, 블록과 메타프로그래밍이 특징이다.
paradigms: [객체지향, 함수형, 명령형]
typing: dynamic
execution: interpreted
firstAppeared: 1995
officialSite: https://www.ruby-lang.org/
docs: https://docs.ruby-lang.org/en/
useCases: [웹 애플리케이션(Rails), 스크립트·자동화, DSL·설정 도구, 프로토타이핑]
sources:
  - https://www.ruby-lang.org/en/downloads/
  - https://www.ruby-lang.org/en/news/2025/12/25/ruby-4-0-0-released/
  - https://www.ruby-lang.org/en/documentation/installation/
  - https://bundler.io/
updatedAt: 2026-11-18
---

## 개요
Ruby는 마츠모토 유키히로(Matz)가 1995년에 공개한 언어로, "프로그래머가 즐겁게 쓰는 언어"를 설계 목표로 삼는다. 모든 값이 객체이고, 블록·열린 클래스·메타프로그래밍으로 짧고 표현력 있는 DSL을 만들기 쉽다. 2025년 12월 25일 **Ruby 4.0** 이 나왔고, 이 글 작성 시점 안정 버전은 4.0.9와 3.4.12다.

## 언어의 특징
- **타입 시스템:** 동적·강타입, 덕 타이핑. 선택적으로 RBS(표준 타입 시그니처 형식)와 Steep, 또는 Sorbet으로 정적 검사를 더할 수 있다.
- **실행:** 기본 구현 CRuby(MRI)는 소스를 YARV 바이트코드로 바꿔 인터프리트한다. JIT으로 YJIT(`--yjit`)이 있고, Ruby 4.0에서 후속 JIT인 ZJIT(`--zjit`, 아직 실험적)이 추가됐다.
- **메모리 관리:** 세대별·증분 가비지 컬렉터.
- **동시성:** GVL(전역 VM 락) 때문에 한 프로세스에서 Ruby 코드는 한 스레드씩 실행된다. I/O 대기 중에는 스레드가 전환된다. 진짜 병렬 실행은 `Ractor`(Ruby 4.0에서 `Ractor::Port` 등으로 API 정리) 또는 멀티 프로세스(Puma 워커 등)로 한다. 경량 동시성은 `Fiber` + Fiber Scheduler.
- **Ruby 4.0 주요 변화:** 정의를 격리하는 실험 기능 Ruby Box(`RUBY_BOX=1`), ZJIT, `Set`·`Pathname` 의 코어 클래스 편입.

## 개발 환경 시작하기
시스템 Ruby 대신 버전 관리자로 설치하는 것이 일반적이다. 공식 다운로드 페이지는 rbenv·RVM(macOS/Linux), RubyInstaller(Windows)를 안내한다.

```bash
# macOS/Linux — rbenv (+ ruby-build)
brew install rbenv ruby-build     # Linux는 배포판 패키지 또는 rbenv 저장소 안내 참고
rbenv install 4.0.9
rbenv global 4.0.9
ruby -v

# Windows: rubyinstaller.org 의 RubyInstaller 사용
```

패키지는 **gem**(저장소 [RubyGems.org](https://rubygems.org/)), 프로젝트 의존성 관리는 Ruby에 포함된 **Bundler** 로 한다.
```bash
mkdir my_app && cd my_app
bundle init                 # Gemfile 생성
bundle add httpx            # Gemfile 에 추가 + 설치
bundle exec ruby main.rb    # Gemfile.lock 기준 실행
bundle gem my_lib           # gem(라이브러리) 프로젝트 골격
```

## 문법 한눈에 보기
```ruby
class InvalidAge < StandardError; end

User = Struct.new(:name, :age) do
  def adult? = age.to_i >= 19          # 한 줄 메서드 정의
end

def parse_age(text)
  Integer(text)
rescue ArgumentError
  raise InvalidAge, "invalid age: #{text}"
end

users = [User.new("kim", 30), User.new("lee", nil)]
users << User.new("park", parse_age("41"))

users.select(&:adult?).each { |u| puts "#{u.name} #{u.age}" }
puts users.map { _1.name.upcase }.join(", ")   # 번호 블록 매개변수

begin
  parse_age("abc")
rescue InvalidAge => e
  puts e.message
end

response = { status: "ok", data: [1, 2] }
case response                               # 패턴 매칭
in { status: "ok", data: [first, *] }
  puts "first=#{first}"
end
```

## 생태계
| 분야 | 대표 도구 |
| --- | --- |
| 웹 프레임워크 | Ruby on Rails, Sinatra, Hanami |
| 백그라운드 작업 | Sidekiq, Solid Queue |
| 앱 서버 | Puma |
| 테스트 | RSpec, Minitest |
| 린트·타입 | RuboCop, Standard, RBS/Steep, Sorbet |
| 도구 | Rake, Bundler, IRB |

이 사이트에는 아직 Ruby 전용 항목이 없다.

## 언제 쓰나 / 약점
- **쓸 때:** 스타트업 웹 서비스처럼 기능을 빠르게 만들고 바꿔야 할 때(Rails의 관례 기반 개발). 스크립트·사내 도구, 내부 DSL.
- **약점:** CPU 바운드 작업과 멀티코어 활용이 GVL 때문에 제약된다. 메타프로그래밍이 많은 코드는 추적·정적 분석이 어렵다. Rails 밖의 생태계는 상대적으로 작다.
- **대안:** 같은 성격의 웹 개발은 [PHP](/develop-wiki/languages/php/)(Laravel), [Python](/develop-wiki/languages/python/)(Django), 동시성이 중요하면 Ruby 문법에 영향을 받은 [Elixir](/develop-wiki/languages/elixir/)(Phoenix).

## 공식 문서·학습 자료
- [Ruby 문서](https://www.ruby-lang.org/en/documentation/) · [API 레퍼런스](https://docs.ruby-lang.org/en/)
- [설치 안내](https://www.ruby-lang.org/en/documentation/installation/) · [다운로드·버전](https://www.ruby-lang.org/en/downloads/)
- [Ruby 4.0.0 릴리스 노트](https://www.ruby-lang.org/en/news/2025/12/25/ruby-4-0-0-released/)
- [Bundler](https://bundler.io/) · [Ruby on Rails Guides](https://guides.rubyonrails.org/)
