---
title: Claude Code 권한 설정 및 완전 자동화 가이드
category: 스터디자료
tags:
  [
    claude-code,
    자동화,
    권한설정,
    settings,
    permissions,
    deny,
    ask,
    네거티브정책,
  ]
summary: Claude Code의 권한 시스템 구조, 자동화 모드, settings.json 설정법, Bash 패턴 문법, deny/ask 명령어 전체 목록 및 주석, 네거티브 정책 설계까지 종합 정리한 가이드
author: jeonseokhwan
created: 2026-03-12
updated: 2026-03-12
version: 2.0
---

# Claude Code 권한 설정 및 완전 자동화 가이드

> Claude Code에서 승인 없이 자동화를 구현하면서도 안전성을 고려하는 방법을 정리합니다.
> 다만 아래 방법은 참고사항이며 각자 실행하는 업무에 따라 권한이 달라질 수 있습니다.(부족하거나 초과할 수 있음)

---

## 1. 권한 시스템 구조 이해

Claude Code는 도구(Tool) 사용 시 사용자에게 승인을 요청합니다.
자동화란 이 **승인 요청을 없애거나 미리 허용하는 것**입니다.

### 도구(Tool) 종류

| 도구        | 설명                                          |
| ----------- | --------------------------------------------- |
| `Bash`      | 터미널 명령 실행 (python, git, powershell 등) |
| `Read`      | 파일 읽기                                     |
| `Write`     | 파일 새로 쓰기                                |
| `Edit`      | 파일 내용 수정                                |
| `MultiEdit` | 여러 위치 동시 수정                           |
| `Glob`      | 파일 패턴 검색                                |
| `Grep`      | 파일 내용 검색                                |
| `WebFetch`  | 특정 URL 접근                                 |
| `WebSearch` | 인터넷 검색                                   |
| `Agent`     | 서브에이전트 실행                             |
| `mcp__*`    | MCP 서버 도구 (Notion 등)                     |

### 권한 평가 우선순위

```
deny (차단) > ask (확인요청) > allow (자동승인)
```

`deny`에 해당하면 `allow`에 있어도 **무조건 차단**됩니다.

### deny / ask / allow 동작 차이

| 규칙    | Claude 동작                                          | 사람이 해야 하나?         |
| ------- | ---------------------------------------------------- | ------------------------- |
| `deny`  | 실행 **불가** + 사용자에게 보고만 함. 승인 질문 없음 | ✅ 사람이 직접 해야 함    |
| `ask`   | **일시 정지** + 승인 질문 → 허용/거부 선택 가능      | 허용 누르면 Claude가 실행 |
| `allow` | 질문 없이 자동 실행                                  | 불필요                    |

> **deny** = 대화창에서 승인 버튼 자체가 안 뜸. Claude가 "차단됐습니다"라고 보고만 함 → 사람이 터미널을 직접 열어서 실행해야 함.
>
> **ask** = 대화창에 승인 질문이 뜸. "허용" 클릭하면 Claude가 실행 → 사람이 직접 실행할 필요 없음.

### deny 규칙이 걸렸을 때 동작 흐름

```
deny 차단 감지
    ↓
대안이 있는가?
    ├── YES → 대안으로 진행 + 사용자에게 알림
    └── NO  → 해당 단계 멈춤 + 사용자에게 보고
```

**예시**: `rm` deny + CLAUDE.md "휴지통 이동 정책" 조합

- Claude가 `rm` 시도 → deny 차단
- CLAUDE.md 지침에 따라 `mv`로 휴지통 경로로 이동
- 작업 중단 없이 안전하게 처리

---

## 2. 자동화 방법 가지

### 방법 1: `--dangerously-skip-permissions` 플래그

```bash
# 대화형 모드
claude --dangerously-skip-permissions
```

**동작**: 모든 도구 사용을 승인 없이 실행합니다.

| 항목        | 내용                    |
| ----------- | ----------------------- |
| 설정 복잡도 | 없음 (플래그 하나)      |
| 적용 범위   | 해당 세션 전체          |
| 위험도      | 🔴 매우 높음            |
| 권장 환경   | 격리된 VM/컨테이너 전용 |

> ⚠️ **주의**: 악성 웹페이지나 파일 내용이 Claude를 통해 시스템 명령을 실행할 수 있습니다(프롬프트 인젝션).

