# 05. S3/OSS File Upload Integration

## Objective
Implement a secure, S3-compatible file upload mechanism for form submissions, utilizing standard AWS SDKs to ensure seamless future migration to AliCloud OSS.

## Context
Applicants need to upload files (e.g., receipts, ID documents). To mitigate GFW (Great Firewall) risks and avoid vendor lock-in, we will use Supabase's native storage bucket but interact with it using the standard `@aws-sdk/client-s3`. This allows a zero-code switch to AliCloud OSS via environment variables if needed. Uploaded files must generate public URLs saved into the submission JSON.

## Technical Constraints
*   **Library:** Use `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`.
*   **Architecture:** Use the "Pre-signed URL" pattern to upload files directly from the browser to the bucket, bypassing Vercel/Next.js payload limits.
*   **Public Engine:** Wire `field.type === 'file'` to trigger the URL fetch, handle the direct upload, and save the final public URL into the `activeAnswers` state.
*   **CSV Export:** Ensure CSV export outputs the clickable file URL.

## Acceptance Criteria
- [ ] AWS SDK S3 client utility configured.
- [ ] Server Action created to generate pre-signed POST/PUT URLs.
- [ ] Form Engine UI handles file selection, upload progress, and errors.
- [ ] Form Engine writes the final S3/OSS file URL as the answer value for the `file` data key.
- [ ] CSV export correctly displays the URL.