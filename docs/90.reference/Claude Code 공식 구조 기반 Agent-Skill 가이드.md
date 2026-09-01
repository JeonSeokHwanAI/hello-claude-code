---
title: Claude Code 공식 구조 기반 Agent-Skill 가이드
author: Jeonseokhwan
date: 2026-03-19
category: guide
tags:
  - claude-code
  - official-structure
  - agent
  - skill
description: Anthropic 공식 구조(.claude/agents, .claude/skills)를 기반으로 Agent와 Skill을 설계하는 가이드
---

# Claude Code 공식 구조 기반 Agent-Skill 가이드

## 개요

Anthropic이 공식 제공하는 `.claude/` 디렉토리 구조를 활용하여
Agent와 Skill을 설계하는 방법을 정리한 문서입니다.

---

## 용어 정의

| 용어 | 정의 |
|------|------|
| **Claude Code** | 사용자의 자연어 지시를 해석하고 실행하는 AI 도구 (행위자) |
| **CLAUDE.md** | Claude Code가 시작 시 자동 로드하는 프로젝트 지침서 (200줄 이하 권장) |
| **Skill** | `.claude/skills/*/SKILL.md`에 정의된 실행 절차. frontmatter로 호출 조건을 제어 |
| **Agent** | `.claude/agents/*.md`에 정의된 하위 작업 단위. 독립된 도구/모델/권한을 가짐 |
| **Rules** | `.claude/rules/*.md`에 정의된 경로 기반 조건부 지침 |

---

## Claude Code와 Skill의 관계

Claude Code 자체는 어떤 절차도 내장하지 않습니다.
**.md 파일이 Claude Code의 행동을 정의**하고, Claude Code는 그것을 읽고 실행합니다.

```
┌─────────────────────────────────────────────────────┐
│                     사용자                            │
│              "노트 만들어줘" 또는 /create-note         │
└────────────────────┬────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────┐
│           Claude Code  (행위자)                       │
│         지시를 해석하고 실행하는 두뇌 + 손발            │
└────────────────────┬────────────────────────────────┘
                     │ ① CLAUDE.md 자동 로드 (시작 시)
                     ▼
┌─────────────────────────────────────────────────────┐
│       CLAUDE.md  (프로젝트 지침서)                     │
│    공통 규칙, 빌드 명령, 아키텍처 결정사항              │
│    (매핑 테이블 불필요 — Skill/Agent가 분리 담당)       │
└────────────────────┬────────────────────────────────┘
                     │ ② description 기반 자동 매칭
                     ▼
┌──────────────────────────┬──────────────────────────┐
│                          │                          │
│  .claude/agents/*.md     │  .claude/skills/*/       │
│  (Agent — 위임 대상)      │  SKILL.md  (Skill)       │
│                          │                          │
│  ┌────────────────────┐  │  ┌────────────────────┐  │
│  │ researcher.md      │  │  │ create-note/       │  │
│  │ - model: haiku     │  │  │   SKILL.md         │  │
│  │ - tools: Read,Grep │  │  │ - 호출: /create-note│  │
│  │ - memory: project  │  │  │ - 또는 자동 매칭    │  │
│  ├────────────────────┤  │  ├────────────────────┤  │
│  │ document.md        │  │  │ index-docs/        │  │
│  │ - model: sonnet    │  │  │   SKILL.md         │  │
│  │ - tools: 전체      │  │  │ - 호출: /index-docs │  │
│  └────────────────────┘  │  └────────────────────┘  │
│                          │                          │
└──────────────────────────┴──────────────────────────┘
                     │ ③ 절차 로드
                     ▼
┌─────────────────────────────────────────────────────┐
│       Claude Code가 절차대로 작업 수행                  │
│   (도구 제한, 모델, 권한이 frontmatter에 의해 강제됨)    │
└─────────────────────────────────────────────────────┘
```

