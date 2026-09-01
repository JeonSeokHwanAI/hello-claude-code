# Hello Claude Code — 4주 화상강의 커리큘럼

> **강의명**: Hello Claude Code
> **대상**: Claude를 조금 사용해봤거나 한 번도 써보지 않은 입문자
> **형식**: 4주 / 주 1회 화상강의
> **일정**: 매주 **수요일 저녁 9:00 시작** (기본 2시간, 종료 시간 유동)
> **회차 일정**:
> - **Kickoff (희망자)**: 5/13 (수) 21:00~ — 사전 인사·환경 점검·강의 안내
> - Week 1: 5/20 (수) 21:00~ — Claude Code 첫 만남
> - Week 2: 5/27 (수) 21:00~ — Skill 이해와 사용 *(사례발표 5분 이내)*
> - Week 3: 6/03 (수) 21:00~ — Skill 직접 만들기 *(사례발표 5분 이내)*
> - Week 4: 6/10 (수) 21:00~ — Skill ↔ Agent 연동 *(사례발표 5분 이내)*
>
> **강의 철학**: "보기만 하면 못 따라온다." 매 회차 **라이브 데모 → 따라하기 → 자기 사례 적용** 3단 구조로 진행

---

## 🗺️ 전체 로드맵

| 주차 | 테마 | 한 줄 목표 |
|------|------|------------|
| Week 0 (사전) | 환경 구축 | 강의 시작 전 설치·로그인 완료 |
| Week 1 | Claude Code 첫 만남 | 내 컴퓨터에서 Claude가 코드를 만지는 첫 경험 |
| Week 2 | Skill 이해와 사용 | 만들어진 Skill로 업무 자동화 한 사이클 |
| Week 3 | Skill 직접 만들기 (블로그·SNS·업무) | 내 일상 시나리오를 Skill로 |
| Week 4 | Skill ↔ Agent 연동 | 내 Skill을 Agent에 태워 한 단계 위로 |

---

## Week 0 (사전 준비) — 환경 구축

> 강의 시작 **전**에 수강생이 미리 완료해 오는 단계. 1주차를 설치 트러블슈팅으로 낭비하지 않기 위함.
> **이번 강의는 VS Code + Claude 확장(extension) 기반**으로 진행한다. 터미널 사용법은 3주차에 다루므로, 사전 준비 단계에서는 **터미널을 거의 다루지 않아도 되도록** 가이드한다.

### 🎯 Week 0 완료 기준 (체크리스트)

> 구성은 참고 자료 *automation-hub Chapter 05 환경 설정* 을 기반으로 하되, **Codex(OpenAI) 확장은 제외**한다 (본 강의는 Claude Code 단일 도구로 진행).

#### 1단계 — 기본 프로그램 3종 설치

- [ ] **1. VS Code 설치** — 코드 편집기, Claude Code가 여기서 실행됨
   - https://code.visualstudio.com/
- [ ] **2. Python 3.11.9 설치** — AI가 코드 실행 시 필요한 프로그래밍 언어
   - https://www.python.org/downloads/release/python-3119/
   - **Windows**: 설치 시 ⚠️ "Add Python to PATH" 체크박스 반드시 켜기
   - **Mac**: 공식 인스톨러(.pkg) 사용
- [ ] **3. Git 설치** — 파일 버전 관리, Claude Code 실행에 필요
   - **Windows**: Git for Windows — https://git-scm.com/install/windows
     - 옵션은 대부분 기본값으로 진행 ("Git Bash Here" 유지)
   - **Mac**: 터미널에서 `git --version` 실행 시 자동으로 설치 안내 / 또는 https://git-scm.com/download/mac

#### 2단계 — AI 확장 설치

- [ ] **4. VS Code에 Claude Code 확장 설치** (Marketplace에서 "Claude Code" 검색 → Install)
- [ ] **5. Claude Code 확장 로그인** (Anthropic 계정 → 사이드바 Claude 아이콘 → Sign in → 브라우저 인증)

#### 3단계 — 실습 프로젝트 폴더 준비

- [ ] **6. 강의용 실습 폴더 다운로드 & 열기**
   - GitHub 저장소에서 ZIP 다운로드 → 압축 해제
   - VS Code에서 `Ctrl+K, Ctrl+O` (Mac: `Cmd+K, Cmd+O`) 로 폴더 열기
- [ ] **7. 동작 확인**: 열린 폴더에서 Claude 패널에 "이 폴더 뭐 있어?" 입력 → 파일 목록을 답하면 OK

### 📦 사전 배포 자료 (수강생용)

