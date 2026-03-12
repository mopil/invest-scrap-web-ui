# invest-scrap-web-ui

`public.scrapped_document` 리뷰용 어드민 프론트엔드입니다.

## 로컬 실행

1. `public/app-config.js`에 Supabase 정보를 넣습니다.

```js
window.APP_CONFIG = {
  supabaseUrl: "https://YOUR_PROJECT.supabase.co",
  supabaseAnonKey: "YOUR_SUPABASE_ANON_KEY",
  adminEmail: "admin@example.com"
};
```

2. 의존성을 설치합니다.

```powershell
cd C:\Users\Admin\Desktop\invest-scrap-web-ui
npm install
```

3. 개발 서버를 실행합니다.

```powershell
cd C:\Users\Admin\Desktop\invest-scrap-web-ui
npm run dev
```

4. 개발 서버가 안 되면 빌드 후 preview로 확인합니다.

```powershell
cd C:\Users\Admin\Desktop\invest-scrap-web-ui
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
```

## Supabase 적용

1. Supabase에서 관리자 계정을 만듭니다.
   - `Authentication > Users`

2. API 정보 확인
   - `Settings > API`
   - `Project URL` -> `supabaseUrl`
   - `anon/public key` -> `supabaseAnonKey`

3. `public/app-config.js`에 실제 값을 넣습니다.

4. `supabase-policies.sql`에서 관리자 이메일을 실제 이메일로 바꿉니다.

5. Supabase `SQL Editor`에서 `supabase-policies.sql`을 실행합니다.
