# Agent Team 및 Main Agent / Subagent 개념 가이드

> 조사일: 2026-04-07

---

## 1. Main Agent (메인 세션)

사용자와 직접 대화하는 **주 세션**. Claude Code를 실행(`claude`)하는 순간 자동으로 시작되며, 별도 설정이나 정의 파일 없이 생성된다. 즉, **사용자가 Claude Code와 대화하고 있는 그 세션 자체가 Main Agent**이다.

- 전체 대화 이력, CLAUDE.md, 메모리를 보유
- 작업을 판단하고 필요 시 subagent를 spawn하는 **오케스트레이터** 역할
- 세션 종료까지 컨텍스트 유지 (누적됨)
- Subagent를 생성할 수 있는 유일한 주체
- 사용자가 직접 생성하는 것이 아님 — Claude Code 실행 = Main Agent 시작
- `.claude/agents/`에 정의하는 것은 subagent이며, Main Agent의 정의 파일은 없음

```
PM (사용자) ↔ 지금 이 대화 (Main Agent)
                    │
                    ├→ doc-manager (subagent) spawn 가능
                    ├→ researcher (subagent) spawn 가능
                    ├→ community (subagent) spawn 가능
                    └→ ...
```

---

## 2. Subagent

메인 Agent가 `Agent` tool로 spawn하는 **독립 작업자**.

### 핵심 특성

- **자체 컨텍스트 윈도우** — 메인 대화 이력을 상속받지 않음, spawn prompt만 수신
- **프로젝트 컨텍스트 로드** — CLAUDE.md, MCP 서버, Skills는 자동 로드
- **완료 시 컨텍스트 폐기** — 요약만 메인에 반환, 탐색 과정은 사라짐
- **파일 변경은 유지** — 디스크에 쓴 파일은 남음
- **다른 subagent 생성 불가** — 위임 체인 방지

### Lifecycle

1. 메인이 task 인식 → Agent tool로 subagent spawn
2. Subagent가 자체 컨텍스트에서 독립 작업
3. 작업 완료 → 요약 결과를 메인에 반환
4. Subagent 컨텍스트 폐기

### 완료 후 남는 것 vs 사라지는 것

| | 남는다 | 사라진다 |
|--|--------|---------|
| **요약 결과** | Main 컨텍스트에 반환 | - |
| **생성/수정한 파일** | 디스크에 유지 | - |
| **작업 과정** | - | 검색, 파일 읽기, 시행착오 전부 |
| **subagent 대화 이력** | - | 전부 폐기 |

예시: researcher를 spawn한 경우

```
Main: "특허 검색해줘" → researcher spawn

researcher 내부 (별도 컨텍스트):
  ├ CLAUDE.md 로드         ← 사라짐
  ├ 웹 검색 10회           ← 사라짐
  ├ 파일 읽기 5회          ← 사라짐
  ├ 리포트 작성 → 파일 저장 ← 파일은 남음
  └ 요약 반환              ← Main에 남음

researcher 종료 후 Main 컨텍스트:
  "researcher 결과: 관련 특허 3건 발견, 리포트를 60-workspace에 저장함"
  (이 한 줄만 남음)
```

같은 researcher를 다시 spawn하면 **이전에 뭘 했는지 전혀 모른다**. 매번 새 직원이 오는 것과 같다.

### 통신 구조

```
사용자 ↔ Main Agent → spawn → Subagent A (독립 작업)
                                    ↓
                              요약 결과 반환
                    Main Agent → spawn → Subagent B
                                    ↓
                              요약 결과 반환
```

- **단방향**: 메인 → subagent (지시), subagent → 메인 (결과)
- **subagent 간 통신 불가** — 메인이 중개해야 함

### Subagent를 쓰는 이유

**컨텍스트 효율성** — 긴 탐색/검색 작업을 subagent에 위임하면 메인 컨텍스트가 비대해지지 않음. 요약만 돌아오므로 메인 세션의 수명이 길어짐.

### Subagent 설정 옵션

정의 파일: `.claude/agents/{name}.md`

```markdown
---
name: "Research Agent"
description: "Researches topics and finds external resources"
model: "haiku"
tools:
  allow:
    - WebFetch
    - WebSearch
    - Glob
    - Grep
  deny:
    - Bash
    - Write
disabled: false
scope: project
---
```

