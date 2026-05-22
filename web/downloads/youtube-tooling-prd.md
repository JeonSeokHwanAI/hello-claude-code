# PRD — YouTube Tooling (Explorer + Analyze)

- **본 문서가 다루는 도구 2종:**
  - **youtube-explorer**: 키워드/채널 검색 → 카드 그리드 HTML → 로컬 HTTP 서버 + Chrome → 시청 이벤트 로깅
  - **youtube-analyze**: URL/ID 또는 큐 → 자막 추출 → 마크다운 리포트 → Claude 분석
- 두 스킬은 **단독 사용 가능**하며 파일 경로 규약으로만 느슨하게 연동 (서로 import 안 함)
- **이 PRD를 새 프로젝트에 가져가면 §17 부트스트랩 절차만 따라도 두 스킬을 처음부터 빌드할 수 있다 (소스 복사 불필요).** 모든 파일의 전체 소스가 §18에 임베드되어 있음.

---

## 📍 어디부터 읽어야 하나 (Reading Map)

> 본 문서는 **2,500줄** 정도. 전부 읽지 말고, 본인 상황에 맞는 섹션만 보세요.

| 상황 | 시작 위치 | 안 봐도 되는 곳 |
|---|---|---|
| 🟢 **Claude 처음 써본다 / 5단계로 천천히 만들고 싶다** | **§20.0 → §20.1 → ... → §20.5** (순서대로) | §1~§19 전부 (참고용) |
| 🟡 두 스킬을 한 번에 빌드하고 싶다 (이미 Claude 익숙) | **§17 부트스트랩** → Claude에게 던지기 | §1~§14, §20 |
| 🔵 설계 의도·한계·결정을 이해하고 싶다 (스펙 리뷰) | §1 (개요) → §3~§6 (요구사항) → §13~§14 (학습된 한계) | §17~§20 |
| 🟣 전체 소스 코드만 필요 | **§18** 14개 파일 | §1~§17, §19~§20 |
| 🟠 다른 프로젝트로 이식하고 싶다 | §12 이식성 + §17 부트스트랩 | §18 (참고만), §20 |

### 가장 흔한 시작 ⭐
대부분의 사용자는 **§20.0 (사전 준비)부터** 시작하면 됩니다. PRD를 폴더에 두고 Claude에게 §20.1 프롬프트를 그대로 복사·붙여넣으면 Claude가 §17/§18을 알아서 참고하면서 빌드해 줍니다. **사용자가 §1~§19를 직접 읽을 필요는 없습니다.**

### 단계 한눈에
```
§20.1 PRD 보고 skill 만들기 (초기 설치, 코드 생성)
§20.2 유튜브 검색 페이지 만들기 (첫 사용)
§20.3 skill 고도화 (시청 기록 + 분석 큐)
§20.4 유튜브 분석 skill 만들기 (자막 분석)
§20.5 댓글까지 분석하기
```

---

---

## 0. TL;DR

```
[explorer]                           [analyze]
키워드 → API → 필터 → HTML            URL/ID 또는 큐 → 자막 추출 → .md
   │                                     │
   └─ 뷰어에서 카드 클릭                 └─ Claude가 .md 읽고 요약·키워드·논점 분석
        │
        ├─ 재생 이벤트 → watch-log.jsonl  (시청 패턴, 현재 미사용)
        └─ "📝 분석 큐에 추가" → analyze-queue.jsonl
                                  ↑ 두 스킬을 잇는 단 한 줄의 계약
```

---

## 1. 개요

### 1.1 목적
유튜브 콘텐츠를 (a) 조건으로 **탐색**하고, (b) 본 영상의 **내용을 분석**할 수 있는 로컬 도구 한 쌍. 외부 SaaS 없이 사용자 머신에서 모두 완결되며, 분석 단계는 Claude가 직접 마크다운 파일을 읽고 수행한다.

### 1.2 사용 시나리오
- **S1.** 키워드("핫이슈지", "PS5 신작", "교토 돈까스")로 탐색 → 그리드에서 카드 클릭 → 모달로 재생 → 마음에 들면 "📝 분석 큐에 추가" → 다음 turn에 `/youtube-analyze --next`로 요약 생성
- **S2.** 친구가 카톡으로 보낸 단일 영상 링크 → `/youtube-analyze <url>` → 30초 안에 3줄 요약·핵심 키워드 받기
- **S3.** 채널 직접 지정(channel ID) → 본인 채널의 전 콘텐츠 모음 (제목에 본인 이름 안 들어가는 경우 키워드 검색은 누락 발생, [[feedback-youtube-creator-channel]] 참고)

### 1.3 성공 기준
- explorer 프리셋 1회 실행: **5~30초** (캐시 미스 기준, pool 150·channels.list 스킵 기본)
- analyze 단건: **5초 이내** (자막 받기 + .md 쓰기)
- API 쿼터 소모 < 300 units/explorer 실행 (v0.3 디폴트), youtube-transcript-api는 별도 쿼터 없음
- Chrome 최신 버전에서 1280×720 이상에서 레이아웃 깨짐 없음

---

## 3. youtube-explorer 기능 요구사항

| ID | 기능 | 설명 |
|----|------|------|
| F1 | 설정파일 로딩 | `youtube-explorer.config.yaml`에서 N개 프리셋 파싱 |
| F2 | YouTube Data API v3 호출 | source 타입에 따라 search.list / videos.list(trending) / channels.list+playlistItems.list / playlistItems.list 사용 |
| F3 | 필터 적용 | 기간, 조회수, 좋아요, 길이(min/max sec), 언어(한국어 합집합), 지역, 제목 include/include_any/exclude. `status.embeddable=true` + `privacyStatus=public`만 통과 |
| F4 | 결과 캐싱 | `~/.cache/youtube-explorer/{preset}_<hash>.json`에 TTL 기반 저장 (해시는 프리셋 내용). `--no-cache`로 우회 |
| F5 | 정적 HTML 생성 | Jinja2 템플릿, 영상 데이터를 JSON으로 인라인 |
| F6 | 로컬 HTTP 서버 + Chrome 오픈 | `http.server` 기반 커스텀 핸들러, 임의 가용 포트, **iframe 임베드는 file:// origin에서 오류 153이라 HTTP 서빙 필수** |
| F7 | CLI | `--preset <name>`, `--all`, `--no-cache`, `--no-open`, `--output`, `--config` |
| F8 | 채널 country 보강 (옵션) | `enrich_channel_country: true`일 때만 channels.list 호출. **기본 off** (속도 우선) |
| F9 | Shorts 휴리스틱 | API에 플래그 없음 → `duration_seconds` 기준. 본 프로젝트 쇼츠 = `≤120s` |
| **F10** | **재생 이벤트 로깅** | YT IFrame Player API의 onStateChange → POST /api/event → `~/.local/share/youtube-explorer/watch-log.jsonl` append |
| **F11** | **분석 큐 추가 버튼** | 모달의 "📝 분석 큐에 추가" → POST /api/queue → `~/.cache/youtube-explorer/analyze-queue.jsonl` append |

### 3.1 source 타입별
- `search`: `query`, optional `region`, `category_id`
- `channel`: `channel_ids: [...]` → 채널 uploads playlist 추적
- `trending`: `region`, optional `category_id`
- `playlist`: `playlist_id`

### 3.2 한국 콘텐츠 판별 (language: ko 합집합)
`regionCode=KR`은 "한국에서 시청 가능"일 뿐. `language: ko` 설정 시 다음 신호의 **합집합**으로 통과:
1. `channels.list.snippet.country == "KR"` — **`enrich_channel_country: true`일 때만** (v0.3부터 기본 off)
2. 영상 제목에 한글(가-힣) 포함
3. 채널명에 한글 포함
4. `snippet.defaultAudioLanguage`가 `ko*`

기본 off 상태에선 신호 1번이 빠지지만 2·3·4번만으로 한국 콘텐츠의 90%+가 잡힌다. 글로벌 채널이 한국어 자막만 단 영상까지 잡고 싶으면 프리셋에 `enrich_channel_country: true`.

### 3.3 후보 풀 (candidate_pool_size)
search.list over-fetch 후 클라이언트 필터링. **v0.3 기본 150** (3페이지, 속도 우선). 결과 부족하면 250~500으로 늘림. 쿼리가 구체적일수록 적은 풀로 충분.

---

## 4. youtube-analyze 기능 요구사항

| ID | 기능 | 설명 |
|----|------|------|
| A1 | URL/ID 파싱 | `youtube.com/watch?v=`, `youtu.be/`, `shorts/`, `embed/`, 11자리 ID 모두 인식 |
| A2 | 자막 추출 | `youtube-transcript-api` (1.x: 인스턴스 메서드 `api.list(video_id)`). 우선순위: ko(manual) → en → ja → 기타 manual → ko(auto) → 기타 auto |
| A3 | 마크다운 저장 | `docs/20.working/youtube-analysis/<video_id>__<slug>.md`. 메타(언어·kind·fetched_at) + 타임코드 본문 |
| A4 | 분석 큐 소비 | `--next`: 큐 첫 항목 1건. `--all`: 큐 전체 일괄. 처리 후 큐에서 제거 |
| A5 | 자막 없음 처리 | `[no-transcript]` 메타로 .md 저장 후 종료. Claude는 메타데이터만으로 제한적 분석 |
| A6 | CLI | `--id <url|id>`, `--next`, `--all`, `--title <hint>`, `--comments N`, `--no-comments`, `--top-likes N` |
| A7 | 댓글 수집 + 표시 | `.env`의 `YOUTUBE_API_KEY`가 있으면 `commentThreads.list`로 top-N(기본 50) 수집 → 좋아요 desc 정렬 → 상위 K(기본 10) 본문 인용 + 나머지는 `<details>`로 접어 저장. 키 없거나 `--no-comments`면 자막만. |

### 4.1 Claude 분석 단계 (스킬 호출 후)
스크립트는 자막 + 댓글을 .md로 떨어뜨릴 뿐, **분석은 Claude(LLM)가 수행**한다. SKILL.md가 다음 서브섹션 순서를 강제:
1. 3줄 요약
2. 핵심 키워드 5~10개
3. 주요 논점/주장 불릿
4. 인상적 인용 1~3구 (자막에서)
5. (필요 시) 반론·맥락
6. **댓글 분석 — `## 분석`의 가장 마지막 서브섹션** (댓글이 수집된 경우만)
   - 좋아요 상위 인용 2~3개 (분석 관점에서 재인용)
   - 반응 패턴(긍정/부정/논쟁/유머 비율, 반복 주제), 자막에 없는 외부 정보
   - 자막 vs 댓글 갭 (영상 메시지 vs 시청자 반응의 차이)
   - 작은 표본(50건)은 일반화 금지, 비율 명시

결과는 동일 .md에 `## 분석` 섹션으로 append.

---

## 5. 두 스킬을 잇는 연동 계약

| 자원 | 경로 | 쓰는 쪽 | 읽는 쪽 |
|---|---|---|---|
| 분석 큐 | `~/.cache/youtube-explorer/analyze-queue.jsonl` | explorer 뷰어 (POST /api/queue) | analyze (`--next`/`--all`) |
| 시청 로그 | `~/.local/share/youtube-explorer/watch-log.jsonl` | explorer 뷰어 (POST /api/event) | (현재 미사용, 향후 패턴 분석) |
| 자막 캐시 | `~/.cache/youtube-explorer/transcripts/<id>.txt` | (계획) analyze | (계획) analyze 재실행 시 |
| 분석 산출물 | `docs/20.working/youtube-analysis/<id>__<slug>.md` | analyze 스크립트 | Claude (Read), explorer는 안 읽음 |

**계약 원칙:**
- 두 스킬은 서로의 Python 모듈을 import하지 않는다.
- 한쪽 고장이 다른 쪽 기능을 막지 않는다.
- 큐 파일/로그 파일이 없거나 비어 있어도 정상 종료한다.

### 5.1 explorer 로컬 서버 API
- `GET /<file>` — 정적 파일 서빙 (기존 `SimpleHTTPRequestHandler` 동작)
- `POST /api/event` — JSON body `{video_id, title, channel, type, position_s, duration_s, t_iso}` → watch-log.jsonl append → `{"ok": true}`
- `POST /api/queue` — JSON body `{video_id, title, channel}` → analyze-queue.jsonl append → `{"ok": true, "queue_size": N}`

타입은 `opened|playing|paused|ended|buffering|cued|closed|unload`. 페이지 unload 시 `navigator.sendBeacon`으로 마지막 position 기록.

---

## 6. 비기능 요구사항
- **쿼터 절약**: search.list(100u) 최소화, videos.list(1u) batch=50, channels.list(1u) 옵션. 프리셋 1회 ≈ 300u (v0.3 기본).
- **속도**: 인터뷰 스킵 + pool 150 + channels.list 옵션 off로 v0.2의 60~90초 → v0.3 **5~30초**.
- **보안**: API 키는 프로젝트 루트 `.env`(`YOUTUBE_API_KEY=...`), `.gitignore` 등록.
- **HTTP 서빙 필수**: YT iframe API는 file:// origin에서 오류 153. 항상 127.0.0.1:<port>로 서빙.
- **호환성**: Chrome ≥ 120, Python ≥ 3.11 (실측 3.12).
- **로깅**: 호출 수·쿼터·캐시 적중·필터 통과 수·서버 URL을 stdout으로.

---

## 7. 설정파일 스키마 (explorer)

```yaml
# docs/10.input/youtube-explorer.config.yaml
output_dir: docs/30.output/youtube-explorer
cache_ttl_minutes: 60

presets:
  - name: ps5-weekly
    source:
      type: search
      query: "붉은사막 OR \"Crimson Desert\""
      region: KR
    filters:
      published_within: P30D
      min_views: 500
      duration: { min_seconds: 121 }
      region: KR
      language: ko
      title_include_any: ["붉은사막", "Crimson Desert"]
      title_exclude: ["광고", "협찬"]
    sort: views_desc
    limit: 50
    # candidate_pool_size: 150 (default; raise to 300 if too few results)
    # enrich_channel_country: false (default; true if global channels need to be caught)

  - name: my-favorite-channel
    source:
      type: channel
      channel_ids:
        - UCxxxxxxxxxxxxxxxxxxxxxx
    filters:
      duration: { min_seconds: 121 }
      title_exclude: ["shorts"]
    sort: views_desc
    limit: 80
```

analyze는 별도 config 없음. 호출 시 CLI 인자로 충분.

---

