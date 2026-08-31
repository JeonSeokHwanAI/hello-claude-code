/**
 * ============================================================
 * 월간클로드 2기 — 신청 완료 메일 자동 발송
 *
 * 흐름:  신청 폼 → Supabase INSERT → Database Webhook → 이 스크립트 → 메일 2통
 *          ① 신청자에게  : 접수 확인 + 결제 안내 (금액 자동 분기)
 *          ② 사장님에게  : 신청 알림 (요약)
 *
 * ⚠️ 이 파일은 공개 저장소용 템플릿입니다. CONFIG 값은 전부 자리표시자예요.
 *    실제 값이 채워진 사본은 로컬에만 두고 저장소에 올리지 마세요.
 *
 * 설치 방법은 email-setup-guide.md 참고
 * ============================================================
 */

// ===== 1. 여기만 채우세요 =========================================

const CONFIG = {
  // 신청 알림을 받을 주소 (네이버 메일 그대로 쓰시면 됩니다)
  OWNER_EMAIL: 'YOUR_EMAIL@example.com',

  // 신청자에게 보낼 때 '보낸사람'으로 찍힐 주소.
  // 비워두면 이 스크립트를 만든 구글 계정 주소로 나갑니다.
  // 네이버 주소로 보내려면 Gmail에 별칭 등록이 먼저 필요합니다 (가이드 3단계).
  FROM_ALIAS: '',

  // 보낸사람 표시 이름
  FROM_NAME: '월간클로드',

  // Supabase 웹훅 URL에 붙일 비밀 토큰. 아무 문자열이나 길게 지어서
  // 여기와 웹훅 URL 양쪽에 똑같이 넣으세요. (남이 이 주소로 장난 못 치게 하는 용도)
  SECRET: 'CHANGE_ME_아무거나_길게_20자이상',

  // 입금 계좌 (신청자 메일에 그대로 들어갑니다)
  BANK: '○○은행 000-0000-0000-00 (예금주: 홍길동)',

  // 현금영수증 안내 (비워두면 메일에 안 나옵니다)
  CASH_RECEIPT: '현금영수증이 필요하신 분은 개인톡으로 신청해 주세요.',

  // 수강료 — 신청서의 '블크업 13기' 응답에 따라 자동으로 갈립니다
  PRICE_NORMAL: 650000,   // 정식
  PRICE_BLKUP:  500000,   // 블크업 13기 스페셜 할인

  // 모집 안내
  DEADLINE: '9월 12일(토)',
  START_DATE: '9월 14일(월) 밤 9시',
  LANDING_URL: '',   // 모집 페이지

  // 카톡 오픈채팅방
  KAKAO_URL: 'https://open.kakao.com/o/XXXXXXX',
  // ⚠️ 참여 코드는 '사장님 알림 메일'에만 나옵니다. 신청자 메일에는 절대 들어가지 않습니다.
  //    (신청만 하고 결제 안 한 사람이 들어오는 걸 막기 위함)
  KAKAO_CODE: 'CHANGE_ME',
};

// ===== 2. 아래는 손대지 않으셔도 됩니다 ============================

/** Supabase 웹훅이 여기로 POST 합니다. */
function doPost(e) {
  try {
    // 토큰 검사 — URL 뒤에 ?token=... 이 맞아야 통과
    if (!e || !e.parameter || e.parameter.token !== CONFIG.SECRET) {
      return json({ ok: false, error: 'unauthorized' });
    }

    const body = JSON.parse(e.postData.contents);

    // INSERT 이벤트만 처리
    if (body.type !== 'INSERT' || !body.record) {
      return json({ ok: true, skipped: body.type });
    }

    const r = body.record;

    sendApplicantMail(r);
    sendOwnerMail(r);

    return json({ ok: true, email: r.email });

  } catch (err) {
    // 실패해도 웹훅에 200을 돌려주고, 대신 사장님께 실패 알림을 보냅니다.
    // (여기서 500을 주면 Supabase가 계속 재시도합니다)
    notifyFailure(err, e);
    return json({ ok: false, error: String(err) });
  }
}