| 옵션 | 용도 |
|------|------|
| `model` | subagent 모델 override (sonnet, haiku 등) |
| `tools.allow / deny` | 도구 허용/차단 |
| `mcpServers` | MCP 서버 범위 지정 |
| `run_in_background` | true = 비동기, false = 완료 대기 |
| `disabled` | 삭제 없이 비활성화 |
| `scope` | project / user / plugin |
| `isolation: "worktree"` | 독립 git worktree에서 실행 (파일 충돌 방지) |

---

## 3. Main Agent vs Subagent 비교

| | Main Agent | Subagent |
|--|-----------|----------|
| **컨텍스트** | 대화 전체 누적 | 매번 새로 시작 (spawn prompt만) |
| **가시성** | 사용자가 실시간 확인 | 최종 요약만 반환 |
| **도구** | 전체 접근 | 정의 파일에서 제한 가능 |
| **모델** | 세션 설정 따름 | 개별 override 가능 (sonnet, haiku 등) |
| **수명** | 세션 종료까지 | 작업 완료 시 폐기 |
| **spawn 능력** | subagent 생성 가능 | 불가 |

---

## 4. Agent Team

Claude Code의 **실험적 기능**(기본 비활성)으로, **여러 독립적인 Claude Code 세션이 팀으로 협업**하는 구조.

### 구성 요소

- **Team Lead**: 팀을 생성하고 조율하는 메인 세션
- **Teammates**: 각자 독립된 컨텍스트 윈도우를 가진 별도 Claude Code 인스턴스
- **공유 태스크 리스트**: 팀원들이 자율적으로 claim하고 수행
- **메시징 시스템**: 팀원 간 직접 소통 가능

### 적합한 사용 사례

1. **리서치/리뷰** — 여러 측면을 동시 조사 후 상호 검증
2. **새 모듈/기능** — 파일 충돌 없이 각자 담당
3. **디버깅** — 서로 다른 가설을 병렬로 검증
4. **크로스 레이어** — 프론트/백엔드/테스트를 각자 담당

### 활성화 방법

요구사항: Claude Code v2.1.32 이상