---

### 방법 2: `--permission-mode` 플래그

```bash
# 파일 편집 자동 승인
claude --permission-mode acceptEdits

# 사전 승인된 도구만 실행
claude --permission-mode dontAsk

# 모든 권한 자동 승인 (위험)
claude --permission-mode bypassPermissions

# 읽기만 가능 (분석용)
claude --permission-mode plan
```

**권한 모드별 비교**

| 모드                | 설명                 | 위험도  | 권장 상황      |
| ------------------- | -------------------- | ------- | -------------- |
| `default`           | 첫 사용 시 승인 요청 | 🟢 낮음 | 표준 대화      |
| `plan`              | 읽기 전용, 수정 불가 | 🟢 없음 | 코드 분석·리뷰 |
| `acceptEdits`       | 파일 편집 자동 승인  | 🟡 중간 | 코드 편집 작업 |
| `dontAsk`           | 미리 승인된 도구만   | 🟡 중간 | 반자동화       |
| `bypassPermissions` | 모든 도구 자동 승인  | 🔴 높음 | 격리 환경 전용 |

---

### 방법 3: `settings.json` 영구 설정 (일상 자동화 권장)

매번 플래그를 입력하지 않고, **설정 파일에 영구 등록**합니다.

#### 설정 파일 위치 및 우선순위

```
우선순위 높음 ──────────────────────────── 우선순위 낮음
관리자 정책 > CLI 플래그 > settings.local.json > settings.json > 전역 settings.json
```

| 파일                  | 위치                          | 용도                     |
| --------------------- | ----------------------------- | ------------------------ |
| `settings.json`       | `.claude/settings.json`       | 프로젝트 공유 (git 커밋) |
| `settings.local.json` | `.claude/settings.local.json` | 개인 전용 (git 제외)     |
| 전역 설정             | `~/.claude/settings.json`     | 모든 프로젝트 적용       |

---

## 3. Bash 패턴 문법 완전 정리

### 전체 개방 vs 부분 허용

```json
"Bash"              // 전체 개방 — 모든 bash 명령 자동 승인
"Bash(mkdir *)"     // 부분 허용 — mkdir로 시작하는 명령만
```

### 패턴 매칭 규칙

| 패턴                          | 의미                      | 예시                              |
| ----------------------------- | ------------------------- | --------------------------------- |
| `Bash`                        | 모든 Bash 명령            | -                                 |
| `Bash(python *)`              | python 다음 모든 인자     | `python main.py`, `python -m pip` |
| `Bash(git commit *)`          | git commit 다음 모든 인자 | `git commit -m "fix"`             |
| `Bash(npm run *)`             | npm run 다음 모든 명령    | `npm run build`, `npm run test`   |
| `Bash(git *)`                 | git 명령 전체             | `git add`, `git push`, `git log`  |
| `WebFetch(domain:github.com)` | 특정 도메인만             | github.com만 접근 허용            |
| `Edit(/src/**)`               | 특정 경로만 편집          | src/ 하위 파일만                  |
| `mcp__notion__*`              | 특정 MCP 전체             | Notion MCP 모든 도구              |

### ⚠️ 공백 주의

```json
"Bash(git*)"    // ❌ git으로 시작하는 모든 것 (gitconfig, gitignore 포함될 수 있음)
"Bash(git *)"   // ✅ git 명령어만 정확히 매칭 (공백 이후 인자)
```

---

## 4. 네거티브 정책 (Negative Policy) 설계

### 개념

```json
"allow": ["Bash"],   // 전체 개방
"deny": [            // 위험한 것만 명시적 차단
  "Bash(rm *)",
  ...
]
```

**deny는 allow보다 항상 우선** 적용됩니다.
즉, `allow: ["Bash"]`로 전체를 열어도 `deny: ["Bash(rm *)"]`이 있으면 rm은 절대 실행 안 됩니다.

### 포지티브 vs 네거티브 정책 비교

| 방식                               | 설정 | 보안    | 편의성  | 권장 환경            |
| ---------------------------------- | ---- | ------- | ------- | -------------------- |
| 포지티브 (필요한 것만 허용)        | 복잡 | 🟢 높음 | 낮음    | 보안 중요 환경       |
| 네거티브 (전체 허용 + 위험만 차단) | 단순 | 🟡 중간 | 🟢 높음 | **일상 자동화 권장** |

