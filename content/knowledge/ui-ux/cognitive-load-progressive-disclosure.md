---
title: 인지 부하와 점진적 공개
aka: [Cognitive Load, Progressive Disclosure, Staged Disclosure, Extraneous Load, 인지 부하, 단계적 공개]
category: ui-ux
group: principles
level: intermediate
summary: 화면을 쓰는 데 드는 정신적 노력 중 과업과 무관한 부분을 줄이고, 자주 쓰는 것만 먼저 보여 준 뒤 고급 옵션은 요청할 때 펼치는 설계 방식.
tags: [ux, cognitive-load, progressive-disclosure, forms, wizard, simplicity]
related: [ui-ux/nielsen-usability-heuristics, ui-ux/gestalt-principles, ui-ux/fitts-hicks-law, ui-ux/affordance-signifier-mental-model, ui-ux/information-architecture-card-sorting, ui-ux/cognitive-accessibility]
sources:
  - https://www.nngroup.com/articles/minimize-cognitive-load/
  - https://www.nngroup.com/articles/progressive-disclosure/
updatedAt: 2026-11-19
---

## 문제

- 설정 화면에 옵션 40개가 한꺼번에 펼쳐져 있으면 초보는 무엇이 중요한지 모르고, 숙련자도 매번 훑어야 한다.
- 장식용 폰트, 의미 없는 아이콘, 이전 단계에서 입력한 값을 다시 외우게 하는 흐름은 과업과 관계없는 노력을 쓰게 한다.

## 해법

### 인지 부하의 두 종류 (NN/g 정리)

- **본질적 부하(intrinsic)**: 새 정보를 이해하고 목표를 기억하는 노력. 없앨 수 없다.
- **외재적 부하(extraneous)**: 이해에 도움이 안 되는 처리. 디자이너가 줄여야 할 대상이다.

줄이는 방법은 세 가지로 묶인다. ① 시각적 잡음 제거 ② 이미 아는 패턴(멘탈 모델) 재사용 ③ 기억·계산·결정을 시스템이 대신(기본값, 이전 입력 재표시, 그림).

### 점진적 공개

처음 화면에는 자주 쓰는 소수의 옵션만 두고, 고급·드문 기능은 2차 화면이나 펼침 영역으로 미룬다. NN/g 는 성공 조건을 두 가지로 든다.

1. **나누는 기준이 맞아야 한다.** 자주 필요한 것은 모두 첫 화면에 있어야 한다. 기준은 과업 분석·현장 조사·사용 통계로 정하고 테스트로 확인한다.
2. **다음 단계로 가는 길이 분명해야 한다.** "고급 설정" 같은 진입점을 눈에 띄게, 안에 무엇이 있는지 예측되게 이름 붙인다.

```tsx
function ExportDialog() {
  const [advanced, setAdvanced] = useState(false);
  return (
    <form>
      <FormatSelect defaultValue="csv" />            {/* 대부분 이것만 바꿈 */}
      <button type="button" aria-expanded={advanced}
              onClick={() => setAdvanced(v => !v)}>
        고급 옵션 (인코딩·구분자·날짜 형식)
      </button>
      {advanced && <AdvancedExportOptions />}
      <button type="submit">내보내기</button>
    </form>
  );
}
```

### 단계적 공개(staged disclosure)와 구분

마법사(wizard)처럼 모든 사용자가 순서대로 모든 단계를 지나는 방식이다. 점진적 공개는 대부분 첫 화면에서 끝난다. 단계끼리 서로 의존해 앞뒤로 오가야 하면 마법사는 잘 맞지 않는다.

## 언제 쓰나

- 기능이 많은 도구의 설정, 내보내기·필터·검색 옵션.
- 처음 쓰는 사람과 숙련자가 함께 쓰는 화면.
- 폼이 길 때: 의미 단위로 묶고(게슈탈트), 이전 입력을 다시 보여 주고, 기본값을 채운다.

## 체크리스트

- [ ] 첫 화면 옵션은 사용 데이터나 조사로 "자주 쓴다"가 확인된 것이다
- [ ] 펼침 버튼 레이블이 숨은 내용을 예측하게 한다(`aria-expanded` 로 상태 노출)
- [ ] 숨긴 옵션이 바뀌어 있으면 접힌 상태에서도 그 사실이 보인다
- [ ] 공개 단계가 2단계를 넘지 않는다
- [ ] 다음 단계에서 이전 단계 값을 외우지 않아도 된다

## 흔한 실수·주의

- **3단계 이상 중첩.** NN/g 는 3단계 이상이면 사용자가 길을 잃는다고 경고한다. 먼저 기능을 줄이거나 재구성한다.
- **중요한 것을 숨긴다.** 숨긴 옵션이 실제로는 자주 쓰이면 클릭 수만 늘린다. 클릭이 많다는 통계가 "실수 클릭"일 수도 있으니 테스트로 확인한다.
- **"미니멀"을 위해 레이블을 지운다.** 아이콘만 남기면 외재적 부하가 오히려 늘어난다.
- **숙련자 경로를 막는다.** 단축키·URL 파라미터·기억된 펼침 상태로 고급 사용자를 배려한다.
- Sweller 의 인지 부하 이론 원 논문은 이 노트에서 직접 확인하지 않았다. 용어 구분은 NN/g 의 UX 해석을 따랐다.