```json
// .claude/settings.json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

또는 CLI: `claude --env CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`

### 팀 실행

활성화 후 자연어로 spawn:

```text
Create an agent team to explore this from different angles:
one teammate on architecture, one on UX, one on security/compliance.
```

기존 `.claude/agents/` 정의 파일을 teammate role로 그대로 참조 가능.

### 디스플레이 모드

| 모드 | 요구사항 | 설명 |
|------|---------|------|
| **In-Process** (기본) | 없음 (Windows 호환) | `Shift+Down`으로 teammate 전환 |
| **Split-Pane** | tmux 또는 iTerm2 | 각 teammate를 별도 pane에 표시 |

### 태스크 관리

- 상태: Pending → In Progress → Completed
- 의존성 지원 (선행 태스크 완료 시 자동 해제)
- 저장 위치: `~/.claude/tasks/{team-name}/`

### 제약 사항

| 제약 | 대응 |
|------|------|
| 세션 resume 시 teammate 복원 안 됨 | 새로 spawn |
| 태스크 상태 지연 가능 | 수동 확인 |
| 세션당 1팀, 중첩 불가 | 기존 팀 정리 후 새 팀 |
| Split pane은 tmux/iTerm2 필요 | Windows는 in-process 모드 |
| 토큰 비용 N배 (teammate 수) | 3명 시작 권장 |

### 비용 고려

- 3 teammates ≈ 3x 단일 세션 비용
- teammate당 5-6개 태스크 권장
- Lead는 Opus, Teammate는 Sonnet 권장:

```json
{
  "model": "opus",
  "env": {
    "CLAUDE_CODE_SUBAGENT_MODEL": "sonnet"
  }
}
```

---

## 5. Subagent vs Agent Team 비교

| | Subagent | Agent Team Teammate |
|--|---------|-------------------|
| **통신** | 메인에게만 반환 | 팀원 간 직접 메시징 |
| **컨텍스트** | 완료 시 폐기 | 독립 세션으로 유지 |
| **조율** | 메인이 순차 관리 | 공유 태스크 + 자율 claim |
| **비용** | 낮음 (요약만 반환) | 높음 (독립 세션) |
| **spawn** | Agent tool로 생성 | Team Lead가 자연어로 생성 |
| **상호 통신** | 불가 (메인 중개) | 직접 가능 |

---

## 6. 비용 비교: Subagent vs Agent Team

### 비유

```
Subagent  = 직원 1명을 불러서 일 시키고 보고서 받기
Agent Team = 사무실 하나를 새로 차려서 팀 운영하기
```

### 시나리오별 토큰 사용량 비교

**리서치 작업 1건**

| 방식 | 토큰 사용량 | 비유 |
|------|-----------|------|
| Main이 직접 | ~11,500 | 사장님이 직접 조사 |
| Subagent 위임 | ~13,300 (+15%) | 직원 한 명 시켜서 보고서 받기 |
| Agent Team | ~15,100 (+31%) | 팀 세팅 + 팀원이 조사 |

**병렬 작업 5건**

| 방식 | 토큰 사용량 | 특징 |
|------|-----------|------|
| Subagent 5개 | ~11,500 | 각자 일하고 보고만 |
| Agent Team 5명 | ~14,500 (+26%) | 서로 소통하며 협업 가능 |

### Spawn 고정 비용 (매 호출마다 소비)

Subagent 1회 spawn 시 작업 시작 전에 이미 소비되는 토큰:

| 항목 | 토큰 |
|------|------|
| CLAUDE.md 로드 | ~1,000 |
| MCP 서버/도구 정의 | ~500 |
| spawn prompt | ~300-500 |
| **합계 (일 시작 전)** | **~1,800-3,500** |

Agent Team은 이 고정 비용이 **teammate 수만큼 반복**된다.

### Agent Team Plan 모드 주의

> Agent Team이 plan 모드로 돌면 **단일 세션 대비 약 7배** 토큰 소비 (공식 문서)

### 비용 절감 전략

| 전략 | 효과 |
|------|------|
| 단순 작업은 `model: haiku` | Opus 대비 비용 대폭 절감 |
| CLAUDE.md 200줄 이내 유지 | spawn마다 고정비용 절약 |
| Agent Team은 3-5명 이내 | 선형 비용 증가 억제 |
| 끝난 teammate 즉시 정리 | 유휴 상태도 토큰 소비 |

### 모델별 권장 배치

```
Main Agent (Lead)  → Opus    (판단·조율 품질 중요)
Subagent 일반      → Sonnet  (균형)
단순 작업          → Haiku   (저렴)
```

### 한 줄 정리

| | Subagent | Agent Team |
|--|---------|------------|
| **비용** | +15~30% | +30~700% |
| **장점** | 메인 컨텍스트 보호, 저렴 | 팀원 간 소통, 병렬 속도 |
| **쓸 때** | 독립 작업 위임 | 협업·토론이 필요할 때 |

**돈 아끼려면 Subagent, 속도와 협업이 중요하면 Agent Team.**

---

## 7. 실전 시나리오: 정부과제 신청서 자료 준비

현재 프로젝트의 6개 Agent를 기준으로, Subagent 방식과 Agent Team 방식을 비교한다.

### 배경

PM이 컨설팅 외주에게 넘길 자료를 준비해야 함. 카카오톡으로 새 공고 정보가 들어온 상황.

### 현재 방식 (Subagent, 순차 중개)

```
PM → Main: "카톡 파일 분석해줘"
Main → community (spawn) → 분석 완료 → 요약 반환 → Main
Main → "일정이 있네" → researcher (spawn) → 조사 완료 → 요약 반환 → Main
Main → "서류 정리해" → doc-manager (spawn) → 정리 완료 → 요약 반환 → Main
Main → reviewer (spawn) → 검토 완료 → 요약 반환 → Main
Main → orchestrator (spawn) → 규칙 검증 → Main
Main → PM에게 최종 보고
```

**문제점**: 모든 단계가 Main을 거쳐 순차 진행. community가 끝나야 researcher가 시작.

### Agent Team 방식 (병렬 + 직접 소통)

**Team Lead (Main)** 가 팀을 spawn:

```
PM → Lead: "카톡에 새 공고 왔어. 자료 준비해줘"

Lead가 팀 생성 + 태스크 배분:
┌─────────────────────────────────────────────────┐
│                  Team Lead                       │
│  태스크 리스트 생성 + teammate spawn              │
└──────┬──────────┬──────────┬──────────┬─────────┘
       │          │          │          │
       ▼          ▼          ▼          ▼
  community   researcher  doc-manager  simulator
  (haiku)     (sonnet)    (sonnet)     (sonnet)
