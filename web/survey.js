// ============================================================
// Hello Claude Code — Pre-survey submission
//
// 1) Supabase 프로젝트 생성 후, Settings → API 에서 아래 두 값을 복사
// 2) 이 파일의 SUPABASE_URL / SUPABASE_ANON_KEY 를 채움
// 3) supabase-setup.md 의 SQL 을 실행해 테이블 + RLS 정책 생성
//
// anon key는 공개되어도 안전 — RLS가 INSERT만 허용하도록 설정됨
// ============================================================

const SUPABASE_URL = 'https://jwzzwrviltrewriorxzt.supabase.co';        // 예: https://xxxxx.supabase.co
const SUPABASE_ANON_KEY = 'sb_publishable_LAMgK1wCpOjP1H9bfp4R2A_UZvhizoq';
const TABLE_NAME = 'survey_responses';

const form = document.getElementById('survey-form');
const submitBtn = document.getElementById('submit-btn');
const formMessage = document.getElementById('form-message');
const thanks = document.getElementById('thanks');

function showMessage(text, type = 'error') {
  formMessage.textContent = text;
  formMessage.className = `form-message ${type}`;
  formMessage.hidden = false;
}

function clearMessage() {
  formMessage.hidden = true;
}

function isConfigured() {
  return SUPABASE_URL && SUPABASE_URL.startsWith('https://') &&
         SUPABASE_ANON_KEY && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY';
}

async function submitToSupabase(payload) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE_NAME}`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase ${res.status}: ${text}`);
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearMessage();

  if (!form.reportValidity()) return;

  const fd = new FormData(form);
  const payload = {
    name: fd.get('name')?.trim(),
    email: fd.get('email')?.trim(),
    os: fd.get('os'),
    vscode: fd.get('vscode') || null,
    coding: fd.get('coding') || null,
    ai_experience: fd.get('ai_experience') || null,
    claude_code: fd.get('claude_code') || null,
    payment: fd.get('payment'),
    interests: fd.getAll('interests'),
    automation_idea: fd.get('automation_idea')?.trim() || null,
    notes: fd.get('notes')?.trim() || null,
    testimonial: fd.get('testimonial') || null,
    user_agent: navigator.userAgent.slice(0, 200),
  };

  submitBtn.disabled = true;
  submitBtn.textContent = '제출 중...';

  if (!isConfigured()) {
    console.warn('[survey] Supabase 미설정 — payload만 콘솔로 출력합니다.');
    console.log(payload);
    showMessage('⚠️ Supabase가 아직 설정되지 않았습니다. 콘솔(F12)에 답변이 출력되었어요.', 'warning');
    submitBtn.disabled = false;
    submitBtn.textContent = '제출하기';
    return;
  }

  try {
    await submitToSupabase(payload);
    form.hidden = true;
    thanks.hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err) {
    console.error(err);
    showMessage('❌ 제출 중 오류가 발생했어요. 잠시 후 다시 시도하거나 강사에게 카톡으로 답변을 보내주세요.', 'error');
    submitBtn.disabled = false;
    submitBtn.textContent = '제출하기';
  }
});