---

## 5. deny 전체 목록 (명령어별 설명)

### [데이터 손실] 파일·폴더 삭제

> CLAUDE.md 정책: 삭제 대신 `90_temp/99_ready_to_DELETE`로 이동. 절대 실행 불가.

| 명령어                | 설명                                                                  |
| --------------------- | --------------------------------------------------------------------- |
| `Bash(rm *)`          | Linux/bash 파일 삭제. `rm -rf` 사용 시 하위 폴더 전체 복구 불가 삭제  |
| `Bash(rm:*)`          | rm 명령어 변형 패턴 추가 차단                                         |
| `Bash(del *)`         | Windows CMD 파일 삭제. 휴지통 없이 즉시 삭제                          |
| `Bash(del:*)`         | del 변형 패턴 추가 차단                                               |
| `Bash(rd *)`          | Windows CMD 폴더 삭제 (remove directory)                              |
| `Bash(rd:*)`          | rd 변형 패턴 추가 차단                                                |
| `Bash(rmdir *)`       | Linux/Windows 폴더 삭제 명령                                          |
| `Bash(rmdir:*)`       | rmdir 변형 패턴 추가 차단                                             |
| `Bash(Remove-Item *)` | PowerShell 파일·폴더 삭제 cmdlet. `-Recurse -Force` 조합 시 전체 삭제 |

### [시스템 파괴] 드라이브 포맷 / 디스크 파티션

> 복구 불가능한 파괴적 명령. 실수로 실행 시 OS 포함 전체 데이터 소멸.

| 명령어             | 설명                                                   |
| ------------------ | ------------------------------------------------------ |
| `Bash(format *)`   | Windows 드라이브 포맷. C: 포맷 시 OS 파괴              |
| `Bash(diskpart *)` | Windows 디스크 파티션 관리 도구. 파티션 삭제·포맷 가능 |
| `Bash(mkfs *)`     | Linux 파일시스템 생성 명령. 디스크를 초기화(포맷)함    |
| `Bash(fdisk *)`    | Linux 파티션 테이블 편집 도구. 잘못 사용 시 부팅 불가  |

### [권한 상승] 관리자 권한 실행

> 시스템 전체에 영향을 미치는 명령 실행 가능. 일반 작업에는 불필요.

| 명령어                                | 설명                                                        |
| ------------------------------------- | ----------------------------------------------------------- |
| `Bash(sudo *)`                        | Linux 관리자 권한으로 명령 실행. 시스템 파일 수정·삭제 가능 |
| `Bash(su *)`                          | Linux 다른 계정(주로 root)으로 전환. 전환 후 모든 권한 획득 |
| `Bash(su:*)`                          | su 변형 패턴 추가 차단                                      |
| `Bash(runas *)`                       | Windows 다른 계정 권한으로 프로그램 실행                    |
| `Bash(Start-Process * -Verb RunAs *)` | PowerShell에서 관리자 권한으로 프로세스 실행                |

### [시스템 조작] 레지스트리 / 서비스 / 파일 권한

> 운영체제 핵심 설정 변경. 잘못 건드리면 부팅 불가 수준의 손상 가능.

| 명령어               | 설명                                                                |
| -------------------- | ------------------------------------------------------------------- |
| `Bash(reg add *)`    | Windows 레지스트리 키·값 추가. 악성코드가 자동실행 등록에 주로 사용 |
| `Bash(reg delete *)` | Windows 레지스트리 키·값 삭제. 잘못 삭제 시 OS 기능 마비            |
| `Bash(regedit *)`    | Windows 레지스트리 편집기 직접 실행                                 |
| `Bash(sc create *)`  | Windows 시스템 서비스 등록. 부팅 시 자동 실행되는 프로세스 생성     |
| `Bash(sc delete *)`  | Windows 시스템 서비스 삭제. 중요 서비스 제거 시 OS 불안정           |
| `Bash(icacls *)`     | Windows 파일·폴더 접근 권한(ACL) 변경. 보안 정책 우회 가능          |
| `Bash(takeown *)`    | Windows 파일·폴더 소유권 강제 탈취. 시스템 파일 소유권 변경 가능    |
| `Bash(attrib *)`     | Windows 파일 속성 변경 (숨김·읽기전용·시스템 파일 등)               |
| `Bash(bcdedit *)`    | Windows 부트 구성 데이터 편집. 잘못 수정 시 부팅 불가               |