```

#### Phase 1: 병렬 시작

| Teammate | 작업 | 상태 |
|----------|------|------|
| **community** | 카톡 파싱 → 공고 정보, 일정, 마일스톤 추출 | 진행 중 |
| **doc-manager** | 기존 보유 서류 스캔 → 체크리스트 준비 | 진행 중 |
| **researcher** | 공고 기관 기본 정보 사전 조사 | 진행 중 |
| **simulator** | 기존 시뮬레이션 코드/문서 현황 파악 | 진행 중 |

#### Phase 2: 직접 소통 (Subagent와의 핵심 차이)

```
community → doc-manager에게 직접 메시지:
  "공고 마감일 2026-04-25, 필수서류: 사업계획서, 기술개발계획서, 참여인력현황"

community → researcher에게 직접 메시지:
  "공고명: 공정모델형, 주관기관: KEIT, 예산규모 확인 필요"

researcher → doc-manager에게 직접 메시지:
  "유사 과제 3건 발견. 기술동향 리포트 작성 중. 60-workspace에 저장 예정"

doc-manager → simulator에게 직접 메시지:
  "기술개발계획서에 시뮬레이션 환경 스펙 필요. 정리해서 공유해줘"

simulator → doc-manager에게 직접 메시지:
  "ROS2 Humble + Gazebo 환경 스펙 정리 완료. 60-workspace/62-tech/ 참조"
```

**Subagent였다면?** 위 소통 5건 모두 Main을 거쳐야 함 → 5번의 spawn-반환 사이클.

#### Phase 3: 취합 + 검토

```
doc-manager: "서류 준비 완료. 누락 2건 발견 [확인 필요]"
  → Lead에게 보고 → PM 확인 대기

reviewer가 자율적으로 claim:
  → doc-manager 산출물 검토
  → researcher 리포트 검토
  → "기술개발계획서 3페이지 수치 불일치" → doc-manager에게 직접 피드백
  → doc-manager가 즉시 수정
```

#### Phase 4: 최종 보고

```
Lead → PM:
  ✅ 카톡 분석 완료 (community)
  ✅ 필수서류 7건 중 5건 준비 완료 (doc-manager)
  ✅ 유사과제 리서치 리포트 작성 (researcher)
  ✅ 시뮬레이션 환경 스펙 정리 (simulator)
  ✅ 품질 검토 완료 (reviewer)
  ⚠️ [확인 필요] 누락 서류 2건: 참여인력현황, 간접비 산출근거
```

### 이 시나리오 기준 두 방식 비교

| | Subagent (현재) | Agent Team |
|--|----------------|------------|
| **소요 시간** | 순차 5단계 | Phase 1~2 병렬 → 빠름 |
| **Main 컨텍스트** | 5개 Agent 요약 누적 | Lead는 최종 보고만 |
| **중간 소통** | Main 거쳐 5회 중개 | teammate 간 직접 5회 |
| **reviewer 피드백** | Main → doc-manager 재호출 | reviewer → doc-manager 직접 수정 |
| **비용** | 기본 | ~3-4배 |
| **PM 개입** | 매 단계 확인 가능 | [확인 필요]만 보고 올라옴 |

---

## 8. Phase 2 시뮬레이션 결과 (2026-04-07 실행)

실제 Agent Team은 활성화하지 않고, 각 teammate 역할을 subagent로 실행하여 직접 소통 흐름을 재현한 결과.

### 실행 흐름

```
[Step 1] community → 카톡 파싱
  입력: simulation_kakao_chat.txt
  산출: simulation_community_result.md
  전달: doc-manager (필수서류 5종), researcher (공고 정보)

[Step 2] doc-manager + researcher 병렬 실행
  doc-manager:
    입력: community 전달 + simulation_existing_docs.md
    산출: simulation_docmanager_result.md
    결과: 보유 3건, 누락 2건 (참여인력현황, 간접비 산출근거)
    전달: simulator (시뮬레이션 스펙 요청)

  researcher:
    입력: community 전달 (공고 정보)
    산출: simulation_researcher_result.md
    결과: 유사과제 3건, 차별화 포인트 정리
    전달: doc-manager (서류 준비 참고 사항)

[Step 3] simulator → 스펙 정리
  입력: doc-manager 요청 + simulation_sim_spec.md
  산출: simulation_simulator_result.md
  전달: doc-manager (기술개발계획서 삽입용 스펙)
