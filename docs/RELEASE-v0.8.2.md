# SIRA APP v0.8.2

## Task detail update

- Added `Edito detyrën` to the task detail header.
- The button opens the existing edit form with the task data prefilled.
- The completion, reopen and invoice actions remain unchanged.
- Updated the visible application name to `SIRA APP v0.8.2`.
- Added a right sidebar with total hours, billable hours and calculated labor cost.
- Added persistent extra costs with description, date, amount and deletion.
- Added an internal hourly labor-cost rate to the task form.

Import `database/migrations/006_task_costs.sql` once before deploying this version.