| 구성요소 | 역할 | 핵심 질문 |
|----------|------|----------|
| **Claude Code** | 읽고, 판단하고, 실행하는 행위자 | — |
| **CLAUDE.md** | 프로젝트 공통 지침 (가볍게 유지) | *"이 프로젝트의 규칙은?"* |
| **Agent** | 독립된 역할/도구/모델을 가진 위임 대상 | *"누가 할 것인가?"* |
| **Skill** | 특정 작업의 실행 절차 | *"어떻게 할 것인가?"* |

> Skill 추가 = `.claude/skills/` 폴더에 SKILL.md 작성. CLAUDE.md 수정 불필요.
> Agent 추가 = `.claude/agents/` 폴더에 .md 작성. CLAUDE.md 수정 불필요.

---

## 프로젝트 디렉토리 구조

```
프로젝트 루트/
├── CLAUDE.md                        ← 프로젝트 공통 지침 (200줄 이하)
├── .claude/
│   ├── settings.json                ← 권한, 환경변수, hooks
│   │
│   ├── agents/                      ← Agent 정의
│   │   ├── researcher.md
│   │   └── document.md
│   │
│   ├── skills/                      ← Skill 정의
│   │   ├── create-note/
│   │   │   └── SKILL.md
│   │   └── index-docs/
│   │       └── SKILL.md
│   │
│   └── rules/                       ← 경로 기반 조건부 지침
│       └── markdown-style.md
│
└── .mcp.json                        ← MCP 서버 설정
```

---

## Agent 작성법

### 파일 위치

```
.claude/agents/researcher.md
```

### 예시: Research Agent

```markdown
---
name: researcher
description: 자료 조사, 코드 탐색, 정보 수집이 필요할 때 사용
tools: Read, Grep, Glob, WebSearch, WebFetch
disallowedTools: Write, Edit
model: haiku
memory: project
---

# Research Agent

리서치 요청을 받으면:

1. 프로젝트 내 관련 파일 탐색
2. 웹 검색으로 외부 자료 수집
3. 결과를 구조화하여 요약 보고
```

### 예시: Document Agent

```markdown
---
name: document
description: 문서 작성, 편집, 정리 작업을 수행
tools: Read, Write, Edit, Glob, Grep
model: sonnet
memory: project
---

# Document Agent

문서 관련 요청을 받으면:

1. 대상 파일/폴더 확인
2. 기존 문서 구조 파악
3. 요청에 맞게 작성 또는 편집
```

### frontmatter 주요 필드

| 필드 | 설명 | 예시 |
|------|------|------|
| `name` | Agent ID (소문자+하이픈) | `researcher` |
| `description` | Claude Code가 자동 위임할 판단 기준 | `자료 조사가 필요할 때` |
| `tools` | 사용 가능한 도구 (화이트리스트) | `Read, Grep, Glob` |
| `disallowedTools` | 사용 금지 도구 | `Write, Edit` |
| `model` | 실행 모델 | `haiku`, `sonnet`, `opus` |
| `memory` | 세션 간 학습 저장 | `project`, `user`, `local` |
| `permissionMode` | 권한 모드 | `default`, `acceptEdits` |
| `maxTurns` | 최대 실행 턴 수 | `50` |

### 호출 방식

```
# 자동 호출 — Claude Code가 description 기반으로 판단
사용자: "이 코드의 인증 로직을 조사해줘"
→ Claude Code가 researcher agent에 자동 위임

# 명시적 호출 — @mention
사용자: @researcher 이 프로젝트의 테스트 구조를 분석해줘

# CLI 호출
$ claude --agent researcher
```

---

## Skill 작성법

### 파일 위치

```
.claude/skills/create-note/SKILL.md
```

### 예시: 노트 생성 Skill

```markdown
---
name: create-note
description: 노트나 학습 문서를 생성할 때 사용
argument-hint: <주제>
user-invocable: true
allowed-tools: Read, Write, Edit, Glob
---

# 노트 생성

$ARGUMENTS 주제로 노트를 생성한다.

## 절차

1. 기존 노트 폴더 구조 확인
2. 템플릿이 있으면 템플릿 기반으로 생성
3. YAML frontmatter 포함 (title, date, author, tags)
4. 내용 작성 후 저장
```

