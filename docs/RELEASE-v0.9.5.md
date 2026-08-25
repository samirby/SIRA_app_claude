# SIRA-APP-v0.9.5

## Refined project workspace

The project detail page now follows the agreed workflow:

- **Përmbledhja** includes progress, task status and the complete financial summary.
- **Detyrat** embeds the full Tasks module, including Kanban/List, filters, labels, editing, drag-and-drop and task completion.
- **Procesi i punës** has a clear form for dated project updates with title, description and a chronological history.
- **Dokumentet** accepts real file uploads and provides direct downloads. Files are stored persistently in MariaDB and are limited to 10 MB.
- **Historiku** remains the automatic audit trail for important project changes.

## Database

Import `database/migrations/010_project_refinements.sql` once before deploying the application. It adds persistent file data to `project_documents` and creates `project_updates`.
