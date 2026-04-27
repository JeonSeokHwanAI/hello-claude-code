# Week 4 — 상세 강의안

> **주제**: Skill ↔ Agent 연동 + 마무리
> **시간**: 90분 (3교시 × 30분)
> **선수 학습**: Week 3 (Skill 1~2개 완성)
> **참고**: [`agent-samples.md`](./agent-samples.md)

---

## 🎯 학습 목표

1. Skill과 Agent의 차이 한 문장 설명
2. `.claude/agents/` 폴더에 본인 Agent 1개 작성·호출
3. Skill 1~2개를 묶은 미니 워크플로우 동작 확인
4. 강의 이후 학습 경로 인지 (MCP, SDK, 커뮤니티)

---

## ⏱️ 타임라인

| 시간 | 내용 |
|------|------|
| 0:00–0:05 | 인사 + 3주차 우수작 1~2개 시연 |
| 0:05–0:30 | **1교시: Agent 개념 + 비교 데모** |
| 0:35–1:00 | **2교시: 내 Skill을 Agent에 태우기** |
| 1:05–1:30 | **3교시: 운영 팁 + 시연 발표 + Q&A** |
| 1:30 | 수료 안내 |

---

# 📋 슬라이드 목차

## 🎬 오프닝 (5분)

**Slide 1** — Week 4 제목 / "오늘이 마지막입니다"
**Slide 2** — 3주차 우수작 시연 (1~2명)
**Slide 3** — 4주 여정 한 컷 (체험 → 사용 → 제작 → 연동)

## 1교시 — Agent 개념 + 비교 (25분)

**Slide 4 — Skill vs Agent 한 장 정리** (5분)
| | Skill | Agent |
|---|-------|-------|
| 정체성 | 정해진 절차 | 절차를 **선택** |
| 호출 | `/명령어` | 위임/체이닝 |
| 비유 | 엑셀 매크로 | 비서 |

**Slide 5 — 왜 Agent를 쓰면 좋은가** (3분)
- 컨텍스트 절약 (메인 대화 깨끗)
- 여러 Skill 자동 선택
- 병렬 작업

**Slide 6 — Subagent 종류 (Claude Code 내장)** (3분)
- `Explore` — 탐색 전문
- `Plan` — 계획 수립 전문
- `general-purpose` — 자유 작업

**Slide 7 — 라이브 비교 데모** (10분)
**같은 작업: "이 견적서 폴더로 품의서 만들어줘"**

(a) **Skill만**: `/img-to-docs` → 결과 보고 → `/approval-doc` → 결과 보고 (사용자가 매번 다음 단계 지시)

(b) **Agent + Skill**: `approval-agent`에게 폴더 던지기 → 알아서 두 Skill 연속 호출 + 결재선 자동 결정 + 한 번의 보고

→ **시간 차이 + 인지 부하 차이** 실감

**Slide 8 — Agent 폴더 구조** (4분)
```
.claude/agents/{agent-name}.md
---
name:
description:
tools: Read, Write, ...
---
시스템 프롬프트 본문
```

## 2교시 — 내 Skill을 Agent에 태우기 ⭐ (25분)

**Slide 9 — 샘플 3종 빠르게 훑기** (5분)
- `blog-agent` — 자료조사 + 블로그 Skill
- `work-secretary` — 입력 보고 Skill 자동 분기
- `approval-agent` — 견적서 폴더 → HTML 품의서

**Slide 10 — 라이브 작성: `work-secretary`** (10분)
1. `.claude/agents/work-secretary.md` 생성
2. frontmatter 작성 (name, description, tools)
3. 시스템 프롬프트:
   - 역할 1줄
   - 입력 분류 규칙 (회의록 → /meeting-actions, 메일 → /mail-reply)
   - 거절 규칙 (확인 없이 발송 금지)
4. 호출 시연: 회의록 텍스트 던지기 → 알아서 처리