/** ① 신청자에게 — 접수 확인 + 결제 안내 */
function sendApplicantMail(r) {
  const isBlkup = r.blkup === 'yes';
  const price = isBlkup ? CONFIG.PRICE_BLKUP : CONFIG.PRICE_NORMAL;
  const priceLabel = isBlkup
    ? won(CONFIG.PRICE_BLKUP) + ' <span style="color:#999;text-decoration:line-through;font-weight:400;font-size:15px;">' + won(CONFIG.PRICE_NORMAL) + '</span>'
    : won(CONFIG.PRICE_NORMAL);
  const priceNote = isBlkup
    ? '블크업 13기 스페셜 할인가로 안내드립니다.'
    : '정식 수강료입니다.';

  const name = esc(r.name || '');

  const receiptLine = CONFIG.CASH_RECEIPT
    ? `<div style="font-size:14px;color:#666;line-height:1.7;padding-top:12px;margin-top:12px;border-top:1px solid #f0d5c8;">${esc(CONFIG.CASH_RECEIPT)}</div>`
    : '';

  const html = wrap(`
    <h1 style="margin:0 0 6px;font-size:22px;color:#1a1a1a;">신청이 완료되었습니다 🎉</h1>
    <p style="margin:0 0 24px;color:#666;font-size:15px;">${name}님, 월간클로드 2기 신청해 주셔서 감사합니다.</p>

    <div style="background:#fff7f3;border:1px solid #f0d5c8;border-left:3px solid #d97757;border-radius:10px;padding:20px 22px;margin-bottom:24px;">
      <div style="font-size:14px;color:#b8613f;font-weight:700;margin-bottom:14px;">💳 수강료 안내</div>
      <table style="width:100%;border-collapse:collapse;font-size:14.5px;">
        <tr>
          <td style="padding:5px 12px 5px 0;color:#888;white-space:nowrap;vertical-align:top;">수강료</td>
          <td style="padding:5px 0;color:#1a1a1a;"><strong style="font-size:19px;">${priceLabel}</strong><br><span style="font-size:13px;color:#777;">${priceNote}</span></td>
        </tr>
        <tr>
          <td style="padding:5px 12px 5px 0;color:#888;white-space:nowrap;vertical-align:top;">입금계좌</td>
          <td style="padding:5px 0;color:#1a1a1a;"><strong>${esc(CONFIG.BANK)}</strong><br><span style="font-size:13px;color:#777;">입금자명은 신청하신 성함(${name})으로 부탁드려요.</span></td>
        </tr>
      </table>
      ${receiptLine}
    </div>

    <p style="font-size:15px;color:#333;line-height:1.8;margin:0 0 8px;"><strong>입금이 확인되면 카톡방으로 안내해 드립니다.</strong></p>
    <p style="font-size:14.5px;color:#666;line-height:1.8;margin:0 0 18px;">
      월간클로드 2기 카톡방에서 공지·자료를 전부 나눠드리고, 막히시는 것도 거기서 물어보시면 됩니다.
      개강 전 <strong>Week 0 세팅 세션</strong>(온라인 1시간) 날짜도 카톡방에서 공지할게요.
    </p>
    <div style="background:#f7f7f8;border-radius:10px;padding:18px 20px;margin-bottom:24px;">
      <div style="font-size:14px;color:#444;line-height:1.7;margin-bottom:14px;">
        방 입장에는 <strong>참여 코드</strong>가 필요합니다.<br>
        입금이 확인되면 코드를 따로 보내드릴게요.
      </div>
      <a href="${esc(CONFIG.KAKAO_URL)}" style="display:inline-block;padding:11px 20px;border-radius:8px;background:#FEE500;color:#191600;font-size:14.5px;font-weight:700;text-decoration:none;">💬 월간클로드 2기 카톡방 →</a>
    </div>

    <table style="width:100%;border-collapse:collapse;font-size:14.5px;margin-bottom:24px;">
      <tr><td style="padding:9px 0;color:#888;width:110px;">개강</td><td style="padding:9px 0;color:#333;"><strong>${esc(CONFIG.START_DATE)}</strong></td></tr>
      <tr><td style="padding:9px 0;color:#888;">모집 마감</td><td style="padding:9px 0;color:#333;">${esc(CONFIG.DEADLINE)}</td></tr>
      <tr><td style="padding:9px 0;color:#888;">진행</td><td style="padding:9px 0;color:#333;">매주 월요일 밤 9시 · 4주 · 화상</td></tr>
    </table>

    <div style="background:#f7f7f8;border-radius:10px;padding:18px 20px;margin-bottom:24px;">
      <div style="font-size:14px;font-weight:700;color:#333;margin-bottom:10px;">⭐ 개강 전에 이것만 미리 해두세요</div>
      <div style="font-size:14px;color:#555;line-height:1.8;">
        <strong>구글 플레이 개발자 계정 등록 ($25)</strong><br>
        신원 확인이 보통 하루, 길면 2주까지 걸립니다. 3주차에 앱을 스토어에 올리려면 꼭 필요해서,
        지금 신청해 두시는 게 안전해요. 등록 방법은 카톡방에서 안내드립니다.
      </div>
    </div>

    <p style="font-size:14.5px;color:#666;line-height:1.8;margin:0;">
      궁금하신 게 있으면 이 메일에 그대로 답장 주세요.<br>
      곧 뵙겠습니다!
    </p>
  `, CONFIG.LANDING_URL);

  send(r.email, `[월간클로드 2기] 신청이 완료되었습니다 — 결제 안내`, html);
}

