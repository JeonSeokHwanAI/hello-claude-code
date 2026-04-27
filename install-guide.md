# Week 0 — 설치 가이드 (Windows / Mac)

> 강의 시작 **전**에 미리 완료해 오세요. 약 30~40분 소요.
> 막히면: [연락처/카톡방 안내] 로 바로 문의하세요.

## ✅ 최종 완료 체크리스트

- [ ] VS Code 설치
- [ ] Python 3.11.9 설치 (Windows는 PATH 체크)
- [ ] Git 설치 (Windows는 Git for Windows)
- [ ] VS Code에 Claude Code 확장 설치
- [ ] Anthropic 계정으로 확장 로그인
- [ ] 강의용 실습 폴더 다운로드 + VS Code로 열기
- [ ] Claude 패널에 "이 폴더 뭐 있어?" 질문 → 응답 확인

---

# 🪟 Windows 설치 가이드

## 1. VS Code 설치

1. https://code.visualstudio.com/ 접속
2. **Download for Windows** 클릭 → 받은 `.exe` 실행
3. 설치 옵션은 모두 기본값으로 진행 (특히 "PATH에 추가" 체크 유지)

> 📸 *[스크린샷: VS Code 첫 화면]*

## 2. Python 3.11.9 설치

1. https://www.python.org/downloads/release/python-3119/ 접속
2. 페이지 하단으로 스크롤 → **Windows installer (64-bit)** 다운로드
3. 받은 `.exe` 실행 시
   - ⚠️ **"Add python.exe to PATH"** 체크박스를 **반드시** 켤 것
   - **Install Now** 클릭
4. 설치 확인: 명령 프롬프트(cmd) 열고 `python --version` 입력 → `Python 3.11.9` 표시되면 OK

> 📸 *[스크린샷: PATH 체크 화면]*

## 3. Git for Windows 설치

1. https://git-scm.com/install/windows 접속 → 다운로드
2. 받은 `.exe` 실행
3. 설치 옵션 거의 모두 **기본값**으로 Next 진행
   - "Git Bash Here" 체크 유지 (Claude Code가 내부적으로 사용)
4. 설치 후 바탕화면 우클릭 → **Git Bash Here** 메뉴가 보이면 OK

## 4. VS Code에 Claude Code 확장 설치

1. VS Code 실행
2. 왼쪽 사이드바의 **확장(Extensions)** 아이콘 클릭 (또는 `Ctrl+Shift+X`)
3. 검색창에 **Claude Code** 입력 → Anthropic 제공 확장 **Install** 클릭
4. 설치 후 사이드바에 Claude 아이콘 생성 확인

> 📸 *[스크린샷: 확장 설치 화면]*

## 5. Anthropic 계정 로그인

1. 사이드바 **Claude 아이콘** 클릭
2. **Sign in** 버튼 클릭 → 브라우저 자동 열림
3. https://claude.ai 계정으로 로그인 (없으면 가입)
4. 인증 완료 후 VS Code로 돌아오면 로그인 상태 표시

## 6. 실습 폴더 다운로드 + 열기

