# 13. Strict File Privacy & Storage Segregation

## Objective
Segregate private file uploads between test and production form submissions in Cloudflare R2, and enforce strict Action-Based Access Control (ABAC) guards on document streaming and downloads via the secure file proxy route[cite: 25].

## Context
Form applicants upload private and sensitive identification documents, certificates, and media files during the registration process[cite: 25]. Currently, submissions support both preview/test submissions (`is_test: true`) and verified applicant submissions (`is_test: false`)[cite: 25]. To prevent data pollution, accidental leakage, and unauthorized access, storage paths within the private R2 bucket are segregated into distinct directory prefixes (`submissions/test/` vs `submissions/real/`)[cite: 25]. Furthermore, file retrieval through the internal proxy route (`/admin/file`) verifies user action capabilities (`submissions:view_test` vs `submissions:view_real`) to ensure read-only or scoped managers cannot access unauthorized production assets[cite: 25].

## Technical Constraints
*   **Storage Partitioning (Private R2 Bucket):**
    *   **Real Submissions:** Stored under `submissions/real/[uniqueId].[extension]`.
    *   **Test Submissions:** Stored under `submissions/test/[uniqueId].[extension]`.
    *   **Public Assets:** Handled separately via the public CDN bucket (`/banners/`, `/public/`) and exempt from private proxy routing[cite: 25].
*   **Secure File Proxy (`app/admin/file/route.ts`):**
    *   Authenticates user session and enforces active account status via `requirePermission`[cite: 25].
    *   **Path-Based Permission Inspection & Traversal Guard:**
        *   Rejects any path containing `..` or not prefixed with `submissions/test/` or `submissions/real/` with `403 Forbidden`.
        *   Paths matching `submissions/test/*` require `submissions:view_test` capability[cite: 25].
        *   Paths matching `submissions/real/*` require `submissions:view_real` capability[cite: 25].
    *   Generates short-lived (60-second) presigned download redirects directly to Cloudflare R2.
*   **Upload Pipeline Integration:**
    *   `getPresignedUploadUrl` in `actions.ts` evaluates the `isTest` flag to write directly to `submissions/test/` or `submissions/real/`.
    *   `FormEngine.tsx` transmits the URL `test=true` parameter state to `getPresignedUploadUrl` during applicant uploads.
*   **Submissions UI Alignment (`app/admin/forms/[form_id]/submissions`):**
    *   `page.tsx` evaluates Next.js 14/15 async `params` and passes `canViewTest`, `canViewReal`, and `canExport` capabilities.
    *   `actions.ts` uses admin elevation for `team_members` profile resolution and filters out live rows when `canViewReal` is false.
    *   `SubmissionsClient.tsx` disables file links and renders visual restriction warnings for production files when the user only holds `submissions:view_test`.

## Acceptance Criteria

### Phase 1: Storage Prefix & Presigned URL Routing (Completed)
- [x] Update S3 upload presigned URL generation to evaluate `is_test` and prefix keys with `submissions/test/` or `submissions/real/`[cite: 25].
- [x] Update public form file upload component to transmit testing context during upload requests[cite: 25].

### Phase 2: Secure File Proxy RBAC Enforcement (Completed)
- [x] Refactor `app/admin/file/route.ts` to enforce active status and path-based permissions[cite: 25].
- [x] Implement path checking: enforce `submissions:view_test` for test files and `submissions:view_real` for real submission files[cite: 25].
- [x] Reject directory traversal attempts and unrecognized path prefixes with `403 Forbidden`.
- [x] Stream/redirect temporary signed download URLs via `@aws-sdk/client-s3` (`GetObjectCommand`)[cite: 25].

### Phase 3: Submissions UI & Access Verification (Completed)
- [x] Update submissions data table in `app/admin/forms/[form_id]/submissions` to construct verified proxy links[cite: 25].
- [x] Ensure users with `submissions:view_test` only see test rows and cannot click production file download links[cite: 25].
- [x] Resolve Next.js 15 async route param compatibility in `app/admin/forms/[form_id]/submissions/page.tsx`.
- [x] Verify that users with `submissions:view_real` can download files across both test and real submission datasets[cite: 25].