## 8. 기술 스택
- **Python 3.11+** (실측 3.12)
- **explorer**: `google-api-python-client`, `pyyaml`, `python-dotenv`, `jinja2`, stdlib(`http.server`, `socketserver`, `threading`, `webbrowser`, `subprocess`, `argparse`, `json`, `hashlib`, `pathlib`)
- **analyze**: `youtube-transcript-api>=0.6.2` (실측 1.x), stdlib(`argparse`, `re`, `urllib.parse`, `pathlib`, `datetime`, `json`)
- **Frontend**: vanilla HTML + CSS Grid + ES2022 JS, YouTube IFrame Player API (https://www.youtube.com/iframe_api), iframe은 youtube-nocookie.com

---

## 9. 폴더/파일 배치

```
PROJECT_ROOT/
  .env                                              # YOUTUBE_API_KEY=...
  .claude/skills/
    youtube-explorer/
      SKILL.md
      references/PRD.md                             # ← 본 문서 (두 스킬 공통)
      scripts/youtube_explorer/
        __main__.py     config.py    api.py
        filters.py      renderer.py
        templates/page.html.j2
        requirements.txt
    youtube-analyze/
      SKILL.md
      scripts/youtube_analyze/
        __main__.py     __init__.py
        requirements.txt
  docs/
    10.input/
      youtube-explorer.config.yaml                  # 프리셋 (선택; explorer 전용)
    20.working/
      youtube-analysis/
        <video_id>__<slug>.md                       # analyze 산출물
    30.output/
      youtube-explorer/
        {preset}.html                               # explorer 산출물

# 사용자 홈 (cross-project state)
~/.env-y.../.cache/youtube-explorer/
    {preset}_<hash>.json                            # explorer 캐시
    analyze-queue.jsonl                             # 분석 큐 (explorer→analyze 계약)
~/.local/share/youtube-explorer/
    watch-log.jsonl                                 # 시청 이벤트 로그
```

---

## 12. 이식성 — 다른 프로젝트에 옮길 때

이 도구를 새 워크스페이스에서 쓰려면:

### 12.1 필수 복사 항목
```
.claude/skills/youtube-explorer/       # 통째로
.claude/skills/youtube-analyze/        # 통째로
```

### 12.2 새 프로젝트 1회 셋업
1. `.env`에 `YOUTUBE_API_KEY=AIza...` 추가 (Google Cloud Console에서 YouTube Data API v3 활성화 후 발급)
2. 의존성 설치:
   ```powershell
   py -3.12 -m pip install -r .claude/skills/youtube-explorer/scripts/youtube_explorer/requirements.txt
   py -3.12 -m pip install -r .claude/skills/youtube-analyze/scripts/youtube_analyze/requirements.txt
   ```
3. (선택) `docs/10.input/youtube-explorer.config.yaml` 생성 — 도메인에 맞는 프리셋 정의. 처음엔 빈 `presets: []`로 시작해 슬래시 명령으로 채워 나가도 됨.
4. `docs/{10.input,20.working,30.output}/` 폴더가 없으면 init-workspace 스킬 또는 수동 생성.

### 12.3 프로젝트별로 다를 수 있는 부분 (커스터마이즈 포인트)
| 항목 | 기본값 | 다른 프로젝트에서 바꿀 만한 곳 |
|---|---|---|
| 출력 폴더 | `docs/30.output/youtube-explorer/` | `output_dir` (config.yaml) |
| 분석 산출물 | `docs/20.working/youtube-analysis/` | `OUTPUT_DIR` 상수 (`youtube_analyze/__main__.py`) |
| 큐·로그 | `~/.cache/...`, `~/.local/share/...` | 글로벌 (프로젝트마다 분리하려면 상수 변경) |
| 쇼츠 정의 | ≤120s | 프리셋의 `duration.max_seconds` 또는 `min_seconds` |
| 한국 합집합 기본 | `enrich_channel_country: false` | 프리셋별 true 가능 |
| 자막 언어 우선순위 | ko → en → ja | `TRANSCRIPT_LANGS` 상수 (`youtube_analyze/__main__.py`) |

### 12.4 도메인 변경 시 함정
- 비한국 도메인(예: 영어 게이밍)에선 `language: ko` 빼고 `relevanceLanguage: en`, `region: US` 같은 식으로. 한국 합집합 신호는 자동으로 비활성화됨 (`language` 필드가 ko가 아니면 §3.2 미적용).
- 도메인별 키워드 시드는 explorer config의 프리셋 query에 직접 적는다. PRD에 PS5 도메인 시드가 §13 참고 자료로 남아 있지만, 새 프로젝트에선 무시해도 됨.

### 12.5 단독 사용
- analyze만 쓰고 explorer는 안 쓰는 프로젝트도 가능. 큐 파일은 그냥 안 생기고, `/youtube-analyze <url>` 단건 호출만 사용.
- 반대도 동일. explorer만 쓰면 "📝 분석 큐에 추가" 버튼이 큐 파일을 채우지만 소비자가 없을 뿐 — 무해.

---

## 13. YouTube Data API v3 — 핵심 참고

빌드에 필요한 최소 정보만 정리. 전체 스펙은 https://developers.google.com/youtube/v3/docs 참조.

**엔드포인트별 쿼터 비용 (1회 호출):**

| 엔드포인트 | 비용 | 용도 |
|---|---|---|
| `search.list` | **100u** | 키워드/지역/언어/카테고리 검색 (페이지당 50건, 약 500개까지) |
| `videos.list` | 1u (배치 50) | snippet, contentDetails(duration), statistics, status |
| `channels.list` | 1u (배치 50) | country, uploads playlist |
| `playlistItems.list` | 1u | 재생목록 내 비디오 ID |
| `commentThreads.list` | 1u (페이지 100건) | 댓글 + 좋아요수 |

**서버에서 거를 수 있는 필터 vs 클라이언트 후처리 필요:**

| 필터 | 위치 | 출처 |
|---|---|---|
| 키워드 / 지역 / 카테고리 / 기간 / 임베드 가능 | server | search.list 파라미터 |
| 영상 길이 (정확) | client | videos.list contentDetails.duration (ISO 8601 → seconds) |
| 조회수·좋아요·댓글수 하한 | client | videos.list statistics |
| 제목 포함/제외 | client | snippet.title |
| 한국어 콘텐츠 (정확) | 합산 | §3.2 4신호 합집합 |
| Shorts 식별 | client | duration < 120s 휴리스틱 (API에 플래그 없음) |

**일일 쿼터:** 기본 10,000 units. v0.5 디폴트(pool 150, channels.list off)로 프리셋 1회 ≈ 300u → 하루 약 30회 신규 실행.

**알아두면 좋은 함정:**
- `regionCode=KR`은 "한국에서 시청 가능"이지 한국 콘텐츠 보장이 아님 → §3.2 합집합 신호 필수
- `relevanceLanguage`는 힌트일 뿐 정확 매치 아님
- `viewCount/likeCount`는 수 시간~하루 지연될 수 있음
- `likeCount/commentCount`는 비공개될 수 있음

**잘 알려진 카테고리 ID:** 1=Film, 10=Music, 17=Sports, 20=Gaming, 22=People&Blogs, 23=Comedy, 24=Entertainment, 25=News, 26=Howto, 27=Education, 28=Sci&Tech.

---
## 14. 구현 중 학습된 한계 / 결정 사항

| 항목 | 학습 내용 | 대응 |
|------|----------|------|
| `regionCode=KR` | "한국에서 시청 가능"일 뿐 한국 콘텐츠 보장 아님 | §3.2 합집합 신호 후처리 |
| `relevanceLanguage=ko` | 정확 매치가 아닌 힌트 | 보조 신호로만 |
| `defaultAudioLanguage` | 대부분 비어 있음 | 단독 사용 불가, 합집합 한 신호 |
| `status.embeddable=true`라도 일부 영상 재생 실패 | 라이선스/지역 제한 | 모달에 YouTube 외부 열기 폴백 |
| `file://` + YouTube iframe | 오류 153 빈발 | 로컬 HTTP 서버 (F6) |
| Shorts 식별 | API 플래그 없음 | duration 휴리스틱 (본 프로젝트 ≤120s) |
| search.list 후보 수 | v0.2엔 250 권장이었지만 채널 보강 스킵으로 시간 단축한 v0.3에선 150이면 충분 | `candidate_pool_size` 기본 150, 부족하면 늘림 |
| **채널 country 보강 비용** | channels.list 호출이 explorer 실행 시간의 대부분 차지 (50~60초) | `enrich_channel_country: false` 기본화 — 한글 신호만으로 90%+ 잡힘 |
| **본인 채널 콘텐츠 누락** | 핫이슈지 같은 본인 채널은 영상 제목에 자기 이름을 안 씀 → `title_include_any: [본인명]`이 자기 채널을 다수 탈락시킴 | 특정 크리에이터 콘텐츠는 `source.type: channel` + 채널 ID 직접 지정. [[feedback-youtube-creator-channel]] |
| **youtube-transcript-api 1.x API 변경** | `YouTubeTranscriptApi.list_transcripts(id)` 클래스 메서드 제거됨 | 인스턴스 패턴 `YouTubeTranscriptApi().list(id)` 사용. `Transcript.fetch()` 결과는 객체 리스트(`seg.start`, `seg.text`) |
| **httplib2 thread-safety** | googleapiclient의 httplib2.Http는 thread-safe 아님 — videos.list 배치 병렬화 시 SSL 오류 | 병렬화 보류. thread-local 클라이언트로 우회 가능하나 미구현 |

---

## 17. 부트스트랩 — 본 PRD만으로 새 프로젝트에 두 스킬을 생성

> **이 문서의 §18에는 모든 파일의 전체 소스가 포함되어 있다. 다른 프로젝트에 소스를 복사할 필요 없이, 이 PRD 한 파일만으로 처음부터 빌드 가능하다.**

### 17.1 Claude에게 던지는 한 줄

새 프로젝트(빈 폴더 또는 워크스페이스)에 이 PRD 파일 하나를 복사한 후, Claude에게 다음과 같이 요청한다:

> "이 PRD의 §17·§18에 따라 youtube-explorer / youtube-analyze 두 스킬을 이 프로젝트에 빌드해줘."

Claude는 아래 §17.2 절차를 따라야 한다.

### 17.2 Claude 빌드 절차 (반드시 순서대로)

1. **사전 환경 점검**
   - Python ≥ 3.11 설치 확인 (`py -3.12 --version` 또는 `python --version`)
   - `pip` 사용 가능 여부 확인
   - 프로젝트 루트에 `.env` 파일 존재 여부 확인 (없으면 다음 단계에서 안내)

2. **YouTube Data API v3 키 확인**
   - 사용자에게 묻기: "`.env`에 `YOUTUBE_API_KEY=AIza...` 가 있나요? 없으면 https://console.cloud.google.com/apis/credentials 에서 YouTube Data API v3 활성화 후 키 발급 필요."
   - 키가 없으면 사용자에게 발급 안내. 단순 작업이라 막히면 안 됨.

3. **폴더 구조 생성** (§17.3 트리 참조)
   ```powershell
   New-Item -ItemType Directory -Force -Path `
     ".claude/skills/youtube-explorer/scripts/youtube_explorer/templates", `
     ".claude/skills/youtube-explorer/references", `
     ".claude/skills/youtube-analyze/scripts/youtube_analyze", `
     "docs/10.input", `
     "docs/20.working/youtube-analysis", `
     "docs/30.output/youtube-explorer" | Out-Null
   ```

4. **§18 모든 파일 생성** — §18의 각 코드블록을 해당 경로에 그대로 작성. 파일 경로는 각 블록 직전 헤더에 명시.

5. **의존성 설치**
   ```powershell
   py -3.12 -m pip install -r .claude/skills/youtube-explorer/scripts/youtube_explorer/requirements.txt
   py -3.12 -m pip install -r .claude/skills/youtube-analyze/scripts/youtube_analyze/requirements.txt
   ```

6. **(선택) 예시 프리셋 추가** — `docs/10.input/youtube-explorer.config.yaml`이 없으면 §18.10의 빈 골격을 작성. 사용자가 첫 검색 요청을 하면 그때 프리셋을 채워나간다.

7. **스모크 테스트**
   ```powershell
   $env:PYTHONPATH = ".claude/skills/youtube-explorer/scripts"
   py -3.12 -m youtube_explorer --help
   $env:PYTHONPATH = ".claude/skills/youtube-analyze/scripts"
   py -3.12 -m youtube_analyze --help
   ```
   둘 다 usage 출력이 나오면 성공. 실패 시 import 오류 메시지 보고 §18 재확인.

8. **사용 안내 출력** — 사용자에게 다음을 알린다:
   - 검색: `/youtube-explorer <키워드>`
   - 분석: `/youtube-analyze <URL_or_ID>` 또는 `--next` / `--all`
   - 산출물 위치: `docs/30.output/youtube-explorer/*.html`, `docs/20.working/youtube-analysis/*.md`

### 17.3 생성해야 할 전체 파일 트리

```
PROJECT_ROOT/
├── .env                                                          # 사용자가 만듦. YOUTUBE_API_KEY=...
├── .claude/
│   └── skills/
│       ├── youtube-explorer/
│       │   ├── SKILL.md                                          # §18.1
│       │   ├── references/
│       │   │   └── PRD.md                                        # 본 문서 (이미 있음)
│       │   └── scripts/
│       │       └── youtube_explorer/
│       │           ├── __init__.py                               # §18.2 (빈 파일)
│       │           ├── __main__.py                               # §18.3
│       │           ├── config.py                                 # §18.4
│       │           ├── api.py                                    # §18.5
│       │           ├── filters.py                                # §18.6
│       │           ├── renderer.py                               # §18.7
│       │           ├── requirements.txt                          # §18.8
│       │           └── templates/
│       │               └── page.html.j2                          # §18.9
│       └── youtube-analyze/
│           ├── SKILL.md                                          # §18.11
│           └── scripts/
│               └── youtube_analyze/
│                   ├── __init__.py                               # §18.12 (빈 파일)
│                   ├── __main__.py                               # §18.13
│                   └── requirements.txt                          # §18.14
└── docs/
    ├── 10.input/
    │   └── youtube-explorer.config.yaml                          # §18.10 (또는 사용자가 작성)
    ├── 20.working/
    │   └── youtube-analysis/                                     # analyze 출력 폴더
    └── 30.output/
        └── youtube-explorer/                                     # explorer 출력 폴더

# 사용자 홈 (자동 생성됨, 미리 만들 필요 없음)
~/.cache/youtube-explorer/
    {preset}_<hash>.json                                          # explorer 캐시
    analyze-queue.jsonl                                           # 분석 큐 (explorer ↔ analyze 계약)
~/.local/share/youtube-explorer/
    watch-log.jsonl                                               # 시청 이벤트 로그
```

### 17.4 도메인 변경 시 손볼 곳 (한국 외 환경)

- 프리셋 `language: ko` 빼면 §3.2 한국 합집합 신호 자동 비활성화
- 프리셋 `region: KR` → 대상 국가 ISO 코드로
- 분석 자막 우선순위는 `youtube_analyze/__main__.py`의 `TRANSCRIPT_LANGS = ["ko", "en", "ja"]` 수정
- 그 외 기본값은 도메인 독립적이라 그대로 사용 가능

---

## 18. Reference Implementation — 모든 파일의 전체 소스

> **이 섹션의 코드블록을 §17.3 트리에 따라 그대로 파일로 만들면 두 스킬이 동작한다.** 각 블록 위에 파일의 절대 경로(프로젝트 루트 기준)가 헤더로 적혀 있다.

### 18.1 `.claude/skills/youtube-explorer/SKILL.md`

````markdown
---
name: youtube-explorer
description: YAML 프리셋(키워드/채널/카테고리/재생목록 + 기간·조회수·길이·언어·키워드 필터)으로 YouTube를 탐색하고, 결과를 Chrome 최적화 정적 HTML(카드 그리드 + 모달 iframe 재생)로 만들어 로컬 HTTP 서버로 띄운다. 사용자가 "유튜브에서 ~로 검색해서 페이지로 보고 싶다", "특정 가수/게임/주제 영상 모아 보기", "쇼츠만 / 쇼츠 제외", "한국 한정 결과", "특정 채널 제외" 같은 요청을 할 때 사용한다.
---

# YouTube Explorer Skill

YouTube Data API v3 → 필터링 → 단일 HTML 페이지(카드 그리드 + 모달 재생) → 로컬 HTTP 서버 + Chrome 자동 오픈.

## 언제 사용하나
- "유튜브에서 X로 검색해 페이지로 모아 보고 싶다"
- "특정 게임/가수/주제 영상을 한 화면에서 비교하고 싶다"
- "쇼츠만 / 쇼츠 제외 / 특정 채널 제외 / 한국어만"
- 같은 도메인을 여러 조건으로 자주 보고 싶을 때(프리셋 재사용)

## 사전 준비 (한 번만)
1. **API 키**: https://console.cloud.google.com/apis/credentials → "YouTube Data API v3" 활성화 후 키 발급
2. 프로젝트 루트 `.env`에 `YOUTUBE_API_KEY=AIza...` 저장 (`.gitignore`로 커밋 제외)
3. 의존성: `pip install -r .claude/skills/youtube-explorer/scripts/youtube_explorer/requirements.txt`

## 실행 흐름 (Claude가 따를 절차)

1. **인터뷰는 기본 생략** — 디폴트(한국 한정·쇼츠 제외·1년·조회수 정렬·pool 150·enrich_channel_country off)를 적용하고 바로 실행.
   결과 본 뒤 사용자가 조건을 바꾸면 프리셋 수정해 재실행 (캐시 적중하면 쿼터 0).
2. **YAML 프리셋 추가** — `docs/10.input/youtube-explorer.config.yaml`에 새 항목.
3. **실행**:
   ```powershell
   $env:PYTHONPATH = ".claude/skills/youtube-explorer/scripts"
   py -3.12 -m youtube_explorer --preset <name>
   ```
4. **로컬 HTTP 서버**가 임의 포트에서 자동 기동, Chrome 새 탭으로 `http://127.0.0.1:<port>/<preset>.html` 오픈.

## 필터·함정·트러블슈팅
PRD §3, §13, §14 참조. 핵심:
- `regionCode=KR`은 한국 필터가 아니다 → `language: ko`로 §3.2 합집합 신호 적용
- Shorts 정의: 본 프로젝트 `≤120s` (`duration.max_seconds: 120` 쇼츠만 / `min_seconds: 121` 쇼츠 제외)
- 특정 크리에이터 콘텐츠는 `source.type: channel` + 채널 ID 직접 지정 (본인 채널은 영상 제목에 자기 이름 안 씀)
- file:// 안 됨, 항상 로컬 HTTP 서버

## 관련 문서
- `references/PRD.md` — 본 도구의 통합 PRD (Explorer + Analyze, 전체 소스 포함)
````

### 18.2 `.claude/skills/youtube-explorer/scripts/youtube_explorer/__init__.py`

```python
```

(빈 파일. 파이썬 패키지 마커)

### 18.3 `.claude/skills/youtube-explorer/scripts/youtube_explorer/__main__.py`

```python
from __future__ import annotations

import argparse
import http.server
import json
import os
import shutil
import socket
import socketserver
import subprocess
import sys
import threading
import webbrowser
from functools import partial
from pathlib import Path

from dotenv import load_dotenv

from .api import QuotaTracker, collect_videos
from .config import Preset, load_config
from .filters import apply_filters, humanize, normalize, sort_videos
from .renderer import render_html


WATCH_LOG = Path.home() / ".local" / "share" / "youtube-explorer" / "watch-log.jsonl"
ANALYZE_QUEUE = Path.home() / ".cache" / "youtube-explorer" / "analyze-queue.jsonl"


def _open_in_chrome(url: str) -> None:
    chrome_paths = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"),
    ]
    for cp in chrome_paths:
        if cp and Path(cp).exists():
            subprocess.Popen([cp, url])
            return
    if shutil.which("chrome"):
        subprocess.Popen(["chrome", url])
        return
    webbrowser.open(url)


def _free_port() -> int:
    s = socket.socket()
    s.bind(("127.0.0.1", 0))
    port = s.getsockname()[1]
    s.close()
    return port


def _append_jsonl(path: Path, obj: dict) -> int:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(obj, ensure_ascii=False) + "\n")
    try:
        return sum(1 for _ in path.open("r", encoding="utf-8"))
    except Exception:
        return 0


class _ApiHandler(http.server.SimpleHTTPRequestHandler):
    """Static file serving + small JSON API for event/queue logging."""

    def log_message(self, fmt, *args):
        pass

    def _send_json(self, code: int, obj: dict) -> None:
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length) if length else b""
            payload = json.loads(raw.decode("utf-8") or "{}")
        except Exception:
            self._send_json(400, {"ok": False, "error": "invalid json"})
            return

        if self.path == "/api/event":
            try:
                _append_jsonl(WATCH_LOG, payload)
                self._send_json(200, {"ok": True})
            except Exception as e:
                self._send_json(500, {"ok": False, "error": str(e)})
            return

        if self.path == "/api/queue":
            try:
                size = _append_jsonl(ANALYZE_QUEUE, {
                    "video_id": payload.get("video_id"),
                    "title": payload.get("title"),
                    "channel": payload.get("channel"),
                    "queued_at": payload.get("t_iso") or "",
                })
                self._send_json(200, {"ok": True, "queue_size": size})
            except Exception as e:
                self._send_json(500, {"ok": False, "error": str(e)})
            return

        self._send_json(404, {"ok": False, "error": "no such endpoint"})


def _start_local_server(root: Path) -> tuple[str, threading.Thread, socketserver.TCPServer]:
    port = _free_port()
    handler = partial(_ApiHandler, directory=str(root))
    httpd = socketserver.ThreadingTCPServer(("127.0.0.1", port), handler)
    httpd.daemon_threads = True
    th = threading.Thread(target=httpd.serve_forever, daemon=True)
    th.start()
    return f"http://127.0.0.1:{port}", th, httpd


def _run_preset(preset: Preset, *, api_key: str, output_dir: Path, cache_ttl: int,
                use_cache: bool, quota: QuotaTracker) -> Path:
    print(f"\n=== Preset: {preset.name} ===")
    raw = collect_videos(preset, api_key, cache_ttl, use_cache=use_cache, quota=quota)
    normalized = [normalize(v) for v in raw]
    filtered = apply_filters(normalized, preset)
    sorted_videos = sort_videos(filtered, preset.sort)[: preset.limit]
    humanize(sorted_videos)
    out_path = output_dir / f"{preset.name}.html"
    render_html(preset, sorted_videos, out_path)
    print(f"[ok] {preset.name}: {len(sorted_videos)} videos → {out_path}")
    return out_path


def main(argv: list[str] | None = None) -> int:
    load_dotenv()
    parser = argparse.ArgumentParser(prog="youtube_explorer")
    parser.add_argument("--config", default="docs/10.input/youtube-explorer.config.yaml",
                        help="path to YAML config")
    parser.add_argument("--preset", help="preset name to run")
    parser.add_argument("--all", action="store_true", help="run all presets")
    parser.add_argument("--no-cache", action="store_true", help="ignore cache")
    parser.add_argument("--no-open", action="store_true", help="do not auto-open Chrome")
    parser.add_argument("--output", help="override output directory")
    args = parser.parse_args(argv)

    api_key = os.environ.get("YOUTUBE_API_KEY")
    if not api_key:
        print("error: YOUTUBE_API_KEY not set (use .env or env var)", file=sys.stderr)
        return 2

    cfg = load_config(Path(args.config))
    output_dir = Path(args.output) if args.output else cfg.output_dir

    if not args.preset and not args.all:
        print("error: specify --preset <name> or --all", file=sys.stderr)
        print("available presets: " + ", ".join(p.name for p in cfg.presets), file=sys.stderr)
        return 2

    quota = QuotaTracker()
    presets = cfg.presets if args.all else [cfg.preset(args.preset)]
    last_path: Path | None = None
    for p in presets:
        last_path = _run_preset(
            p, api_key=api_key, output_dir=output_dir,
            cache_ttl=cfg.cache_ttl_minutes,
            use_cache=not args.no_cache,
            quota=quota,
        )
    print(f"\nTotal quota used: {quota.used} units")

    if last_path and not args.no_open:
        base_url, _th, httpd = _start_local_server(output_dir.resolve())
        full_url = f"{base_url}/{last_path.name}"
        print(f"\n[server] serving {output_dir.resolve()} at {base_url}")
        print(f"[open]   {full_url}")
        print("(Ctrl+C로 서버 종료)")
        _open_in_chrome(full_url)
        try:
            threading.Event().wait()
        except KeyboardInterrupt:
            print("\n[server] stopping...")
            httpd.shutdown()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
```

### 18.4 `.claude/skills/youtube-explorer/scripts/youtube_explorer/config.py`

```python
from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import yaml


@dataclass
class Source:
    type: str  # search | channel | trending | playlist
    query: str | None = None
    channel_ids: list[str] = field(default_factory=list)
    region: str | None = None
    category_id: str | None = None
    playlist_id: str | None = None


@dataclass
class DurationRange:
    min_seconds: int | None = None
    max_seconds: int | None = None


@dataclass
class Filters:
    published_within: str | None = None  # ISO 8601 duration like "P7D"
    published_after: str | None = None   # explicit RFC 3339
    published_before: str | None = None
    min_views: int | None = None
    min_likes: int | None = None
    duration: DurationRange = field(default_factory=DurationRange)
    language: str | None = None
    region: str | None = None
    title_include: list[str] = field(default_factory=list)
    title_include_any: list[str] = field(default_factory=list)
    title_exclude: list[str] = field(default_factory=list)
    title_starts_with: list[str] = field(default_factory=list)
    channel_exclude: list[str] = field(default_factory=list)

    def published_after_dt(self, now: datetime | None = None) -> datetime | None:
        if self.published_after:
            return datetime.fromisoformat(self.published_after.replace("Z", "+00:00"))
        if self.published_within:
            now = now or datetime.now(timezone.utc)
            return now - _parse_iso_duration(self.published_within)
        return None

    def published_before_dt(self) -> datetime | None:
        if self.published_before:
            return datetime.fromisoformat(self.published_before.replace("Z", "+00:00"))
        return None


@dataclass
class Preset:
    name: str
    source: Source
    filters: Filters = field(default_factory=Filters)
    sort: str = "views_desc"
    limit: int = 50
    candidate_pool_size: int = 150
    enrich_channel_country: bool = False


@dataclass
class Config:
    output_dir: Path
    cache_ttl_minutes: int
    presets: list[Preset]

    def preset(self, name: str) -> Preset:
        for p in self.presets:
            if p.name == name:
                return p
        raise KeyError(f"preset not found: {name}")


_DUR_RE = re.compile(
    r"^P"
    r"(?:(?P<days>\d+)D)?"
    r"(?:T(?:(?P<hours>\d+)H)?(?:(?P<minutes>\d+)M)?(?:(?P<seconds>\d+)S)?)?$"
)


def _parse_iso_duration(s: str) -> timedelta:
    m = _DUR_RE.match(s.strip())
    if not m:
        raise ValueError(f"invalid ISO 8601 duration: {s}")
    parts = {k: int(v) for k, v in m.groupdict(default=0).items()}
    return timedelta(
        days=parts["days"],
        hours=parts["hours"],
        minutes=parts["minutes"],
        seconds=parts["seconds"],
    )


def iso_duration_to_seconds(s: str) -> int:
    return int(_parse_iso_duration(s).total_seconds())


def load_config(path: Path) -> Config:
    data: dict[str, Any] = yaml.safe_load(path.read_text(encoding="utf-8"))
    presets = [_parse_preset(p) for p in data.get("presets", [])]
    return Config(
        output_dir=Path(data.get("output_dir", "docs/30.output/youtube-explorer")),
        cache_ttl_minutes=int(data.get("cache_ttl_minutes", 60)),
        presets=presets,
    )


def _parse_preset(d: dict[str, Any]) -> Preset:
    src = d["source"]
    source = Source(
        type=src["type"],
        query=src.get("query"),
        channel_ids=src.get("channel_ids") or ([src["channel_id"]] if src.get("channel_id") else []),
        region=src.get("region"),
        category_id=str(src["category_id"]) if src.get("category_id") is not None else None,
        playlist_id=src.get("playlist_id"),
    )
    f = d.get("filters") or {}
    dur = f.get("duration") or {}
    filters = Filters(
        published_within=f.get("published_within"),
        published_after=f.get("published_after"),
        published_before=f.get("published_before"),
        min_views=f.get("min_views"),
        min_likes=f.get("min_likes"),
        duration=DurationRange(
            min_seconds=dur.get("min_seconds"),
            max_seconds=dur.get("max_seconds"),
        ),
        language=f.get("language"),
        region=f.get("region"),
        title_include=list(f.get("title_include") or []),
        title_include_any=list(f.get("title_include_any") or []),
        title_exclude=list(f.get("title_exclude") or []),
        title_starts_with=list(f.get("title_starts_with") or []),
        channel_exclude=list(f.get("channel_exclude") or []),
    )
    return Preset(
        name=d["name"],
        source=source,
        filters=filters,
        sort=d.get("sort", "views_desc"),
        limit=int(d.get("limit", 50)),
        candidate_pool_size=int(d.get("candidate_pool_size", 150)),
        enrich_channel_country=bool(d.get("enrich_channel_country", False)),
    )
```

### 18.5 `.claude/skills/youtube-explorer/scripts/youtube_explorer/api.py`

```python
from __future__ import annotations

import hashlib
import json
import os
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable

from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from .config import Preset, Source


CACHE_DIR = Path.home() / ".cache" / "youtube-explorer"


@dataclass
class QuotaTracker:
    used: int = 0

    def add(self, units: int) -> None:
        self.used += units


def _client(api_key: str):
    return build("youtube", "v3", developerKey=api_key, cache_discovery=False)


def _cache_path(preset: Preset) -> Path:
    h = hashlib.sha1(json.dumps(preset.__dict__, default=str, sort_keys=True).encode()).hexdigest()[:12]
    return CACHE_DIR / f"{preset.name}_{h}.json"


def _load_cache(path: Path, ttl_minutes: int) -> list[dict] | None:
    if not path.exists():
        return None
    age_sec = time.time() - path.stat().st_mtime
    if age_sec > ttl_minutes * 60:
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None


def _save_cache(path: Path, data: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")


def collect_videos(preset, api_key, cache_ttl_minutes, use_cache=True, quota=None):
    quota = quota or QuotaTracker()
    cache_file = _cache_path(preset)
    if use_cache:
        cached = _load_cache(cache_file, cache_ttl_minutes)
        if cached is not None:
            print(f"[cache] {preset.name}: {len(cached)} items (ttl {cache_ttl_minutes}m)")
            return cached

    yt = _client(api_key)
    video_ids = _gather_video_ids(yt, preset, quota)
    print(f"[api] {preset.name}: gathered {len(video_ids)} candidate ids (quota={quota.used})")
    videos = _hydrate_videos(yt, video_ids, quota, enrich_country=preset.enrich_channel_country)
    print(f"[api] {preset.name}: hydrated {len(videos)} videos (quota={quota.used})")
    _save_cache(cache_file, videos)
    return videos


def _gather_video_ids(yt, preset: Preset, quota: QuotaTracker) -> list[str]:
    src = preset.source
    f = preset.filters
    target = max(preset.candidate_pool_size, preset.limit)
    if src.type == "search":
        return _ids_from_search(yt, src, f, target, quota)
    if src.type == "trending":
        return _ids_from_trending(yt, src, target, quota)
    if src.type == "channel":
        return _ids_from_channels(yt, src.channel_ids, f, target, quota)
    if src.type == "playlist":
        return _ids_from_playlist(yt, src.playlist_id, target, quota)
    raise ValueError(f"unknown source type: {src.type}")


def _ids_from_search(yt, src: Source, f, target: int, quota: QuotaTracker) -> list[str]:
    ids: list[str] = []
    page_token = None
    pa = f.published_after_dt()
    pb = f.published_before_dt()
    dur_bucket = None
    if f.duration.max_seconds and f.duration.max_seconds <= 240:
        dur_bucket = "short"
    elif f.duration.min_seconds and f.duration.min_seconds >= 1200:
        dur_bucket = "long"
    while len(ids) < target:
        params: dict[str, Any] = dict(
            part="snippet", type="video", q=src.query or "",
            maxResults=50, order="viewCount",
        )
        if src.region or f.region:
            params["regionCode"] = src.region or f.region
        if f.language:
            params["relevanceLanguage"] = f.language
        if src.category_id:
            params["videoCategoryId"] = src.category_id
        if pa:
            params["publishedAfter"] = pa.isoformat().replace("+00:00", "Z")
        if pb:
            params["publishedBefore"] = pb.isoformat().replace("+00:00", "Z")
        if dur_bucket:
            params["videoDuration"] = dur_bucket
        if page_token:
            params["pageToken"] = page_token
        resp = yt.search().list(**params).execute()
        quota.add(100)
        ids.extend(item["id"]["videoId"] for item in resp.get("items", []) if item["id"].get("videoId"))
        page_token = resp.get("nextPageToken")
        if not page_token:
            break
    return ids


def _ids_from_trending(yt, src: Source, target: int, quota: QuotaTracker) -> list[str]:
    ids: list[str] = []
    page_token = None
    while len(ids) < target:
        params: dict[str, Any] = dict(
            part="id", chart="mostPopular", maxResults=50,
            regionCode=src.region or "US",
        )
        if src.category_id:
            params["videoCategoryId"] = src.category_id
        if page_token:
            params["pageToken"] = page_token
        resp = yt.videos().list(**params).execute()
        quota.add(1)
        ids.extend(item["id"] for item in resp.get("items", []))
        page_token = resp.get("nextPageToken")
        if not page_token:
            break
    return ids


def _ids_from_channels(yt, channel_ids: list[str], f, target: int, quota: QuotaTracker) -> list[str]:
    if not channel_ids:
        return []
    resp = yt.channels().list(part="contentDetails", id=",".join(channel_ids), maxResults=50).execute()
    quota.add(1)
    uploads = [
        ch["contentDetails"]["relatedPlaylists"]["uploads"]
        for ch in resp.get("items", [])
        if ch.get("contentDetails", {}).get("relatedPlaylists", {}).get("uploads")
    ]
    ids: list[str] = []
    per_channel = max(target // max(len(uploads), 1), 50)
    for pl in uploads:
        ids.extend(_ids_from_playlist(yt, pl, per_channel, quota))
    return ids


def _ids_from_playlist(yt, playlist_id: str | None, target: int, quota: QuotaTracker) -> list[str]:
    if not playlist_id:
        return []
    ids: list[str] = []
    page_token = None
    while len(ids) < target:
        params: dict[str, Any] = dict(part="contentDetails", playlistId=playlist_id, maxResults=50)
        if page_token:
            params["pageToken"] = page_token
        try:
            resp = yt.playlistItems().list(**params).execute()
        except HttpError as e:
            print(f"[warn] playlistItems.list failed for {playlist_id}: {e}")
            break
        quota.add(1)
        ids.extend(item["contentDetails"]["videoId"] for item in resp.get("items", []) if item.get("contentDetails", {}).get("videoId"))
        page_token = resp.get("nextPageToken")
        if not page_token:
            break
    return ids


def _hydrate_videos(yt, video_ids: list[str], quota: QuotaTracker, enrich_country: bool = False) -> list[dict]:
    items: list[dict] = []
    seen: set[str] = set()
    unique_ids = [v for v in video_ids if not (v in seen or seen.add(v))]
    for batch in _chunked(unique_ids, 50):
        resp = yt.videos().list(
            part="snippet,contentDetails,statistics,status",
            id=",".join(batch), maxResults=50,
        ).execute()
        quota.add(1)
        items.extend(resp.get("items", []))
    if enrich_country:
        _enrich_channel_country(yt, items, quota)
    return items


def _enrich_channel_country(yt, videos: list[dict], quota: QuotaTracker) -> None:
    channel_ids = sorted({v.get("snippet", {}).get("channelId") for v in videos if v.get("snippet", {}).get("channelId")})
    country_by_id: dict[str, str] = {}
    for batch in _chunked(list(channel_ids), 50):
        try:
            resp = yt.channels().list(part="snippet", id=",".join(batch), maxResults=50).execute()
        except HttpError as e:
            print(f"[warn] channels.list failed: {e}")
            continue
        quota.add(1)
        for ch in resp.get("items", []):
            country_by_id[ch["id"]] = ch.get("snippet", {}).get("country", "")
    for v in videos:
        cid = v.get("snippet", {}).get("channelId")
        v.setdefault("snippet", {})["_channelCountry"] = country_by_id.get(cid, "")


def _chunked(seq: list[str], n: int) -> Iterable[list[str]]:
    for i in range(0, len(seq), n):
        yield seq[i : i + n]
```

### 18.6 `.claude/skills/youtube-explorer/scripts/youtube_explorer/filters.py`

```python
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from .config import Preset, iso_duration_to_seconds


def normalize(video: dict) -> dict:
    sn = video.get("snippet", {})
    cd = video.get("contentDetails", {})
    st = video.get("statistics", {})
    status = video.get("status", {})
    thumbs = sn.get("thumbnails", {})
    thumb = (
        thumbs.get("maxres") or thumbs.get("standard") or thumbs.get("high")
        or thumbs.get("medium") or thumbs.get("default") or {}
    ).get("url", "")
    duration_iso = cd.get("duration", "PT0S")
    try:
        duration_s = iso_duration_to_seconds(duration_iso)
    except Exception:
        duration_s = 0
    return {
        "id": video.get("id"),
        "title": sn.get("title", ""),
        "description": sn.get("description", ""),
        "channelId": sn.get("channelId", ""),
        "channelTitle": sn.get("channelTitle", ""),
        "channelCountry": sn.get("_channelCountry", ""),
        "publishedAt": sn.get("publishedAt", ""),
        "thumbnail": thumb,
        "duration_iso": duration_iso,
        "duration_seconds": duration_s,
        "viewCount": int(st.get("viewCount", 0) or 0),
        "likeCount": int(st.get("likeCount", 0) or 0),
        "commentCount": int(st.get("commentCount", 0) or 0),
        "tags": sn.get("tags", []),
        "defaultAudioLanguage": sn.get("defaultAudioLanguage", ""),
        "categoryId": sn.get("categoryId", ""),
        "liveBroadcastContent": sn.get("liveBroadcastContent", "none"),
        "embeddable": status.get("embeddable", True),
        "privacyStatus": status.get("privacyStatus", "public"),
        "url": f"https://www.youtube.com/watch?v={video.get('id')}",
        "embed": f"https://www.youtube.com/embed/{video.get('id')}",
    }


def apply_filters(videos: list[dict], preset: Preset) -> list[dict]:
    f = preset.filters
    pa = f.published_after_dt()
    pb = f.published_before_dt()
    inc = [s.lower() for s in f.title_include]
    inc_any = [s.lower() for s in f.title_include_any]
    exc = [s.lower() for s in f.title_exclude]
    starts = [s.lower() for s in f.title_starts_with]
    chan_exc = [s.lower() for s in f.channel_exclude]
    out: list[dict] = []
    for v in videos:
        if not v.get("embeddable", True):
            continue
        if v.get("privacyStatus") != "public":
            continue
        title_l = v["title"].lstrip().lower()
        if starts and not any(title_l.startswith(s) for s in starts):
            continue
        if inc and not all(s in title_l for s in inc):
            continue
        if inc_any and not any(s in title_l for s in inc_any):
            continue
        if exc and any(s in title_l for s in exc):
            continue
        if chan_exc:
            ch_l = v["channelTitle"].lower()
            if any(s in ch_l for s in chan_exc):
                continue
        if f.min_views and v["viewCount"] < f.min_views:
            continue
        if f.min_likes and v["likeCount"] < f.min_likes:
            continue
        if f.duration.min_seconds and v["duration_seconds"] < f.duration.min_seconds:
            continue
        if f.duration.max_seconds and v["duration_seconds"] > f.duration.max_seconds:
            continue
        if f.language:
            audio = v["defaultAudioLanguage"] or ""
            if f.language == "ko":
                # Union signal: channel country=KR / hangul in title / hangul in channel / audio=ko*
                if not (
                    v["channelCountry"] == "KR"
                    or _has_hangul(v["title"])
                    or _has_hangul(v["channelTitle"])
                    or audio.startswith("ko")
                ):
                    continue
            else:
                if audio and not audio.startswith(f.language):
                    continue
        if pa or pb:
            try:
                pub = datetime.fromisoformat(v["publishedAt"].replace("Z", "+00:00"))
            except Exception:
                pub = None
            if pub:
                if pa and pub < pa:
                    continue
                if pb and pub > pb:
                    continue
        out.append(v)
    return out


def sort_videos(videos: list[dict], sort: str) -> list[dict]:
    key_fns = {
        "views_desc": lambda v: -v["viewCount"],
        "likes_desc": lambda v: -v["likeCount"],
        "comments_desc": lambda v: -v["commentCount"],
        "published_desc": lambda v: v["publishedAt"],
        "duration_asc": lambda v: v["duration_seconds"],
        "duration_desc": lambda v: -v["duration_seconds"],
        "engagement_desc": lambda v: -(v["likeCount"] / max(v["viewCount"], 1)),
    }
    fn = key_fns.get(sort, key_fns["views_desc"])
    if sort == "published_desc":
        return sorted(videos, key=fn, reverse=True)
    return sorted(videos, key=fn)


def humanize(videos: list[dict]) -> list[dict]:
    now = datetime.now(timezone.utc)
    for v in videos:
        v["duration_label"] = _fmt_duration(v["duration_seconds"])
        v["views_label"] = _fmt_number(v["viewCount"])
        v["likes_label"] = _fmt_number(v["likeCount"]) if v["likeCount"] else ""
        v["comments_label"] = _fmt_number(v["commentCount"]) if v["commentCount"] else ""
        v["age_label"] = _fmt_age(v["publishedAt"], now)
    return videos


def _has_hangul(s: str) -> bool:
    return any("가" <= c <= "힣" for c in s or "")


def _fmt_duration(s: int) -> str:
    if s <= 0:
        return ""
    h, rem = divmod(s, 3600)
    m, sec = divmod(rem, 60)
    if h:
        return f"{h}:{m:02d}:{sec:02d}"
    return f"{m}:{sec:02d}"


def _fmt_number(n: int) -> str:
    if n >= 100_000_000:
        return f"{n/100_000_000:.1f}억"
    if n >= 10_000:
        return f"{n/10_000:.1f}만"
    if n >= 1_000:
        return f"{n/1_000:.1f}천"
    return str(n)


def _fmt_age(iso: str, now: datetime) -> str:
    if not iso:
        return ""
    try:
        pub = datetime.fromisoformat(iso.replace("Z", "+00:00"))
    except Exception:
        return ""
    delta = now - pub
    days = delta.days
    if days < 1:
        h = int(delta.total_seconds() // 3600)
        return f"{max(h,1)}시간 전"
    if days < 7:
        return f"{days}일 전"
    if days < 30:
        return f"{days // 7}주 전"
    if days < 365:
        return f"{days // 30}개월 전"
    return f"{days // 365}년 전"
```

### 18.7 `.claude/skills/youtube-explorer/scripts/youtube_explorer/renderer.py`

```python
from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape

from .config import Preset


_TEMPLATE_DIR = Path(__file__).parent / "templates"


def render_html(preset: Preset, videos: list[dict], output_path: Path) -> Path:
    env = Environment(
        loader=FileSystemLoader(str(_TEMPLATE_DIR)),
        autoescape=select_autoescape(["html"]),
    )
    tpl = env.get_template("page.html.j2")
    html = tpl.render(
        preset=preset,
        videos=videos,
        videos_json=json.dumps(videos, ensure_ascii=False),
        generated_at=datetime.now().strftime("%Y-%m-%d %H:%M"),
    )
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(html, encoding="utf-8")
    return output_path
```

### 18.8 `.claude/skills/youtube-explorer/scripts/youtube_explorer/requirements.txt`

```
google-api-python-client>=2.130
python-dotenv>=1.0
PyYAML>=6.0
Jinja2>=3.1
```

### 18.9 `.claude/skills/youtube-explorer/scripts/youtube_explorer/templates/page.html.j2`

전체 HTML 템플릿. **이 파일은 길지만 그대로 복사할 것** — JS의 IFrame Player API 통합, sendBeacon 이벤트 로깅, 분석 큐 버튼이 모두 여기 있다. 변경 금지.

```html
<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>YouTube Explorer — {{ preset.name }}</title>
<style>
  :root {
    --bg: #ffffff; --fg: #0f172a; --muted: #64748b;
    --card: #f8fafc; --border: #e2e8f0; --accent: #ef4444;
    --shadow: 0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06);
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #0b0f17; --fg: #e2e8f0; --muted: #94a3b8;
      --card: #111827; --border: #1f2937; --accent: #f87171;
      --shadow: 0 1px 2px rgba(0,0,0,.5), 0 8px 24px rgba(0,0,0,.5);
    }
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: var(--bg); color: var(--fg);
    font-family: -apple-system, "Segoe UI", "Noto Sans KR", system-ui, sans-serif; }
  header { position: sticky; top: 0; z-index: 10; background: var(--bg);
    border-bottom: 1px solid var(--border); backdrop-filter: blur(8px); }
  .head-row { display: flex; flex-wrap: wrap; gap: 12px; align-items: baseline; padding: 14px 20px; }
  .title { font-size: 18px; font-weight: 700; }
  .meta { color: var(--muted); font-size: 13px; }
  .controls { display: flex; gap: 8px; flex: 1; justify-content: flex-end; flex-wrap: wrap; }
  .controls input, .controls select {
    padding: 8px 12px; border: 1px solid var(--border); border-radius: 8px;
    background: var(--card); color: var(--fg); font-size: 13px; outline: none;
  }
  .controls input:focus, .controls select:focus { border-color: var(--accent); }
  main { padding: 20px; }
  .grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }
  .card { background: var(--card); border: 1px solid var(--border); border-radius: 12px;
    overflow: hidden; cursor: pointer; transition: transform .12s ease, box-shadow .12s ease; }
  .card:hover { transform: translateY(-2px); box-shadow: var(--shadow); }
  .thumb-wrap { position: relative; aspect-ratio: 16/9; background: #000; }
  .thumb-wrap img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .duration-badge { position: absolute; right: 8px; bottom: 8px; padding: 2px 6px;
    background: rgba(0,0,0,.78); color: #fff; font-size: 12px; border-radius: 4px; }
  .card-body { padding: 10px 12px 14px; }
  .card-title { font-size: 14px; font-weight: 600; line-height: 1.35;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .card-meta { color: var(--muted); font-size: 12px; margin-top: 6px; display: flex; gap: 6px; flex-wrap: wrap; }
  .channel { font-size: 12px; color: var(--muted); margin-top: 4px; }
  .modal { position: fixed; inset: 0; background: rgba(0,0,0,.7);
    display: none; align-items: center; justify-content: center; z-index: 100; }
  .modal.open { display: flex; }
  .modal-inner { width: min(90vw, 1200px); aspect-ratio: 16/9; background: #000;
    border-radius: 12px; overflow: hidden; box-shadow: var(--shadow); }
  .modal-inner #player { width: 100%; height: 100%; border: 0; }
  .modal-close { position: absolute; top: 16px; right: 20px; color: #fff; background: transparent;
    border: 0; font-size: 28px; cursor: pointer; }
  .modal-btn { color: #fff; background: rgba(255,255,255,.15); border: 1px solid rgba(255,255,255,.35);
    padding: 6px 12px; border-radius: 8px; text-decoration: none; font-size: 13px;
    cursor: pointer; font-family: inherit; }
  .modal-btn:hover { background: rgba(255,255,255,.28); }
  .modal-btn.queued { background: rgba(34,197,94,.4); border-color: rgba(34,197,94,.7); }
  .modal-actions { position: absolute; top: 20px; right: 64px; display: flex; gap: 8px; }
  .empty { color: var(--muted); padding: 40px 0; text-align: center; }
  .toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
    background: rgba(15,23,42,.95); color: #fff; padding: 10px 16px; border-radius: 8px;
    font-size: 13px; z-index: 200; opacity: 0; transition: opacity .2s; }
  .toast.show { opacity: 1; }
</style>
</head>
<body>
<header>
  <div class="head-row">
    <div>
      <div class="title">{{ preset.name }}</div>
      <div class="meta">
        {{ videos|length }}개 · 생성 {{ generated_at }} · source={{ preset.source.type }}
        {% if preset.source.query %}· q="{{ preset.source.query }}"{% endif %}
      </div>
    </div>
    <div class="controls">
      <input id="q" type="search" placeholder="제목으로 필터…" />
      <select id="sort">
        <option value="views_desc">조회수 ↓</option>
        <option value="published_desc">최신순</option>
        <option value="duration_asc">길이 ↑</option>
        <option value="duration_desc">길이 ↓</option>
        <option value="likes_desc">좋아요 ↓</option>
        <option value="comments_desc">댓글수 ↓</option>
        <option value="engagement_desc">참여율 ↓</option>
      </select>
    </div>
  </div>
</header>
<main>
  <div id="grid" class="grid"></div>
  <div id="empty" class="empty" hidden>조건에 맞는 영상이 없습니다.</div>
</main>
<div id="modal" class="modal" aria-hidden="true">
  <div class="modal-actions">
    <button id="analyzeBtn" class="modal-btn" type="button" title="이 영상을 분석 큐에 추가">📝 분석 큐에 추가</button>
    <a id="openYT" class="modal-btn" target="_blank" rel="noopener">YouTube에서 열기 ↗</a>
  </div>
  <button class="modal-close" id="modalClose" aria-label="닫기">×</button>
  <div class="modal-inner"><div id="player"></div></div>
</div>
<div id="toast" class="toast"></div>
<script id="data" type="application/json">{{ videos_json }}</script>
<script src="https://www.youtube.com/iframe_api"></script>
<script>
  const VIDEOS = JSON.parse(document.getElementById('data').textContent);
  const VIDEOS_BY_ID = Object.fromEntries(VIDEOS.map(v => [v.id, v]));
  const grid = document.getElementById('grid');
  const empty = document.getElementById('empty');
  const qInput = document.getElementById('q');
  const sortSel = document.getElementById('sort');
  const modal = document.getElementById('modal');
  const modalClose = document.getElementById('modalClose');
  const openYT = document.getElementById('openYT');
  const analyzeBtn = document.getElementById('analyzeBtn');
  const toast = document.getElementById('toast');

  function sortBy(list, key) {
    const copy = list.slice();
    const cmp = {
      views_desc: (a,b) => b.viewCount - a.viewCount,
      likes_desc: (a,b) => b.likeCount - a.likeCount,
      comments_desc: (a,b) => b.commentCount - a.commentCount,
      published_desc: (a,b) => (b.publishedAt||'').localeCompare(a.publishedAt||''),
      duration_asc: (a,b) => a.duration_seconds - b.duration_seconds,
      duration_desc: (a,b) => b.duration_seconds - a.duration_seconds,
      engagement_desc: (a,b) => (b.likeCount/Math.max(b.viewCount,1)) - (a.likeCount/Math.max(a.viewCount,1)),
    }[key] || ((a,b)=>0);
    return copy.sort(cmp);
  }
  function escapeHtml(s) {
    return (s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function render() {
    const q = qInput.value.trim().toLowerCase();
    const sorted = sortBy(VIDEOS, sortSel.value);
    const filtered = q ? sorted.filter(v => v.title.toLowerCase().includes(q)) : sorted;
    grid.innerHTML = filtered.map(v => `
      <div class="card" data-id="${v.id}">
        <div class="thumb-wrap">
          <img loading="lazy" src="${v.thumbnail}" alt="">
          ${v.duration_label ? `<span class="duration-badge">${v.duration_label}</span>` : ''}
        </div>
        <div class="card-body">
          <div class="card-title">${escapeHtml(v.title)}</div>
          <div class="channel">${escapeHtml(v.channelTitle)}</div>
          <div class="card-meta">
            <span>👁 ${v.views_label}</span>
            ${v.likes_label ? `<span>👍 ${v.likes_label}</span>` : ''}
            ${v.comments_label ? `<span>💬 ${v.comments_label}</span>` : ''}
            <span>${v.age_label}</span>
          </div>
        </div>
      </div>
    `).join('');
    empty.hidden = filtered.length > 0;
  }
  function logEvent(payload) {
    try {
      const body = JSON.stringify(payload);
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/event', new Blob([body], {type: 'application/json'}));
      } else {
        fetch('/api/event', {method: 'POST', headers: {'Content-Type': 'application/json'}, body, keepalive: true});
      }
    } catch (e) {}
  }
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
  }
  let ytPlayer = null;
  let currentVideo = null;
  window.onYouTubeIframeAPIReady = function() {
    ytPlayer = new YT.Player('player', {
      host: 'https://www.youtube-nocookie.com',
      playerVars: { autoplay: 1, playsinline: 1, rel: 0 },
      events: { onStateChange: onPlayerStateChange }
    });
  };
  const STATE_NAME = { [-1]: 'unstarted', 0: 'ended', 1: 'playing', 2: 'paused', 3: 'buffering', 5: 'cued' };
  function onPlayerStateChange(e) {
    if (!currentVideo) return;
    const stateName = STATE_NAME[e.data] || String(e.data);
    let position = 0;
    try { position = ytPlayer.getCurrentTime ? ytPlayer.getCurrentTime() : 0; } catch (_) {}
    logEvent({
      video_id: currentVideo.id, title: currentVideo.title, channel: currentVideo.channelTitle,
      type: stateName, position_s: Math.round(position),
      duration_s: currentVideo.duration_seconds, t_iso: new Date().toISOString(),
    });
  }
  function openVideo(id) {
    const v = VIDEOS_BY_ID[id];
    if (!v) return;
    currentVideo = v;
    openYT.href = `https://www.youtube.com/watch?v=${id}`;
    analyzeBtn.classList.remove('queued');
    analyzeBtn.textContent = '📝 분석 큐에 추가';
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    if (ytPlayer && ytPlayer.loadVideoById) ytPlayer.loadVideoById(id);
    logEvent({
      video_id: id, title: v.title, channel: v.channelTitle,
      type: 'opened', position_s: 0, duration_s: v.duration_seconds,
      t_iso: new Date().toISOString(),
    });
  }
  function closeModal() {
    if (currentVideo && ytPlayer && ytPlayer.getCurrentTime) {
      try {
        logEvent({
          video_id: currentVideo.id, title: currentVideo.title, channel: currentVideo.channelTitle,
          type: 'closed', position_s: Math.round(ytPlayer.getCurrentTime()),
          duration_s: currentVideo.duration_seconds, t_iso: new Date().toISOString(),
        });
      } catch (_) {}
    }
    if (ytPlayer && ytPlayer.stopVideo) { try { ytPlayer.stopVideo(); } catch (_) {} }
    currentVideo = null;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }
  grid.addEventListener('click', (e) => {
    const card = e.target.closest('.card');
    if (!card) return;
    openVideo(card.dataset.id);
  });
  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
  qInput.addEventListener('input', render);
  sortSel.addEventListener('change', render);
  analyzeBtn.addEventListener('click', () => {
    if (!currentVideo) return;
    fetch('/api/queue', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({video_id: currentVideo.id, title: currentVideo.title, channel: currentVideo.channelTitle}),
    }).then(r => r.json()).then(j => {
      analyzeBtn.classList.add('queued');
      analyzeBtn.textContent = '✓ 큐에 추가됨';
      showToast(`분석 큐에 추가: ${j.queue_size}개 대기 중. Claude에서 /youtube-analyze --next 실행`);
    }).catch(() => showToast('큐 추가 실패'));
  });
  window.addEventListener('beforeunload', () => {
    if (currentVideo) {
      let pos = 0;
      try { pos = ytPlayer && ytPlayer.getCurrentTime ? ytPlayer.getCurrentTime() : 0; } catch (_) {}
      logEvent({
        video_id: currentVideo.id, title: currentVideo.title, channel: currentVideo.channelTitle,
        type: 'unload', position_s: Math.round(pos),
        duration_s: currentVideo.duration_seconds, t_iso: new Date().toISOString(),
      });
    }
  });
  render();