### [원격 코드 실행] 외부 스크립트 즉시 실행

> 프롬프트 인젝션 최고 위험. 악성 페이지 내용이 시스템 명령으로 이어질 수 있음.

| 명령어                                | 설명                                                                 |
| ------------------------------------- | -------------------------------------------------------------------- |
| `Bash(curl * \| bash)`                | 외부 URL에서 스크립트 다운로드 후 bash로 즉시 실행. 가장 위험한 패턴 |
| `Bash(curl * \| sh)`                  | curl로 받은 내용을 sh로 즉시 실행. bash와 동일한 위험                |
| `Bash(wget * \| bash)`                | wget으로 받은 스크립트를 bash로 즉시 실행                            |
| `Bash(wget -O- * \| bash)`            | wget 표준출력을 bash로 파이프. 다운로드와 동시에 실행                |
| `Bash(iex *)`                         | PowerShell Invoke-Expression 약어. 문자열을 명령으로 즉시 실행       |
| `Bash(Invoke-Expression *)`           | PowerShell에서 문자열 내용을 코드로 실행. 악성 스크립트 실행 경로    |
| `Bash(powershell * DownloadString *)` | 원격 URL에서 문자열 다운로드 후 실행하는 패턴                        |
| `Bash(powershell * IEX *)`            | PowerShell에서 IEX 원격 실행 조합                                    |

### [데이터 유출] 외부 서버로 파일 전송

> 민감 파일(.env, 문서 등)이 외부 서버로 전송될 위험.

| 명령어              | 설명                                                     |
| ------------------- | -------------------------------------------------------- |
| `Bash(scp *)`       | SSH 기반 파일 복사. 외부 서버로 파일 전송 가능           |
| `Bash(sftp *)`      | SSH FTP. 외부 서버와 파일 송수신                         |
| `Bash(ftp *)`       | 암호화 없는 파일 전송. 자격증명과 데이터가 평문으로 노출 |
| `Bash(rsync * *@*)` | 원격 서버(@포함) 동기화. 대량 파일을 외부로 복사 가능    |

### [민감 파일 보호] 환경변수 / SSH 키 / 인증 정보

> API 키, 비밀번호, SSH 개인키 노출 방지. Claude가 내용을 읽으면 대화 로그에 남음.

| 명령어               | 설명                                                                 |
| -------------------- | -------------------------------------------------------------------- |
| `Read(.env)`         | 프로젝트 환경변수 파일. API 키·DB 비밀번호·토큰 등이 평문으로 저장됨 |
| `Read(.env.*)`       | `.env.local`, `.env.production` 등 환경별 변형 파일 모두 차단        |
| `Read(~/.ssh/**)`    | SSH 개인키 디렉토리. `id_rsa` 등 유출 시 서버 무단 접근 가능         |
| `Read(*id_rsa*)`     | SSH RSA 개인키 파일. 유출 시 해당 서버 전체 접근 가능                |
| `Read(*id_ed25519*)` | SSH Ed25519 개인키 파일. 최신 SSH 키 방식                            |
| `Read(*.pem)`        | SSL/TLS 인증서 또는 AWS 접속키. 유출 시 클라우드 서버 접근 가능      |
| `Read(*.key)`        | 각종 암호화 개인키 파일. SSL 키, 코드서명 키 등 포함                 |

---

## 6. ask 전체 목록 (명령어별 설명)

### [프로세스 종료] 실행 중인 프로세스 강제 종료

> 텔레그램 봇/서버 먹통 시 가끔 필요. 잘못 종료하면 서비스 중단. 확인 후 실행.

| 명령어                 | 설명                                                             |
| ---------------------- | ---------------------------------------------------------------- |
| `Bash(taskkill *)`     | Windows 프로세스 강제 종료. `/F /PID` 조합으로 봇 재시작 시 사용 |
| `Bash(kill *)`         | Linux/bash 프로세스 종료 시그널 전송. `-9` 옵션 시 강제 종료     |
| `Bash(Stop-Process *)` | PowerShell 프로세스 종료 cmdlet. taskkill의 PS 버전              |

