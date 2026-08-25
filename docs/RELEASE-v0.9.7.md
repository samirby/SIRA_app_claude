# SIRA-APP-v0.9.7

This release expands Projects from a task container into a planning and delivery workspace.

## New project capabilities

- Planned hours versus actual work time
- Cost budget, actual internal cost, profit and profit margin
- Phases and milestones with status and dates
- Project blockers with severity and resolution state
- Typed project updates: update, information, decision, problem and client request
- Deliverables with Draft, In Review and Approved states
- Responsive milestone timeline and compact planning summary

## Deployment

1. Back up the current database.
2. Import `database/migrations/011_project_planning_delivery.sql` once.
3. Deploy `SIRA-APP-v0.9.7.zip` through Hostinger.
4. Restart the Node.js application.

Existing projects remain valid; the new planning values default to zero until edited.
