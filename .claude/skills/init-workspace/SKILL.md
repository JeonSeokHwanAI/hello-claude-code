---
name: init-workspace
description: Initialize a new folder as a Claude Code workspace by creating CLAUDE.md, .claude/skills/, and the docs/{10.input,20.working,30.output,90.reference} working-folder structure. Use when the user opens a brand-new project folder and asks to "set up", "초기 구성", "init workspace", or similar.
---

# init-workspace

Set up the current folder as a Claude Code workspace.

## Steps

Perform these in order, then show the resulting file tree.

### 1. Create `CLAUDE.md` at the repository root

Use the current folder name as the `{폴더명}` placeholder.

```markdown
# {폴더명}

TODO: 프로젝트 설명

## 프로젝트 개요

## 폴더 구조

docs/
  10.input/      ← 외부에서 받은 원본 자료 (수정하지 않음)
  20.working/    ← 작업 중인 초안·중간 산출물
  30.output/     ← 최종 결과물 (공유·배포용)
  90.reference/  ← 참고 문서·링크·캡처

## 작업 규칙 (Claude가 따라야 할 규칙)

### Skill 구성 규칙
- 사용자가 생성한 Skill은 반드시 `.claude/skills/{스킬명}/SKILL.md` 형태로 만든다.
  (스킬명 폴더를 만들고 그 아래에 `SKILL.md`를 둔다 — `.claude/skills/SKILL.md` 처럼 평탄하게 두지 않는다)
- Skill에서 사용하는 스크립트는 `.claude/skills/{스킬명}/scripts/` 아래에 둔다.
- Skill이 참고하는 문서·예시·데이터 파일은 `.claude/skills/{스킬명}/references/` 아래에 둔다.

## 자주 쓰는 명령

---
이 문서는 Claude가 매 대화 시작 시 자동으로 읽는다.
```

### 2. Create `.claude/skills/` folder with two files

**`.claude/skills/.gitkeep`** — empty file (so git tracks the empty folder).

**`.claude/skills/README.md`**:
```markdown
이 폴더에 Skill을 추가하면 Claude Code가 자동으로 인식한다.
```

### 3. Create `docs/` working-folder structure (empty folders only)

Create these four empty folders. Do NOT add `.gitkeep` or `README.md` inside them — their purpose is already documented in `CLAUDE.md`'s "폴더 구조" section.

- `docs/10.input/`
- `docs/20.working/`
- `docs/30.output/`
- `docs/90.reference/`

### 4. Show the resulting tree

Run `ls` (or equivalent) and report the created files.

## Rules

- Do NOT overwrite an existing `CLAUDE.md` — if one is present, stop and ask the user before proceeding.
- If any of the `docs/` subfolders already exist, skip creating them and note it in the report.
- Only `.claude/skills/` gets a `.gitkeep` and `README.md` (because that folder will stay empty until the user adds a Skill). The `docs/` subfolders do NOT get these files.
- Do NOT add any extra files, .gitignore, license, or boilerplate beyond what is listed above.
- Keep all generated content in Korean as shown.
