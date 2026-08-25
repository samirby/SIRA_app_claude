# SIRA APP v0.9.9

## Project phases and tasks

- Project tasks can now be assigned to an existing project phase.
- Phase selection is available in both quick task creation and task editing.
- The phase name appears on Kanban task cards and on the task detail summary.
- Every phase displays completed tasks, total tasks and an automatic progress bar.
- Project phase progress updates after task creation, editing or status changes.

## Database update

Back up the database, then import `database/migrations/012_task_project_phases.sql` exactly once before deploying the application files. Migration `011_project_planning_delivery.sql` must already be installed because the new task relation uses the `project_milestones` table.
