---
title: 3D 에셋 파이프라인 — glTF 와 USD
aka: [glTF, GLB, OpenUSD, USD, USDZ, Asset Pipeline, 3D Interchange Format]
category: graphics-xr
group: rendering
level: intermediate
summary: glTF 는 런타임 전달용 단순 포맷(JSON + 바이너리), USD 는 레이어 합성으로 대규모 장면을 협업 제작하는 프레임워크다. 단위·업축 규약 차이가 변환 사고의 주원인이다.
tags: [gltf, glb, usd, usdz, asset-pipeline, 3d-format, interchange, xr]
related: [graphics-xr/coordinate-systems-handedness, graphics-xr/pbr-material-model, graphics-xr/image-based-lighting, graphics-xr/openxr-webxr-architecture, graphics-xr/rasterization-pipeline, graphics-xr/plane-detection-anchors-spatial-mapping]
sources:
  - https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html
  - https://github.com/KhronosGroup/glTF/blob/main/extensions/README.md
  - https://openusd.org/release/intro.html
  - https://openusd.org/dev/api/group___usd_geom_linear_units__group.html
  - https://openusd.org/24.08/api/group___usd_geom_up_axis__group.html
updatedAt: 2026-11-19
---

## 문제

3D 에셋은 DCC 도구(Blender, Maya)에서 만들어져 엔진, 웹 뷰어, XR 기기, 시뮬레이터로 간다. 각자 좌표계·단위·재질 모델이 달라 변환 때마다 크기가 100배 틀리거나 뒤집히고, 재질이 사라진다. 또 두 요구가 충돌한다. **런타임**은 작고 빨리 읽히는 파일을 원하고, **제작**은 여러 사람이 같은 장면을 겹쳐서 비파괴로 편집하길 원한다.

## 해법: 용도에 맞는 두 포맷

### glTF 2.0 (런타임 전달)

- **구성**: JSON(`.gltf`)이 장면 그래프를 기술하고, 정점 데이터는 `.bin` 버퍼, 텍스처는 PNG/JPEG 이미지 파일이다. 모두 하나로 묶은 단일 파일이 **GLB** 다.
- **구조**: scenes → nodes(변환, 메시/카메라/스킨 참조) → meshes → primitives(속성 + 재질). 데이터는 buffer → bufferView(구간) → accessor(타입·개수)로 해석한다. 배열 인덱스로 서로 참조한다.
- **재질**: `pbrMetallicRoughness` 기본 모델([PBR](/develop-wiki/knowledge/graphics-xr/pbr-material-model/)).
- **규약**: 오른손 좌표계, **+Y 위**, 에셋 정면은 +Z, 선형 거리 단위는 **미터**, 각도는 라디안([좌표계](/develop-wiki/knowledge/graphics-xr/coordinate-systems-handedness/)).
- **확장**: `extensionsUsed`/`extensionsRequired` 로 선언한다. Khronos 레지스트리의 비준 확장에는 메시 압축(`KHR_draco_mesh_compression`, 업체 확장 `EXT_meshopt_compression`), 텍스처 압축 컨테이너(`KHR_texture_basisu`), 재질 확장(`KHR_materials_clearcoat`, `..._transmission` 등), `KHR_lights_punctual` 이 있다.

GLB 는 리틀엔디안이고 12바이트 헤더(매직 `0x46546C67` = "glTF", 버전 2, 전체 길이)와 청크들로 이뤄진다. 청크는 길이·타입·데이터 순이며 JSON(`0x4E4F534A`)이 반드시 하나, BIN(`0x004E4942`)이 0~1개이고 4바이트로 정렬되고, 알 수 없는 타입은 무시한다.

```ts
export function parseGlb(buf: ArrayBuffer) {
  const dv = new DataView(buf);
  if (dv.getUint32(0, true) !== 0x46546c67) throw new Error('not GLB');   // "glTF"
  let off = 12, json: any = null, bin: Uint8Array | null = null;
  while (off < dv.getUint32(8, true)) {
    const len = dv.getUint32(off, true), type = dv.getUint32(off + 4, true);
    const data = new Uint8Array(buf, off + 8, len);
    if (type === 0x4e4f534a) json = JSON.parse(new TextDecoder().decode(data));
    else if (type === 0x004e4942) bin = data;
    off += 8 + len;
  }
  return { json, bin };
}
```

