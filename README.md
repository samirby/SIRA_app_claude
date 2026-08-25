# SIRA Enterprise Foundation v0.1.0

Hostinger:
- Framework: Next.js
- Node.js: 22.x
- Root: ./
- Build: Default for Next.js

Import:
database/migrations/001_core.sql

Health:
- /api/v1/health/live
- /api/v1/health/ready

Version policy:
- 0.x = active development
- 1.0.0 = stable only after all core modules are complete and tested


## Platform Architecture & Capabilities

Open `/settings` to view the complete platform capability map covering:

- Core platform and multi-company architecture
- Modules and add-ons
- Events, jobs, workflows and approvals
- AI infrastructure
- Web, PWA, desktop and mobile readiness
- Polyglot service integration
- Localization
- Integrations
- File and notification services
- Security, compliance, backup and monitoring
- Plans, licensing, usage and testing


## SIRA Platform Hub

The Settings capability map now includes `Platform Hub & Connected Platforms`.

Detailed documentation:

```text
docs/PLATFORM-HUB.md
```

This defines the future control center for Smart Xhamia and other independent
platforms operated by SIRA Solutions.


## v0.3.0 architecture foundation

This release adds structural foundations for:

- modules and add-ons;
- dependency checks;
- AI providers;
- platform hub;
- app studio;
- localization (`sq`, `de`, `en`);
- PWA metadata;
- events, jobs and workflows;
- email and storage provider interfaces;
- connected platforms;
- notifications and files;
- local, staging and production environments.

These are architectural foundations. Large business capabilities remain scheduled
for gradual functional implementation.


## v0.3.1 design refresh

This release aligns the visual language much closer to the Hostinger dashboard reference while keeping top navigation as requested.


## v0.4.0 — Clients

The first functional business module includes:

- quick client registration;
- name, phone, email and address;
- MySQL persistence;
- searchable client list;
- responsive table and modal;
- extended profile route prepared for future fields.

Import `database/migrations/003_clients_quick_registration.sql` before using the module.


## v0.4.1 — SIRA Brand System

This release introduces the official SIRA design tokens and brand palette.

See:

```text
docs/BRAND-SYSTEM.md
```


## v0.4.4

Fixed MySQL parameter typing in the client update repository for strict TypeScript builds.


## v0.4.4 Brand Refresh

- New Ocean Teal and Deep Navy brand palette
- Wider SIRA wordmark styling
- Updated status and neutral colors
- Hostinger-independent visual identity


## v0.4.4
- Fixed double client-list request on first page load.
- Client rows remain visible during search refreshes.
- Previous client requests are cancelled to prevent flicker and race conditions.


## v0.4.5
- Fixed quick client registration when the optional email field is left empty.
- Empty email values are now stored as NULL instead of failing validation.

## v0.4.6 — Client archive safety

- Archive clients instead of deleting them directly.
- Separate Active and Archived client views.
- Restore archived clients.
- Permanent deletion is available only from the archived view and requires typing the exact client name.
- Client names now link to the client profile route.


## v0.5.9

- dashboard refined into a compact integrated hero row;
- top-level +Detyrë action removed from dashboard header;
- module-level quick actions added: + Task, + Ticket, + Projekt, + Kontratë;
- standard overview cards now include direct module actions and cleaner layout.


## v0.6.0

- Added a respectful Quran gratitude card to the end of the first Dashboard row.
- Verse: Ibrahim 14:7, with Arabic text, Albanian translation, and reference.


## v0.6.1

- Removed Pamje, Module and Statusi cards from the first Dashboard row.
- Kept the Dashboard welcome section on the left.
- Added the Quran gratitude card on the right side of the same row.


## v0.6.2

- Removed the Arabic Quran text from the Dashboard.
- Moved the Quran label, Albanian translation and surah reference below Dashboard Standard.
- Kept the welcome title and description directly underneath.


## v0.6.3

- Restored the Quran gratitude card to the right side of the first Dashboard row.
- Arabic text remains removed; Albanian translation and Surah reference remain visible.


## v0.6.5

- Redesigned Settings with clean sidebar navigation, search, platform summary and capability cards.