1. **설치 가이드 문서** (스크린샷 포함, OS별 분리)
   - **Windows**: VS Code → Python 3.11.9 (PATH 체크) → Git for Windows → Claude 확장 → 로그인 → 실습 폴더 열기
   - **Mac**: VS Code → Python 3.11.9 → Git (필요 시) → Claude 확장 → 로그인 → 실습 폴더 열기 (권한 팝업 대응 안내)
2. **실습용 프로젝트 폴더** (GitHub 저장소 + ZIP)
   - 폴더명 예: `claude-lecture-workspace`
   - 강의 전 회차에서 사용할 샘플 파일들 포함
   - 동작 확인 미션: "이 폴더 열고 Claude에게 '여기 뭐 있어?' 물어보세요"
3. **막힐 때 연락 채널** 안내 (카톡방 / 디스코드 / 이메일)
4. **자주 묻는 질문(FAQ) 1페이지**
   - "확장이 안 보여요" → VS Code 버전 업데이트
   - "로그인 창이 안 떠요" → 브라우저 기본값 확인
   - "응답이 안 와요" → 인터넷 / 로그인 상태 확인

### 🛠️ 강사 측 준비물

- OS별(특히 Windows) 설치 트러블슈팅 FAQ 문서
- 강의 첫날 **5~10분 "환경 점검 타임"** 확보 — 끝까지 안 된 사람만 1:1 도움
- 사전 안내: **Anthropic 유료 결제 필수** (claude.ai 웹 버전은 실습용으로 사용하지 않음)

### ⚠️ 의도적으로 다루지 **않는** 것 (Week 0 단계)

- ❌ 터미널에서 `claude` CLI 실행 → **3주차에 별도로 다룸** (Week 0에서는 설치만)
- ❌ Codex(OpenAI) 확장 → 본 강의는 Claude Code 단일 도구로 진행
- ❌ API 키 발급 → Anthropic 계정 로그인으로 충분
- ❌ GitHub 계정/연동 워크플로우 → 3주차

> 이유: 입문자에게 "터미널·CLI"는 가장 큰 진입장벽이다. 1~2주차는 VS Code 사이드바 클릭만으로 모든 실습이 가능하도록 설계해야 이탈을 줄일 수 있다.

---

## Week 1 — Claude Code 첫 만남

**목표**: "내 컴퓨터에서 Claude가 실제로 코드를 만진다"는 감각을 첫날에 체득한다. (환경은 이미 구축된 상태)

### 1교시 | Claude Code란 무엇인가
- ChatGPT / 웹 Claude와 무엇이 다른가 — 터미널에서 파일을 직접 읽고 쓴다
- Claude Code가 잘하는 일 / 못하는 일
- 강의 전체 로드맵 안내
- (5분) 환경 점검 — VS Code Claude 확장 패널이 열리는지 확인

### 2교시 | 첫 대화 실습
- VS Code에서 빈 폴더 열기 → Claude 사이드바 패널 둘러보기
- 간단한 파일 읽기 / 요약 시키기
- "Hello World" 만들기 → 실행까지
- 권한 모드(permission) 이해: yes/no가 왜 뜨는가

### 3교시 | 작은 결과물 만들어보기
- 라이브 데모: 자기소개 HTML 페이지를 Claude와 함께 만들기
- 따라하기: 수강생도 동일하게 진행
- "이렇게 시키면 더 잘하더라" 팁 몇 가지 공유

### 🏠 과제
자기소개 페이지(HTML 또는 Python script) 하나를 Claude Code와 함께 본인 스타일로 완성해 오기

---

## Week 2 — Skill 이해와 사용