/** ② 사장님에게 — 신청 알림 */
function sendOwnerMail(r) {
  const isBlkup = r.blkup === 'yes';
  const price = isBlkup ? CONFIG.PRICE_BLKUP : CONFIG.PRICE_NORMAL;

  const rows = [
    ['이름', r.name],
    ['이메일', r.email],
    ['연락처', r.phone],
    ['수강료', won(price) + (isBlkup ? '  (블크업 13기 할인)' : '  (정식)')],
    ['유형', label(r.user_type, { shop: '🏪 가게형', personal: '🧑 개인형', tool: '🛠 도구형', undecided: '🤔 미정' })],
    ['사업자등록증', label(r.business, { yes: '✅ 있음 — 테스터 12명 요건 면제', no: '없음 (개인 계정)', unsure: '모르겠다고 응답' })],
    ['개발자 계정', label(r.play_account, { done: '이미 보유', will: '개강 전 등록 예정', guide: '⚠️ 등록 방법 안내 필요', skip: '⚠️ 등록 안 하겠다고 응답' })],
    ['Claude 구독', label(r.payment, { done: '구독 중', planning: '개강 전 결제 예정', question: '⚠️ 결제 방법 문의' })],
    ['월요일 참석', label(r.attend, { all: '매주 가능', most: '가끔 빠질 예정', weekend: '⚠️ 주말 특강 희망' })],
    ['연휴(3·4주차)', label(r.holiday, { ok: '문제없음', maybe: '미정', hard: '⚠️ 참석 어려움' })],
    ['코딩 경험', label(r.coding, { none: '전혀 없음', beginner: '조금 따라해 봄', some: '어느 정도 가능', pro: '직업적으로 코딩' })],
    ['PC', [label(r.os, { windows: 'Windows', mac: 'macOS', other: '기타' }), label(r.device_owner, { personal: '개인 PC', company: '⚠️ 회사 PC' })].join(' · ')],
    ['스마트폰', label(r.phone_os, { android: '안드로이드', both: '안드로이드+아이폰', ios: '⚠️ 아이폰만' })],
    ['유입 경로', label(r.referral, { season1: '1기 수강생', friend: '지인 추천', sns: 'SNS·블로그', search: '검색', other: '기타' })],
    ['만들고 싶은 것', r.build_idea],
    ['남긴 말', r.notes],
  ];

  const table = rows
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) =>
      `<tr>
         <td style="padding:9px 14px 9px 0;color:#888;font-size:13.5px;white-space:nowrap;vertical-align:top;">${esc(k)}</td>
         <td style="padding:9px 0;color:#222;font-size:14.5px;">${esc(String(v))}</td>
       </tr>`)
    .join('');

  const flags = [];
  if (r.play_account === 'skip' || r.play_account === 'guide') flags.push('개발자 계정 안내 필요');
  if (r.phone_os === 'ios') flags.push('아이폰만 보유 — 실습 대안 안내');
  if (r.device_owner === 'company') flags.push('회사 PC — 설치 가능 여부 확인');
  if (r.payment === 'question') flags.push('Claude 결제 방법 안내 필요');
  if (r.attend === 'weekend') flags.push('주말 특강 대상');
  if (r.holiday === 'hard') flags.push('연휴 회차 참석 어려움');

  const flagBox = flags.length
    ? `<div style="background:#fff7f3;border:1px solid #f0d5c8;border-radius:10px;padding:14px 18px;margin-bottom:20px;">
         <div style="font-size:13px;font-weight:700;color:#b8613f;margin-bottom:6px;">체크할 것</div>
         <div style="font-size:14px;color:#444;line-height:1.8;">· ${flags.map(esc).join('<br>· ')}</div>
       </div>`
    : '';

  const html = wrap(`
    <h1 style="margin:0 0 4px;font-size:20px;color:#1a1a1a;">신청 접수</h1>
    <p style="margin:0 0 22px;color:#666;font-size:14.5px;">
      ${esc(r.name || '')} · ${won(price)}${isBlkup ? ' (할인)' : ''}
    </p>
    ${flagBox}
    <table style="width:100%;border-collapse:collapse;">${table}</table>

    <div style="margin-top:26px;padding:18px 20px;border-radius:10px;background:#f7f7f8;border:1px dashed #d5d5da;">
      <div style="font-size:13px;font-weight:700;color:#555;margin-bottom:10px;">💬 입금 확인되면 이 문구를 보내세요</div>
      <div style="font-size:14px;color:#222;line-height:1.85;background:#fff;border-radius:8px;padding:14px 16px;">
        ${esc(r.name || '')}님, 입금 확인했습니다 :)<br>
        아래 링크로 들어오셔서 참여 코드를 입력해 주세요.<br><br>
        ${esc(CONFIG.KAKAO_URL)}<br>
        참여 코드 : <strong>${esc(CONFIG.KAKAO_CODE)}</strong>
      </div>
    </div>
    <p style="margin:22px 0 0;font-size:13px;color:#999;">
      신청 시각 ${esc(fmtDate(r.created_at))}
    </p>
  `, '');

  send(CONFIG.OWNER_EMAIL, `[2기 신청접수] ${r.name || '이름없음'} · ${won(price)}${isBlkup ? ' (할인)' : ''}`, html);
}