### [Git 원격] 원격 저장소 변경 / 브랜치 삭제

> push 후 되돌리기 어려움. force push는 팀 작업 파괴 가능. 반드시 확인 후 실행.

| 명령어                     | 설명                                                                     |
| -------------------------- | ------------------------------------------------------------------------ |
| `Bash(git push *)`         | 로컬 커밋을 원격 저장소에 업로드. `--force` 옵션 시 기존 히스토리 덮어씀 |
| `Bash(git rm *)`           | Git 추적 파일 삭제. 워킹트리에서도 파일 제거됨                           |
| `Bash(git rm:*)`           | git rm 변형 패턴 추가 차단                                               |
| `Bash(git reset --hard *)` | 커밋 되돌리기 + 워킹트리 변경사항 전부 삭제. 미커밋 작업 소멸            |
| `Bash(git clean *)`        | 추적되지 않는 파일 전체 삭제. `-fd` 옵션 시 새 파일·폴더 모두 제거       |
| `Bash(git branch -D *)`    | 브랜치 강제 삭제. 미병합 커밋이 있어도 삭제됨                            |

### [컨테이너] Docker 명령

> 컨테이너·이미지·볼륨 삭제 시 데이터 손실. 영향 범위가 넓으므로 확인 후 실행.

| 명령어           | 설명                                                                                      |
| ---------------- | ----------------------------------------------------------------------------------------- |
| `Bash(docker *)` | Docker 모든 명령 포함. `rm`(컨테이너삭제), `rmi`(이미지삭제), `volume prune`(볼륨삭제) 등 |

### [패키지 삭제] 설치된 패키지·앱 제거

> 삭제 후 다른 스크립트·서비스가 동작 안 할 수 있음. 의존성 확인 후 실행.

| 명령어                     | 설명                                                                  |
| -------------------------- | --------------------------------------------------------------------- |
| `Bash(pip uninstall *)`    | Python 패키지 삭제. 다른 스크립트가 의존하는 패키지 삭제 시 오류 발생 |
| `Bash(npm uninstall *)`    | Node.js 패키지 삭제. `node_modules`에서 제거되고 `package.json` 반영  |
| `Bash(yarn remove *)`      | Yarn 패키지 삭제. npm uninstall과 동일한 효과                         |
| `Bash(winget uninstall *)` | Windows 앱 패키지 관리자로 앱 삭제                                    |
| `Bash(choco uninstall *)`  | Chocolatey 패키지 관리자로 앱 삭제                                    |
| `Bash(conda remove *)`     | Conda 가상환경 패키지 삭제. 환경 전체에 영향 가능                     |

### [예약작업·서비스 수정] 시스템 자동실행 등록/수정

> 부팅 후 자동 실행되는 작업·서비스 변경. 의도치 않은 자동화 방지.

| 명령어             | 설명                                                                       |
| ------------------ | -------------------------------------------------------------------------- |
| `Bash(schtasks *)` | Windows 예약 작업 생성·수정·삭제. `/Create` 시 자동 실행 등록              |
| `Bash(sc *)`       | Windows 서비스 제어 관리자. `start·stop·config·delete` 등 서비스 전체 관리 |

### [네트워크 설정 변경] 방화벽 / 네트워크 인터페이스

> 잘못 변경 시 인터넷 연결 끊김 또는 외부 공격 노출. 확인 후 실행.

| 명령어                       | 설명                                                                  |
| ---------------------------- | --------------------------------------------------------------------- |
| `Bash(netsh *)`              | Windows 네트워크 설정 변경 도구. 방화벽 규칙·IP·DNS 등 전반 조작 가능 |
| `Bash(iptables *)`           | Linux 방화벽 규칙 설정. 잘못 설정 시 외부 접근 전면 차단 또는 개방    |
| `Bash(ufw *)`                | Ubuntu 방화벽 관리 도구. `enable·disable·allow·deny` 등으로 포트 제어 |
| `Bash(ipconfig /release *)`  | Windows 네트워크 어댑터 IP 반납. 인터넷 연결 즉시 끊김                |
| `Bash(ipconfig /flushdns *)` | DNS 캐시 초기화. 일반적으로 무해하나 네트워크 설정 변경 범주          |

---

