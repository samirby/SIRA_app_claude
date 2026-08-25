# SIRA Platform v0.7.0

## Tasks

- Kanban and list views
- Client and project reference
- Assignee, priority, status, dates and time tracking
- Subtasks and task history
- Fixed-price or hourly billing data

## Invoicing workflow

```text
Task completed
→ Pending billing
→ Invoice draft
→ Invoice finalized
→ Invoiced
```

Cancelling the invoice returns linked tasks to `Pending billing`.

## Database

Run:

```text
database/migrations/004_tasks_and_invoicing.sql
```
