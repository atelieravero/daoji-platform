# 13. Strict File Privacy & Storage Segregation

## Objective
Segregate private file uploads between test and production form submissions in Cloudflare R2, and enforce strict Action-Based Access Control (ABAC) guards on document streaming and downloads via the secure file proxy route[cite: 8, 9].

## Context
Form applicants upload private and sensitive identification documents, certificates, and media files during the registration process[cite: 9]. Currently, submissions support both preview/test submissions (`is_test: true`) and verified applicant submissions (`is_test: false`)[cite: 9]. To prevent data pollution, accidental leakage, and unauthorized access, storage paths within the private R2 bucket must be segregated into distinct directory prefixes (`submissions/test/` vs `submissions/real/`)[cite: 8, 9]. Furthermore, file retrieval through the internal proxy route (`/admin/file`) must check user action capabilities (`submissions:view_test` vs `submissions:view_real`) to ensure read-only or scoped managers cannot access unauthorized production assets[cite: 8, 9, 10].

## Technical Constraints
*   **Storage Partitioning (Private R2 Bucket):**
    *   **Real Submissions:** Stored under `submissions/real/[eventId]/[formId]/[applicantToken]_[filename]`.
    *   **Test Submissions:** Stored under `submissions/test/[eventId]/[formId]/[timestamp]_[filename]`.
    *   **Public Assets:** Handled separately via the public CDN bucket (`/banners/`, `/public/`) and exempt from private proxy routing[cite: 9].
*   **Secure File Proxy (`app/admin/file/route.ts`):**
    *   Must authenticate user session using `createClient()` from `@/lib/supabase/server`[cite: 1, 9].
    *   Must verify account status (`status === 'active'`) from `team_members` before serving any file stream[cite: 1, 9].
    *   **Path-Based Permission Inspection:**
        *   Paths matching `submissions/test/*` require `submissions:view_test` capability[cite: 8, 10].
        *   Paths matching `submissions/real/*` require `submissions:view_real` capability[cite: 8, 10].
    *   Unauthorized requests must return a `403 Forbidden` response without disclosing file existence[cite: 1].
*   **Upload Pipeline Integration:**
    *   Presigned URL generators and upload actions must inspect the form's testing state (`?test=true` / `is_test: true`) and prefix the destination S3 key accordingly[cite: 8, 9].
*   **Submissions UI Alignment (`app/admin/forms/[form_id]/submissions`):**
    *   Ensure file columns and attachment previews pass the exact relative key path to `/admin/file?path=...`[cite: 9].
    *   Conditionally render clickable download links based on `permissions.canViewReal` and `permissions.canViewTest`[cite: 10].

## Acceptance Criteria

### Phase 1: Storage Prefix & Presigned URL Routing
- [ ] Update S3 upload presigned URL generation to evaluate `is_test` and prefix keys with `submissions/test/` or `submissions/real/`[cite: 8, 9].
- [ ] Update public form file upload component to transmit testing context during upload requests[cite: 9].

### Phase 2: Secure File Proxy RBAC Enforcement
- [ ] Refactor `app/admin/file/route.ts` to fetch user roles and status from `team_members`[cite: 1, 9].
- [ ] Implement path checking: enforce `submissions:view_test` for test files and `submissions:view_real` for real submission files[cite: 8, 10].
- [ ] Reject suspended, inactive, or unauthenticated users with `401 Unauthorized` or `403 Forbidden`[cite: 1].
- [ ] Stream file buffer directly using `@aws-sdk/client-s3` (`GetObjectCommand`) with appropriate MIME type headers[cite: 9].

### Phase 3: Submissions UI & Access Verification
- [ ] Update submissions data table in `app/admin/forms/[form_id]/submissions` to construct verified proxy links[cite: 9].
- [ ] Verify that a user with `submission_viewer` or `form_editor` with only `submissions:view_test` cannot download production files[cite: 4, 10].
- [ ] Verify that `super_admin` and users with `submissions:view_real` can download files across both test and real submission datasets[cite: 4, 10].