## 7. 실전 설정 예시 — 네거티브 정책 완성본

`.claude/settings.local.json` 권장 구조:

```json
{
  "permissions": {
    "allow": [
      "Bash",
      "Read",
      "Write",
      "Edit",
      "MultiEdit",
      "Grep",
      "Glob",
      "WebSearch",
      "WebFetch",
      "Agent"
    ],
    "deny": [
      "Bash(rm *)",
      "Bash(del *)",
      "Bash(rd *)",
      "Bash(rmdir *)",
      "Bash(Remove-Item *)",
      "Bash(format *)",
      "Bash(diskpart *)",
      "Bash(sudo *)",
      "Bash(runas *)",
      "Bash(reg add *)",
      "Bash(reg delete *)",
      "Bash(sc create *)",
      "Bash(sc delete *)",
      "Bash(icacls *)",
      "Bash(bcdedit *)",
      "Bash(curl * | bash)",
      "Bash(iex *)",
      "Bash(Invoke-Expression *)",
      "Bash(scp *)",
      "Bash(sftp *)",
      "Read(.env)",
      "Read(.env.*)",
      "Read(~/.ssh/**)",
      "Read(*.pem)",
      "Read(*.key)"
    ],
    "ask": [
      "Bash(taskkill *)",
      "Bash(kill *)",
      "Bash(git push *)",
      "Bash(git reset --hard *)",
      "Bash(git clean *)",
      "Bash(git branch -D *)",
      "Bash(docker *)",
      "Bash(pip uninstall *)",
      "Bash(npm uninstall *)",
      "Bash(winget uninstall *)",
      "Bash(schtasks *)",
      "Bash(netsh *)",
      "Bash(iptables *)",
      "Bash(ufw *)"
    ]
  }
}
```

---

## 8. 방법별 최종 비교

| 방법                                               | 설정 | 지속성    | 안전도  | 권장 상황      |
| -------------------------------------------------- | ---- | --------- | ------- | -------------- |
| `--dangerously-skip-permissions`                   | 없음 | 세션 한정 | 🔴 낮음 | 격리 환경 전용 |
| `--permission-mode bypassPermissions`              | 없음 | 세션 한정 | 🔴 낮음 | 격리 환경 전용 |
| `--permission-mode acceptEdits`                    | 없음 | 세션 한정 | 🟡 중간 | 코드 편집 작업 |
| `--allowedTools`                                   | 낮음 | 세션 한정 | 🟢 높음 | CI/CD, 일회성  |
| `settings.local.json` allow 규칙                   | 중간 | **영구**  | 🟢 높음 | 일상 자동화    |
| `settings.local.json` allow + deny (네거티브 정책) | 중간 | **영구**  | 🟢 최고 | **실전 권장**  |

---

## 9. 보안 체크리스트

자동화 설정 전 확인사항:

- [ ] `deny`에 `rm`, `del`, `sudo` 차단 규칙 있음
- [ ] `deny`에 원격 코드 실행 (`curl | bash`, `iex`) 차단 있음
- [ ] `.env` 파일 읽기 차단됨
- [ ] `~/.ssh/` 접근 차단됨
- [ ] `*.pem`, `*.key` 인증서 읽기 차단됨
- [ ] `ask`에 `git push`, `taskkill`, `docker` 등 중요 명령 등록됨
- [ ] 외부 공유 워크스페이스(Notion 팀) 사용 시 삭제 신중히
- [ ] 프롬프트 인젝션 위험 인지 (신뢰할 수 없는 URL/파일 주의)
- [ ] 중요 작업 전 git commit으로 백업

---

## 관련 문서

- [[claude-code-권한설정-자동화-가이드]] ← 현재 문서
- [[40_created/42_insights/20260312_claude_code_permission_automation_design]] - 인사이트 정리
- 설정 파일 위치: `C:\501_aiworks\.claude\settings.local.json`

---

## 개정 이력

| 버전 | 날짜       | 변경 내용                                                             |
| ---- | ---------- | --------------------------------------------------------------------- |
| 1.0  | 2026-03-12 | 최초 작성 (자동화 방법 5가지, 도구별 위험성)                          |
| 2.0  | 2026-03-12 | Bash 패턴 문법, 네거티브 정책, deny/ask 전체 명령어 목록 및 설명 추가 |
