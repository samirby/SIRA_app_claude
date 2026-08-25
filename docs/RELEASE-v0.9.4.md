# SIRA-APP-v0.9.4

## Advanced project workspace

Projects now support two operational views:

- Kanban with Waiting, Working and Completed columns;
- the compact List view introduced in v0.9.3.

Dragging a project to Completed opens the guarded completion flow, which checks
open tasks and asks how billing should be handled.

The project detail page now includes:

- Overview with progress, task counters, time and financial totals;
- Tasks with the complete project Kanban;
- Work Process aggregated from all task time entries and internal notes;
- Finance with base package, extra paid tasks, client costs, internal cost and VAT;
- Documents for project-related links;
- History for project creation, edits, status changes, documents and completion.

## Database

Import `database/migrations/009_advanced_project_workspace.sql` once before the
application deployment. It creates `project_documents` and `project_activity`.
