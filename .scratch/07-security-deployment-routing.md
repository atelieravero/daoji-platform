# 07. Security, Deployment, & China Routing

## Objective
Lock down the admin dashboard, configure Cloudflare routing for GFW mitigation, and deploy the application to production.

## Context
The admin dashboard is fortified using Supabase password-based authentication and a unified Next.js `proxy.ts` middleware. Unauthorized visitors trying to access `/admin/*` are automatically intercepted and redirected to `/admin/login`. Additionally, all private Cloudflare R2 file downloads are gated behind an admin session verification check.

## Technical Constraints
*   **Auth:** Supabase Auth (`signInWithPassword`) restricted to verified admin credentials.
*   **Proxy/Middleware:** Unified Next.js `proxy.ts` handling both session verification for `/admin` routes and localization routing via `next-intl`.
*   **Storage Security:** File proxy route (`/admin/file/route.ts`) requires an active admin session before generating temporary signed R2 URLs.
*   **Routing & Deployment:** Vercel Hosting + Cloudflare Reverse Proxy across `maggapatipada.org` and `daoji.info` for GFW mitigation.

## Acceptance Criteria
- [x] Supabase password-based Auth implemented for admin users.[cite: 8]
- [x] Unified Next.js proxy/middleware successfully intercepts and redirects unauthorized `/admin` visitors.[cite: 8]
- [x] Secure file proxy route configured with strict admin session validation.[cite: 8]
- [x] App deployed to Vercel.[cite: 8]
- [x] Cloudflare configured for both custom domains.[cite: 8]
- [x] Latency/GFW testing completed to determine the primary distribution link.[cite: 8]