</script>
</body>
</html>
```

### 18.10 `docs/10.input/youtube-explorer.config.yaml` (빈 골격)

```yaml
# YouTube Explorer 설정. 첫 검색 요청이 오면 프리셋을 채워나간다.
output_dir: docs/30.output/youtube-explorer
cache_ttl_minutes: 60

presets: []
```

### 18.11 `.claude/skills/youtube-analyze/SKILL.md`

````markdown
---
name: youtube-analyze
description: YouTube 영상 URL/ID 또는 큐(--next/--all)에서 자막 + 댓글(좋아요 상위)을 수집해 docs/20.working/youtube-analysis/<id>__<slug>.md로 저장하고, Claude가 요약·키워드·논점·댓글 반응을 분석한다. youtube-explorer 뷰어의 "📝 분석 큐에 추가" 버튼과 연동.
---

# YouTube Analyze Skill

URL/ID 하나 → 자막 + 댓글 추출 → 마크다운 리포트 저장 → Claude가 요약·키워드·논점·댓글 반응 분석.

## 언제 사용하나
- 친구가 보낸 영상 링크 하나를 빠르게 요약하고 싶을 때
- 긴 영상을 직접 안 보고 핵심 + 시청자 반응까지 파악하고 싶을 때
- youtube-explorer 뷰어에서 "📝 분석 큐에 추가" 누른 영상들을 한꺼번에 처리할 때

## 사전 준비 (한 번만)
```powershell
pip install -r .claude/skills/youtube-analyze/scripts/youtube_analyze/requirements.txt
```
프로젝트 루트 `.env`에 `YOUTUBE_API_KEY=AIza...` 필요 (댓글 수집용). 키 없으면 자막만 진행.

## 호출 패턴
```
/youtube-analyze https://www.youtube.com/watch?v=XXXX     # 단건, 댓글 50건 포함
/youtube-analyze XXXX                                     # 11자 ID 직접
/youtube-analyze --next                                   # 큐에서 1건
/youtube-analyze --all                                    # 큐 전체
```

### 댓글 옵션
- 기본: **댓글 50건 자동 수집** + 좋아요 상위 10건만 본문에 인용, 나머지 40건은 `<details>`에 접힘
- `--comments N` — 수집 댓글 수 변경 (0이면 스킵)
- `--no-comments` — 댓글 완전 스킵 (자막만)
- `--top-likes N` — 본문 노출 좋아요 상위 개수 (기본 10)

큐 파일: `~/.cache/youtube-explorer/analyze-queue.jsonl` (youtube-explorer 뷰어가 채움)

## 실행 흐름 (Claude가 따를 절차)

1. URL/ID 추출 (또는 `--next`/`--all`이면 큐에서 꺼냄)
2. 스크립트 실행:
   ```powershell
   $env:PYTHONPATH = ".claude/skills/youtube-analyze/scripts"
   py -3.12 -m youtube_analyze --id <VIDEO_ID>
   ```
3. Claude가 `docs/20.working/youtube-analysis/<id>__<slug>.md`를 Read로 읽고 **`## 분석` 섹션을 append**.

   **분석 서브섹션 순서 (반드시 이대로):**
   1. 3줄 요약
   2. 핵심 키워드 (5~10개)
   3. 주요 논점/주장 (불릿)
   4. 인상적 인용 1~3구 (자막에서)
   5. 맥락·반론 (필요시)
   6. **댓글 분석 — 반드시 `## 분석`의 가장 마지막 서브섹션으로 배치** (댓글이 수집된 경우만):
      - 좋아요 상위 인용 (분석 관점에서 인상적인 댓글 2~3개 재인용)
      - 반응 패턴: 긍정/부정/논쟁/유머 비율 대략, 반복 주제, 자막에 없는 외부 정보
      - **자막 vs 댓글 갭**: 영상 메시지 vs 시청자 실제 반응의 차이
      - 댓글 0건/막힘이면 `> 댓글 비활성화/없음으로 미분석` 한 줄로 대체
