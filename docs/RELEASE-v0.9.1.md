# SIRA-APP-v0.9.1

## Projects workspace

This release turns Projects into a complete client-work workspace:

- create reusable Products/Packages with price, VAT and standard tasks;
- create a project for a client with or without a package;
- preserve a package snapshot inside the project;
- classify project tasks as included, extra billable or non-billable;
- view project progress, worked time, internal costs and client costs;
- complete only after all project tasks are completed;
- create a project invoice draft, queue billing for later or close without billing;
- prevent project tasks from entering the separate task invoice queue.

## Database

Import `database/migrations/008_project_workspace.sql` once before deploying the application files.

The migration adds:

- the `products` table;
- product and financial snapshot columns on `projects`;
- project billing status and invoice linkage;
- `project_billing_type` on `tasks`.

## Deployment order

1. Back up the current database.
2. Import `008_project_workspace.sql` in phpMyAdmin.
3. Upload and deploy `SIRA-APP-v0.9.1.zip`.
4. Restart the Node.js application.
