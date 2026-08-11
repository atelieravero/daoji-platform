# 08. Public Assets & Success Message Configuration

## Objective
Implement a public storage bucket for static assets, add banner image support to forms, and build a Markdown-powered customizable success screen.[cite: 17]

## Context
Currently, the platform only supports private, expiring URLs for file uploads. To support public-facing images (like form banners or instructional images in success messages) without latency or expiration issues, a secondary public R2 bucket must be integrated. Furthermore, the form submission success screen needs to be highly customizable, supporting tables, images, and flexible placement of the applicant's magic token.[cite: 17]

## Technical Constraints
*   **Storage Architecture:** Maintain strict separation. `S3_BUCKET_NAME` remains for private applicant uploads. A new `S3_PUBLIC_BUCKET_NAME` combined with `NEXT_PUBLIC_CDN_URL` will host public assets.[cite: 17]
*   **Markdown Rendering:** Unified `MarkdownRenderer` must parse GitHub Flavored Markdown (tables via `remark-gfm`) and semantically downgrade headings (`#` becomes `<h3>`, `##` becomes `<h4>`) to preserve page structure.[cite: 17]
*   **Component Modularity:** A reusable `MarkdownEditor` component must be built to support drag-and-drop public image uploads, replacing standard textareas in the builder.[cite: 17]
*   **Token Injection:** The public engine must intercept the `{{TOKEN_BOX}}` string in the success message and seamlessly replace it with the interactive React component.[cite: 17]

## Acceptance Criteria
- [x] Configure `getPublicPresignedUploadUrl` Server Action for the public bucket.[cite: 17]
- [x] Update `MarkdownRenderer` to support tables and shifted semantic headings.[cite: 17]
- [x] Build the `MarkdownEditor` component with drag-and-drop image uploading.[cite: 17]
- [x] Update Form Builder schema and UI to include `bannerImageUrl`, `successTitleEn/Zh`, and `successMessageEn/Zh`.[cite: 17]
- [x] Update Public Form Engine to render the banner image and the customized success screen with dynamic token placement.[cite: 17]
- [x] Add the banner image UI to the top of the success screen.
- [x] Add a "Submit another response" button to clear session storage and reset the form state, updating i18n dictionaries.