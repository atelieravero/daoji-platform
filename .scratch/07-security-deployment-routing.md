# 07. Security, Deployment, & China Routing

## Objective
Lock down the admin dashboard, configure Cloudflare routing for GFW mitigation, and deploy the application to production.

## Context
The admin dashboard is currently unprotected. We need to lock it down to a single superuser (Gmail). We also need to deploy to Vercel and configure Cloudflare reverse proxy routing across two domains (`maggapatipada.org` and `daoji.info`) to test and mitigate GFW interference in Mainland China.

## Technical Constraints
*   **Auth:** Implement Supabase Auth (OAuth or Magic Link) restricted to the designated superuser.
*   **Middleware:** Next.js middleware to protect `/admin/*`.
*   **Routing:** Hook up domains via Cloudflare (orange cloud proxy) to mask Vercel IPs.
*   **Testing:** Run China firewall latency tests (e.g., ping.pe) on both domains.

## Acceptance Criteria
- [ ] Supabase Auth implemented for the Gmail superuser.
- [ ] Middleware successfully redirects unauthorized `/admin` visitors.
- [ ] App deployed to Vercel.
- [ ] Cloudflare configured for both domains.
- [ ] Latency/GFW testing completed to determine the primary distribution link.