// ============================================================
// 월간클로드 2기 — 수강 신청 접수
//
// 1) Supabase 프로젝트에서 Settings → API 의 값을 아래에 채웁니다.
// 2) docs/20.working/season2/supabase-apply-table.sql 을 SQL Editor에서 실행해
//    season2_applications 테이블 + RLS 정책을 생성합니다.
//
// anon key는 공개되어도 안전합니다 — RLS가 INSERT만 허용하도록 설정되어 있습니다.
// ============================================================

const SUPABASE_URL = 'https://jwzzwrviltrewriorxzt.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_LAMgK1wCpOjP1H9bfp4R2A_UZvhizoq';
const TABLE_NAME = 'season2_applications';

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
    // 기본 정보
    name: fd.get('name')?.trim(),
    email: fd.get('email')?.trim(),
    phone: fd.get('phone')?.trim(),
    blkup: fd.get('blkup'),
    referral: fd.get('referral') || null,

    // 실습 환경
    os: fd.get('os'),
    device_owner: fd.get('device_owner'),
    phone_os: fd.get('phone_os'),
    payment: fd.get('payment'),

    notes: fd.get('notes')?.trim() || null,
    user_agent: navigator.userAgent.slice(0, 200),

    // 나머지 항목(유형·경험·참석 가능 여부 등)은 개강 전 사전 설문에서 수집합니다.
  };

  submitBtn.disabled = true;
  submitBtn.textContent = '접수 중...';

  if (!isConfigured()) {
    console.warn('[apply] Supabase 미설정 — payload만 콘솔로 출력합니다.');
    console.log(payload);
    showMessage('⚠️ 신청 접수 시스템이 아직 연결되지 않았습니다. 잠시 후 다시 시도하거나 강사에게 직접 연락해 주세요.', 'warning');
    submitBtn.disabled = false;
    submitBtn.textContent = '신청 접수하기';
    return;
  }

  try {
    await submitToSupabase(payload);
    form.hidden = true;
    thanks.hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err) {
    console.error(err);
    showMessage('❌ 접수 중 오류가 발생했어요. 잠시 후 다시 시도하시거나, 강사에게 카톡·메일로 알려주세요.', 'error');
    submitBtn.disabled = false;
    submitBtn.textContent = '신청 접수하기';
  }
});
