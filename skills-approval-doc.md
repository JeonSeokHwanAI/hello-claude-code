# Skill 본문 — `/approval-doc`

> 실습 폴더 `claude-lecture-workspace/.claude/skills/approval-doc/SKILL.md` 로 배포할 완성형.
> 견적 데이터(마크다운)를 받아 HTML 품의서를 자동 생성한다.

---

```markdown
---
name: approval-doc
description: 견적 데이터(/img-to-docs 결과 마크다운 또는 사용자 직접 입력)를 받아 한국 비즈니스 양식의 HTML 품의서를 작성한다. 결재선은 금액 기준으로 자동 결정하거나 사용자가 지정할 수 있다.
---

# /approval-doc

견적 데이터 → HTML 품의서.

## 입력
- 마크다운 파일 경로 (예: `20_extracted/quote-1.md`) — `/img-to-docs` 결과
- 또는 폴더 경로 → 안의 모든 마크다운을 묶어 1개 품의서 작성
- (선택) 결재선 지정: "팀장만", "팀장+본부장", "전체" 등
- (선택) 결재 사유 한 문장

## 출력
- `30_output/품의서_{YYYYMMDD}_{HHMM}.html` (단일 파일)
- 인쇄 미리보기 가능한 A4 1~2페이지 분량
- 한국 비즈니스 표준 양식 (제목, 결재선 박스, 본문 표, 합계, 비고)

## 결재선 자동 결정 규칙 (사용자가 미지정 시)

| 총액 (VAT 포함) | 결재선 |
|---|---|
| 100만원 미만 | 팀장 |
| 100만원 이상 ~ 500만원 미만 | 팀장 + 본부장 |
| 500만원 이상 ~ 3000만원 미만 | 팀장 + 본부장 + 대표 |
| 3000만원 이상 | 팀장 + 본부장 + 대표 + 이사회 (별도 안건) |

## 절차

1. **입력 수집**
   - 마크다운 파일(들) 읽고 항목·금액·메타 정보 파싱
   - 폴더 입력 시 모든 마크다운의 항목을 합쳐 단일 품의서로 통합
   - 통합 시 출처 파일을 비고에 명시

2. **결재 사유 결정**
   - 사용자가 제공했으면 그대로 사용
   - 없으면 항목 종류로부터 자동 추론 (예: 컨설팅·디자인 → "외주 용역 진행 건")
   - 추론 어려우면 사용자에게 1번 묻기

3. **결재선 결정**
   - 사용자 지정 우선
   - 없으면 위 표에 따라 자동
   - 결정 근거를 1줄로 본문 상단에 표기

4. **HTML 생성**
   - 단일 파일 (외부 CSS·JS 의존성 없음)
   - 인쇄 친화적 (A4, 흑백 인쇄 가독성)
   - 인라인 `<style>` 으로 자체 완결

5. **결과 출력**
   - 파일 경로 안내
   - 핵심 정보 요약 (총액, 결재선, 항목 수)
   - 검수 체크리스트 5개 자동 제시

## HTML 양식 스켈레톤

```html
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>품의서 — {제목}</title>
<style>
  @page { size: A4; margin: 20mm; }
  body { font-family: '맑은 고딕', sans-serif; color: #222; }
  h1 { text-align: center; letter-spacing: 8px; }
  .meta { display: flex; justify-content: space-between; margin: 16px 0; }
  table.approval { border-collapse: collapse; width: 50%; margin-left: auto; }
  table.approval th, table.approval td { border: 1px solid #333; padding: 12px; text-align: center; }
  table.items { border-collapse: collapse; width: 100%; margin: 24px 0; }
  table.items th, table.items td { border: 1px solid #555; padding: 8px; }
  table.items th { background: #f3f3f3; }
  td.num { text-align: right; }
  .total { font-weight: bold; font-size: 1.1em; background: #fafafa; }
  .notes { margin-top: 24px; padding: 12px; border-left: 4px solid #888; background: #fbfbfb; }
</style>
</head>
<body>
  <h1>품 의 서</h1>

  <div class="meta">
    <div>문서번호: {DOC_NO}</div>
    <div>작성일: {YYYY-MM-DD}</div>
  </div>

  <table class="approval">
    <thead><tr>{결재선 헤더}</tr></thead>
    <tbody><tr>{서명란}</tr></tbody>
  </table>

  <h2>제목: {결재 사유}</h2>

  <p><strong>제안 배경</strong>: {배경 1~2문장}</p>

  <table class="items">
    <thead>
      <tr><th>항목</th><th>수량</th><th>단가</th><th>금액</th></tr>
    </thead>
    <tbody>
      <!-- 반복 -->
    </tbody>
    <tfoot>
      <tr><td colspan="3">소계 (VAT 별도)</td><td class="num">{SUBTOTAL}</td></tr>
      <tr><td colspan="3">부가세 (10%)</td><td class="num">{TAX}</td></tr>
      <tr class="total"><td colspan="3">총 합계</td><td class="num">{TOTAL}</td></tr>
    </tfoot>
  </table>

  <div class="notes">
    <strong>비고</strong><br>
    {NOTES}
  </div>
</body>
</html>
```

## 사용자 수정 요청 처리

이 Skill 호출 후 사용자가 수정 요청 시:
- "결재선 바꿔줘 / 추가해줘" → 결재선 박스만 갱신
- "금액 단위 바꿔줘" → 모든 숫자 표기 일괄 변경
- "비고에 ~~ 추가" → notes 영역만 갱신
- "긴급 표시" → 제목 옆에 빨간 `[긴급]` 배지 추가

수정 시 **새 파일을 만들지 말고 기존 출력 파일을 수정**한다.

## 호출 예시

- `/approval-doc 20_extracted/quote-1.md`
- `/approval-doc 20_extracted/` (모두 통합)
- `/approval-doc 20_extracted/quote-1.md 결재선=팀장+본부장 사유="2025년 2분기 외주 디자인 진행"`

## 검수 체크리스트 (자동 제시)

- [ ] 총액이 항목 합계와 일치하는지
- [ ] 부가세 계산이 맞는지 (소계 × 0.1)
- [ ] 결재선이 회사 내규에 맞는지
- [ ] 결재 사유가 충분히 구체적인지
- [ ] 비고에 결제 조건이 명시되었는지

```

---

## 🧪 강의 시 시연 시나리오 (Week 2)

1. Week 2에서 `/img-to-docs` 로 만든 `20_extracted/quote-1.md` 호출
2. HTML 결과 → 브라우저로 열어 보기
3. 수정 요청 1: "결재선 본부장 추가"
4. 수정 요청 2: "금액 단위를 천 원 단위로"
5. 인쇄 미리보기 → A4 1페이지 들어가는지 확인

## 🤝 다른 Skill·Agent와의 결합

- **`/img-to-docs` → `/approval-doc`**: 표준 흐름 (Week 2 실습)
- **`approval-agent`**: 두 Skill을 자동 연결 + 결재선 자동 결정 (Week 4 데모)
- **이메일 발송 Skill**: 완성된 HTML을 첨부해 결재 요청 메일 자동 작성 (응용)

## ⚠️ 강사 주의

- 실제 사내 양식과 다를 수 있음 → "여러분 회사 양식에 맞춰 절차의 양식 부분을 바꾸면 그대로 쓸 수 있다" 강조
- HTML이 외부 CSS에 의존하지 않게 한 이유: 메일 첨부·USB 이동 시에도 깨지지 않도록