**목표**: Skill의 개념을 이해하고, **기존에 만들어진 Skill을 사용해** 업무 자동화 한 사이클을 직접 돌려본다. (만드는 건 3주차)
**참고 자료**: [automation-hub Chapter 01~04, 06](https://automation-hub-virid.vercel.app/) 기반

### 1교시 | 이론 — 왜 Claude Code이고, Skill이란 무엇인가
*(automation-hub Ch 01~03)*

- **AI의 종류와 코딩 AI** (Ch 01) — 대화형 / 이미지 / 코딩 / 특화
- **웹 챗봇 vs CLI·IDE AI** (Ch 02) — 파일 접근, 실행, 연속 작업
- **Claude Code 핵심 구조** (Ch 03) — 입력 → 작업 → 출력, 마크다운이 공용어인 이유
- 1주차 응용 프로그램 경험을 이 구조에 매핑해 보기

### 2교시 | Skill 개념 + 사례 데모
*(automation-hub Ch 04)*

- **Skill = AI 업무 매뉴얼** — 사람의 SOP(표준작업절차)에 비유
- 슬래시 커맨드로 호출되는 재사용 절차
- **현장 Skill 3종 라이브 데모**
   - `/img-to-docs` — 이미지 → 마크다운/Excel
   - `/approval-doc` — 견적 데이터 → HTML 품의서
   - `/translate-pdf` — PDF 레이아웃 유지 번역
- **자동화 효과 체감**: 품의서 55분 → 7분, 번역 2~3일 → 5~15분
- 토론 5분: "내 업무 중 자동화할 만한 게 뭐가 있을까?"

### 3교시 | 실습 — 품의서 자동화 3단계 직접 실행
*(automation-hub Ch 06)*

1. 견적서 이미지 → `10_input/` 폴더 배치
2. `/img-to-docs` 실행 → 마크다운 생성 + 결과 검수
3. `/approval-doc` 실행 → HTML 품의서 완성
4. 수정 요청 체험 ("금액 단위 바꿔줘", "결재선 추가해줘")
- 핵심 메시지: 이번 주는 **사용자**, 다음 주는 **제작자**

### 🏠 과제
- 본인 업무 중 자동화 후보 **1개 선정 + 현재 절차를 글로 정리** (Week 3 Skill 작성 재료)
- 다음 주 시나리오 카탈로그(블로그 / SNS / 메일 / 보고서 등) 중 **해보고 싶은 1개** 미리 정해 오기

---

## Week 3 — Skill 직접 만들기 ⭐ (블로그·SNS·업무 시나리오)

**목표**: 2주차에 사용해 본 Skill을 **이번에는 직접 만든다**. 흥미를 끌 수 있는 실전 시나리오(블로그·SNS·업무)를 재료로 사용해 "내가 만든 Skill이 실제로 동작한다"는 성공 경험을 만든다.

### 1교시 | Skill 내부 구조 + 첫 Skill 만들기
- Skill 분해: `.claude/skills/` 폴더 구조 / frontmatter (name, description) / 본문 마크다운
- 2주차에 쓴 `/approval-doc` Skill 열어서 역분석
- **첫 Skill 라이브 작성** (강사 시연 + 수강생 따라하기)
   - 예시: "주간 업무 일지 자동 생성" — 가장 단순한 입력→출력 형태
- 좋은 Skill 작성 원칙
   - 입력/출력 명시, 단계 쪼개기, 예시 첨부, 실패 케이스 안내

### 2교시 | 시나리오 카탈로그 — 흥미를 부르는 실전 Skill 🚀

> 강사가 카탈로그를 준비, 수강생 투표/관심도에 따라 2~3개를 깊게 다루고 나머지는 자료 배포.

**🎨 콘텐츠/SNS**
- 🅰️ **네이버 블로그 자동 작성** — 키워드 → 톤·소제목·해시태그 / 본인 말투 학습
- 🅱️ **인스타 캡션 + 해시태그** — 사진 1장 → 캡션 3안
- 🅲️ **쇼츠/릴스 스크립트** — 30초 후킹 멘트 + CTA

**💼 업무**
- 🅳️ **회의록 → 액션 아이템 분리** — 결정사항/TODO/담당자/마감
- 🅴️ **메일 회신 초안** — 받은 메일 + 의도 → 초안
- 🅵️ **일일/주간 업무 보고서** — 작업 파일·메모 → 양식 맞춤 보고서
- 🅶️ **엑셀 데이터 정리** — 정렬·중복 제거·요약 표

### 3교시 | 내 시나리오 적용 + 시연

- 수강생이 미리 정해 온 시나리오로 **본인 Skill 직접 구현**
- 강사 1:1 코칭 (10분씩 순회)
- 마지막 15분: **시연 발표** — 1인 2~3분씩 본인 Skill 자랑
- 우수 사례 1~2개는 4주차 Agent 변환 데모 재료로 활용

### 🏠 과제
- 본인 Skill **1~2개 완성**해서 실제로 사용해 보기
- 사용 로그/개선 포인트 메모 → **Week 4에서 Agent로 확장할 재료**

---

## Week 4 — Skill ↔ Agent 연동 🤖

**목표**: 3주차까지 만든 Skill을 **Agent와 연결**해 한 단계 위 수준의 자동화로 끌어올린다. "Skill = 절차, Agent = 그 절차를 알아서 골라 쓰는 일꾼"이라는 멘탈 모델을 잡고, 본인 Skill을 Agent 워크플로우에 태운다.

### 1교시 | Agent란 무엇인가 + Skill과의 관계
- **Skill vs Agent 한 장 정리**
   - Skill = 정해진 절차(매뉴얼) — 부르면 그대로 실행
   - Agent = 목표를 받고 **어떤 Skill·도구를 쓸지 스스로 결정**하는 실행자
- Claude Code의 Subagent 종류와 쓰임
   - `Explore` — 코드/파일 탐색
   - `Plan` — 작업 계획 수립
   - `general-purpose` — 자유 작업
- "왜 Agent를 쓰면 좋은가" — 컨텍스트 절약, 병렬 작업, 역할 분담
- 라이브 시연: 같은 작업을 (a) Skill만 (b) Agent + Skill 조합으로 비교

### 2교시 | 내 Skill을 Agent에 태우기 ⭐ (메인 실습)
- **커스텀 Agent 만들기**
   - `.claude/agents/` 폴더 구조, frontmatter (name, description, tools)
   - 시스템 프롬프트에 "이 Agent는 어떤 Skill을 언제 호출하는지" 명시
- **3주차에 만든 Skill을 Agent에 연결**
   - 예시 1: `블로그-에이전트` — 주제만 던지면 자료조사 → `/네이버블로그작성` Skill 호출 → 결과 검토까지 한 번에
   - 예시 2: `업무비서-에이전트` — 메일 + 회의록 입력 → `/회의록정리` + `/메일회신` Skill 자동 선택·실행
   - 예시 3: `품의서-에이전트` — `/img-to-docs` + `/approval-doc` 연속 호출 + 결재선 자동 결정
- 수강생 실습: 본인 Skill 1~2개를 묶는 미니 Agent 1개 작성

### 3교시 | 마무리 — 운영 팁, 한 단계 더, Q&A
- Agent 사용 시 주의점
   - 권한(`/permissions`) — 위험 작업 가드
   - 컨텍스트 관리, `/clear`, 막혔을 때 대처법
- 만든 Skill·Agent를 **Git으로 버전 관리** (터미널 + Git 짧게 다룸 / Windows: Git Bash)
- 수강생 Agent 시연 발표 + 피드백
- 더 깊이 배우려면: 공식 문서 / MCP / Claude Agent SDK
- 단축키·팁 모음 배포

---

## 💡 강의 운영 팁

1. **매 회차 3단 구조 유지** — 라이브 데모 → 따라하기 → 자기 사례 적용
2. **Week 1~2는 비개발자도 따라올 수 있는 난이도**, Week 3부터 코드 비중 증가
3. **공통 실습 프로젝트 하나**(예: 개인 메모 앱)를 4주 내내 발전시키면 학습 응집도 ↑
4. **사전 설문 권장**: OS, 설치 가능 여부, 코딩 경험 정도를 미리 파악

---

## 📂 관련 자료

| 파일 | 용도 |
|------|------|
| [`install-guide.md`](./install-guide.md) | Week 0 수강생 배포용 설치 가이드 (Win/Mac, FAQ) |
| [`skill-catalog.md`](./skill-catalog.md) | Week 3 시나리오 카탈로그 (블로그/SNS/업무 7종) |
| [`agent-samples.md`](./agent-samples.md) | Week 4 Agent 샘플 3종 + 수강생 실습 가이드 |
| [`workspace-structure.md`](./workspace-structure.md) | 실습 폴더 `claude-lecture-workspace` 구조 + GitHub 운영 |
| [`week1-lesson-plan.md`](./week1-lesson-plan.md) | Week 1 90분 상세 강의안 |
| [`week2-lesson-plan.md`](./week2-lesson-plan.md) | Week 2 90분 상세 강의안 (Skill 사용·품의서) |
| [`week3-lesson-plan.md`](./week3-lesson-plan.md) | Week 3 90분 상세 강의안 (Skill 직접 만들기) |
| [`week4-lesson-plan.md`](./week4-lesson-plan.md) | Week 4 90분 상세 강의안 (Agent 연동·수료) |
| [`pre-survey.md`](./pre-survey.md) | 수강생 사전 설문지 (T-14일 발송) |
| [`dummy-assets-guide.md`](./dummy-assets-guide.md) | 강의용 더미 자산 명세 (견적서·회의록·엑셀 등) |
| [`skills-img-to-docs.md`](./skills-img-to-docs.md) | `/img-to-docs` Skill 본문 완성형 |
| [`skills-approval-doc.md`](./skills-approval-doc.md) | `/approval-doc` Skill 본문 완성형 |
| [`skill-design-thinking.md`](./skill-design-thinking.md) | **Week 3 핵심** — Skill 설계 4단계 사고 + AI Blog Writer 케이스 스터디 |
| [`web/`](./web/) | **강의 안내 웹사이트** (Vercel 배포용 정적 사이트) |

## 📌 다음 작업 후보 (선택)
- [ ] 학생 사례 모음용 회고 양식
- [ ] 강의 후 후속 학습 로드맵 (1개월 챌린지)
- [ ] MCP 연동 부록 (Gmail, Notion 등)
