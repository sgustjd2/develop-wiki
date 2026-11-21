---
name: JAX
url: https://docs.jax.dev
docs: https://docs.jax.dev/en/latest/
repo: https://github.com/jax-ml/jax
stars: 36665
domain: data-ml
category: ml
description: NumPy 호환 API 에 자동 미분·JIT 컴파일·벡터화 변환을 더한 고성능 수치 계산 라이브러리. GPU·TPU 대규모 모델 학습과 과학 계산에 쓴다.
pricing: oss
tags: [autodiff, jit, xla, tpu, gpu, numerical-computing]
languages: [python]
koreanDocs: false
addedAt: 2026-11-18
verifiedAt: 2026-11-18
---

## 개요
JAX 는 `jax.numpy` 로 NumPy 와 거의 같은 코드를 쓰되, 순수 함수에 `grad`(미분), `jit`(XLA 컴파일), `vmap`(자동 배치), 샤딩 기반 병렬화 같은 "함수 변환" 을 조합해 적용하는 라이브러리다. 같은 코드가 CPU·GPU·TPU 에서 동작한다. 신경망 레이어는 JAX 자체가 아니라 Flax(NNX)·Optax 같은 생태계 라이브러리가 제공한다. Google 이 주도한다.

**버전(2026-11 기준):** 0.12.0.1(2026-10-21), Python 3.12 이상(PyPI 기준). 0.x 버전이라 마이너 버전 사이에도 API 변경이 있다. 라이선스 Apache-2.0.

## 설치
```bash
pip install -U jax                    # CPU
pip install -U "jax[cuda13]"          # NVIDIA GPU, pip 로 CUDA 13 포함 (Linux)
pip install -U "jax[cuda12]"          # CUDA 12 (추후 지원 종료 예정)
pip install -U "jax[tpu]"             # Cloud TPU VM
```

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| `jax.numpy` | NumPy 호환 배열 API. 배열은 불변(immutable) |
| `jax.grad` | 스칼라 함수의 기울기 함수를 반환 |
| `jax.jit` | 함수를 추적해 XLA 로 컴파일, 같은 형태 입력에 재사용 |
| `jax.vmap` | 단일 예제 함수를 배치 함수로 자동 변환 |
| PRNG 키 | 전역 시드 대신 `jax.random.key` 를 명시적으로 나눠(`split`) 사용 |
| pytree | 중첩 dict/list/tuple 을 변환의 입력·출력으로 다루는 구조 |
| 샤딩 | `jax.sharding` 으로 배열을 여러 장치에 분산 |
| 순수 함수 | 부작용 없는 함수여야 변환이 올바르게 동작 |

## 기본 사용법
```python
import jax
import jax.numpy as jnp

def loss(w, x, y):
    pred = x @ w
    return jnp.mean((pred - y) ** 2)

grad_fn = jax.jit(jax.grad(loss))          # 미분 + 컴파일

key = jax.random.key(0)
kx, kw = jax.random.split(key)
x = jax.random.normal(kx, (256, 3))
true_w = jnp.array([1.0, -2.0, 0.5])
y = x @ true_w

w = jnp.zeros(3)
for _ in range(200):
    w = w - 0.1 * grad_fn(w, x, y)
print(w)                                    # true_w 에 가까워짐

per_example = jax.vmap(lambda xi: xi @ w)(x)   # 배치 자동화
```

## 자주 쓰는 패턴
- **신경망**: Flax NNX 로 모델을 정의하고 Optax 로 옵티마이저를 구성한다.
- **재컴파일 주의**: `jit` 함수에 들어가는 배열 형태(shape)가 바뀌면 다시 컴파일되므로 배치 크기를 고정하거나 패딩한다.
- **제어문**: 값에 따라 분기하는 Python `if` 대신 `jax.lax.cond`, 반복은 `jax.lax.scan`/`fori_loop`.
- **배열 수정**: 제자리 수정 대신 `x.at[i].set(v)` 로 새 배열을 만든다.

## 언제 쓰나 / 피할 때
- 쓸 때: TPU 또는 다수 GPU 에서의 대규모 학습, 미분 가능한 과학·물리 시뮬레이션, 함수형 스타일의 연구 코드.
- 피할 때(대안): 사전학습 모델·튜토리얼 생태계와 eager 디버깅이 중요하면 [PyTorch](/develop-wiki/data-ml/ml/pytorch/). 전통적 ML 은 [scikit-learn](/develop-wiki/data-ml/ml/scikit-learn/).

## 공식 문서
- [문서 홈](https://docs.jax.dev/en/latest/) · [설치](https://docs.jax.dev/en/latest/installation.html) · [Quickstart](https://docs.jax.dev/en/latest/notebooks/thinking_in_jax.html)
- [Sharp bits(흔한 함정)](https://docs.jax.dev/en/latest/notebooks/Common_Gotchas_in_JAX.html) · [Flax](https://flax.readthedocs.io/) · [Optax](https://optax.readthedocs.io/)
