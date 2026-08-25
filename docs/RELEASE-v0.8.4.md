# SIRA APP v0.8.4

- `E re` uses a soft blue background.
- `Në punë` uses a soft turquoise background.
- `Në pritje` uses a soft amber background.
- `Përfunduar` uses a soft green background.
- Task cards remain white for readability.
- The task overview is shorter and more compact.
- Date, time-entry mode, start time and end time share one desktop row.
- The manual-hours field stays in the same compact row when selected.
- Saved time entries use one compact row with the work description, interval, duration and date.
- The task title is not repeated inside its own time-entry list.
- Every saved time entry can be deleted; the task's total worked time is recalculated automatically.
- Task labels can be created, edited and deleted centrally under Settings.
- Labels keep their selected colors and appear directly on task cards.
- Subtasks and internal notes are combined into one compact two-column module on desktop.
- Internal notes and work time are unified into a single `Procesi i punës` tab.
- Every process entry stores the date, start time, end time and work description together.
- Previous internal notes remain visible in the same process history.
- The separate subtasks box has been removed from the task detail page.
- Extra costs can be internal-only or billable to the client.
- Client-billable extra costs keep separate real-cost and invoice amounts and become invoice lines automatically.

Import `database/migrations/007_extra_cost_billing.sql` once before deploying this package.
