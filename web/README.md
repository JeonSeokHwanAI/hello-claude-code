# Hello Claude Code — 강의 안내 웹사이트

> Vercel에 정적 사이트로 배포되는 강의 랜딩 페이지.

## 📁 구조

```
web/
├── index.html        # 메인 (히어로 / 일정 / 커리큘럼 / 사전 준비 / FAQ)
├── week-1.html       # Week 1 상세
├── week-2.html       # Week 2 상세
├── week-3.html       # Week 3 상세
├── week-4.html       # Week 4 상세
├── styles.css        # 공통 스타일
├── vercel.json       # Vercel 설정 (cleanUrls, 보안 헤더)
└── README.md
```

순수 HTML/CSS — 빌드 과정 없음. 폰트는 Google Fonts CDN.

## 🚀 Vercel 배포 (3가지 방법)

### A. CLI로 즉시 배포 (가장 빠름)

```bash
# Vercel CLI 설치 (1회)
npm install -g vercel

# web/ 폴더에서
cd web
vercel
# → 첫 실행 시 로그인 + 프로젝트명 입력
# → 이후 'vercel --prod' 로 프로덕션 배포
```

### B. GitHub 연동 (권장 — 자동 배포)

1. 이 폴더(또는 상위 저장소)를 GitHub에 push
2. https://vercel.com/new 접속 → "Import Git Repository"
3. **Root Directory** 를 `web/` 으로 지정
4. Framework Preset: `Other`
5. Build Command: 비워두기
6. Output Directory: 비워두기 (또는 `.`)
7. Deploy 클릭 → 끝

push할 때마다 자동 재배포.

### C. 드래그 앤 드롭

1. https://vercel.com/new 접속
2. `web/` 폴더 통째로 드래그
3. 즉시 배포

## 🔧 로컬 미리보기

빌드 없이 정적 파일이라 어떤 방법으로든 가능:

```bash
# Python (가장 간단)
cd web
python -m http.server 8000
# → http://localhost:8000

# 또는 VS Code Live Server 확장
# 또는 Node가 있다면: npx serve web
```

## 🎨 커스터마이징

- **컬러**: `styles.css` 상단 `:root` 변수 — `--accent` 가 메인 컬러
- **콘텐츠**: 각 HTML 파일에서 직접 수정
- **새 주차 페이지 추가**: `week-1.html` 복사 → 내용 수정

## ✅ 배포 전 체크리스트

- [ ] 강의 신청 폼/링크가 있다면 `index.html` 의 `.btn-primary` 에 연결
- [ ] OG 이미지 추가 (소셜 공유용 — `/og.png` 등)
- [ ] favicon 추가 (`<link rel="icon" href="/favicon.svg">`)
- [ ] 강사 연락처/카카오톡 오픈채팅 링크를 footer 또는 FAQ에 추가
- [ ] Google Analytics / Plausible 등 분석 도구 (선택)
- [ ] 도메인 연결 (Vercel 대시보드 → Settings → Domains)

## 📅 콘텐츠 갱신 시점

- 강의 1주 전: 실습 폴더 GitHub ZIP 링크를 사전 준비 6단계에 활성화
- 매주 수요일 강의 후: 다음 주 페이지의 디테일 보강 가능
- 강의 종료 후: 후기·결과물 갤러리 섹션 추가 고려
