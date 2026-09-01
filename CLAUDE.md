# hello-ClaudeCode

**월간클로드** — Claude Code로 앱을 만들어 스토어에 올리는 것까지 다루는 4주 화상 강의.
매월 새 기수가 이어지는 연속 프로그램입니다. 이 저장소에는 기수별 운영 문서와
모집 사이트, 신청 처리 자동화가 함께 들어 있습니다.

## 프로젝트 개요

| 구성 | 내용 |
|---|---|
| 모집 사이트 | `sites/season1/` · `sites/season2/` (각각 별도 Vercel 프로젝트) |
| 신청 처리 | 신청 폼 → Supabase INSERT → Database Webhook → Google Apps Script → 메일 2통 |
| 운영 문서 | `docs/` — 커리큘럼·강의안·PRD·설문 |

현재 진행 중: **2기(2026-09~10)** — 개강 9월 14일(월) 밤 9시, 매주 월요일 4주 화상.

## 폴더 구조

```
docs/
  10.input/      ← 외부에서 받은 원본 자료 (수정하지 않음)
  20.working/    ← 작업 중인 초안·중간 산출물
  30.output/     ← 최종 결과물 (공유·배포용)
  90.reference/  ← 참고 문서·링크·캡처
sites/
  season1/       ← 1기 안내 사이트 (Vercel `hello-claude-code`)
  season2/       ← 2기 모집 사이트 (Vercel `monthly-claude-2`)
```

기수 폴더는 진행 중이면 `20.working/`, 끝나면 `30.output/` 으로 옮깁니다.

## 문서 인덱스

작업 전에 아래 README를 먼저 확인한다.

| 문서 | 내용 |
|---|---|
| [`docs/README.md`](docs/README.md) | 폴더별로 무엇이 들어 있는지 · 사이트 배포 주의사항 |
| [`docs/90.reference/README.md`](docs/90.reference/README.md) | 참고 문서 목차 (Agent·Skill·권한 설정 가이드 등) |
| [`.claude/skills/README.md`](.claude/skills/README.md) | Skill 폴더 안내 |
| [`.claude/skills/student-mail/SKILL.md`](.claude/skills/student-mail/SKILL.md) | 수강생 안내 메일(결제 안내·입금 확인) 작성 규칙 |
| [`docs/20.working/season2/PRD.md`](docs/20.working/season2/PRD.md) | 2기 기획 문서 — 확정 사항의 기준 |
| [`docs/20.working/season2/email-setup-guide.md`](docs/20.working/season2/email-setup-guide.md) | 신청 메일 자동화 설치·배포 방법 |

## 작업 규칙 (Claude가 따라야 할 규칙)

### 공개 저장소
- 이 저장소는 **공개**다. 계좌번호·API 토큰·카톡 참여코드가 담긴 파일은 `.gitignore` 에
  경로로 제외돼 있다.
- **문서를 다른 폴더로 옮길 때는 `.gitignore` 의 경로도 함께 고친다.** 경로가 어긋나면
  비밀값이 그대로 커밋된다. 옮긴 뒤 `git check-ignore` 로 확인한다.
- 새 문서에 민감 정보를 적어야 하면 `.template` 사본을 만들어 커밋하고, 실제 값이 든
  파일은 `.gitignore` 에 추가한다.

### 사이트 배포
- `sites/season1/` 와 `sites/season2/` 는 **Vercel 프로젝트가 서로 다르다.**
  `monthly-claude-2` 는 `rootDirectory = sites/season2` 로 지정돼 있어야 한다.
  이 설정이 비면 푸시할 때 저장소 루트(1기)가 배포되어 2기 주소에 1기 페이지가 뜬다.
- 사이트 폴더를 옮기면 **Vercel 대시보드의 Root Directory 설정도 같이 바꿔야 한다.**
  저장소만 고치고 푸시하면 Vercel 이 옛 경로를 찾지 못해 배포가 깨진다.
  루트 `vercel.json` 의 rewrite 경로(1기)도 함께 확인한다.

### 안내 메일
- 카카오톡 오픈채팅방 링크는 `open.kakao.com` 주소를 **그대로** 쓴다. 자체 도메인 경유
  같은 우회를 넣지 않는다.
- 메일 HTML은 `<!doctype html>` 부터 시작하는 완전한 문서로 만들고, 색이 들어가는 박스는
  `<table bgcolor="...">` 를 쓴다. `<div>` 조각으로만 보내면 배경색이 걸러진다.
- 비-BMP 이모지(🎉 💳 💬)는 HTML 숫자 참조(`&#127881;`)로 적는다. Apps Script 가
  서로게이트 쌍을 잘못 인코딩해 메일에서 깨진다.

### Skill 구성 규칙
- 사용자가 생성한 Skill은 반드시 `.claude/skills/{스킬명}/SKILL.md` 형태로 만든다.
  (스킬명 폴더를 만들고 그 아래에 `SKILL.md`를 둔다 — `.claude/skills/SKILL.md` 처럼 평탄하게 두지 않는다)
- Skill에서 사용하는 스크립트는 `.claude/skills/{스킬명}/scripts/` 아래에 둔다.
- Skill이 참고하는 문서·예시·데이터 파일은 `.claude/skills/{스킬명}/references/` 아래에 둔다.

## 자주 쓰는 명령

```bash
git check-ignore -v <파일>     # 이 파일이 공개 저장소에서 제외되는지 확인
git push origin main           # 푸시하면 Vercel 이 두 사이트를 자동 재배포
```

---
이 문서는 Claude가 매 대화 시작 시 자동으로 읽는다.
