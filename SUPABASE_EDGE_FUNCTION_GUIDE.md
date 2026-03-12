# Supabase Edge Function Guide

이 문서는 이 레포에서 Supabase Edge Function을 수정, 배포, 운영할 때 참고하는 기준 문서다.

## 현재 기준

- Supabase project ref: `dwamyepwdfnukkkohpeb`
- 현재 함수 이름: `bad-document-embedding`
- 함수 소스 경로: `supabase/functions/bad-document-embedding/index.ts`
- 프론트 호출 위치: `src/services/documents.js`

## 역할 분리

- 프론트
  - 버튼 클릭
  - `supabase.functions.invoke("bad-document-embedding", ...)` 호출
  - 성공/실패 메시지 표시
- Edge Function
  - 현재 `BAD` 문서 조회
  - 아직 임베딩되지 않은 row만 선별
  - `title` 기준 임베딩 생성
  - `bad_document_embedding` 테이블에 upsert

## 로컬 파일 수정 위치

- 함수 코드는 반드시 레포 안의 아래 파일을 기준으로 수정한다.

```text
supabase/functions/bad-document-embedding/index.ts
```

- Supabase Dashboard의 `Code` 탭에서 직접 수정하지 않는 것을 우선한다.
- Dashboard UI는 코드 파싱이 깨질 수 있으므로, 가능하면 로컬 파일 수정 후 CLI 배포를 사용한다.

## 필요한 Secret

이 함수는 아래 secret이 필요하다.

- `OPENAI_API_KEY`
- `SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAIL`

## Secret이 없을 때 원칙

필요한 secret 값이 대화에 없으면, 작업 전에 사용자에게 값을 요청한다.

예시:

- `OPENAI_API_KEY 알려줘`
- `ADMIN_EMAIL 알려줘`
- `SUPABASE_ACCESS_TOKEN 알려줘`

주의:

- `OPENAI_API_KEY`를 `app-config.js`에 넣지 않는다.
- secret은 브라우저로 내려가면 안 된다.
- secret은 Supabase secret 또는 배포용 환경변수로만 관리한다.

## Supabase CLI 사용

이 환경에서는 `supabase` 바이너리가 없을 수 있으므로 `npx supabase`를 사용한다.

프로젝트 확인:

```powershell
$env:SUPABASE_ACCESS_TOKEN='YOUR_TOKEN'
npx supabase projects list
```

프로젝트 링크:

```powershell
$env:SUPABASE_ACCESS_TOKEN='YOUR_TOKEN'
npx supabase link --project-ref dwamyepwdfnukkkohpeb
```

함수 배포:

```powershell
$env:SUPABASE_ACCESS_TOKEN='YOUR_TOKEN'
npx supabase functions deploy bad-document-embedding
```

## Secret 설정 예시

```powershell
$env:SUPABASE_ACCESS_TOKEN='YOUR_TOKEN'
npx supabase secrets set OPENAI_API_KEY=YOUR_OPENAI_KEY
```

여러 개를 한 번에 넣는 방식 예시:

```powershell
$env:SUPABASE_ACCESS_TOKEN='YOUR_TOKEN'
npx supabase secrets set OPENAI_API_KEY=YOUR_OPENAI_KEY ADMIN_EMAIL=admin@example.com
```

필요하면 아래도 함께 설정한다.

```powershell
$env:SUPABASE_ACCESS_TOKEN='YOUR_TOKEN'
npx supabase secrets set SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

## 배포 순서

1. 로컬 파일 `supabase/functions/bad-document-embedding/index.ts` 수정
2. 필요한 secret이 있는지 확인
3. 없으면 사용자에게 secret 요청
4. `npx supabase link --project-ref dwamyepwdfnukkkohpeb`
5. `npx supabase functions deploy bad-document-embedding`
6. 프론트에서 버튼 클릭 후 응답 확인

## 현재 응답 형태

함수는 아래 형태로 응답한다.

```json
{
  "results": [
    { "scrapped_document_id": 123, "ok": true },
    { "scrapped_document_id": 124, "ok": false, "error": "..." }
  ],
  "success_count": 1,
  "failure_count": 1,
  "skipped_count": 3
}
```

## 참고 규칙

- 함수 이름을 바꾸면 반드시 둘 다 같이 수정한다.
  - `src/services/documents.js`
  - `supabase/functions/<function-name>/index.ts`
- 함수 이름과 배포 이름은 반드시 동일해야 한다.
- 전체 BAD 기준 로직, 중복 방지 로직, 관리자 검증 로직은 프론트가 아니라 Edge Function 안에 둔다.
- 임베딩은 현재 `title`만 사용한다. `eval_reason`이나 별도 원문은 테이블에 저장하지 않는다.