### 예시: 문서 index 정리 Skill

```markdown
---
name: index-docs
description: 문서 목록을 스캔하여 index를 생성하거나 업데이트
user-invocable: true
allowed-tools: Read, Write, Edit, Glob, Grep
---

# 문서 Index 정리

## 절차

1. 대상 디렉토리의 .md 파일 전체 스캔
2. 각 파일의 frontmatter에서 title, date, category 추출
3. index 파일 생성 또는 업데이트
4. 카테고리별 분류 적용
```

### frontmatter 주요 필드

| 필드 | 설명 | 예시 |
|------|------|------|
| `name` | Skill ID (소문자+하이픈), `/name`으로 호출 | `create-note` |
| `description` | Claude Code가 자동 호출할 판단 기준 | `노트를 생성할 때` |
| `argument-hint` | 자동완성 시 인자 힌트 | `<주제>` |
| `user-invocable` | 사용자가 `/`로 직접 호출 가능 여부 | `true` / `false` |
| `disable-model-invocation` | `true`면 수동 호출만 가능 | `true` |
| `allowed-tools` | 이 Skill에서 사용 가능한 도구 | `Read, Write` |
| `model` | 실행 모델 | `haiku` |

### 호출 방식

```
# 슬래시 명령 — 사용자가 직접 호출
사용자: /create-note ROS2 기초 정리

# 자동 호출 — Claude Code가 description 기반으로 판단
사용자: "노트 만들어줘"
→ Claude Code가 create-note skill 자동 매칭
```

---

## 동작 흐름

### Case 1: Skill 직접 호출

```
사용자: /create-note ROS2 기초
  → Claude Code가 .claude/skills/create-note/SKILL.md 로드
    → SKILL.md의 절차대로 실행
      → 노트 파일 생성 완료
```

### Case 2: Agent 자동 위임

```
사용자: "이 프로젝트의 API 구조를 조사해줘"
  → Claude Code가 description 매칭
    → .claude/agents/researcher.md 로드
      → researcher가 제한된 도구(Read, Grep)로 조사 수행
        → 결과를 메인 Claude Code에 반환
```

### Case 3: Agent + Skill 조합

```
사용자: "조사해서 노트로 정리해줘"
  → Claude Code가 researcher agent에 조사 위임
    → 조사 결과 반환
      → Claude Code가 create-note skill 실행
        → 노트 파일 생성 완료
```

---

## 디스패처 패턴과의 비교

| 항목 | 디스패처 패턴 | 공식 구조 |
|------|-------------|----------|
| Agent 정의 | CLAUDE.md 매핑 테이블 | `.claude/agents/*.md` |
| Skill 정의 | 별도 .md 수동 매핑 | `.claude/skills/*/SKILL.md` |
| 라우팅 | Root CLAUDE.md가 수동 디스패치 | description 기반 자동 매칭 |
| 도구 제한 | 불가 (텍스트 권고만) | frontmatter로 강제 |
| 모델 분리 | 불가 | Agent/Skill별 모델 지정 |
| 권한 격리 | 불가 | permissionMode로 격리 |
| Skill 추가 시 | CLAUDE.md 테이블 수정 필요 | 파일만 추가하면 끝 |
| 세션 간 학습 | 불가 | memory 옵션으로 지속 |

---

## 핵심 규칙 요약

1. **CLAUDE.md는 가볍게** — 공통 규칙만 담고 200줄 이하 유지
2. **Agent는 역할 단위** — 조사, 문서작성, 리뷰 등 역할별로 분리
3. **Skill은 작업 단위** — 노트 생성, index 정리 등 구체적 작업별로 분리
4. **frontmatter가 핵심** — 자동 매칭, 도구 제한, 모델 지정 모두 frontmatter로 제어
5. **파일 추가 = 기능 추가** — CLAUDE.md 수정 없이 agents/, skills/ 폴더에 파일만 추가