4. `--next`/`--all`이면 큐 파일에서 처리한 항목 제거됨 (스크립트가 자동)

## 함정
- **자막 없는 영상**: `[no-transcript]` 메타로 .md 저장 후 종료
- **자동생성 자막**: 정확도 낮음 — 분석에서 명시
- **나이제한·비공개·삭제**: 명시적 에러
- **댓글 비활성화 영상**: status에 사유 기록, 분석에서 명시
- **댓글 분석 편향**: 좋아요 상위만 보면 자극적·동의 댓글이 과대 대표. 반드시 "N건 중 N건" 식 비율 명시, 작은 표본은 일반화 금지

## 참고
- `youtube-transcript-api` 1.x: 인스턴스 메서드 `YouTubeTranscriptApi().list(video_id)` (구버전 클래스 메서드 제거됨)
- 댓글: `commentThreads.list(part=snippet, videoId, order=relevance)` — 1u/100건
- 통합 PRD: `.claude/skills/youtube-explorer/references/PRD.md`
````

### 18.12 `.claude/skills/youtube-analyze/scripts/youtube_analyze/__init__.py`

```python
```

(빈 파일)

### 18.13 `.claude/skills/youtube-analyze/scripts/youtube_analyze/__main__.py`

```python
"""youtube-analyze: fetch a video's transcript (+ optionally top comments) and emit a markdown file Claude can analyze."""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse, parse_qs

try:
    from youtube_transcript_api import YouTubeTranscriptApi
    from youtube_transcript_api._errors import (
        TranscriptsDisabled, NoTranscriptFound, VideoUnavailable,
    )
except ImportError as e:
    print(f"error: youtube-transcript-api not installed ({e})", file=sys.stderr)
    print("  pip install -r .claude/skills/youtube-analyze/scripts/youtube_analyze/requirements.txt", file=sys.stderr)
    sys.exit(2)

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # comments fetching becomes unavailable; transcript still works

try:
    from googleapiclient.discovery import build as _build_yt
    _HAS_GAPI = True
except ImportError:
    _HAS_GAPI = False


OUTPUT_DIR = Path("docs/20.working/youtube-analysis")
QUEUE = Path.home() / ".cache" / "youtube-explorer" / "analyze-queue.jsonl"
TRANSCRIPT_LANGS = ["ko", "en", "ja"]
DEFAULT_COMMENT_TOTAL = 50      # how many raw comments to fetch
DEFAULT_COMMENT_VISIBLE = 10    # how many top-by-likes to inline in body


def extract_video_id(s: str) -> str | None:
    s = s.strip()
    if re.fullmatch(r"[A-Za-z0-9_-]{11}", s):
        return s
    try:
        u = urlparse(s)
    except Exception:
        return None
    if u.hostname in ("youtu.be",):
        vid = u.path.lstrip("/").split("/")[0]
        return vid if re.fullmatch(r"[A-Za-z0-9_-]{11}", vid) else None
    if u.hostname and "youtube.com" in u.hostname:
        qs = parse_qs(u.query)
        if "v" in qs and re.fullmatch(r"[A-Za-z0-9_-]{11}", qs["v"][0]):
            return qs["v"][0]
        m = re.match(r"/(shorts|embed)/([A-Za-z0-9_-]{11})", u.path)
        if m:
            return m.group(2)
    return None


def slugify(s: str, maxlen: int = 40) -> str:
    s = re.sub(r"[\s\-]+", "-", s.strip())
    s = re.sub(r"[^\w\-가-힣]", "", s)
    return s[:maxlen] or "untitled"


def fetch_transcript(video_id: str):
    transcript_list = YouTubeTranscriptApi().list(video_id)
    for lang in TRANSCRIPT_LANGS:
        try:
            t = transcript_list.find_manually_created_transcript([lang])
            return t.fetch(), t.language_code, "manual"
        except Exception:
            pass
    for t in transcript_list:
        if not t.is_generated:
            return t.fetch(), t.language_code, "manual"
    for lang in TRANSCRIPT_LANGS:
        try:
            t = transcript_list.find_generated_transcript([lang])
            return t.fetch(), t.language_code, "auto"
        except Exception:
            pass
    for t in transcript_list:
        return t.fetch(), t.language_code, "auto" if t.is_generated else "manual"
    raise NoTranscriptFound(video_id, TRANSCRIPT_LANGS, transcript_list)


def fmt_time(s: float) -> str:
    s = int(s)
    h, rem = divmod(s, 3600)
    m, sec = divmod(rem, 60)
    return f"{h}:{m:02d}:{sec:02d}" if h else f"{m}:{sec:02d}"


def fetch_top_comments(video_id: str, max_count: int):
    """Fetch comments via YouTube Data API. Returns (list, status_msg). list=None if unavailable."""
    api_key = os.environ.get("YOUTUBE_API_KEY")
    if not api_key:
        return None, "no YOUTUBE_API_KEY in env"
    if not _HAS_GAPI:
        return None, "google-api-python-client not installed"
    try:
        yt = _build_yt("youtube", "v3", developerKey=api_key, cache_discovery=False)
    except Exception as e:
        return None, f"client build failed: {e}"

    out: list[dict] = []
    page_token = None
    try:
        while len(out) < max_count:
            params = {
                "part": "snippet",
                "videoId": video_id,
                "maxResults": min(100, max_count - len(out)),
                "order": "relevance",
                "textFormat": "plainText",
            }
            if page_token:
                params["pageToken"] = page_token
            resp = yt.commentThreads().list(**params).execute()
            for item in resp.get("items", []):
                tl = item["snippet"]["topLevelComment"]["snippet"]
                out.append({
                    "author": tl.get("authorDisplayName", ""),
                    "text": (tl.get("textDisplay") or tl.get("textOriginal") or "").strip(),
                    "likes": int(tl.get("likeCount", 0) or 0),
                    "published_at": tl.get("publishedAt", ""),
                    "reply_count": int(item["snippet"].get("totalReplyCount", 0) or 0),
                })
            page_token = resp.get("nextPageToken")
            if not page_token:
                break
    except Exception as e:
        msg = f"commentThreads.list failed at {len(out)} fetched: {e}"
        return (out if out else None), msg

    out.sort(key=lambda c: -c["likes"])
    return out, f"ok ({len(out)} fetched)"


def _fmt_comment_line(c: dict) -> str:
    text = c["text"].replace("\n", " ").strip()
    reply = f" [답글 {c['reply_count']}]" if c["reply_count"] else ""
    date = (c["published_at"] or "")[:10]
    return f"- 👍 {c['likes']} · @{c['author']} · {date}{reply}: {text}"


def write_markdown(video_id, segments, lang, kind, title_hint=None,
                   comments=None, comments_status="",
                   visible_top=DEFAULT_COMMENT_VISIBLE) -> Path:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    slug = slugify(title_hint or video_id)
    path = OUTPUT_DIR / f"{video_id}__{slug}.md"
    lines = [
        f"# YouTube transcript: {title_hint or video_id}",
        "",
        f"- video_id: `{video_id}`",
        f"- url: https://www.youtube.com/watch?v={video_id}",
        f"- transcript_language: `{lang}` ({kind})",
        f"- fetched_at: {datetime.now(timezone.utc).isoformat()}",
    ]
    if comments is not None:
        lines.append(f"- comments_fetched: {len(comments)} (status: {comments_status})")
    elif comments_status:
        lines.append(f"- comments_fetched: 0 (skipped: {comments_status})")
    lines += ["", "## Transcript", ""]
    for seg in segments:
        if hasattr(seg, "start"):
            start, text = seg.start, seg.text
        else:
            start, text = seg.get("start", 0), seg.get("text", "")
        lines.append(f"[{fmt_time(start)}] {text}")

    if comments:
        top = comments[:visible_top]
        rest = comments[visible_top:]
        lines += [
            "",
            f"## Comments — 좋아요 상위 {len(top)}건 (총 {len(comments)}건 수집)",
            "",
        ]
        for c in top:
            lines.append(_fmt_comment_line(c))
        if rest:
            lines += [
                "",
                f"<details>",
                f"<summary>분석에 사용된 나머지 {len(rest)}건 (펼치기)</summary>",
                "",
            ]
            for c in rest:
                lines.append(_fmt_comment_line(c))
            lines += ["", "</details>"]

    path.write_text("\n".join(lines), encoding="utf-8")
    return path


def write_no_transcript(video_id, title_hint, reason) -> Path:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    slug = slugify(title_hint or video_id)
    path = OUTPUT_DIR / f"{video_id}__{slug}.md"
    path.write_text(
        f"# YouTube transcript: {title_hint or video_id}\n\n"
        f"- video_id: `{video_id}`\n"
        f"- url: https://www.youtube.com/watch?v={video_id}\n"
        f"- status: **[no-transcript]**\n"
        f"- reason: {reason}\n"
        f"- fetched_at: {datetime.now(timezone.utc).isoformat()}\n",
        encoding="utf-8",
    )
    return path


def pop_next_from_queue():
    if not QUEUE.exists():
        return None
    lines = [ln for ln in QUEUE.read_text(encoding="utf-8").splitlines() if ln.strip()]
    if not lines:
        return None
    first = json.loads(lines[0])
    QUEUE.write_text("\n".join(lines[1:]) + ("\n" if lines[1:] else ""), encoding="utf-8")
    return first


def process_one(video_id, title_hint,
                comment_count=DEFAULT_COMMENT_TOTAL,
                visible_top=DEFAULT_COMMENT_VISIBLE):
    comments = None
    comments_status = ""
    if comment_count > 0:
        comments, comments_status = fetch_top_comments(video_id, comment_count)
        print(f"[comments] {video_id}: {comments_status}")

    try:
        segments, lang, kind = fetch_transcript(video_id)
        out = write_markdown(video_id, segments, lang, kind, title_hint,
                             comments=comments, comments_status=comments_status,
                             visible_top=visible_top)
        n_c = len(comments) if comments else 0
        print(f"[ok] {video_id}: transcript={lang}/{kind}, {len(segments)} segments, {n_c} comments → {out}")
        return out
    except TranscriptsDisabled:
        return write_no_transcript(video_id, title_hint, "transcripts disabled by uploader")
    except NoTranscriptFound:
        return write_no_transcript(video_id, title_hint, "no transcript available")
    except VideoUnavailable:
        return write_no_transcript(video_id, title_hint, "video unavailable")
    except Exception as e:
        return write_no_transcript(video_id, title_hint, f"unexpected error: {e}")


def main(argv=None) -> int:
    p = argparse.ArgumentParser(prog="youtube_analyze")
    p.add_argument("--id", help="video id or URL")
    p.add_argument("--next", action="store_true", help="pop next item from analyze queue")
    p.add_argument("--all", action="store_true", help="drain entire analyze queue")
    p.add_argument("--title", help="optional title hint (for filename slug)")
    p.add_argument("--comments", type=int, default=DEFAULT_COMMENT_TOTAL, metavar="N",
                   help=f"fetch top-N comments (default {DEFAULT_COMMENT_TOTAL}, 0 to skip; needs YOUTUBE_API_KEY)")
    p.add_argument("--no-comments", action="store_true", help="skip comment fetching")
    p.add_argument("--top-likes", type=int, default=DEFAULT_COMMENT_VISIBLE, metavar="N",
                   help=f"how many top-liked comments to inline in body (default {DEFAULT_COMMENT_VISIBLE})")
    args = p.parse_args(argv)

    comment_count = 0 if args.no_comments else max(0, args.comments)
    visible_top = max(0, args.top_likes)

    if args.next:
        item = pop_next_from_queue()
        if not item:
            print("queue is empty"); return 0
        process_one(item["video_id"], item.get("title"), comment_count, visible_top); return 0

    if args.all:
        count = 0
        while True:
            item = pop_next_from_queue()
            if not item: break
            process_one(item["video_id"], item.get("title"), comment_count, visible_top)
            count += 1
        print(f"processed {count} item(s)"); return 0

    if not args.id:
        print("error: --id <video_id_or_url> required, or use --next / --all", file=sys.stderr)
        return 2
    vid = extract_video_id(args.id)
    if not vid:
        print(f"error: cannot extract video id from {args.id!r}", file=sys.stderr)
        return 2
    process_one(vid, args.title, comment_count, visible_top)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
```

