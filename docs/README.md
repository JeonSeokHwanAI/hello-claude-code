# docs — 문서 폴더 안내

작업 단계별로 나눠 두었습니다. 폴더 규칙은 저장소 루트의 [`CLAUDE.md`](../CLAUDE.md)에 정의돼 있습니다.

| 폴더 | 내용 |
|---|---|
| [`10.input/`](./10.input) | 외부에서 받은 원본 자료. 수정하지 않고 그대로 보관 |
| [`20.working/`](./20.working) | 작업 중인 초안·중간 산출물 |
| [`30.output/`](./30.output) | 최종 결과물. 공유·배포용 |
| [`90.reference/`](./90.reference) | 기수와 무관한 참고 문서 — [목차](./90.reference/README.md) |

## 현재 들어 있는 것

| 경로 | 내용 |
|---|---|
| [`20.working/season2/`](./20.working/season2) | 2기(2026-09~10) 진행 중 — PRD·신청 테이블·메일 자동화 |
| [`30.output/season1/`](./30.output/season1) | 1기(2026-05~06) 완료 산출물 — 커리큘럼·강의안·설문·실습 자료 |
| [`90.reference/`](./90.reference) | Claude Code 기술·학습 자료. 다음 기수에서도 재사용 |

기수가 끝나면 해당 폴더를 `20.working/` 에서 `30.output/` 으로 옮깁니다.

## 사이트는 `sites/` 아래에 기수별로 있습니다

| 폴더 | 배포 |
|---|---|
| [`sites/season1/`](../sites/season1) | 1기 안내 사이트 (Vercel `hello-claude-code`) |
| [`sites/season2/`](../sites/season2) | 2기 모집 사이트 (Vercel `monthly-claude-2`) |
| [`sites/season2-class/`](../sites/season2-class) | 2기 수강생 강의 안내 (Vercel `monthly-claude-2-class`) |

> ⚠️ 두 사이트는 **Vercel 프로젝트가 서로 다릅니다.** `monthly-claude-2`는
> `rootDirectory = sites/season2` 로 지정돼 있어야 하며, 이 설정이 비면
> 푸시할 때 저장소 루트(1기)가 배포되어 2기 주소에 1기 페이지가 뜹니다.

## 공개 저장소 주의

이 저장소는 **공개**입니다. 계좌번호·API 토큰·카톡 참여코드가 담긴 파일은
`.gitignore` 로 제외되어 있습니다. 문서를 추가할 때 민감 정보가 들어가지 않았는지
확인해 주세요. 제외 중인 파일은 `.gitignore` 하단에 경로로 적혀 있으므로,
**문서를 다른 폴더로 옮길 때는 `.gitignore` 경로도 함께 고쳐야 합니다.**