/** 발송 실패 시 사장님께 알림 */
function notifyFailure(err, e) {
  try {
    const raw = (e && e.postData && e.postData.contents) ? e.postData.contents : '(본문 없음)';
    MailApp.sendEmail({
      to: CONFIG.OWNER_EMAIL,
      subject: '[2기 신청접수] ⚠️ 자동 메일 발송 실패 — 직접 확인 필요',
      htmlBody: wrap(`
        <h1 style="margin:0 0 10px;font-size:19px;color:#c0392b;">자동 메일이 나가지 못했습니다</h1>
        <p style="font-size:14.5px;color:#444;line-height:1.8;">
          신청 자체는 Supabase에 저장되어 있으니 <strong>대시보드에서 확인</strong>하시고 직접 회신해 주세요.
        </p>
        <div style="background:#f7f7f8;border-radius:8px;padding:14px;margin-top:16px;font-size:13px;color:#555;font-family:monospace;white-space:pre-wrap;word-break:break-all;">${esc(String(err))}

${esc(raw).slice(0, 1500)}</div>
      `, ''),
    });
  } catch (ignore) {}
}

// ===== 유틸 =====================================================

function send(to, subject, htmlBody) {
  const opts = { to: to, subject: subject, htmlBody: htmlBody, name: CONFIG.FROM_NAME };

  // 네이버 주소를 Gmail 별칭으로 등록해 두었으면 그 주소로 발송
  if (CONFIG.FROM_ALIAS) {
    const aliases = GmailApp.getAliases();
    if (aliases.indexOf(CONFIG.FROM_ALIAS) !== -1) {
      opts.from = CONFIG.FROM_ALIAS;
    } else {
      Logger.log('별칭 미등록: ' + CONFIG.FROM_ALIAS + ' / 사용 가능: ' + JSON.stringify(aliases));
    }
  }
  GmailApp.sendEmail(to, subject, '', opts);
}