### 18.14 `.claude/skills/youtube-analyze/scripts/youtube_analyze/requirements.txt`

```
youtube-transcript-api>=0.6.2
google-api-python-client>=2.130
python-dotenv>=1.0
```

---

## 19. 빌드 검증 체크리스트

§17.2 절차로 빌드한 후 다음 모두 ✓이면 성공:

- [ ] `py -3.12 -c "import youtube_explorer; import youtube_analyze"` 둘 다 에러 없음 (PYTHONPATH 두 번 따로 지정)
- [ ] `docs/10.input/youtube-explorer.config.yaml`에 프리셋 한 개 (이름이라도) 추가 후 `py -3.12 -m youtube_explorer --preset <name> --no-open` 실행 → `docs/30.output/youtube-explorer/<name>.html` 생성
- [ ] HTML 파일을 직접 열어 카드 그리드 보임 (단 재생은 file://로 안 됨 — `--no-open` 빼고 다시 실행해 HTTP 서버로 띄울 것)
- [ ] 카드 클릭 → 모달 재생 → 모달 닫기 시 콘솔에 에러 없음
- [ ] "📝 분석 큐에 추가" 클릭 → 토스트 표시 + `~/.cache/youtube-explorer/analyze-queue.jsonl`에 1줄 추가
- [ ] `py -3.12 -m youtube_analyze --next` → `docs/20.working/youtube-analysis/<id>__<slug>.md` 생성, 큐가 비워짐
- [ ] 임의 URL로 `py -3.12 -m youtube_analyze --id <URL>` 직접 호출 → 자막 .md 생성

---

*본 PRD는 §17/§18을 통해 자가완결적으로 두 스킬을 빌드할 수 있는 단일 SoT(Source of Truth) 문서다.*

---

## 20. 단계별 빌드 가이드 (Claude를 처음 써본다는 가정)

> §17/§18은 **한 번에 v0.5 전체**를 만든다. 아래 §20은 **5단계로 나눠** 진행한다. 각 단계는:
> 1. **사용자가 Claude에 그대로 복사·붙여넣을 프롬프트**
> 2. **Claude가 만들거나 바꾸는 파일들**
> 3. **사용자가 보는 결과 + 동작 확인 방법**
>
> 5단계 흐름: ① PRD 보고 skill 만들기 → ② 검색 페이지 만들기 → ③ skill 고도화(시청 기록·분석 큐) → ④ 유튜브 분석 skill 만들기 → ⑤ 댓글까지 분석.

---

### 20.0 시작하기 전에 (한 번만)

**필요한 것:**
- **Claude Code** 설치 — https://docs.claude.com/claude-code (VS Code 확장 또는 CLI)
- **Python 3.12** — https://www.python.org/downloads/ (3.11 이상이면 됨)
- **Google Chrome** — 결과 페이지 자동 오픈에 사용
- **YouTube Data API v3 키** — Stage 1·3은 없어도 동작하지만 Stage 5(댓글)에 필요
  - 발급: https://console.cloud.google.com/apis/credentials → "YouTube Data API v3" 활성화 → API 키 만들기

**폴더 셋업 (3분):**

1. 새 폴더를 하나 만든다 (예: `Documents\my-youtube-skill\`)
2. **이 PRD 파일**(`PRD.md`)을 그 폴더 루트에 복사한다
3. 같은 폴더에 `.env` 파일을 만들고 한 줄 적는다 (선택, Stage 5 전엔 안 적어도 됨):
   ```
   YOUTUBE_API_KEY=AIza...너의키...
   ```
4. VS Code로 그 폴더를 열고 **Claude Code 사이드바**를 활성화한다 (또는 터미널에서 그 폴더로 `cd`한 뒤 `claude` 명령)

이제 Claude에게 문장을 입력할 수 있는 상태. 각 단계 프롬프트를 그대로 복사해서 보내면 된다.

---

### 20.1 Stage 1 — PRD 보고 skill 만들기 (초기 설치)

> **목표:** PRD를 보고 explorer 스킬을 처음부터 빌드. 검색·재생까지 가능한 동작 가능한 상태로 만든다 (한국 콘텐츠 튜닝 디폴트 포함).

#### 1) 사용자가 Claude에 입력할 문장 (그대로 복사)

```
PRD.md 파일을 읽고 §17 부트스트랩과 §18 Reference Implementation을 따라
youtube-explorer 스킬을 빌드해줘. 한국 콘텐츠 튜닝 디폴트(language: ko,
쇼츠 제외, 1년, pool 150, enrich_channel_country: false)도 포함.

단, 이번 Stage 1에서는 **검색→HTML→Chrome 자동 오픈→모달 재생**까지만
동작하면 된다. 다음 항목은 **빼고** 만들어 (Stage 3에서 추가할 예정):
- 모달의 "📝 분석 큐에 추가" 버튼과 토스트
- `POST /api/queue`, `POST /api/event` 핸들러 (`_ApiHandler` 커스텀 핸들러)
- IFrame Player API (`onPlayerStateChange` 이벤트 로깅)
- `analyze-queue.jsonl`, `watch-log.jsonl` 경로 상수

즉 Stage 1의 `__main__.py`는 표준 `SimpleHTTPRequestHandler`로 정적 파일만 서빙,
`templates/page.html.j2`의 모달은 단순 `<iframe>` 임베드 + "YouTube에서 열기 ↗"
버튼만 둔다. youtube-analyze 스킬은 Stage 4에서 만들 거니까 이번엔 빼고,
explorer만 만들어.
```

#### 2) Claude가 하는 일

- 폴더 만들기:
  - `.claude/skills/youtube-explorer/scripts/youtube_explorer/templates/`
  - `.claude/skills/youtube-explorer/references/` (PRD.md 위치)
  - `docs/10.input/`, `docs/30.output/youtube-explorer/`
- 파일 생성 (9개):
  - `SKILL.md` (§18.1)
  - `__init__.py` (빈)
  - `__main__.py` (§18.3) — 로컬 HTTP 서버 + Chrome 자동 오픈. **이번 단계에서는 `SimpleHTTPRequestHandler`만 사용** — `_ApiHandler` / `/api/event` / `/api/queue` / `WATCH_LOG` / `ANALYZE_QUEUE`는 Stage 3에서 추가.
  - `config.py`, `api.py`, `filters.py`, `renderer.py`
  - `templates/page.html.j2` — **단순 `<iframe>` 임베드 모달 버전** (IFrame Player API와 "📝 분석 큐에 추가" 버튼은 Stage 3에서 교체).
  - `requirements.txt`
- 의존성 설치:
  ```powershell
  py -3.12 -m pip install -r .claude/skills/youtube-explorer/scripts/youtube_explorer/requirements.txt
  ```
- `--help` 동작 확인

#### 3) 사용자가 확인하는 것

Claude가 작업 끝나면 다음 둘 다 통과해야 한다:

```powershell
# A) 파일들이 다 있나
ls .claude/skills/youtube-explorer/scripts/youtube_explorer
# → __init__.py, __main__.py, api.py, config.py, filters.py, renderer.py, requirements.txt, templates/

# B) 도움말 출력되나
$env:PYTHONPATH = ".claude/skills/youtube-explorer/scripts"
py -3.12 -m youtube_explorer --help
# → "usage: youtube_explorer [-h] [--preset ...] ..." 보이면 OK
```

#### 4) 이 단계에서 만들어지는 산출물 정리

| 항목 | 위치 | 용도 |
|---|---|---|
| youtube-explorer 스킬 | `.claude/skills/youtube-explorer/` | 다음 단계부터 호출 가능 |
| 빈 프리셋 설정 | `docs/10.input/youtube-explorer.config.yaml` | Stage 2에서 첫 프리셋 작성 |
| 빈 출력 폴더 | `docs/30.output/youtube-explorer/` | Stage 2 결과 HTML 저장될 곳 |

아직 실제 검색은 안 했음 → Stage 2로.

---

### 20.2 Stage 2 — 유튜브 검색 페이지 만들기 (첫 사용)

> **목표:** Stage 1에서 만든 스킬을 써서 실제 검색 → HTML 페이지 → Chrome 자동 오픈. **코드 변경 없음, 사용법만 익히는 단계.**

#### 0) 사전 준비 — YouTube API 키 (한 번만)

1. [Google Cloud Console → API 및 서비스 → 사용자 인증 정보](https://console.cloud.google.com/apis/credentials)에서 **YouTube Data API v3** 활성화 후 API 키 발급
2. 프로젝트 루트 `.env`에 저장 (이 파일은 `.gitignore`로 커밋 제외):
   ```
   YOUTUBE_API_KEY=AIzaSyAR0ZIJXoUxefM7NNIKaXP7wiXqYsMecsg
   ```
3. 스크립트는 실행 시 `.env`를 자동 로드한다(`load_dotenv()`). 키가 없으면 `error: YOUTUBE_API_KEY not set`로 종료.
4. 키가 노출됐다면 Console에서 **재발급/폐기**하고 `.env`만 교체하면 됨 (코드·문서 수정 불필요).

> ⚠️ 위 키는 사용자 요청으로 기록한 실제 값이다. 이 PRD를 외부 공유·커밋·업로드하면 키가 노출되니 그 전에 마스킹하거나 키를 재발급할 것.

#### 1) 사용자가 Claude에 입력할 문장 (예시 — 본인 관심 키워드로 바꿔서)

```
/youtube-explorer 이수지
```

또는 일반 채팅으로:
```
유튜브에서 "PS5 신작" 한국 영상만, 쇼츠 제외, 최근 1개월로 페이지 만들어줘
```

#### 2) Claude가 하는 일

- 사용자 키워드를 받아 `docs/10.input/youtube-explorer.config.yaml`에 새 프리셋 추가 (이름은 자동 작성)
- 한국 한정·쇼츠 제외·1년 디폴트 적용 (별도 지시 없으면)
- `py -3.12 -m youtube_explorer --preset <name>` 실행
- 로컬 HTTP 서버가 자동으로 임의 포트에 기동 + Chrome 새 탭에서 `http://127.0.0.1:<port>/<name>.html` 자동 오픈

#### 3) 사용자가 보는 것 (Chrome)

- 카드 그리드: 썸네일 + 제목 + 채널 + 조회수 + 좋아요 + 길이 뱃지
- 상단에 검색바·정렬 옵션 6종
- 카드 클릭 → 모달에서 영상 재생 (단순 `<iframe>` 임베드)
- 모달 우측 상단 "YouTube에서 열기 ↗" 버튼만 노출
  - "📝 분석 큐에 추가" 버튼은 **Stage 3에서 추가**되므로 이 단계엔 없음

#### 4) 자주 쓰는 패턴 (Claude에 자연어로 던지면 됨)

| 상황 | 사용자가 할 말 | Claude가 하는 일 |
|---|---|---|
| 특정 크리에이터 영상만 모으기 (검색 결과에 본인 채널이 안 잡힘) | "이수지 채널 모드로 바꿔줘" | 캐시에서 채널 ID 추출 → `source.type: channel`로 프리셋 변환 |
| 결과가 너무 적음 | "결과 더 늘려줘" | `candidate_pool_size: 300` 또는 `enrich_channel_country: true` 추가 |
| 영문 채널 섞임 | "한국 채널만" | `enrich_channel_country: true` 켜기 |
| 이상한 채널 노출 | "OO 채널 제외" | `channel_exclude: ["OO"]` 추가 |
| 같은 조건 또 보고 싶음 | 같은 명령 다시 | 캐시 적중하면 쿼터 0, 즉시 표시 |

#### 5) 이 단계에서 만들어지는 산출물 정리

| 항목 | 위치 | 용도 |
|---|---|---|
| 프리셋 정의 | `docs/10.input/youtube-explorer.config.yaml` | 다음 실행에서 재사용 |
| 결과 HTML | `docs/30.output/youtube-explorer/<프리셋>.html` | Chrome에서 보기 |
| API 응답 캐시 | `~/.cache/youtube-explorer/<프리셋>_<해시>.json` | TTL 60분, 같은 조건 재실행 시 쿼터 0 |

---

### 20.3 Stage 3 — skill 고도화: 시청 기록 + 분석 큐

> **목표:** Stage 1에서 만든 explorer 스킬에 **시청 기록 + 분석 큐 기능을 추가**한다. 모달은 단순 `<iframe>` → YouTube IFrame Player API로 교체되고, "📝 분석 큐에 추가" 버튼이 새로 생긴다.

#### 1) 사용자가 Claude에 입력할 문장

```
PRD.md §20.3 Stage 3에 맞춰 youtube-explorer를 고도화해줘.
시청 이벤트 로깅(/api/event)과 "📝 분석 큐에 추가" 버튼(/api/queue)
그리고 YouTube IFrame Player API로 모달을 바꿔줘.
```

#### 2) Claude가 하는 일 (수정 파일 2개)

- `__main__.py`: 로컬 서버 핸들러를 `SimpleHTTPRequestHandler` → 커스텀 `_ApiHandler`로 교체 (POST `/api/event`, `/api/queue` 처리). `WATCH_LOG`, `ANALYZE_QUEUE` 경로 상수 추가.
- `templates/page.html.j2`:
  - `<iframe id="player">` → `<div id="player">` (IFrame Player API가 채움)
  - 모달에 "📝 분석 큐에 추가" 버튼 + 토스트 영역
  - JS: `onYouTubeIframeAPIReady`, `onPlayerStateChange` → sendBeacon으로 `/api/event` POST, 버튼 클릭 시 `/api/queue` POST

#### 3) 사용자가 검증하는 것

1. Stage 2처럼 검색 다시 실행 (예: `/youtube-explorer 이수지`)
2. Chrome에 카드 그리드 뜸 → 카드 클릭 → 영상 재생 (회귀 없는지) + 모달에 **"📝 분석 큐에 추가"** 버튼이 새로 보이는지
3. 다른 카드 1~2개 더 클릭 → 모달의 **"📝 분석 큐에 추가"** 버튼 누르기 → 화면 하단에 토스트 표시
4. 채팅으로 돌아와서 Claude에게:
   ```
   ~/.cache/youtube-explorer/analyze-queue.jsonl 와
   ~/.local/share/youtube-explorer/watch-log.jsonl 파일 내용 보여줘
   ```
5. Claude가 각 파일 읽음 → 큐엔 방금 추가한 영상들이 1줄씩 들어있어야 하고, watch-log엔 `opened`/`playing`/`closed` 같은 이벤트들이 누적되어 있어야 함.

#### 4) 이 단계에서 만들어지는 산출물 정리

| 항목 | 위치 | 용도 |
|---|---|---|
| 시청 이벤트 로그 | `~/.local/share/youtube-explorer/watch-log.jsonl` | 향후 시청 패턴 분석용 (현재 미사용) |
| 분석 대기 큐 | `~/.cache/youtube-explorer/analyze-queue.jsonl` | Stage 4의 analyze skill이 소비 |

이제 큐에 영상이 쌓여있지만 분석할 도구가 없음 → Stage 4로.

---

### 20.4 Stage 4 — 유튜브 분석 skill 만들기

> **목표:** 두 번째 스킬 `youtube-analyze` 신규 생성. URL/ID 또는 Stage 3에서 쌓아둔 큐 → 자막 추출 → 마크다운 → Claude가 요약·키워드·논점 분석.

#### 1) 사용자가 Claude에 입력할 문장

```
PRD.md §20.4 Stage 4에 따라 youtube-analyze 스킬을 새로 만들어줘.
자막 추출 + Claude 분석까지만 포함하고, 댓글은 Stage 5에서 추가할 거야.
```

#### 2) Claude가 하는 일

- 폴더 만들기: `.claude/skills/youtube-analyze/scripts/youtube_analyze/`
- 폴더 만들기: `docs/20.working/youtube-analysis/` (분석 결과 .md가 떨어질 곳)
- 파일 생성 (4개):
  - `SKILL.md` (자막 전용 버전 — 댓글 옵션 제외)
  - `__init__.py` (빈)
  - `__main__.py` — `youtube-transcript-api`로 자막 추출, .md 저장, 큐 소비 (`--next`/`--all`)
  - `requirements.txt` — `youtube-transcript-api>=0.6.2`
- 의존성 설치:
  ```powershell
  py -3.12 -m pip install -r .claude/skills/youtube-analyze/scripts/youtube_analyze/requirements.txt
  ```

#### 3) 사용자가 첫 분석 실행

**방법 A — Stage 3 큐 비우기 (한꺼번에):**
```
/youtube-analyze --all
```

**방법 B — 특정 URL 단건 분석:**
```
/youtube-analyze https://www.youtube.com/watch?v=XXXXXXXXXXX
```

#### 4) Claude가 하는 일

- 스크립트 실행 → 영상별로 `docs/20.working/youtube-analysis/<id>__<제목>.md` 생성 (자막 본문 포함)
- Claude가 그 .md를 Read로 읽고 **`## 분석` 섹션을 append**:
  - 3줄 요약
  - 핵심 키워드 (5~10개)
  - 주요 논점 (불릿)
  - 인상적 인용 1~3구
  - (필요시) 맥락·반론

#### 5) 자주 마주칠 함정

| 상황 | 설명 | 대응 |
|---|---|---|
| 자막 없는 영상 | uploader가 자막 비활성화함 | `[no-transcript]` 메타로 저장, Claude는 제목·설명만으로 제한적 분석 |
| 자동생성 자막 부정확 | "양지머리" → "양치머리" 같은 오류 | Claude가 의미상 보정해 읽음. 분석 시 "자동생성이라 부정확" 주의 명시 |
| 같은 영상 다시 분석 | 자막 재요청됨 (캐시 없음 — 향후 개선) | 의미 있으면 별도 .md로 보존 (덮어쓰기 됨) |

#### 6) 이 단계에서 만들어지는 산출물 정리

| 항목 | 위치 | 용도 |
|---|---|---|
| youtube-analyze 스킬 | `.claude/skills/youtube-analyze/` | URL/큐 분석 |
| 분석 결과 .md | `docs/20.working/youtube-analysis/<id>__<제목>.md` | 자막 + Claude 분석 |
| 큐 소비 | `analyze-queue.jsonl` 줄 수 줄어듦 | 처리한 항목은 자동 제거 |

---

### 20.5 Stage 5 — 댓글까지 분석하기

> **목표:** analyze 스킬에 댓글 수집 추가. 좋아요 상위 10건은 본문 인용, 나머지 40건은 접힘 처리, `## 분석`의 **마지막 서브섹션으로 "댓글 분석"** (시청자 반응 패턴, 자막 vs 댓글 갭).

#### 1) 사전 준비: API 키

`.env`에 `YOUTUBE_API_KEY=AIza...`가 있어야 댓글 수집 가능 (없으면 Stage 4와 동일하게 자막만 동작).

#### 2) 사용자가 Claude에 입력할 문장

```
PRD.md §20.5 Stage 5에 따라 youtube-analyze 스킬에 댓글 분석을 추가해줘.
좋아요 상위 10건만 본문에 인용하고, 나머지 40건은 <details>에 접고,
"## 분석"의 가장 마지막 서브섹션으로 댓글 반응 패턴을 추가해줘.
```

#### 3) Claude가 하는 일 (수정 파일 3개)

- analyze `__main__.py`:
  - import 추가: `dotenv` (`.env` 자동 로드), `googleapiclient`
  - 함수 추가: `fetch_top_comments` (commentThreads.list), `_fmt_comment_line`
  - `write_markdown` 확장 — `## Comments — 좋아요 상위 N건` 섹션 + `<details>`로 나머지 접기
  - CLI 옵션 추가: `--comments N`, `--no-comments`, `--top-likes N`
- analyze `requirements.txt`: `google-api-python-client`, `python-dotenv` 추가
- analyze `SKILL.md`:
  - "댓글 옵션" 섹션 추가
  - "분석 서브섹션 순서" 강제 — 6번 댓글 분석이 **반드시 마지막**

#### 4) 사용자가 다시 분석 실행

```
/youtube-analyze --id https://www.youtube.com/watch?v=XXXX
```
또는 큐 일괄 (Stage 3에서 쌓아둔 게 있으면):
```
/youtube-analyze --all
```

#### 5) 결과 .md 구조

```
# YouTube transcript: ...
- video_id, url, transcript_language, fetched_at, comments_fetched: 50

## Transcript
[0:00] ...
...

## Comments — 좋아요 상위 10건 (총 50건 수집)
- 👍 265 · @user · 2026-04-28: ...
- ...

<details><summary>분석에 사용된 나머지 40건 (펼치기)</summary>
- 👍 19 · @user · ... : ...
...
</details>

## 분석
### 3줄 요약
### 핵심 키워드
### 주요 논점
### 인상적 인용 (자막)
### 맥락·반론
### 댓글 분석   ← ✓ 반드시 마지막
- 좋아요 상위 인용 2~3개 (분석 관점 재인용)
- 반응 패턴(긍정/부정/논쟁/유머 비율, 반복 주제, 자막에 없는 외부 정보)
- 자막 vs 댓글 갭 (영상 의도 메시지 vs 시청자 실제 반응)
```

#### 6) 자주 마주칠 함정

| 상황 | 설명 | 대응 |
|---|---|---|
| 댓글 비활성화 영상 | uploader가 끔 | 댓글 섹션 자동 생략, 분석에선 "댓글 비활성화로 미분석" 한 줄 |
| API 키 없음 | .env에 키 없음 | 댓글 섹션 자동 생략, 자막만 동작 |
| 작은 표본 일반화 | 50건은 통계적으로 작음 | Claude가 반드시 "N건 중 N건이 X" 비율로 표기, 일반화 금지 |
| 좋아요 상위 편향 | 자극적·동의 댓글이 과대 대표 | 댓글 분석에 그 사실 명시 |

#### 7) 이 단계에서 만들어지는 산출물 정리

| 항목 | 위치 | 용도 |
|---|---|---|
| 댓글 포함 .md | `docs/20.working/youtube-analysis/<id>__<제목>.md` | 자막 + 좋아요 상위 + Claude의 댓글 반응 분석 |
| 댓글 분석 서브섹션 | `## 분석`의 마지막 | 영상 메시지 vs 시청자 반응 갭 파악 |

---

### 20.6 Stage 6 — 카드 그리드 순차 자동재생

> **목표:** explorer 뷰어 모달에 **순차 자동재생**을 추가한다. 카드를 클릭한 위치부터 화면에 보이는 순서(필터·정렬 반영)대로 재생되고, 한 영상이 끝나면 다음 영상으로 자동 진행한다. 이전/다음 버튼, 자동재생 토글, 진행 표시("3 / 10")가 새로 생긴다.

#### 1) 사용자가 Claude에 입력할 문장

```
PRD.md §20.6 Stage 6에 맞춰 youtube-explorer 모달에 카드 그리드 순차 자동재생을 추가해줘.
prev/next 버튼 + 자동재생 토글 + 진행 표시, 카드 클릭한 위치부터 시작.
```

#### 2) Claude가 하는 일 (수정 파일 1개)

- `templates/page.html.j2` 만 수정 (`__main__.py` 변경 없음 — 정적 HTML 안에서 동작):
  - CSS: `.modal-nav`, `.modal-progress`, `.autoplay-toggle`, `.modal-btn:disabled` 추가
  - 모달에 좌상단 컨트롤바 추가: `◀ 이전` / 진행표시 `3 / 10` / `다음 ▶` / `☑ 자동재생`
  - JS:
    - `currentList` — `render()`가 화면에 그린 순서(필터·정렬 결과)를 그대로 보관
    - `indexOfCurrent()` / `openVideoAt(i)` / `updateNav()` — 현재 영상의 위치 계산·이동·버튼 상태 갱신
    - `onPlayerStateChange`에서 `YT.PlayerState.ENDED` + 자동재생 ON이면 다음 영상으로 `openVideoAt(i+1)`, 마지막이면 모달 닫기
    - prev/next 버튼 + `←`/`→` 키보드 단축키

#### 3) 사용자가 검증하는 것

1. `/youtube-explorer <키워드>` (캐시 적중하면 쿼터 0) → Chrome 페이지
2. 아무 카드나 클릭 → 모달 좌상단에 `◀ 이전 / N / M / 다음 ▶ / 자동재생` 보임
3. `다음 ▶` 누르면 그리드 순서대로 다음 영상으로 이동, 진행 표시 갱신
4. 짧은 영상이 끝까지 재생되면 자동으로 다음 영상으로 넘어가는지 (자동재생 ON 기준)
5. 자동재생 체크 해제 → 끝나도 안 넘어감. 마지막 영상에서 끝나면 모달 자동으로 닫힘
6. `←` `→` 키로도 이동되는지

#### 4) 설계 메모

- 재생 순서 = **현재 보이는 그리드 순서**. 정렬(조회수/최신/길이 등)이나 제목 필터를 바꾸면 그 순서가 그대로 재생 순서가 됨.
- 인덱스는 `currentVideo.id`로 매번 `currentList`에서 다시 찾으므로, 재생 중 정렬·필터를 바꿔도 다음/이전이 새 순서를 따름.
- 임베드 차단 영상은 자동재생 중 재생이 안 될 수 있음 → 다음 영상으로 자연히 안 넘어가면 `다음 ▶` 수동 클릭 또는 `채널 exclude`.

#### 5) 이 단계에서 만들어지는 산출물 정리

| 항목 | 위치 | 용도 |
|---|---|---|
| 순차 자동재생 모달 | `templates/page.html.j2` (재생성되는 `*.html`에 반영) | 카드 클릭 위치부터 그리드 순서대로 연속 시청 |

---

### 20.7 Stage 7 — 선택분만 순차 재생 (체크 → 내 목록)

> **목표:** Stage 6의 순차 자동재생을 확장한다. 검색 결과 카드를 **체크해서 골라 "내 목록"을 만들고, 선택한 영상만** 그 순서대로 연속 재생한다. 전체 그리드가 아니라 사용자가 고른 부분집합을 재생 대상으로 삼는다.

#### 1) 사용자가 Claude에 입력할 문장

```
youtube-explorer 카드에 체크박스를 달아서, 고른 영상만 순서대로 재생하는 기능 추가해줘.
헤더에 '선택 재생 (N)' 버튼이랑 '선택 해제' 버튼도.
```

#### 2) Claude가 하는 일 (수정 파일 1개)

- `templates/page.html.j2` 만 수정 (`__main__.py` 변경 없음):
  - CSS: `.card.selected`(외곽선 강조), `.sel`(카드 좌상단 체크박스), `.ctrl-btn`(헤더 버튼) 추가
  - 헤더 컨트롤에 `▶ 선택 재생 (N)` / `선택 해제` 버튼 추가
  - 카드 썸네일 좌상단에 체크박스(`.selChk`) 추가
  - JS:
    - `selected`(Set) — 체크한 영상 id 보관, 필터·정렬이 바뀌어도 유지
    - `playList` / `selectionPlay` — 모달 nav가 따라가는 목록을 **전체 그리드(currentList)** 와 **선택 부분집합** 사이에서 전환
    - `updateSelBar()` — 선택 개수에 따라 버튼 라벨·활성화 갱신
    - grid의 `change`(체크 토글)와 `click`(체크박스 클릭 시 재생 안 함) 분리 처리
    - `선택 재생` → `currentList` 순서대로 선택분만 모아 `playList`로 두고 0번부터 재생

#### 3) 사용자가 검증하는 것

1. `/youtube-explorer <키워드>` → 카드마다 좌상단 체크박스
2. 카드 3~4개 체크 → 헤더 `▶ 선택 재생 (3)`로 개수 표시, 버튼 활성화
3. `▶ 선택 재생` 클릭 → **체크한 영상만** 화면 순서대로 재생, 진행 표시가 `1 / 3`처럼 선택 개수 기준
4. 모달 `다음 ▶` / `←`/`→`가 선택 목록 안에서만 이동, 마지막 끝나면 모달 닫힘
5. 정렬·제목 필터를 바꿔도 체크 상태가 유지되는지
6. 체크박스 말고 카드 본문 클릭 시엔 기존처럼 전체 그리드 순서로 재생되는지
7. `선택 해제` → 전체 체크 풀림

#### 4) 설계 메모

- **두 모드 공존:** 카드 본문 클릭 = 전체 그리드 순서(일반), `선택 재생` = 선택 부분집합. 모달을 닫으면 자동으로 일반 모드로 복귀.
- 인덱스는 `currentVideo.id`로 `playList`에서 매번 재탐색 → 모드가 바뀌어도 prev/next가 올바른 목록을 따라감.
- 선택은 화면 표시 순서(`currentList`)대로 재생되므로, 재생 전에 정렬을 바꿔 순서를 정할 수 있음.

#### 5) 이 단계에서 만들어지는 산출물 정리

| 항목 | 위치 | 용도 |
|---|---|---|
| 선택 재생(체크박스 + 선택 재생 버튼) | `templates/page.html.j2` (재생성되는 `*.html`에 반영) | 고른 영상만 "내 목록"으로 순차 시청 |

---

### 20.8 Stage 8 — 최신성·정확도 개선 (검색↔채널 / 정렬 / 캐시)

> **목표:** "최신순"이 진짜 최신을 반영하고, 특정 채널을 빠짐없이 볼 수 있게 한다. 세 한계를 고친다 — ① 검색 후보가 조회수순으로만 수집돼 신규 영상 누락 ② 키워드 검색이 채널 전체를 못 가져옴 ③ 캐시 스냅샷이 최신 영상을 가림.

#### 1) 사용자가 Claude에 입력할 문장

```
youtube-explorer에서 "최신순"으로 봐도 진짜 최근 업로드가 안 보이고,
특정 채널을 통째로 최신순으로 보고 싶어. 후보 수집·정렬·캐시·소스 선택을 개선해줘.
```

#### 2) Claude가 하는 일 (수정 파일 4개 + 규칙 2개)

- **`api.py` — 검색 후보 양축 수집:** `_ids_from_search`가 `viewCount`(조회수 상위) + `date`(최신)로 두 번 수집해 병합(`_search_ids_by_order`로 분리). 조회수 적은 신규 영상도 항상 후보 풀에 들어옴.
- **`api.py` — 캐시 키 축소:** `_cache_path`가 후보 풀에 영향 주는 필드(source/filters/candidate_pool_size/enrich/pinned)만 해시 → `sort`/`limit` 제외. 정렬만 바꿔 재실행하면 캐시 재사용(쿼터 0).
- **`filters.py` — 정렬 한글 별칭:** `normalize_sort()` + `_SORT_ALIASES`로 `최신순`=`published_desc`, `조회수순`=`views_desc`, `좋아요순`/`댓글순`/`참여순` 인식. `sort: 최신순`을 YAML에 그대로 써도 동작.
- **`__main__.py` — 최신 보장 선별:** `_select_videos()`가 limit의 약 40%(`_RECENT_SHARE`)를 최신 영상에 먼저 배정하고 나머지를 `preset.sort` 상위로 채움. `sort`가 최신순이면 블렌드 없이 순수 최신 N개.
- **`config.yaml` — 캐시 TTL 단축:** `cache_ttl_minutes: 60 → 15` (스포츠/뉴스성 채널 신선도 우선).
- **규칙 문서화(CLAUDE.md·SKILL.md):**
  - **검색 vs 채널:** 특정 채널/크리에이터는 **`source.type: channel` + `channel_id`** 로 만든다. 키워드 검색(`search`)은 텍스트 일치 영상만 반환해 같은 채널 영상도 누락됨(채널 ID는 기존 결과 HTML의 `channelId` 재사용, 또는 `search.list(type=channel, q=채널명)`/영상의 `snippet.channelId`로 확보).
  - **"최신순" 요청 시 `--no-cache`** 로 실행(신선도 우선).

#### 3) 사용자가 검증하는 것

1. 검색 프리셋을 `sort: 최신순`으로 `--no-cache` 실행 → 상단이 몇 시간 전 업로드부터 내림차순(`strictly newest-first`).
2. 같은 query에서 `sort`만 바꿔 재실행 → 로그에 `[cache] ... items` + `Total quota used: 0 units`.
3. 디폴트(`views_desc`)에서도 결과에 최신 영상이 일부 섞임(블렌드 40%).
4. **채널 프리셋**(`source.type: channel`)으로 만들면, 키워드 검색에선 빠졌던 영상(제목에 키워드 없는 것)까지 채널 업로드 전체가 최신순으로 나옴.

#### 4) 설계 메모

- **검색 ≠ 채널 카탈로그:** `search.list`는 `order=date`라도 "쿼리에 매칭된 집합" 안에서만 최신순. 채널 전체는 `channels.list → uploads playlist`(=`source.type: channel`)로만 완전. 실제 사례: 채널 "이글스 EVERYDAY"를 키워드 검색하면 "키움 김웅빈…"·"롯데 시즌초반"·"LG 시즌초반"(제목에 채널명 없음)이 누락됨.
- **후보 풀은 두 축, 표시는 한 정렬:** 풀에 조회수+최신을 모두 담아두면 뷰어의 `조회수순`/`최신순` 토글이 둘 다 의미있게 동작.
- **캐시 TTL 트레이드오프:** 짧을수록 신선↑·쿼터↑. 최신성이 중요한 프리셋은 `--no-cache` 병행.

#### 5) 이 단계에서 만들어지는 산출물 정리

| 항목 | 위치 | 용도 |
|---|---|---|
| 후보 양축 수집 | `api.py` `_ids_from_search`/`_search_ids_by_order` | 신규 영상도 후보에 포함 |
| 캐시 키 축소 | `api.py` `_cache_path` | 정렬만 바꿔도 캐시 재사용(쿼터 0) |
| 정렬 한글 별칭 | `filters.py` `normalize_sort`/`_SORT_ALIASES` | `sort: 최신순` 등 한글 정렬 |
| 최신 보장 선별 | `__main__.py` `_select_videos`/`_RECENT_SHARE` | limit 안에 최신 보장(블렌드) |
| 캐시 TTL 단축 | `config.yaml` `cache_ttl_minutes: 15` | 신선도 향상 |
| 소스 선택 규칙 | CLAUDE.md / SKILL.md | 채널은 channel 소스, 최신순은 `--no-cache` |

---

### 20.9 단계별 산출물 한눈에 보기

| Stage | 만들/바뀐 파일 | 명령어 / 사용법 | 결과로 보이는 것 |
|---|---|---|---|
| **1. PRD 보고 skill 만들기** | `.claude/skills/youtube-explorer/` 폴더 전체 (9파일) | `--help` 확인만 | 스킬 코드 자체 (아직 사용 X) |
| **2. 검색 페이지 만들기** | `docs/10.input/...config.yaml` (프리셋), `docs/30.output/.../*.html` | `/youtube-explorer <키워드>` | Chrome 카드 그리드, 모달 재생 |
| **3. skill 고도화** | explorer 파일 2개 수정 (`__main__.py`에 `_ApiHandler` 추가, `page.html.j2`를 IFrame Player API + 큐 버튼 버전으로 교체). `~/.cache/.../analyze-queue.jsonl`, `~/.local/share/.../watch-log.jsonl` 자동 생성 | 모달에서 "📝 분석 큐에 추가" 누르기 | 큐 파일에 영상 누적 |
| **4. 유튜브 분석하기** | `.claude/skills/youtube-analyze/` 폴더 전체 (4파일), `docs/20.working/youtube-analysis/*.md` | `/youtube-analyze --all` 또는 `--id <url>` | 자막 본문 + Claude 분석 |
| **5. 댓글까지 분석** | analyze 파일 3개 수정 | `/youtube-analyze --id <url>` 다시 (이젠 댓글까지) | 자막 + 좋아요 상위 + 댓글 반응 분석 |
| **6. 순차 자동재생** | explorer `page.html.j2` 1개 수정 | `/youtube-explorer <키워드>` 다시 | 모달 prev/next·자동재생 토글·진행표시, 끝나면 다음 영상 자동 진행 |
| **7. 선택분만 순차 재생** | explorer `page.html.j2` 1개 수정 | 카드 체크 → 헤더 `▶ 선택 재생 (N)` | 고른 영상만 화면 순서대로 연속 재생 |
| **8. 최신성·정확도 개선** | explorer `api.py`·`filters.py`·`__main__.py`·`config.yaml` 수정 + CLAUDE.md/SKILL.md 규칙 | `sort: 최신순` + `--no-cache`, 채널은 `source.type: channel` | 진짜 최신순 반영, 채널 전체 누락 없음, 정렬만 바꾸면 쿼터 0 |

---

### 20.10 막혔을 때 Claude에 물어볼 수 있는 것

| 증상 | Claude에 그대로 던질 문장 |
|---|---|
| `pip install` 에러 | "`pip install -r .../requirements.txt`가 에러나, 메시지: ..." |
| `--help`도 안 됨 | "py -3.12 -m youtube_explorer --help 가 ImportError나" |
| 빈 페이지·결과 0개 | "검색 결과가 0개야. PRD §3.3 candidate_pool_size 늘리거나 enrich_channel_country 켜는 방향으로 봐줘" |
| 영문 채널 많이 섞임 | "영문 채널이 너무 많아. language: ko + enrich_channel_country: true로 강화" |
| 카드는 보이는데 클릭 시 검은 화면 | "임베드 차단 영상 같아. 모달의 'YouTube에서 열기' 버튼 사용. 자주 그러면 channel_exclude로 빼줘" |
| 큐에 누른 게 안 쌓임 | "모달의 '📝 분석 큐에 추가' 클릭했는데 analyze-queue.jsonl이 비어있어. 로컬 서버 핸들러가 _ApiHandler 맞는지 확인" |
| 자막 추출이 모두 [no-transcript] | "전부 자막 없다고 뜨는데 진짜인지 확인해줘 (브라우저로 영상 자막 토글 보고)" |
| 댓글 분석이 안 됨 | ".env의 YOUTUBE_API_KEY 확인. analyze __main__.py에 fetch_top_comments 함수 있는지" |
| 자동재생이 다음으로 안 넘어감 | "영상 끝났는데 다음으로 안 넘어가. 자동재생 토글 ON인지, 임베드 차단 영상인지 확인. page.html.j2에 PlayerState.ENDED 핸들링 있는지" |
| 체크박스 눌렀는데 영상이 재생됨 | "카드 체크하니 모달이 열려. grid click 핸들러에 `e.target.closest('.sel')` 가드 있는지 확인" |
| 선택 재생이 전체를 다 틀어버림 | "선택분만 안 틀고 전부 재생돼. selPlayBtn이 playList=선택부분집합으로 두는지, nav가 currentList 대신 playList 쓰는지 확인" |
| 특정 채널 영상이 일부 누락됨 | "그 채널 영상이 검색에서 빠져. §20.8대로 `source.type: channel` + channel_id로 채널 프리셋 만들어줘" |
| "최신순"인데 최근 업로드가 안 보임 | "마지막 수집 이후 올라온 영상 같아. §20.8대로 `sort: 최신순` + `--no-cache`로 다시 받아줘" |
| 쿼터 다 씀 (API key 일일 10,000 units 초과) | "오늘은 캐시(15분 TTL)로 버티고 내일 다시. 또는 새 API 키 만들기" |

각 단계에서 막히면 그 단계 번호(예: "Stage 3에서 막혔어")랑 에러 메시지를 같이 던지면 Claude가 그 단계의 §20.N 절을 다시 보고 진단해 줌.

---