1. [GitHub 저장소 링크 — 추후 공지] 에서 ZIP 다운로드
2. 압축 해제 (예: `C:\claude-lecture\` 같은 경로 — 한글 폴더명 피하기)
3. VS Code → **File > Open Folder** (`Ctrl+K, Ctrl+O`) → 압축 푼 폴더 선택

## 7. 동작 확인

1. Claude 사이드바 패널 열기
2. 입력창에 `이 폴더 뭐 있어?` 입력 → 전송
3. 폴더 안 파일 목록을 답하면 **Week 0 완료!** 🎉

---

# 🍎 Mac 설치 가이드

## 1. VS Code 설치

1. https://code.visualstudio.com/ 접속 → **Download for Mac**
2. 받은 `.zip` 압축 해제 → `Visual Studio Code.app` 을 **Applications 폴더**로 드래그
3. 첫 실행 시 보안 경고가 뜨면 **시스템 설정 > 개인정보 보호 및 보안** 에서 "확인 후 열기"

## 2. Python 3.11.9 설치

1. https://www.python.org/downloads/release/python-3119/ 접속
2. 페이지 하단 → **macOS 64-bit universal2 installer** 다운로드
3. 받은 `.pkg` 실행 → 기본값으로 설치
4. 확인: 터미널에서 `python3 --version` → `Python 3.11.9` 확인

## 3. Git 설치 (필요 시)

대부분 Mac에는 Git이 기본 포함되어 있음.

1. 터미널 열기 → `git --version` 입력
2. 표시되면 OK / 안 되면 자동으로 설치 안내 팝업 → 진행
3. 또는 https://git-scm.com/download/mac 에서 별도 설치

## 4. VS Code에 Claude Code 확장 설치

(Windows와 동일)

1. VS Code → 사이드바 **확장** (`Cmd+Shift+X`)
2. **Claude Code** 검색 → Anthropic 확장 **Install**

## 5. Anthropic 계정 로그인

(Windows와 동일)

1. 사이드바 Claude 아이콘 → **Sign in**
2. 브라우저에서 claude.ai 로그인 → VS Code 복귀

> ⚠️ **Mac 권한 팝업 주의**: Claude가 파일 접근/실행 권한을 요청하면 모두 **허용**하세요. 거부하면 작동하지 않습니다.

## 6. 실습 폴더 다운로드 + 열기

1. [GitHub ZIP 링크] 에서 다운로드
2. Finder에서 압축 해제 (예: `~/claude-lecture/`)
3. VS Code → **File > Open** (`Cmd+K, Cmd+O`) → 폴더 선택

## 7. 동작 확인

(Windows와 동일) Claude 패널에 `이 폴더 뭐 있어?` 입력 → 응답 확인 ✅

---

# 🆘 자주 묻는 문제 (FAQ)

### Q1. VS Code 확장에서 Claude가 검색되지 않아요
- VS Code 버전이 너무 낮을 수 있음 → **Help > Check for Updates** 실행
- 인터넷 연결 / 사내 방화벽 확인

### Q2. Sign in을 눌러도 브라우저가 안 열려요
- 기본 브라우저 설정 확인 (Chrome/Edge/Safari 권장)
- 클릭 후 10초 정도 대기 (느릴 수 있음)

### Q3. (Windows) "python을 찾을 수 없습니다" 오류
- 설치 시 **PATH 체크**를 빠뜨림 → Python 재설치 + PATH 체크
- 또는 제어판 > 시스템 > 환경 변수에서 직접 추가

### Q4. (Windows) Git Bash가 안 보여요
- Git for Windows 미설치 → 위 3번 단계 다시
- 바탕화면이 아닌 임의 폴더에서 우클릭해 보기

### Q5. Claude 패널에 메시지를 보내도 응답이 없어요
- 로그인 상태 재확인 (사이드바 하단)
- 인터넷 연결 확인
- VS Code 재시작

### Q6. 강의 폴더를 어디에 두는 게 좋나요?
- **한글 / 공백이 없는 경로** 권장
- Windows: `C:\claude-lecture\` / Mac: `~/claude-lecture/`
- OneDrive·iCloud 동기화 폴더는 가급적 피하기

---

# 💳 Anthropic 유료 결제 안내

본 강의는 실습 분량이 많아 **Anthropic 유료 플랜 결제가 필수**입니다. 강의 시작 전 아래 흐름으로 결제해 주세요.

1. https://claude.ai 로그인
2. 좌측 하단 프로필 → **Settings → Plans & Billing**
3. **Pro** 또는 그 이상의 유료 플랜 선택 → 결제
4. VS Code의 Claude Code 확장에서 동일 계정으로 로그인하면 자동 인식

> 무료 플랜으로 강의에 참여하실 경우 실습 도중 사용량 한도에 막힐 수 있습니다.

---

# 🆘 회사 PC에서 설치가 막힐 때

본 강의는 VS Code + Claude Code 확장 환경에서만 진행되며, **claude.ai 웹 버전으로는 실습이 불가능합니다.**

- 회사 IT팀과 VS Code / Python / Git 설치 가능 여부를 사전 확인하세요.
- 설치가 어려우면 **개인 PC**를 사용해 주세요.
- 어떤 경우에도 사전 설문에 상황을 적어주시면 강사가 1:1로 도와드립니다.