## v0.6.6

- Removed the duplicate Dashboard breadcrumb/title block.
- Added automatic time-based Albanian greeting.
- Quran card expands horizontally for longer verses.
- Clicking the verse opens a full reading modal.


## v0.6.7

- Dashboard header redesigned into two clear cards: left greeting card and right Quran verse card.
- Removed the oversized shared header container feeling and improved balance between both sections.


## v0.7.0 — Tasks & Invoicing

- Functional task management with Kanban and list views.
- Client, project reference, assignee, priority, dates, time and subtasks.
- Fixed-price and hourly billing configuration on each task.
- Completed tasks can be queued for invoicing.
- Pending work can be selected and edited inside a new invoice draft.
- Billing states: not ready, pending, drafted and invoiced.
- Tasks are marked invoiced only after invoice finalization.
- Cancelling an invoice returns linked work to the pending billing queue.
- Import `database/migrations/004_tasks_and_invoicing.sql` before using these modules.

## v0.8.0 — Task workflow

- Client/person task ownership (one is required)
- Project linkage with active project selection
- Task detail page for time entries, subtasks, internal notes and labels
- Explicit task completion and billing handoff

## v0.8.1 — Task card navigation

- The complete task card opens the task detail page reliably.
- Drag and drop uses a separate card handle, so it no longer blocks card clicks.
- Cards show the title, project when linked, client/person, colored labels and due date.

## v0.8.2 — Task detail editing

- The task detail page includes an `Edito detyrën` action in its header.
- The action opens the existing task edit form with the selected task prefilled.
- The application version badge uses the `SIRA APP v0.x.x` naming convention.
- The detail sidebar summarizes worked hours, billable hours and internal labor cost.
- Extra task costs can be added and removed with description, date and amount.
- Import `database/migrations/006_task_costs.sql` before deploying v0.8.2.

## v0.9.1 — Projects workspace

- Products/Packages can store a default price, VAT and standard task templates.
- A project belongs to a client and can copy a selected package as a financial snapshot.
- Project tasks can be included, extra billable work or non-billable work.
- Project detail combines progress, time, internal costs, client costs and billing totals.
- Completing a project validates open tasks and offers draft invoice, invoice later or no billing.
- Project tasks are excluded from individual task billing to prevent duplicate invoicing.
- Import `database/migrations/008_project_workspace.sql` before deploying v0.9.1.

## v0.9.2 — Clean Hostinger package

- Removes the duplicate legacy root `app/` tree from the deployment package.
- Keeps `src/app/` as the only Next.js application directory.
- Accepts missing financial fields from a temporarily cached v0.9.0 project form.
- No additional database migration is required after v0.9.1.

## v0.9.3 — Compact projects list

- Redesigned the projects table with separate Client and Service columns.
- Added a compact progress bar, status badge and due date.
- Project rows now show labels collected from their tasks.
- Added direct actions for project overview, editing, tasks and finance.
- No database migration is required.

## v0.9.4 — Advanced project workspace

- Added Kanban/List views for projects with drag-and-drop between Waiting and Working.
- Completing from Kanban opens the protected project completion and billing flow.
- Added advanced project tabs: Overview, Tasks, Work Process, Finance, Documents and History.
- Work Process aggregates time and notes from every task in the project.
- Documents can be linked to a project and major project changes are recorded in History.
- Import `database/migrations/009_advanced_project_workspace.sql` before deploying v0.9.4.

## v0.9.5 — Refined project workspace

- Project Tasks now use the complete Tasks module with the same Kanban/List views, filters, cards and actions.
- Finance is displayed directly inside the project Overview.
- Work Process supports manual dated updates with title, description and history.
- Project documents are uploaded and downloaded as real files, with a 10 MB limit.
- Import `database/migrations/010_project_refinements.sql` once before deploying v0.9.5.

## v0.9.6 — Quick project task creation

- The New Task form opened inside a project now contains only Title, Description, Priority and Due Date.
- Client and project are assigned automatically from the current project.
- After saving, the user remains in the project and the new task appears immediately in its Kanban/List view.
- No additional database migration is required after v0.9.5.

