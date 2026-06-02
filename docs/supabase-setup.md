# Supabase 셋업 가이드 — 사전 설문 페이지

> Hello Claude Code 사전 설문 페이지(`web/survey.html`)에 연결할 Supabase 백엔드 셋업 가이드.
> 약 10분 소요. 프리 플랜 무료.

---

## 📋 한눈에 보기

```
1. Supabase 프로젝트 생성  (3분)
2. SQL 에디터에서 스키마 + RLS 정책 실행  (2분)
3. URL / anon key 복사 → web/survey.js 에 붙여넣기  (1분)
4. 로컬 테스트  (2분)
5. Vercel 배포  (2분)
```

---

## 1️⃣ Supabase 프로젝트 생성

1. https://supabase.com 접속 → **Start your project** → GitHub 또는 이메일로 로그인
2. **New project** 클릭
3. 입력
   - **Project name**: `hello-claude-code`
   - **Database password**: 강력한 비밀번호 (잊지 말 것 — 비밀번호 관리자에 저장)
   - **Region**: `Northeast Asia (Seoul)` 또는 `Tokyo`
   - **Plan**: Free
4. **Create new project** 클릭 → 1~2분 대기

---

## 2️⃣ 테이블 + RLS 정책 생성

좌측 메뉴 **SQL Editor** → **New query** → 아래 SQL 붙여넣고 **Run**.

```sql
-- ============================================================
-- 사전 설문 응답 테이블
-- ============================================================
create table public.survey_responses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),

  -- 기본 정보
  name text not null,
  email text not null,

  -- 환경
  os text,                  -- 'windows' | 'mac' | 'other'
  vscode text,              -- 'daily' | 'some' | 'none'
  coding text,              -- 'none' | 'beginner' | 'some' | 'pro'

  -- AI 경험
  ai_experience text,       -- 'daily' | 'weekly' | 'rare' | 'never'
  claude_code text,         -- 'yes' | 'heard' | 'new'
  payment text,             -- 'done' | 'planning' | 'question'

  -- 관심사
  interests text[],         -- ['blog', 'youtube', 'calendar', ...]
  automation_idea text,
  notes text,
  testimonial text,         -- 'ok' | 'anonymous' | 'no'

  -- 메타
  user_agent text
);

-- 검색 편의 인덱스
create index idx_survey_email on public.survey_responses(email);
create index idx_survey_created on public.survey_responses(created_at desc);

-- ============================================================
-- RLS (Row Level Security) — 익명 INSERT만 허용, SELECT는 차단
-- ============================================================
alter table public.survey_responses enable row level security;

-- 누구나 응답 추가 가능 (익명 INSERT)
create policy "Allow anonymous insert"
  on public.survey_responses
  for insert
  to anon
  with check (true);

-- SELECT 정책 없음 → 익명 사용자는 데이터를 읽을 수 없음
-- 강사는 service_role 키 (Supabase 대시보드)에서만 조회 가능 → 안전

-- ============================================================
-- 중복 방지 (선택) — 같은 이메일로 1회만 응답
-- ============================================================
-- 주석 해제 시 활성화. 한 사람이 여러 번 응답 가능하게 두려면 그대로 둠.
-- create unique index uniq_survey_email on public.survey_responses(email);
```

> ✅ **확인 방법**: 좌측 **Table Editor** → `survey_responses` 가 보이면 OK.

---

## 3️⃣ URL / anon key 복사

1. 좌측 메뉴 **Project Settings (⚙️)** → **API**
2. 두 개 값을 복사
   - **Project URL** (예: `https://abcdefgh.supabase.co`)
   - **Project API keys → anon / public** (긴 JWT 문자열)

3. `web/survey.js` 상단을 수정:

```js
const SUPABASE_URL = 'https://abcdefgh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGci...아주_긴_문자열';
```

> 🔒 **anon key 공개해도 되나요?** YES. RLS가 INSERT만 허용하도록 설정되어 있어 안전합니다. 데이터 조회는 service_role 키(절대 공개 금지)로만 가능합니다.

---

## 4️⃣ 로컬 테스트

```bash
cd web
python -m http.server 8000
# → http://localhost:8000/survey.html
```

설문 작성 후 제출 → Supabase 대시보드 **Table Editor → survey_responses** 에서 행이 추가됐는지 확인.

### 만약 실패하면

| 증상 | 원인 / 해결 |
|------|------------|
| 콘솔에 `Supabase 미설정` 경고 | URL / anon key 가 기본값 그대로. survey.js 수정 |
| `401 Unauthorized` | anon key 오타. 다시 복사 |
| `403 Forbidden` | RLS 정책 미적용. 2단계 SQL 다시 실행 |
| `relation "survey_responses" does not exist` | 테이블 생성 실패. 2단계 SQL 다시 실행 |
| CORS 에러 | Supabase는 기본적으로 모든 도메인 허용 — Project Settings → API → URL Configuration 확인 |

---

## 5️⃣ Vercel 배포

```bash
cd web
npx vercel --prod
```

또는 GitHub 연동 → push 시 자동 배포.

**배포 후 확인**:
- `https://your-project.vercel.app/survey.html` 접속
- 테스트 응답 1건 → Supabase 대시보드에서 확인

---

## 📊 응답 조회 방법 (강사용)

### 방법 A — Supabase 대시보드 (가장 간단)

1. Supabase → **Table Editor** → `survey_responses`
2. 필터·정렬·CSV 내보내기 가능

### 방법 B — SQL Editor에서 분석 쿼리

```sql
-- 응답 총수, OS 분포
select
  count(*) total,
  count(*) filter (where os = 'windows') windows,
  count(*) filter (where os = 'mac') mac
from public.survey_responses;

-- 관심사 분포 (배열 unnest)
select unnest(interests) as interest, count(*)
from public.survey_responses
group by 1
order by 2 desc;

-- 결제 안내 필요한 사람 목록
select email, name, notes
from public.survey_responses
where payment = 'question';

-- 자동화 아이디어 (자유응답) 모두 보기
select email, automation_idea
from public.survey_responses
where automation_idea is not null
order by created_at desc;
```

### 방법 C — Google Sheets로 자동 동기화 (선택)

Supabase Edge Functions 또는 [Supabase Webhooks](https://supabase.com/docs/guides/database/webhooks) 로 응답마다 시트에 행 추가 가능. (이는 강의 Week 4 Agent 데모 재료로도 좋음)

---

## 🔐 보안 체크리스트

- [ ] anon key만 클라이언트에 노출 (✅ 안전)
- [ ] service_role key 는 절대 클라이언트 코드에 넣지 말기
- [ ] RLS 활성화 확인 (테이블 우측 자물쇠 아이콘)
- [ ] SELECT 정책 없는지 확인 — 익명이 데이터 읽으면 안 됨
- [ ] 이메일 등 개인정보는 강의 종료 후 일정 기간 후 삭제 정책 검토

---

## 🎓 강의 자료로의 활용

이 셋업 자체가 **Week 2 ⑤번 시연 (설문 페이지 + DB + 배포)** + **Week 3 Ⓜ️5 메인 코스** 의 살아있는 재료입니다.

- 강의 시간에 본 사이트의 `survey.html` 코드를 같이 들여다보기
- 학생들에게 "강사 본인이 이걸 어떻게 만들었나" 사고 과정 공유
- Week 4 `survey-ops-agent` 가 바로 이 데이터를 다루는 Agent

즉 강의 자체가 강의 자료로 재귀적으로 사용되는 구조 — 가장 강력한 학습 사례.