```

### Teammate 간 소통 5건 요약

| # | 발신 | 수신 | 메시지 내용 |
|---|------|------|-----------|
| 1 | community | doc-manager | 필수서류 5종 목록, 마감일 2026-04-25 |
| 2 | community | researcher | 공고명, 주관기관 KEIT, 예산 3억 확인 필요 |
| 3 | researcher | doc-manager | 유사과제 3건, 차별화 전략·정량지표 반영 권고 |
| 4 | doc-manager | simulator | 기술개발계획서에 시뮬레이션 환경 스펙 요청 |
| 5 | simulator | doc-manager | ROS2 Humble + Gazebo 스펙 정리 완료 |

### Subagent(현재) vs Agent Team 실제 차이

위 5건의 소통을 처리하는 데:

| | Subagent (실제 실행) | Agent Team (이론) |
|--|---------------------|-------------------|
| **Main 개입** | 5회 (매번 결과 수신 → 다음 spawn) | 0회 (teammate 간 직접) |
| **spawn 횟수** | 4회 순차 | 4회 동시 (이후 자율) |
| **Main 컨텍스트 소비** | 4개 요약 누적 | 최종 보고만 |

### 생성된 시뮬레이션 파일

| 파일 | 구분 | 역할 |
|------|------|------|
| `simulation_kakao_chat.txt` | 입력 | 카톡 원본 |
| `simulation_existing_docs.md` | 입력 | 보유 서류 현황 |
| `simulation_sim_spec.md` | 입력 | 시뮬레이션 환경 스펙 |
| `simulation_community_result.md` | 산출 | community 파싱 결과 |
| `simulation_docmanager_result.md` | 산출 | doc-manager 서류 대조 결과 |
| `simulation_researcher_result.md` | 산출 | researcher 유사과제 조사 결과 |
| `simulation_simulator_result.md` | 산출 | simulator 스펙 정리 결과 |

> 모든 시뮬레이션 파일은 `60-workspace/`에 위치하며, `simulation_` 접두사로 구분된다.

---

## 9. Agent Team 적용을 위한 프로젝트 수정 내역

`cobot_automation_hub` → `cobot_automation_hub_team` 복사 후, 아래 파일을 Agent Team용으로 수정.

### 9-1. `.claude/settings.json`

**이전 (Subagent)**
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [{ "type": "command", "command": "echo '산출물 변경 감지 — [25.01:reviewer] 검토 대상에 추가'" }]
      }
    ],
    "SubagentStop": [
      {
        "matcher": "doc-manager|researcher|community|simulator",
        "hooks": [{ "type": "command", "command": "echo 'Agent 작업 완료 — [25.01:reviewer] 검토 대기열에 등록'" }]
      }
    ]
  },
  "enabledMcpjsonServers": ["kipris", "google-calendar"],
  "permissions": {
    "allow": ["Read", "Write", "Edit", "Glob", "Grep", "Bash", "Agent"],
    "deny": ["Bash(rm -rf *)", "Bash(git push --force)"]
  }
}
```

**이후 (Agent Team)**
```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [{ "type": "command", "command": "echo '산출물 변경 감지 — [25.01:reviewer] 검토 대상에 추가'" }]
      }
    ]
  },
  "enabledMcpjsonServers": ["kipris", "google-calendar"],
  "permissions": {
    "allow": ["Read", "Write", "Edit", "Glob", "Grep", "Bash", "Agent"],
    "deny": ["Bash(rm -rf *)", "Bash(git push --force)"]
  }
}
```

**변경점:**
- `env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: "1"` 추가 (Agent Team 활성화)
- `SubagentStop` hook 제거 (Agent Team에서는 teammate가 자율 동작하므로 불필요)

---

### 9-2. `CLAUDE.md`

**이전 (Subagent) → 이후 (Agent Team) 주요 변경**

| 섹션 | 이전 (Subagent) | 이후 (Agent Team) |
|------|----------------|-------------------|
| 제목 | `cobot_automation_hub` | `cobot_automation_hub (Agent Team 버전)` |
| 운영 방식 | 명시 없음 (subagent 전제) | `운영 방식: Agent Team (teammate 간 직접 소통)` 명시 |
| Agent 실행 모드 규칙 | spawn 방식, 파이프라인 순서 정의 | **삭제** → Agent Team 구성 섹션으로 대체 |
| Agent 우선순위 | 6개 Agent 우선순위 리스트 | **삭제** → Team Lead가 태스크 우선순위로 관리 |
| orchestrator 자동 호출 | Agent 완료 후 메인이 orchestrator 호출 | **삭제** → reviewer가 자율 검토로 대체 |
| Agent 간 전달 규칙 | "직접 호출 금지, 메인이 중개" | **"teammate 간 직접 메시지 허용"**으로 변경 |
| Agent 결과 보고 형식 | 메인에 보고 (요약, 파일목록, [전달]) | Lead에 보고 + teammate 간 직접 피드백 |
| 스킬 규칙 | 독립 스킬 테이블 | **삭제** (Agent Team에서는 teammate가 자율 판단) |
| 설계서 참조 규칙 | "설계서를 먼저 검토" | **삭제** (실험용 프로젝트) |

