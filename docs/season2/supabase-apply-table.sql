-- ============================================================
-- 월간클로드 2기 — 수강 신청 테이블
--
-- 사용법: Supabase 대시보드 → SQL Editor → 아래 전체를 붙여넣고 Run
-- (1기 survey_responses 와 같은 프로젝트에 그대로 추가하면 됩니다)
-- ============================================================

create table public.season2_applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),

  -- 기본 정보
  name text not null,
  email text not null,
  phone text not null,
  blkup text,                 -- 'yes' | 'no'  (블크업 13기 = 스페셜 할인 50만원)
  referral text,              -- 'season1' | 'friend' | 'sns' | 'search' | 'other'

  -- 실습 환경
  os text,                    -- 'windows' | 'mac' | 'other'
  device_owner text,          -- 'personal' | 'company'
  phone_os text,              -- 'android' | 'both' | 'ios'
  payment text,               -- 'done' | 'planning' | 'question'

  -- 구글 플레이 개발자 계정
  business text,              -- 'yes' | 'no' | 'unsure'  (사업자 = 테스터 12명 요건 면제)
  play_account text,          -- 'done' | 'will' | 'guide' | 'skip'

  -- 경험 수준
  coding text,                -- 'none' | 'beginner' | 'some' | 'pro'
  claude_code text,           -- 'season1' | 'yes' | 'heard' | 'new'
  deploy_exp text,            -- 'yes' | 'tool' | 'no'

  -- 만들고 싶은 것
  user_type text,             -- 'shop' | 'personal' | 'tool' | 'undecided'
  interests text[],           -- ['website', 'app', 'store', 'claude', 'data']
  build_idea text,

  -- 운영
  attend text,                -- 'all' | 'most' | 'weekend'  (주말 특강 수요 파악)
  holiday text,               -- 'ok' | 'maybe' | 'hard'
  notes text,
  testimonial text,           -- 'ok' | 'anonymous' | 'no'

  -- 메타
  user_agent text
);

-- 조회 편의 인덱스
create index idx_s2_email on public.season2_applications(email);
create index idx_s2_created on public.season2_applications(created_at desc);

-- ============================================================
-- RLS — 익명 INSERT만 허용, SELECT는 차단
-- (신청자 명단이 anon key로 조회되지 않도록 반드시 켜 둡니다)
-- ============================================================
alter table public.season2_applications enable row level security;

create policy "Allow anonymous insert"
  on public.season2_applications
  for insert
  to anon
  with check (true);

-- SELECT 정책은 만들지 않습니다.
-- 명단 확인은 Supabase 대시보드(Table Editor) 또는 service_role 키로만 하세요.
