# 실습 폴더 (`claude-lecture-workspace`) 구조 설계

> 수강생이 ZIP으로 다운로드해 VS Code로 여는 강의 공통 작업 폴더.
> GitHub Public 저장소로 운영 → "Code > Download ZIP" 또는 `git clone`.

---

## 🎯 설계 원칙

1. **빈 폴더 0개** — 모든 폴더에 README나 샘플 파일을 둬서 git이 추적 가능
2. **한글·공백 폴더명 금지** — Windows·OneDrive 동기화 이슈 방지
3. **주차별 분리** — `week1/`, `week2/` 등으로 진도와 1:1 매칭
4. **결과물은 `output/`** — 입력은 `input/`, AI 결과는 `output/` 으로 분리
5. **`.claude/` 는 비워서 시작** — 수강생이 직접 채워나가는 공간

---

## 📁 전체 구조

```
claude-lecture-workspace/
├── README.md                       # 첫 화면, 강의 안내 + 폴더 가이드
├── CLAUDE.md                       # Claude에게 주는 프로젝트 규칙(시작용 템플릿)
├── .claude/
│   ├── skills/
│   │   └── .gitkeep                # Week 3에 채울 빈 자리
│   └── agents/
│       └── .gitkeep                # Week 4에 채울 빈 자리
│
├── week1-first-app/
│   ├── README.md                   # 1주차 미션 안내
│   ├── samples/
│   │   └── about-me-template.html  # 자기소개 페이지 시작 템플릿
│   └── output/                     # 학생 결과물 저장 위치
│       └── .gitkeep
│
├── week2-skill-usage/
│   ├── README.md                   # 2주차 품의서 자동화 실습 안내
│   ├── 10_input/                   # 견적서 이미지 두는 곳
│   │   ├── sample-quote-1.png      # 강의용 샘플 견적서
│   │   └── sample-quote-2.png
│   ├── 20_extracted/               # /img-to-docs 결과 마크다운
│   │   └── .gitkeep
│   ├── 30_output/                  # /approval-doc 결과 HTML
│   │   └── .gitkeep
│   └── .claude/skills/             # 강의용 사전 제공 Skill 사본
│       ├── img-to-docs/
│       └── approval-doc/
│
├── week3-skill-creation/
│   ├── README.md                   # 시나리오 카탈로그 요약 + 과제 안내
│   ├── samples/
│   │   ├── my-blog-sample.md       # 블로그 톤 학습용 샘플
│   │   ├── meeting-transcript.txt  # 회의록 처리 실습용
│   │   └── messy-data.xlsx         # 엑셀 정리 실습용
│   └── output/
│       └── .gitkeep
│
├── week4-agents/
│   ├── README.md                   # Agent 실습 안내
│   ├── samples/
│   │   └── multi-quote-folder/     # 견적서 여러 장 (approval-agent 데모용)
│   └── output/
│       └── .gitkeep
│
├── docs/                           # 강의 자료 사본 (오프라인 열람)
│   ├── install-guide.md
│   ├── skill-catalog.md
│   └── agent-samples.md
│
└── .gitignore
```

---

## 📝 주요 파일 내용

### `README.md` (루트)

```markdown
# Claude Code 4주 강의 실습 워크스페이스

이 폴더는 Claude Code 강의 4주 동안 함께 사용하는 공통 작업 공간입니다.

## 처음 여는 분에게
1. VS Code로 이 폴더를 열기 (`Ctrl+K, Ctrl+O` / Mac: `Cmd+K, Cmd+O`)
2. Claude 사이드바에서 "이 폴더 뭐 있어?" 입력
3. 응답이 오면 환경 OK ✅

## 폴더 가이드
- `week1-first-app/` — 1주차: 첫 응용 프로그램 만들기
- `week2-skill-usage/` — 2주차: 만들어진 Skill로 품의서 자동화
- `week3-skill-creation/` — 3주차: 나만의 Skill 만들기
- `week4-agents/` — 4주차: Skill을 Agent로 확장
- `docs/` — 강의 자료 사본
- `.claude/` — 수강생이 직접 채워나갈 Skill·Agent 폴더

## 주차별 입출력 규칙
- 입력 파일: `weekN-*/samples/` 또는 `10_input/`
- 결과 파일: `weekN-*/output/` 또는 `30_output/`
```

### `CLAUDE.md` (루트, 시작 템플릿)

