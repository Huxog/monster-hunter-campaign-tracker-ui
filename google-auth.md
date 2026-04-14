# Google Sign In — Implementation Checklist

Three moving parts that need to land in order:

## 1. Google Cloud Console
- Create an OAuth 2.0 Client ID at console.cloud.google.com
- Authorized JavaScript origins: `http://localhost:5173` (dev), production URL when ready
- Authorized redirect URIs: your backend callback URL (e.g. `https://your-api.com/api/auth/google/callback`)
- You'll receive:
  - **Client ID** — safe for frontend, goes in `VITE_GOOGLE_CLIENT_ID`
  - **Client Secret** — backend only, never exposed to the frontend

## 2. Backend (blocker — must land first)
- Install Laravel Socialite + Google provider
- Add to `config/services.php`: client_id, client_secret, redirect
- Two new endpoints:
  - `GET /api/auth/google` — redirects user to Google's consent screen
  - `GET /api/auth/google/callback` — exchanges code, finds/creates user, returns Sanctum token
- The callback response should match the existing `AuthResponse` shape `{ data: User, token: string }`

## 3. Frontend
- Install: `npm install @react-oauth/google`
- Add env var: `VITE_GOOGLE_CLIENT_ID=<your-client-id>`
- Wrap app in `<GoogleOAuthProvider>` in `src/main.tsx`
- Add `<GoogleLogin>` button to `LoginForm` and `RegisterForm`
- On success, send the credential token to the backend callback and call `setAuth()` with the response

```tsx
// Rough shape — wire up once backend is ready
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';

<GoogleLogin
  onSuccess={(res) => {
    // POST res.credential to /api/auth/google/callback
    // then setAuth(token, user)
  }}
/>
```

## Notes
- The backend is the critical path — nothing to wire on the frontend until the two API endpoints exist
- Match the existing `AuthResponse` shape so `useLogin` / `useRegister` patterns can be reused
