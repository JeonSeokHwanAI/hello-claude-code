# 새 폴더 Claude Code 초기 구성 프롬프트

> 새 폴더를 만들 때마다 Claude Code에 그대로 붙여넣어 사용하세요.
> 더 편하게 쓰려면 `/init-workspace` Skill로 등록되어 있습니다 (`~/.claude/skills/init-workspace/`).

---

## 📋 복사용 프롬프트

```
이 폴더를 Claude Code 작업 공간으로 초기 구성해줘. 다음 세 가지를 만들어줘.

1. 루트에 `CLAUDE.md` 파일 생성
   - `# {폴더명}` 제목과 "TODO: 프로젝트 설명" 한 줄
   - 아래 섹션을 미리 만들어줘:
     - ## 프로젝트 개요  (비어 있음)
     - ## 폴더 구조  (아래 docs 구조를 그대로 기재)
     - ## 작업 규칙 (Claude가 따라야 할 규칙)  ← 아래 "Skill 구성 규칙" 을 미리 채워둔다
     - ## 자주 쓰는 명령  (비어 있음)
   - "## 작업 규칙" 섹션에는 아래 내용을 그대로 넣어줘:
     ```
     ### Skill 구성 규칙
     - 사용자가 생성한 Skill은 반드시 `.claude/skills/{스킬명}/SKILL.md` 형태로 만든다.
       (스킬명 폴더를 만들고 그 아래에 `SKILL.md`를 둔다 — `.claude/skills/SKILL.md` 처럼 평탄하게 두지 않는다)
     - Skill에서 사용하는 스크립트는 `.claude/skills/{스킬명}/scripts/` 아래에 둔다.
     - Skill이 참고하는 문서·예시·데이터 파일은 `.claude/skills/{스킬명}/references/` 아래에 둔다.
     ```
   - "## 폴더 구조" 섹션에는 아래 내용을 넣어줘:
     ```
     docs/
       10.input/      ← 외부에서 받은 원본 자료 (수정하지 않음)
       20.working/    ← 작업 중인 초안·중간 산출물
       30.output/     ← 최종 결과물 (공유·배포용)
       90.reference/  ← 참고 문서·링크·캡처
     ```
   - 마지막에 "이 문서는 Claude가 매 대화 시작 시 자동으로 읽는다"는 안내 한 줄 추가

2. `.claude/skills/` 폴더 생성
   - `.claude/skills/.gitkeep` 빈 파일 함께 생성 (빈 폴더는 git에 안 올라감)
   - `.claude/skills/README.md`에 "이 폴더에 Skill을 추가하면 Claude Code가 자동으로 인식한다"는 한 줄 안내

3. `docs/` 하위 작업 폴더 4개 생성 (빈 폴더만)
   - `docs/10.input/`
   - `docs/20.working/`
   - `docs/30.output/`
   - `docs/90.reference/`
   - 각 폴더에는 `.gitkeep`이나 `README.md`를 만들지 않는다 (폴더 용도는 위 CLAUDE.md "폴더 구조" 섹션에 이미 적혀 있음)

완료되면 생성된 파일 트리를 보여줘.
```

---

## 💡 사용 방법

1. 새 폴더 만들기 → VS Code로 열기
2. Claude Code 열고 위 프롬프트 붙여넣기 (또는 `/init-workspace` 실행)
3. 끝

---

## 🛠️ `/init-workspace` Skill 내 PC에 설치하기

위 프롬프트를 매번 복사·붙여넣기 하지 않고 `/init-workspace` 한 줄로 실행하려면, 강의 repo에 들어있는 Skill을 본인 PC의 사용자 Skill 폴더로 복사하면 됩니다.

### 📍 사용자 Skill 폴더 위치

| OS | 경로 |
|----|------|
| Windows | `%USERPROFILE%\.claude\skills\` |
| Mac / Linux | `~/.claude/skills/` |

### 📥 설치 명령

**Windows (PowerShell)**
```powershell
# 1) 사용자 Skill 폴더가 없으면 만든다
New-Item -ItemType Directory -Force "$env:USERPROFILE\.claude\skills" | Out-Null

# 2) 강의 repo의 Skill을 복사한다 (강의 repo 폴더에서 실행)
Copy-Item -Recurse -Force .claude\skills\init-workspace "$env:USERPROFILE\.claude\skills\"
```

**Mac / Linux**
```bash
mkdir -p ~/.claude/skills
cp -r .claude/skills/init-workspace ~/.claude/skills/
```

### ✅ 설치 확인

1. Claude Code를 **재시작** (Skill은 시작 시 한 번만 로드됨)
2. 아무 새 폴더를 열고 Claude Code에서 입력:
   ```
   /init-workspace
   ```
3. `CLAUDE.md`와 `.claude/skills/` 가 자동 생성되면 성공

### 🔄 Skill 업데이트

강사가 Skill을 수정해서 강의 repo에 새 버전을 올리면, `git pull` 후 위 복사 명령을 한 번 더 실행하면 최신 버전으로 갱신됩니다.
