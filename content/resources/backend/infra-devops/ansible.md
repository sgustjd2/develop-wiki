---
name: Ansible
url: https://www.ansible.com
docs: https://docs.ansible.com/ansible/latest/
repo: https://github.com/ansible/ansible
stars: 71665
domain: backend
category: infra-devops
description: SSH 로 서버에 접속해 YAML 플레이북에 적은 원하는 상태를 적용하는 에이전트리스 구성 관리·자동화 도구. 서버 설정, 배포, 반복 운영 작업에 쓴다.
pricing: oss
tags: [configuration-management, automation, playbook, yaml, agentless, iac]
languages: []
koreanDocs: false
addedAt: 2026-11-19
verifiedAt: 2026-11-19
---

## 개요
Ansible 은 원격 시스템의 상태를 관리하는 자동화 도구다. 제어 노드(Ansible 을 설치한 곳)에서 인벤토리에 적힌 관리 대상 호스트로 SSH 접속해 모듈을 실행한다. 대상 호스트에 에이전트를 설치할 필요가 없고, 대상에는 Python 과 SSH 로 접속 가능한 계정이 필요하다.

- 이 문서는 **ansible-core 2.22.0**(GitHub·PyPI, 2026-11-02, Python `>=3.13`)과 패키지 `ansible` **15.0.0**(PyPI) 기준이다. GPL-3.0.
- 두 패키지의 차이: `ansible-core` 는 기본 모듈·플러그인만 담은 최소 패키지, `ansible` 은 커뮤니티 컬렉션까지 포함한 "batteries included" 패키지다.
- 대안: 선언형 인프라 프로비저닝은 [Terraform](/develop-wiki/backend/infra-devops/terraform/)·[OpenTofu](/develop-wiki/backend/infra-devops/opentofu/)·[Pulumi](/develop-wiki/backend/infra-devops/pulumi/), 컨테이너 오케스트레이션은 [Kubernetes](/develop-wiki/backend/infra-devops/kubernetes/). Ansible 은 이미 있는 서버의 설정·소프트웨어 배포에 맞다.

## 설치
```bash
python3 -m pip install --user ansible        # 전체 패키지
python3 -m pip install --user ansible-core   # 최소 패키지
# 또는 pipx
pipx install --include-deps ansible
ansible --version                            # 설치된 ansible-core 버전
ansible-community --version                  # 전체 패키지 버전
```
제어 노드는 Python 이 있는 거의 모든 UNIX 계열 시스템이고, Windows 는 WSL 에서만 지원한다.

## 핵심 개념
| 개념 | 설명 |
| --- | --- |
| Control node | `ansible`, `ansible-playbook` 을 실행하는 머신 |
| Managed node | Ansible 이 제어하는 원격 호스트 |
| Inventory | 관리 대상 호스트 목록과 그룹 |
| Playbook | 호스트에 적용할 플레이(play)와 태스크를 적은 YAML |
| Module | 태스크가 호출하는 실행 단위. 예: `ansible.builtin.ping`, `ansible.builtin.debug` |
| Collection | 모듈·플러그인·롤을 묶은 배포 단위 |

## 기본 사용법
`inventory.ini` 에 호스트를 나열한다(주소는 예시).
```ini
[myhosts]
192.0.2.50
192.0.2.51
```
`playbook.yaml`:
```yaml
- name: My first play
  hosts: myhosts
  tasks:
    - name: Ping my hosts
      ansible.builtin.ping:

    - name: Print message
      ansible.builtin.debug:
        msg: Hello world
```
실행:
```bash
ansible-playbook -i inventory.ini playbook.yaml
```

## 자주 쓰는 패턴
- **FQCN 사용**: 모듈 이름을 `ansible.builtin.*` 처럼 컬렉션까지 포함해 적는다.
- **멱등성**: 태스크는 "원하는 상태"를 기술하므로 여러 번 실행해도 결과가 같게 모듈을 고른다.
- **인벤토리 그룹**: 환경별(`staging`, `production`) 그룹으로 나눠 같은 플레이북을 재사용한다.
- **컬렉션 버전 고정**: 필요한 컬렉션을 요구사항 파일에 적어 팀 간 재현성을 확보한다.

## 언제 쓰나 / 피할 때
- 쓸 때: 서버 설정·패키지 설치·배포 같은 운영 작업을 코드로 반복 가능하게 만들 때, 에이전트 설치가 곤란한 환경.
- 피할 때(대안): 클라우드 리소스 생성·상태 관리는 Terraform 계열, 쿠버네티스 내부 배포는 [Helm](/develop-wiki/backend/infra-devops/helm/)·[Argo CD](/develop-wiki/backend/infra-devops/argo-cd/).

## 공식 문서
- [시작하기](https://docs.ansible.com/ansible/latest/getting_started/index.html) · [설치 가이드](https://docs.ansible.com/ansible/latest/installation_guide/intro_installation.html) · [플레이북 시작](https://docs.ansible.com/ansible/latest/getting_started/get_started_playbook.html)