function wrap(inner, linkUrl) {
  const footLink = linkUrl
    ? `<a href="${esc(linkUrl)}" style="color:#d97757;text-decoration:none;">모집 안내 페이지</a> · `
    : '';
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#f4f4f5;">
  <div style="max-width:600px;margin:0 auto;padding:32px 20px;font-family:-apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;">
    <div style="font-size:14px;font-weight:800;color:#d97757;margin-bottom:20px;">● 월간클로드 2기</div>
    <div style="background:#fff;border-radius:14px;padding:32px 30px;">
      ${inner}
    </div>
    <div style="text-align:center;font-size:12px;color:#aaa;margin-top:20px;line-height:1.8;">
      ${footLink}월간클로드 · Instructor 전석환
    </div>
  </div></body></html>`;
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function won(n) {
  return Number(n).toLocaleString('ko-KR') + '원';
}

function label(v, map) {
  if (v == null || v === '') return '';
  return map[v] || v;
}

function fmtDate(iso) {
  if (!iso) return '';
  try {
    return Utilities.formatDate(new Date(iso), 'Asia/Seoul', 'yyyy-MM-dd HH:mm');
  } catch (e) { return String(iso); }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ===== 테스트 ===================================================

/**
 * 웹훅 없이 메일이 잘 나가는지 확인하는 함수.
 * Apps Script 편집기에서 testSendMail 을 선택하고 ▶ 실행 → 메일 2통이 옵니다.
 */
function testSendMail() {
  const dummy = {
    name: '홍길동(테스트)',
    email: CONFIG.OWNER_EMAIL,     // 테스트라 신청자 메일도 사장님께 보냅니다
    phone: '010-1234-5678',
    blkup: 'yes',
    referral: 'friend',
    os: 'windows',
    device_owner: 'personal',
    phone_os: 'ios',
    payment: 'planning',
    business: 'yes',
    play_account: 'guide',
    coding: 'none',
    claude_code: 'new',
    deploy_exp: 'no',
    user_type: 'shop',
    interests: ['website', 'app', 'store'],
    build_idea: '도자기 공방 소개 사이트랑 수업 예약받는 앱',
    attend: 'weekend',
    holiday: 'ok',
    notes: '컴퓨터가 서툴러요. 설치부터 도움이 필요합니다.',
    testimonial: 'ok',
    created_at: new Date().toISOString(),
  };
  sendApplicantMail(dummy);
  sendOwnerMail(dummy);
  Logger.log('발송 완료. 남은 일일 할당량: ' + MailApp.getRemainingDailyQuota());
}