## v0.9.7 — Project planning and delivery

- Projects now include planned hours and a cost budget, compared with actual work time and internal costs.
- Added a dedicated Phases & Milestones tab with status, start/end dates and a visual timeline.
- Added project blockers with severity, due date and resolved/open states.
- Project finances now show profit and margin in the Overview.
- Work Process updates can be categorized as update, information, decision, problem or client request.
- Documents can be marked as deliverables and moved through Draft, In Review and Approved states.
- Import `database/migrations/011_project_planning_delivery.sql` once before deploying v0.9.7.

## v0.9.8 — Simplified Projects

- Project navigation now contains only Overview, Tasks and Documents.
- Phases, waiting reasons, finances and activity are integrated into Overview.
- New projects require only client, package/service, title and due date; optional fields are behind More details.
- Project status is presented through the simple Waiting, In progress and Completed workflow.
- Fixed Hostinger collation errors when adding phases, blockers or approving deliverables.
- No new database migration is required after v0.9.7.

## v0.9.9 — Project phases and tasks

- Every project task can be assigned to a project phase when it is created or edited.
- The selected phase is shown on the task card and on the task detail page.
- Each phase shows completed/total tasks and an automatic progress percentage.
- Overall phase progress is calculated automatically from all tasks assigned to phases.
- Import `database/migrations/012_task_project_phases.sql` once before deploying v0.9.9.

## v0.10.0 — Access & Vault registry

- Added the `Qasjet & Kasaforta` module for servers, hosting, domains, networks, cloud services, databases, email and applications.
- Records include owner/scope, provider, address, safe service URL, username, 2FA status, renewal date and non-secret notes.
- External Bitwarden, Vaultwarden, 1Password or KeePass links can be attached without storing passwords in SIRA.
- Dashboard indicators highlight upcoming renewals and active records without 2FA.
- Changes are recorded in the platform audit log.
- Import `database/migrations/013_access_registry.sql` once before deploying v0.10.0.

## v0.8.3 — Unified task overview

- The task title, status, actions and summary metrics are combined into one visual module.
- The information remains responsive and stacks cleanly on mobile screens.

## v0.8.4 — Kanban status colors

- Each Kanban status column has its own soft background and header color.
- Task cards remain white for clear text contrast.
- Work time is integrated into the internal-notes module.
- Extra costs distinguish internal expenses from amounts billed to the client.
- Import `database/migrations/007_extra_cost_billing.sql` once before deploying this updated v0.8.4 package.

## v0.8.5 — Work process history

- The work-process history uses the original internal-notes timeline design.
- Each entry shows its date, start/end interval, duration and description without a separate card.
- The package name follows the clean `SIRA-APP-v0.8.5.zip` format.

## v0.8.6 — Cleaner work process

- The box title is now `Procesi i punës` without a subtitle or redundant inner tab.
- Dates, time intervals, total duration and descriptions use larger, clearer typography.
- Delete actions use a clean, visible button.

## v0.8.7 — Compact extra costs

- The extra-cost header now keeps `Shiko kostot` and `+ Shto` together on the right.
- The expense list is collapsed by default and opens only on request.
- Internal, client-billable and total extra costs remain visible as permanent summaries.
- The extra-cost total no longer includes labor cost.

## v0.8.8 — Task billing center

- Completed tasks can create a draft invoice directly from the billing box.
- Billable client costs remain invoiceable even when the task work itself is not billable.
- Invoice drafts keep work and client-cost positions separate and prevent duplicate billing.
- The work-process form now keeps date/start/end on the first row and description on the second.

## v0.8.9 — Compact task detail layout

- The task detail page keeps only the page title and removes its subtitle.
- Back navigation and labels are integrated into the task header.
- Billing now sits in the right sidebar after worked hours and extra costs.
- The work-process history expands naturally without an internal scrollbar.

## v0.9.0 — Quick creation flows

- New tasks use a compact form with client/person, work type, optional project, title, description, priority and due date.
- After creation, the task detail page opens automatically; advanced settings remain available through Edit.
- New clients start with type, name, email, phone and city.
- Optional client details can be expanded and completed during creation or added later from the client profile.
