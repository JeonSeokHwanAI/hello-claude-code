-- ============================================================
-- 월간클로드 2기 — 사전 설문 테이블
--
-- 사용법: Supabase 대시보드 → SQL Editor → 아래 전체를 붙여넣고 Run
-- (season2_applications 와 같은 프로젝트에 그대로 추가하면 됩니다)
--
-- 왜 별도 테이블인가:
--   신청 폼(season2_applications)은 연락처·실습 환경만 받도록 간소화했다.
--   나머지 항목은 개강 전 이 설문에서 받는다. 신청 테이블은 RLS 로 익명
--   UPDATE 를 막아 두었으므로 기존 행을 고치지 않고 새 행으로 쌓는다.
--   두 테이블은 email 로 대조한다.
-- ============================================================

create table public.season2_survey (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),

  -- 본인 확인 (신청 행과 대조하는 열쇠)
  name text not null,
  email text not null,

  -- 만들고 싶은 것
  user_type text,             -- 'shop' | 'personal' | 'tool' | 'undecided'
  interests text[],           -- ['website','app','store','claude','data']
  build_idea text,

  -- 경험 수준
  coding text,                -- 'none' | 'beginner' | 'some' | 'pro'
  claude_code text,           -- 'season1' | 'yes' | 'heard' | 'new'
  deploy_exp text,            -- 'yes' | 'tool' | 'no'

  -- 구글 플레이 개발자 계정
  play_account text,          -- 'done' | 'will' | 'guide' | 'skip'
  business text,              -- 'yes' | 'no' | 'unsure'  (사업자 = 테스터 12명 요건 면제)

  -- 참석
  attend text,                -- 'all' | 'most' | 'weekend'
  holiday text,               -- 'ok' | 'maybe' | 'hard'   (9/28 · 10/5 연휴)
  week0 text[],               -- ['weekday_night','weekend_morning','weekend_afternoon','weekend_night']

  -- 기타
  notes text,
  testimonial text,           -- 'ok' | 'anonymous' | 'no'
  user_agent text
);

create index idx_s2s_email on public.season2_survey(email);
create index idx_s2s_created on public.season2_survey(created_at desc);

-- ============================================================
-- RLS — 익명 INSERT만 허용, SELECT는 차단
-- (설문 응답이 anon key로 조회되지 않도록 반드시 켜 둡니다)
-- ============================================================
alter table public.season2_survey enable row level security;

create policy "Allow anonymous insert"
  on public.season2_survey
  for insert
  to anon
  with check (true);

-- ============================================================
-- 확인용 조회 (대시보드 SQL Editor에서만 동작 — service role)
-- ============================================================

-- 응답 목록
-- select created_at, name, email, user_type, coding, play_account, attend
--   from public.season2_survey order by created_at desc;

-- Week 0 시간대 집계 — 제일 많이 겹치는 시간 찾기
-- select unnest(week0) as slot, count(*) from public.season2_survey
--   group by slot order by count desc;

-- 신청은 했는데 설문을 아직 안 낸 사람
-- select a.name, a.email from public.season2_applications a
--   left join public.season2_survey s on s.email = a.email
--   where s.id is null order by a.created_at;
