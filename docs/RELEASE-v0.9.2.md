# SIRA-APP-v0.9.2

## Hostinger package correction

Version 0.9.1 accidentally included both the legacy root `app/` tree and the new
`src/app/` tree. Next.js selected the legacy UI on Hostinger while loading the
new project services, so the old project form failed validation.

Version 0.9.2:

- ships only `src/app/`;
- restores the complete Projects and Products workspace;
- accepts the older project's missing price, VAT and discount values as safe defaults;
- requires no new database migration after `008_project_workspace.sql` was imported.
