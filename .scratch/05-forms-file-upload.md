# 05. S3/OSS File Upload Integration

## Objective
Implement a secure, S3-compatible file upload mechanism for form submissions, utilizing standard AWS SDKs to ensure seamless future migration to AliCloud OSS.

## Context
Applicants need to upload files (e.g., receipts, ID documents). To mitigate GFW (Great Firewall) risks and avoid vendor lock-in, we are using **Cloudflare R2** and interacting with it using the standard `@aws-sdk/client-s3`. To maintain strict security, buckets remain completely private. Uploaded files store their raw key (`submissions/uuid.ext`) in the database, and admins access them via a secure proxy route (`/admin/file`).

## Technical Constraints
*   **Library:** Use `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`.
*   **Architecture:** Use the "Pre-signed URL" pattern to upload files directly from the browser to the private Cloudflare R2 bucket.
*   **Public Engine:** Wire `field.type === 'file'` to trigger the URL fetch, handle the direct upload, and save the raw S3 key into the `activeAnswers` state.
*   **CSV Export & Admin:** Ensure CSV export and data tables dynamically prefix the raw key with the secure `/admin/file?path=` proxy route.

## Acceptance Criteria
- [x] AWS SDK S3 client utility configured (Cloudflare R2).
- [x] Server Action created to generate pre-signed POST/PUT URLs.
- [x] Form Engine UI handles file selection, upload progress, and strict 10MB limits.
- [x] Form Engine writes the private file key as the answer value for the `file` data key.
- [x] CSV export and Admin Data Table correctly output the secure proxy URL.