```markdown
# 프로젝트 규칙

## 응답 언어
- 모든 응답은 **한국어** 로 작성한다.

## 결과물 저장 위치
- 자동 생성된 결과물은 해당 주차의 `output/` 폴더에 저장한다.
- 입력 파일은 절대 덮어쓰지 않는다.

## 코드 스타일
- 파이썬은 표준 라이브러리 우선, 외부 패키지는 꼭 필요할 때만.
- HTML은 인라인 스타일 대신 `<style>` 블록 사용.

## 검수
- 결과물 생성 후 한 줄 요약 + 검수 포인트 3개를 함께 출력한다.
```

### `.gitignore`

```
# OS
.DS_Store
Thumbs.db
desktop.ini

# Editor
.vscode/
.idea/

# Python
__pycache__/
*.pyc
.venv/
venv/

# 학생 결과물 — 강의 후 git push 안 하도록
**/output/*
!**/output/.gitkeep

# 환경 변수
.env
*.local

# 임시
*.tmp
*.log
```

### `week1-first-app/README.md`

```markdown
# Week 1 — 첫 응용 프로그램 만들기

## 미션
Claude Code와 대화하면서 "자기소개 페이지" 만들기

## 시작점
- `samples/about-me-template.html` 에 비어있는 골격이 있습니다.
- "이 파일을 내 정보로 채워서 멋지게 꾸며줘" 같이 요청해 보세요.

## 결과물
- `output/about-me.html` 로 저장
- 브라우저로 직접 열어 확인

## 도전 과제
- 다크 모드 토글 버튼 추가
- 좋아하는 책/영화 카드 섹션 추가
```

### `week2-skill-usage/README.md`

```markdown
# Week 2 — Skill로 품의서 자동화

## 실습 흐름 (3단계)
1. `10_input/` 의 견적서 이미지 확인
2. `/img-to-docs` 호출 → `20_extracted/` 에 마크다운 생성 + 검수
3. `/approval-doc` 호출 → `30_output/` 에 HTML 품의서 완성

## 도전 과제
- 결재선을 "팀장 → 본부장 → 대표" 로 변경 요청
- 금액 단위 만 원 ↔ 천 원 변환 요청
```

### `week3-skill-creation/README.md`

```markdown
# Week 3 — 나만의 Skill 만들기

## 카탈로그
`docs/skill-catalog.md` 의 7개 시나리오 중 본인이 선택한 것을 만든다.

## 작업 위치
- 만든 Skill: `.claude/skills/{skill-name}/SKILL.md`
- 테스트 입력: `samples/`
- 결과물: `output/`

## 체크리스트
- [ ] frontmatter (name, description) 작성
- [ ] 절차를 번호로 명시
- [ ] 입력/출력 위치 명시
- [ ] 실제로 1번 호출해서 결과 확인
```

### `week4-agents/README.md`

```markdown
# Week 4 — Skill을 Agent로

## 실습
3주차에 만든 Skill 1~2개를 묶는 Agent를 작성한다.

## 작업 위치
- 만든 Agent: `.claude/agents/{agent-name}.md`
- 참고: `docs/agent-samples.md` 의 3종 샘플

## 체크리스트
- [ ] Agent의 한 가지 책임을 한 줄로 정의했는가
- [ ] 어떤 Skill을 언제 부르는지 명시했는가
- [ ] 사용자 확인이 필요한 작업을 명시했는가
- [ ] Git 커밋 1회 이상
```

---

## 🚀 GitHub 저장소 운영

- **저장소명**: `claude-lecture-workspace`
- **Visibility**: Public (수강생 누구나 ZIP 다운로드 가능)
- **License**: MIT 또는 CC0 (수강생이 fork·수정 자유)
- **Branch**: `main` 만 사용. 강의 진행 중 자료가 갱신되면 새 commit + Release 태그
- **Release**: 강의 시작 1주 전 `v1.0` 태그 + ZIP 첨부

### 제공 ZIP 다운로드 흐름
1. 학생이 GitHub Release 페이지 접속
2. `claude-lecture-workspace-v1.0.zip` 다운로드
3. 압축 해제 → VS Code로 열기

### 강사 갱신 시
- 작은 수정: main에 commit, 학생에게 `git pull` 안내
- 큰 변경(주차 추가): 새 Release 태그 (`v1.1`)

---

## 📌 강사가 사전에 만들어야 할 것

| 자산 | 비고 |
|------|------|
| `sample-quote-1.png`, `sample-quote-2.png` | 가짜 회사명·금액의 견적서 이미지 (개인정보 없는 더미) |
| `meeting-transcript.txt` | 가상 회의 녹취록 200~400자 |
| `messy-data.xlsx` | 중복·결측 의도적으로 포함한 더미 데이터 |
| `img-to-docs/`, `approval-doc/` Skill 사본 | automation-hub 강의 자료에서 가져와 사전 배포 |
| `about-me-template.html` | 비어있는 자기소개 골격 |