**새로 추가된 섹션:**

| 섹션 | 내용 |
|------|------|
| Agent Team 구성 | Team Lead + 5 Teammates 역할·모델 정의 |
| Agent Team 소통 규칙 | teammate 간 직접 메시지 형식, Lead 보고 규칙 |
| 태스크 관리 | 태스크 리스트, 자율 claim, 의존성 관리 |
| Reviewer 역할 | 자율 검토, 직접 피드백 루프 (Lead 거치지 않음) |
| 팀 실행 예시 | 구체적인 실행 시나리오 |

---

### 9-3. `.claude/rules/change-log.md`

**이전 (Subagent)**
```
- Agent 또는 Skill이 파일을 생성/수정/삭제할 때 `.logs/change_log.md`에 기록한다
- 기록 형식: `| 날짜 | Agent | Skill | 작업 | 대상 파일 |`
- PM이 직접 수행한 작업도 기록한다 (Agent란에 `-` 표기)
```

**이후 (Agent Team)**
```
- Teammate 또는 Lead가 파일을 생성/수정/삭제할 때 `.logs/change_log.md`에 기록한다
- 기록 형식: `| 날짜 | Teammate | 작업 | 대상 파일 |`
- PM이 직접 수행한 작업도 기록한다 (Teammate란에 `-` 표기)
```

**변경점:**
- `Agent` → `Teammate`, `Lead` 용어 변경
- `Skill` 컬럼 제거 (Agent Team에서는 teammate가 자율적으로 스킬 사용)

---

### 9-4. 변경하지 않은 파일

| 파일 | 이유 |
|------|------|
| `.claude/agents/*.md` | Agent 정의 파일은 그대로 teammate role로 참조 가능 |
| `.claude/rules/hwp-handling.md` | 파일 처리 규칙은 방식과 무관 |
| `.claude/rules/python-style.md` | 코드 스타일은 방식과 무관 |
| `.claude/settings.local.json` | 환경변수, MCP 키 등 로컬 설정 유지 |
| `INDEX.md` | 프로젝트 현황은 동일 |

### 10. Agent Team 시뮬레이션

**프롬프트**
```
카톡에 새 공고가 왔어. agent team을 만들어서 자료 준비해줘.

  입력 파일:
  - 카톡: 60-workspace/simulation_kakao_chat.txt
  - 보유 서류: 60-workspace/simulation_existing_docs.md
  - 시뮬레이션 스펙: 60-workspace/simulation_sim_spec.md

  팀 구성:
  1. community: 카톡 파일을 파싱해서 공고 정보, 필수서류 목록, 일정을 추출해줘.   완료되면 doc-manager에게 필수서류 목록을, researcher에게 공고 정보를 직접   
  전달해줘.
  2. doc-manager: community에게 필수서류 목록을 받으면 보유 서류 파일과        
  대조해서 누락을 파악해줘. 기술개��계획서에 시뮬레이션 스펙이 필요하면        
  simulator에게 직접 요청해.
  3. researcher: community에게 공고 정보를 받으면 유사과제 3건을 조사하고, 서류
   준비에 참고할 사항을 doc-manager에게 직접 전달해줘.
  4. simulator: doc-manager가 요청하면 시뮬레이션 스펙 파일을 기술개발계획서에 
  넣을 수 있는 형태로 정리해서 doc-manager에게 직접 전달해줘.
  5. reviewer: 다른 teammate들의 산출물을 검토하고, 문제가 있으면 해당
  teammate에게 직접 피드백해줘.

  규칙:
  - 산출물은 모두 60-workspace/에 저장
  - 파일명 앞에 simulation_ 붙이기
  - [확인 필요] 항목이 있으면 나에게 보고
  - 완료되면 최종 결과를 정리해서 보고해줘
```