**Slide 11 — 좋은 Agent 체크리스트** (3분)
- [ ] 한 가지 책임에 집중
- [ ] 어떤 Skill을 언제 부르는지 명시
- [ ] 모호한 입력의 기본 동작 정의
- [ ] "사용자 확인 필요" 작업 명시
- [ ] 출력 양식 고정

**Slide 12 — 자유 작업 (7분)**
- 본인 Skill 1~2개를 묶는 미니 Agent 1개 작성
- 강사·조교 1:1 코칭

## 3교시 — 운영 팁 + 시연 + Q&A (25분)

**Slide 13 — 운영 팁: 권한** (3분)
- `/permissions` 로 자주 쓰는 명령 자동 허용
- 위험 명령(force push, rm -rf)은 항상 수동 확인

**Slide 14 — 운영 팁: 막혔을 때** (3분)
- Claude가 헛다리 짚으면 → `/clear` 로 컨텍스트 리셋
- 새 세션에서 다시 시도
- description 한 줄을 더 구체적으로 고치는 게 90%의 해결책

**Slide 15 — 운영 팁: Git 버전 관리** (5분)
- 만든 Skill·Agent를 GitHub에 백업
- VS Code 통합 터미널에서 `claude` 명령 실행 (Windows: Git Bash)
- 짧은 시연: "이번 주 변경사항 커밋해줘"

**Slide 16 — 시연 발표** (8분)
- 자원자 2~3명, 1인 2~3분
- 본인 Agent + Skill 조합 자랑

**Slide 17 — 더 깊이 배우려면** (3분)
- 공식 문서: docs.claude.com/claude-code
- **MCP** — Gmail·Notion·Slack 같은 외부 도구를 Agent에 연결
- **Claude Agent SDK** — 코드로 Agent를 더 정밀 제어
- 본인이 만든 Agent 동기들과 공유 = 가장 빠른 학습

**Slide 18 — 단축키·팁 모음 한 장** (1분)
- `/clear`, `/compact`, `/help`, `/permissions`
- 이미지 드래그 앤 드롭으로 첨부
- 한국어 응답 강제: CLAUDE.md에 한 줄

**Slide 19 — Q&A 자유 시간** (2분)

## 🎁 수료 (5분)

**Slide 20 — 4주 동안 한 일 정리**
- ✅ 환경 구축
- ✅ 첫 응용 프로그램
- ✅ Skill 사용 (품의서 자동화)
- ✅ Skill 직접 작성 (블로그·SNS·업무)
- ✅ Agent 연동 (워크플로우 자동화)

**Slide 21 — 다음 1개월 권장 학습 경로**
- 1주차: 만든 Skill 매일 사용
- 2주차: 부족한 부분 description·절차 개선
- 3주차: 새 시나리오 1개 추가
- 4주차: 동기들과 Agent 1개씩 교환·리뷰

**Slide 22 — 감사 인사 + 후기 요청**

---

## 🎓 강사 메모

### 자주 나올 질문
- **Q. Agent와 Skill 둘 다 만들면 너무 많아지지 않나?** A. Skill이 부품, Agent가 조립품. 조립품을 매번 만들 필요는 없고, 자주 묶어 쓰는 1~2개 패턴만 Agent화.
- **Q. Agent끼리 호출하나?** A. 가능. 다만 입문자는 한 단계만 — 메인 대화 → Agent → Skill.
- **Q. MCP는 강의에서 안 다루나?** A. 4주에 다 못 넣음. 후속 학습 자료로 안내.

### 시간 압박 대응
- 1교시 비교 데모 길어지면 → Slide 7 (b) 시연을 짧게
- 2교시 자유 작업 빠듯하면 → 시연 발표를 1명으로
- Q&A 모자라면 → 강의 후 잔류 30분 안내

### 수료 후 운영
- 후속 단톡방 / 디스코드 안내 (옵션)
- 우수 시연자에게 인터뷰 제안 (다음 기수 마케팅 자료)