(삼각형 한 개짜리 GLB 를 직접 조립해 이 파서로 읽어, 버전 2.0·메시 1개·BIN 36바이트를 확인했다.)

### USD (제작·합성)

OpenUSD 는 장면 기술을 **레이어**로 쪼개 쌓는 프레임워크다.

- **프림과 속성**: 계층 이름공간의 프림이 속성(시간에 따라 변하는 값)과 관계를 가진다.
- **레이어와 스테이지**: 데이터는 레이어(파일: 텍스트 `usda`, 바이너리 `usdc`, 패키지 `usdz`)에 저장되고, 스테이지가 이를 합성한 장면을 보여 준다.
- **합성 아크**: 서브레이어(강한 레이어가 약한 레이어를 덮어씀), 레퍼런스(자산 조립의 주 수단), 페이로드(로드/언로드 가능한 지연 참조), 베리언트(비파괴 변형 전환), 인헤릿·스페셜라이즈. 강도 순서가 정해져 있어 **누가 이기는지 예측 가능**하다.
- **스키마**: UsdGeom(메시·변환), UsdShade(재질), UsdLux(조명), UsdVol(볼륨) 등 표준 프림 타입.

이 덕에 한 팀이 모델링 레이어, 다른 팀이 조명 레이어를 겹쳐 쓰고 원본은 건드리지 않는다.

## 비교

| | glTF 2.0 | USD |
| --- | --- | --- |
| 목적 | 런타임 전달(웹·모바일·XR 뷰어) | 제작·협업·대규모 장면 합성 |
| 편집 모델 | 완성된 에셋(합성 없음) | 레이어·참조·베리언트로 비파괴 오버라이드 |
| 파일 | `.gltf`+`.bin`/`.glb` | `.usda`/`.usdc`/`.usdz` |
| 단위 | 항상 미터 | 스테이지 `metersPerUnit` 메타데이터(미작성 시 폴백 0.01 = cm) |
| 업축 | +Y 고정 | 스테이지 `upAxis` = "Y" 또는 "Z"(폴백 Y) |
| 복잡도 | 낮음, 구현 쉬움 | 높음, 런타임 라이브러리 크다 |

**단위·업축 차이가 변환 사고의 주범이다.** USD 의 단위 폴백이 cm 이므로 메타데이터를 안 쓴 파일은 glTF 로 갈 때 100배 어긋난다. 변환기는 `metersPerUnit` 과 `upAxis` 를 반드시 읽어 적용해야 하고, 내보낼 때 쓰는 쪽도 명시해야 한다(공식 문서도 exporter 가 항상 upAxis 를 기록하길 권한다).

## 언제 쓰나

- 웹·모바일·XR 앱에 모델을 내려보낼 때는 glTF/GLB. 다운로드 크기 때문에 메시·텍스처 압축 확장을 같이 쓴다.
- 여러 부서가 같은 큰 장면을 만들거나 시뮬레이션 환경을 조립할 때는 USD. 납품 단계에서 glTF/USDZ 로 베이킹해 내보낸다.

## 주의/비용

- 변환은 정보 손실이다. 스키마가 다르면(예: 셰이더 그래프, 합성 아크) glTF 로 평탄화하며 사라진다. 변환 후 눈으로 재질·크기를 확인하는 절차를 둔다.
- 확장 지원은 뷰어마다 다르다. `extensionsRequired` 에 올라간 확장을 모르는 로더는 파일을 열지 못한다. 대상 런타임이 지원하는 확장만 쓴다.
- 텍스처 색 공간(색 데이터 sRGB, 노멀·러프니스 선형)을 틀리면 PBR 이 어긋난다([IBL](/develop-wiki/knowledge/graphics-xr/image-based-lighting/)도 같은 이유로 선형 HDR 입력을 전제한다).
- glTF 버퍼·텍스처는 외부 URI 를 참조할 수 있다. 신뢰할 수 없는 에셋을 서버에서 열 때는 외부 URI 해석을 제한한다.
- 복잡한 장면은 USD 의 합성을 모르고 레이어를 편집하면 어느 레이어가 값을 정했는지 추적이 어렵다. 팀 규약(레이어 책임)을 정한다.
