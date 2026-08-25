-- SIRA APP v0.14.4 — Combined full schema (auto-generated, ordered)
-- Perfshin migrations/001..030 + SIRA-APP-v0.14.4-database.sql (versioni i azhurnuar/fix i 031_version_source_of_truth.sql)

-- ===== database/migrations/001_core.sql =====
CREATE TABLE organizations (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(180) NOT NULL,
  slug VARCHAR(120) NOT NULL UNIQUE,
  status ENUM('ACTIVE','SUSPENDED','ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(190) NOT NULL UNIQUE,
  display_name VARCHAR(160) NOT NULL,
  password_hash VARCHAR(255) NULL,
  status ENUM('ACTIVE','INACTIVE','LOCKED') DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE organization_memberships (
  organization_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  role_code VARCHAR(80) NOT NULL,
  PRIMARY KEY (organization_id,user_id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE clients (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  organization_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(160) NOT NULL,
  company_name VARCHAR(160) NULL,
  client_type ENUM('BUSINESS','PRIVATE') NOT NULL,
  email VARCHAR(190) NULL,
  phone VARCHAR(50) NULL,
  status ENUM('ACTIVE','INACTIVE','ARCHIVED') DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_clients_org (organization_id),
  INDEX idx_clients_name (name),
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE audit_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  organization_id BIGINT UNSIGNED NOT NULL,
  actor_user_id BIGINT UNSIGNED NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id VARCHAR(100) NULL,
  action VARCHAR(50) NOT NULL,
  before_data JSON NULL,
  after_data JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_org (organization_id),
  INDEX idx_audit_entity (entity_type,entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO organizations(name,slug) VALUES ('SIRA Solutions','sira-solutions');

-- ===== database/migrations/002_platform_capabilities.sql =====
CREATE TABLE IF NOT EXISTS platform_capabilities (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(120) NOT NULL UNIQUE,
  kind ENUM('core','module','addon','integration','automation','platform') NOT NULL,
  current_version VARCHAR(30) NOT NULL,
  default_status ENUM('enabled','disabled','hidden','coming_soon','maintenance') NOT NULL,
  dependencies JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS organization_capabilities (
  organization_id BIGINT UNSIGNED NOT NULL,
  capability_id BIGINT UNSIGNED NOT NULL,
  status ENUM('enabled','disabled','hidden','coming_soon','maintenance') NOT NULL,
  configuration JSON NULL,
  enabled_at DATETIME NULL,
  disabled_at DATETIME NULL,
  PRIMARY KEY (organization_id, capability_id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (capability_id) REFERENCES platform_capabilities(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS connected_platforms (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  organization_id BIGINT UNSIGNED NOT NULL,
  code VARCHAR(120) NOT NULL,
  name VARCHAR(180) NOT NULL,
  platform_type VARCHAR(100) NOT NULL,
  base_url VARCHAR(255) NOT NULL,
  environment ENUM('development','staging','production') NOT NULL,
  current_version VARCHAR(30) NULL,
  status ENUM('online','degraded','maintenance','offline','unknown') DEFAULT 'unknown',
  repository_url VARCHAR(255) NULL,
  active_branch VARCHAR(100) NULL,
  last_seen_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_connected_platform (organization_id, code),
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS background_jobs (
  id CHAR(36) PRIMARY KEY,
  organization_id BIGINT UNSIGNED NOT NULL,
  job_type VARCHAR(120) NOT NULL,
  payload JSON NOT NULL,
  status ENUM('pending','processing','completed','failed','retrying','cancelled') NOT NULL,
  attempts INT UNSIGNED NOT NULL DEFAULT 0,
  max_attempts INT UNSIGNED NOT NULL DEFAULT 3,
  scheduled_at DATETIME NULL,
  started_at DATETIME NULL,
  completed_at DATETIME NULL,
  error_message TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_jobs_status (status, scheduled_at),
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS stored_files (
  id CHAR(36) PRIMARY KEY,
  organization_id BIGINT UNSIGNED NOT NULL,
  storage_provider VARCHAR(80) NOT NULL,
  storage_key VARCHAR(500) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  content_type VARCHAR(120) NOT NULL,
  file_size BIGINT UNSIGNED NOT NULL,
  checksum VARCHAR(128) NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_files_org (organization_id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS notifications (
  id CHAR(36) PRIMARY KEY,
  organization_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NULL,
  channel ENUM('in_app','email','push','desktop','mobile','sms','webhook') NOT NULL,
  title VARCHAR(190) NOT NULL,
  message TEXT NOT NULL,
  status ENUM('pending','sent','failed','read') NOT NULL DEFAULT 'pending',
  data JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sent_at DATETIME NULL,
  read_at DATETIME NULL,
  INDEX idx_notifications_user (organization_id, user_id, status),
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===== database/migrations/003_clients_quick_registration.sql =====
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS address_line VARCHAR(255) NULL AFTER phone,
  ADD COLUMN IF NOT EXISTS company_name VARCHAR(160) NULL AFTER address_line,
  ADD COLUMN IF NOT EXISTS city VARCHAR(120) NULL AFTER company_name,
  ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20) NULL AFTER city,
  ADD COLUMN IF NOT EXISTS country_code CHAR(2) NULL AFTER postal_code,
  ADD COLUMN IF NOT EXISTS tax_number VARCHAR(80) NULL AFTER country_code,
  ADD COLUMN IF NOT EXISTS website VARCHAR(190) NULL AFTER tax_number,
  ADD COLUMN IF NOT EXISTS notes TEXT NULL AFTER website;

CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);

-- ===== database/migrations/004_tasks_and_invoicing.sql =====
CREATE TABLE invoices (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  organization_id BIGINT UNSIGNED NOT NULL,
  client_id BIGINT UNSIGNED NOT NULL,
  invoice_number VARCHAR(60) NOT NULL,
  status ENUM('DRAFT','FINALIZED','CANCELLED') NOT NULL DEFAULT 'DRAFT',
  issue_date DATE NOT NULL,
  due_date DATE NULL,
  notes TEXT NULL,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount_total DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_total DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  finalized_at DATETIME NULL,
  cancelled_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_invoices_org_number (organization_id, invoice_number),
  INDEX idx_invoices_org_status (organization_id, status),
  INDEX idx_invoices_client (organization_id, client_id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (client_id) REFERENCES clients(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE tasks (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  organization_id BIGINT UNSIGNED NOT NULL,
  client_id BIGINT UNSIGNED NULL,
  invoice_id BIGINT UNSIGNED NULL,
  project_name VARCHAR(180) NULL,
  title VARCHAR(190) NOT NULL,
  description TEXT NULL,
  assignee_name VARCHAR(160) NULL,
  priority ENUM('LOW','NORMAL','HIGH','URGENT') NOT NULL DEFAULT 'NORMAL',
  status ENUM('NEW','IN_PROGRESS','WAITING','COMPLETED') NOT NULL DEFAULT 'NEW',
  start_date DATE NULL,
  due_date DATE NULL,
  estimated_minutes INT UNSIGNED NOT NULL DEFAULT 0,
  spent_minutes INT UNSIGNED NOT NULL DEFAULT 0,
  notes TEXT NULL,
  billable BOOLEAN NOT NULL DEFAULT TRUE,
  billing_type ENUM('FIXED','HOURLY') NOT NULL DEFAULT 'FIXED',
  invoice_description VARCHAR(500) NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  vat_rate DECIMAL(5,2) NOT NULL DEFAULT 20,
  discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
  billing_status ENUM('NOT_BILLABLE','NOT_READY','PENDING','DRAFTED','INVOICED') NOT NULL DEFAULT 'NOT_READY',
  completed_at DATETIME NULL,
  invoice_queued_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_tasks_org_status (organization_id, status),
  INDEX idx_tasks_org_billing (organization_id, billing_status),
  INDEX idx_tasks_client (organization_id, client_id),
  INDEX idx_tasks_due_date (organization_id, due_date),
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (invoice_id) REFERENCES invoices(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE task_subtasks (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  task_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(190) NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE task_history (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  organization_id BIGINT UNSIGNED NOT NULL,
  task_id BIGINT UNSIGNED NOT NULL,
  action VARCHAR(80) NOT NULL,
  details JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_task_history_task (task_id, created_at),
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE invoice_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  invoice_id BIGINT UNSIGNED NOT NULL,
  task_id BIGINT UNSIGNED NULL,
  description VARCHAR(500) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit_label VARCHAR(40) NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  vat_rate DECIMAL(5,2) NOT NULL,
  discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
  net_total DECIMAL(12,2) NOT NULL,
  tax_total DECIMAL(12,2) NOT NULL,
  line_total DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_invoice_task (invoice_id, task_id),
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES tasks(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ===== database/migrations/005_task_workflow.sql =====
CREATE TABLE projects (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  organization_id BIGINT UNSIGNED NOT NULL,
  client_id BIGINT UNSIGNED NULL,
  name VARCHAR(190) NOT NULL,
  description TEXT NULL,
  status ENUM('OPEN','IN_PROGRESS','ON_HOLD','COMPLETED','CANCELLED') NOT NULL DEFAULT 'OPEN',
  start_date DATE NULL,
  due_date DATE NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_projects_org_status (organization_id, status),
  INDEX idx_projects_client (organization_id, client_id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (client_id) REFERENCES clients(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE tasks
  ADD COLUMN subject_type ENUM('CLIENT','PERSON') NOT NULL DEFAULT 'CLIENT' AFTER organization_id,
  ADD COLUMN person_name VARCHAR(160) NULL AFTER client_id,
  ADD COLUMN project_id BIGINT UNSIGNED NULL AFTER invoice_id,
  ADD INDEX idx_tasks_project (organization_id, project_id),
  ADD FOREIGN KEY (project_id) REFERENCES projects(id);

CREATE TABLE task_time_entries (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  organization_id BIGINT UNSIGNED NOT NULL,
  task_id BIGINT UNSIGNED NOT NULL,
  work_date DATE NOT NULL,
  start_time TIME NULL,
  end_time TIME NULL,
  minutes INT UNSIGNED NOT NULL,
  note VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_task_time_task (task_id, work_date, id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE task_notes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  organization_id BIGINT UNSIGNED NOT NULL,
  task_id BIGINT UNSIGNED NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_task_notes_task (task_id, created_at, id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE labels (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  organization_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(80) NOT NULL,
  color CHAR(7) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_labels_org_name (organization_id, name),
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE task_label_links (
  task_id BIGINT UNSIGNED NOT NULL,
  label_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (task_id, label_id),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO task_time_entries (organization_id, task_id, work_date, minutes, note)
SELECT organization_id, id, COALESCE(start_date, DATE(created_at)), spent_minutes, 'Koha e bartur nga versioni 0.7.1'
FROM tasks
WHERE spent_minutes > 0;

INSERT INTO task_notes (organization_id, task_id, note, created_at)
SELECT organization_id, id, notes, created_at
FROM tasks
WHERE notes IS NOT NULL AND TRIM(notes) <> '';


-- ===== database/migrations/006_task_costs.sql =====
ALTER TABLE tasks
  ADD COLUMN hourly_cost_rate DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER unit_price;

CREATE TABLE task_extra_costs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  organization_id BIGINT UNSIGNED NOT NULL,
  task_id BIGINT UNSIGNED NOT NULL,
  description VARCHAR(190) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  cost_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_task_extra_costs_task (task_id, cost_date, id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===== database/migrations/007_extra_cost_billing.sql =====
ALTER TABLE task_extra_costs
  ADD COLUMN cost_type ENUM('INTERNAL', 'CLIENT') NOT NULL DEFAULT 'INTERNAL' AFTER amount,
  ADD COLUMN billable_amount DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER cost_type;

-- ===== database/migrations/008_project_workspace.sql =====
CREATE TABLE IF NOT EXISTS products (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  organization_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(190) NOT NULL,
  description TEXT NULL,
  base_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  vat_rate DECIMAL(5,2) NOT NULL DEFAULT 20,
  template_tasks TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_products_org_active (organization_id, is_active),
  CONSTRAINT fk_products_organization FOREIGN KEY (organization_id) REFERENCES organizations(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS product_id BIGINT UNSIGNED NULL AFTER client_id,
  ADD COLUMN IF NOT EXISTS product_name_snapshot VARCHAR(190) NULL AFTER product_id,
  ADD COLUMN IF NOT EXISTS product_description_snapshot TEXT NULL AFTER product_name_snapshot,
  ADD COLUMN IF NOT EXISTS base_price DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER description,
  ADD COLUMN IF NOT EXISTS vat_rate DECIMAL(5,2) NOT NULL DEFAULT 20 AFTER base_price,
  ADD COLUMN IF NOT EXISTS discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0 AFTER vat_rate,
  ADD COLUMN IF NOT EXISTS billing_status ENUM('NOT_BILLABLE','NOT_READY','PENDING','DRAFTED','INVOICED') NOT NULL DEFAULT 'NOT_READY' AFTER due_date,
  ADD COLUMN IF NOT EXISTS invoice_id BIGINT UNSIGNED NULL AFTER billing_status,
  ADD COLUMN IF NOT EXISTS completed_at DATETIME NULL AFTER invoice_id;

ALTER TABLE projects
  ADD INDEX IF NOT EXISTS idx_projects_product (organization_id, product_id),
  ADD INDEX IF NOT EXISTS idx_projects_billing (organization_id, billing_status),
  ADD INDEX IF NOT EXISTS idx_projects_invoice (organization_id, invoice_id);

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS project_billing_type ENUM('INCLUDED','EXTRA_BILLABLE','NON_BILLABLE')
    NOT NULL DEFAULT 'NON_BILLABLE' AFTER project_id;

UPDATE tasks
SET project_billing_type = CASE WHEN billable = TRUE THEN 'EXTRA_BILLABLE' ELSE 'INCLUDED' END
WHERE project_id IS NOT NULL AND project_billing_type = 'NON_BILLABLE';

-- ===== database/migrations/009_advanced_project_workspace.sql =====
CREATE TABLE IF NOT EXISTS project_documents (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  organization_id BIGINT UNSIGNED NOT NULL,
  project_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(190) NOT NULL,
  url VARCHAR(2048) NOT NULL,
  description VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_project_documents_project (organization_id, project_id, created_at),
  CONSTRAINT fk_project_documents_organization FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT fk_project_documents_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS project_activity (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  organization_id BIGINT UNSIGNED NOT NULL,
  project_id BIGINT UNSIGNED NOT NULL,
  action VARCHAR(80) NOT NULL,
  description VARCHAR(500) NOT NULL,
  details TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_project_activity_project (organization_id, project_id, created_at),
  CONSTRAINT fk_project_activity_organization FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT fk_project_activity_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO project_activity (organization_id, project_id, action, description, created_at)
SELECT p.organization_id, p.id, 'PROJECT_IMPORTED', 'Projekti u bart në hapësirën e avancuar.', p.created_at
FROM projects p
WHERE p.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM project_activity pa
    WHERE pa.organization_id = p.organization_id AND pa.project_id = p.id
  );

-- ===== database/migrations/010_project_refinements.sql =====
ALTER TABLE project_documents
  MODIFY COLUMN url VARCHAR(2048) NULL,
  ADD COLUMN IF NOT EXISTS file_name VARCHAR(255) NULL AFTER name,
  ADD COLUMN IF NOT EXISTS mime_type VARCHAR(120) NULL AFTER file_name,
  ADD COLUMN IF NOT EXISTS file_size BIGINT UNSIGNED NULL AFTER mime_type,
  ADD COLUMN IF NOT EXISTS file_data LONGBLOB NULL AFTER file_size;

CREATE TABLE IF NOT EXISTS project_updates (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  organization_id BIGINT UNSIGNED NOT NULL,
  project_id BIGINT UNSIGNED NOT NULL,
  update_date DATE NOT NULL,
  title VARCHAR(190) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_project_updates_project (organization_id, project_id, update_date, id),
  CONSTRAINT fk_project_updates_organization FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT fk_project_updates_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===== database/migrations/011_project_planning_delivery.sql =====
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS estimated_minutes INT UNSIGNED NOT NULL DEFAULT 0 AFTER due_date,
  ADD COLUMN IF NOT EXISTS cost_budget DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER estimated_minutes;

ALTER TABLE project_updates
  ADD COLUMN IF NOT EXISTS update_type ENUM('UPDATE','INFORMATION','DECISION','PROBLEM','CLIENT_REQUEST')
    NOT NULL DEFAULT 'UPDATE' AFTER update_date;

ALTER TABLE project_documents
  ADD COLUMN IF NOT EXISTS document_type ENUM('DOCUMENT','DELIVERABLE') NOT NULL DEFAULT 'DOCUMENT' AFTER description,
  ADD COLUMN IF NOT EXISTS approval_status ENUM('NOT_REQUIRED','DRAFT','IN_REVIEW','APPROVED')
    NOT NULL DEFAULT 'NOT_REQUIRED' AFTER document_type,
  ADD COLUMN IF NOT EXISTS approved_at DATETIME NULL AFTER approval_status;

CREATE TABLE IF NOT EXISTS project_milestones (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  organization_id BIGINT UNSIGNED NOT NULL,
  project_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(190) NOT NULL,
  description TEXT NULL,
  status ENUM('PLANNED','IN_PROGRESS','BLOCKED','COMPLETED') NOT NULL DEFAULT 'PLANNED',
  start_date DATE NULL,
  due_date DATE NULL,
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  completed_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_project_milestones_project (organization_id, project_id, sort_order, due_date),
  CONSTRAINT fk_project_milestones_organization FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT fk_project_milestones_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS project_blockers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  organization_id BIGINT UNSIGNED NOT NULL,
  project_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(190) NOT NULL,
  description TEXT NULL,
  severity ENUM('LOW','MEDIUM','HIGH') NOT NULL DEFAULT 'MEDIUM',
  status ENUM('OPEN','RESOLVED') NOT NULL DEFAULT 'OPEN',
  due_date DATE NULL,
  resolved_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_project_blockers_project (organization_id, project_id, status, severity),
  CONSTRAINT fk_project_blockers_organization FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT fk_project_blockers_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===== database/migrations/012_task_project_phases.sql =====
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS project_milestone_id BIGINT UNSIGNED NULL AFTER project_id;

ALTER TABLE tasks
  ADD INDEX IF NOT EXISTS idx_tasks_project_milestone (organization_id, project_id, project_milestone_id);

ALTER TABLE tasks
  ADD CONSTRAINT fk_tasks_project_milestone
    FOREIGN KEY (project_milestone_id) REFERENCES project_milestones(id) ON DELETE SET NULL;

-- ===== database/migrations/013_access_registry.sql =====
CREATE TABLE IF NOT EXISTS access_registry_entries (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  organization_id BIGINT UNSIGNED NOT NULL,
  client_id BIGINT UNSIGNED NULL,
  name VARCHAR(190) NOT NULL,
  category ENUM('SERVER','HOSTING','DOMAIN','NETWORK','CLOUD','DATABASE','EMAIL','APPLICATION','SOCIAL','OTHER') NOT NULL,
  access_scope ENUM('PERSONAL','SIRA','CLIENT') NOT NULL DEFAULT 'SIRA',
  provider VARCHAR(160) NULL,
  address VARCHAR(255) NULL,
  service_url VARCHAR(500) NULL,
  username VARCHAR(190) NULL,
  vault_provider ENUM('BITWARDEN','VAULTWARDEN','ONEPASSWORD','KEEPASS','OTHER') NULL,
  vault_url VARCHAR(500) NULL,
  vault_reference VARCHAR(190) NULL,
  two_factor_status ENUM('ENABLED','DISABLED','UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
  renewal_date DATE NULL,
  notes TEXT NULL,
  status ENUM('ACTIVE','INACTIVE','ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_access_registry_org (organization_id, status),
  INDEX idx_access_registry_category (organization_id, category),
  INDEX idx_access_registry_renewal (organization_id, renewal_date),
  INDEX idx_access_registry_client (organization_id, client_id),
  CONSTRAINT fk_access_registry_organization FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT fk_access_registry_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===== database/migrations/014_release_history.sql =====
CREATE TABLE IF NOT EXISTS application_releases (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  version VARCHAR(30) NOT NULL,
  title VARCHAR(190) NOT NULL,
  summary TEXT NOT NULL,
  release_channel VARCHAR(40) NOT NULL DEFAULT 'development',
  migration_name VARCHAR(190) NULL,
  installed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_application_release_version (version),
  INDEX idx_application_releases_installed (installed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS application_release_changes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  release_id BIGINT UNSIGNED NOT NULL,
  change_type ENUM('FEATURE','IMPROVEMENT','FIX','SECURITY','DATABASE') NOT NULL DEFAULT 'IMPROVEMENT',
  description VARCHAR(500) NOT NULL,
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_application_release_change_order (release_id, sort_order),
  CONSTRAINT fk_application_release_change_release
    FOREIGN KEY (release_id) REFERENCES application_releases(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO application_releases (
  version, title, summary, release_channel, migration_name
) VALUES (
  '0.10.1',
  'Historiku i versioneve',
  'Shton një vend qendror ku shihen versionet e instaluara dhe ndryshimet e secilit version.',
  'development',
  '014_release_history.sql'
)
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  summary = VALUES(summary),
  release_channel = VALUES(release_channel),
  migration_name = VALUES(migration_name);

INSERT INTO application_release_changes (release_id, change_type, description, sort_order)
SELECT id, 'FEATURE', 'U shtua faqja Historiku i versioneve te Settings.', 10
FROM application_releases WHERE version = '0.10.1'
ON DUPLICATE KEY UPDATE change_type = VALUES(change_type), description = VALUES(description);

INSERT INTO application_release_changes (release_id, change_type, description, sort_order)
SELECT id, 'IMPROVEMENT', 'Versioni aktual dhe versionet e instaluara dallohen qartë me status dhe datë.', 20
FROM application_releases WHERE version = '0.10.1'
ON DUPLICATE KEY UPDATE change_type = VALUES(change_type), description = VALUES(description);

INSERT INTO application_release_changes (release_id, change_type, description, sort_order)
SELECT id, 'DATABASE', 'Çdo version i ardhshëm mund të regjistrojë përshkrimin e ndryshimeve përmes migrimit të vet SQL.', 30
FROM application_releases WHERE version = '0.10.1'
ON DUPLICATE KEY UPDATE change_type = VALUES(change_type), description = VALUES(description);

INSERT INTO application_release_changes (release_id, change_type, description, sort_order)
SELECT id, 'FIX', 'U hoq varësia opsionale nga tabela platform_capabilities në migrimin e Qasjeve & Kasafortës.', 40
FROM application_releases WHERE version = '0.10.1'
ON DUPLICATE KEY UPDATE change_type = VALUES(change_type), description = VALUES(description);

-- ===== database/migrations/015_project_operational_dashboard.sql =====
INSERT INTO application_releases (
  version, title, summary, release_channel, migration_name
) VALUES (
  '0.10.2',
  'Përmbledhja operative e projekteve',
  'Shton pamjen e re testuese të projektit me faza, detyra aktive, financa, bllokues dhe aktivitet.',
  'development',
  '015_project_operational_dashboard.sql'
)
ON DUPLICATE KEY UPDATE
  title = VALUES(title), summary = VALUES(summary),
  release_channel = VALUES(release_channel), migration_name = VALUES(migration_name);

INSERT INTO application_release_changes (release_id, change_type, description, sort_order)
SELECT id, 'FEATURE', 'U shtua dashboard-i operativ në Përmbledhjen e projektit.', 10
FROM application_releases WHERE version = '0.10.2'
ON DUPLICATE KEY UPDATE change_type = VALUES(change_type), description = VALUES(description);

INSERT INTO application_release_changes (release_id, change_type, description, sort_order)
SELECT id, 'FEATURE', 'U shtua skeda e veçantë Aktiviteti me shënime, vendime, probleme dhe kërkesa të klientit.', 20
FROM application_releases WHERE version = '0.10.2'
ON DUPLICATE KEY UPDATE change_type = VALUES(change_type), description = VALUES(description);

INSERT INTO application_release_changes (release_id, change_type, description, sort_order)
SELECT id, 'IMPROVEMENT', 'Përmbledhja shfaq fazën aktuale, progresin, afatin, buxhetin, detyrat aktive dhe bllokuesit.', 30
FROM application_releases WHERE version = '0.10.2'
ON DUPLICATE KEY UPDATE change_type = VALUES(change_type), description = VALUES(description);

-- ===== database/migrations/016_project_templates.sql =====
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS project_type ENUM('WEBSITE','IT','GRAPHIC','VIDEO','MARKETING','OTHER')
    NOT NULL DEFAULT 'WEBSITE' AFTER product_description_snapshot;

INSERT INTO application_releases (version, title, summary, release_channel, migration_name)
VALUES (
  '0.10.3', 'Projektet me faza automatike',
  'Thjeshton listën e projekteve dhe krijon automatikisht katër faza me detyra sipas llojit të projektit.',
  'development', '016_project_templates.sql'
)
ON DUPLICATE KEY UPDATE title = VALUES(title), summary = VALUES(summary),
  release_channel = VALUES(release_channel), migration_name = VALUES(migration_name);

INSERT INTO application_release_changes (release_id, change_type, description, sort_order)
SELECT id, 'IMPROVEMENT', 'Projektet hapen drejtpërdrejt si listë; pamja Kanban u largua nga ndërfaqja.', 10
FROM application_releases WHERE version = '0.10.3'
ON DUPLICATE KEY UPDATE change_type = VALUES(change_type), description = VALUES(description);

INSERT INTO application_release_changes (release_id, change_type, description, sort_order)
SELECT id, 'FEATURE', 'Krijimi i projektit gjeneron katër faza dhe detyrat standarde sipas llojit.', 20
FROM application_releases WHERE version = '0.10.3'
ON DUPLICATE KEY UPDATE change_type = VALUES(change_type), description = VALUES(description);

INSERT INTO application_release_changes (release_id, change_type, description, sort_order)
SELECT id, 'FEATURE', 'U shtuan template për Website, IT, Grafikë, Video, Marketing dhe projekte të tjera.', 30
FROM application_releases WHERE version = '0.10.3'
ON DUPLICATE KEY UPDATE change_type = VALUES(change_type), description = VALUES(description);

INSERT INTO application_release_changes (release_id, change_type, description, sort_order)
SELECT id, 'IMPROVEMENT', 'Brenda projektit zgjidhet faza dhe shfaqen vetëm detyrat e asaj faze.', 40
FROM application_releases WHERE version = '0.10.3'
ON DUPLICATE KEY UPDATE change_type = VALUES(change_type), description = VALUES(description);

-- ===== database/migrations/017_mysql_pool_fix.sql =====
INSERT INTO application_releases (version, title, summary, release_channel, migration_name)
VALUES (
  '0.10.4',
  'Stabilizimi i lidhjes me databazën',
  'Përdor një MySQL connection pool të vetëm edhe në production dhe shmang lidhjet e përsëritura EPERM.',
  'development',
  '017_mysql_pool_fix.sql'
)
ON DUPLICATE KEY UPDATE title = VALUES(title), summary = VALUES(summary),
  release_channel = VALUES(release_channel), migration_name = VALUES(migration_name);

INSERT INTO application_release_changes (release_id, change_type, description, sort_order)
SELECT id, 'FIX', 'MySQL pool ruhet dhe ripërdoret në production në vend që të krijohet për çdo query.', 10
FROM application_releases WHERE version = '0.10.4'
ON DUPLICATE KEY UPDATE change_type = VALUES(change_type), description = VALUES(description);

INSERT INTO application_release_changes (release_id, change_type, description, sort_order)
SELECT id, 'FIX', 'U shmang krijimi parcial i projektit nga dështimi i lidhjeve të njëpasnjëshme me databazën.', 20
FROM application_releases WHERE version = '0.10.4'
ON DUPLICATE KEY UPDATE change_type = VALUES(change_type), description = VALUES(description);

-- ===== database/migrations/018_project_simplification_delete.sql =====
-- SIRA App v0.10.5
-- Simplified project workspace and safe project deletion.
-- No schema changes are required: projects.deleted_at already exists.

INSERT INTO application_releases (version, title, summary, release_channel, migration_name)
VALUES (
  '0.10.5',
  'Projektet e thjeshtuara dhe fshirja',
  'Lista e projekteve është thjeshtuar dhe projektet pa faturë mund të largohen në mënyrë të sigurt nga lista aktive.',
  'development',
  '018_project_simplification_delete.sql'
)
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  summary = VALUES(summary),
  release_channel = VALUES(release_channel),
  migration_name = VALUES(migration_name);

SET @release_id = (SELECT id FROM application_releases WHERE version = '0.10.5' LIMIT 1);

DELETE FROM application_release_changes WHERE release_id = @release_id;

INSERT INTO application_release_changes (release_id, change_type, description, sort_order)
VALUES
  (@release_id, 'IMPROVEMENT', 'Lista paraqet vetëm projektin, klientin, progresin, afatin dhe veprimet.', 10),
  (@release_id, 'IMPROVEMENT', 'Projekti ka tri seksione kryesore: Puna, Dokumentet dhe Detajet.', 20),
  (@release_id, 'FEATURE', 'Menyja me tri pika lejon fshirjen pas një konfirmimi të qartë.', 30),
  (@release_id, 'SECURITY', 'Përdoret deleted_at; klienti dhe historiku ruhen, ndërsa projektet e lidhura me faturë mbrohen.', 40);

-- ===== database/migrations/019_project_phases_without_tasks.sql =====
-- SIRA App v0.10.6
-- New projects receive their four base phases without automatic tasks.
-- No schema changes are required.

INSERT INTO application_releases (version, title, summary, release_channel, migration_name)
VALUES (
  '0.10.6',
  'Fazat pa detyra automatike',
  'Projektet e reja krijojnë vetëm katër fazat bazë. Detyrat shtohen manualisht sipas nevojës së projektit.',
  'development',
  '019_project_phases_without_tasks.sql'
)
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  summary = VALUES(summary),
  release_channel = VALUES(release_channel),
  migration_name = VALUES(migration_name);

SET @release_id = (SELECT id FROM application_releases WHERE version = '0.10.6' LIMIT 1);

DELETE FROM application_release_changes WHERE release_id = @release_id;

INSERT INTO application_release_changes (release_id, change_type, description, sort_order)
VALUES
  (@release_id, 'IMPROVEMENT', 'Projektet e reja krijojnë katër fazat bazë pa shtuar detyra automatike.', 10),
  (@release_id, 'IMPROVEMENT', 'Detyrat shtohen manualisht dhe lidhen me fazën përkatëse sipas nevojës.', 20),
  (@release_id, 'FIX', 'Projektet e llojeve të ndryshme nuk ngarkohen më me lista të paracaktuara detyrash.', 30);

-- ===== database/migrations/020_phase_kanban.sql =====
-- SIRA App v0.10.7
-- Phase-specific Kanban directly below the project phases.
-- No schema changes are required.

INSERT INTO application_releases (version, title, summary, release_channel, migration_name)
VALUES (
  '0.10.7',
  'Kanban sipas fazës',
  'Klikimi mbi një fazë shfaq menjëherë Kanban-in me detyrat e asaj faze.',
  'development',
  '020_phase_kanban.sql'
)
ON DUPLICATE KEY UPDATE
  title = VALUES(title), summary = VALUES(summary),
  release_channel = VALUES(release_channel), migration_name = VALUES(migration_name);

SET @release_id = (SELECT id FROM application_releases WHERE version = '0.10.7' LIMIT 1);
DELETE FROM application_release_changes WHERE release_id = @release_id;

INSERT INTO application_release_changes (release_id, change_type, description, sort_order)
VALUES
  (@release_id, 'FEATURE', 'Klikimi mbi fazën hap Kanban-in direkt poshtë listës së fazave.', 10),
  (@release_id, 'IMPROVEMENT', 'Kanban-i filtron dhe paraqet vetëm detyrat e fazës së zgjedhur.', 20),
  (@release_id, 'IMPROVEMENT', 'Detyra e re lidhet automatikisht me fazën që është e hapur.', 30);

-- ===== database/migrations/021_project_summary_tab.sql =====
-- SIRA App v0.10.8
-- Project summary moved into a dedicated tab.
-- No schema changes are required.

INSERT INTO application_releases (version, title, summary, release_channel, migration_name)
VALUES (
  '0.10.8',
  'Tabi Përmbledhja',
  'Përmbledhja, fazat dhe aktiviteti janë vendosur në tab-e të veçanta për një hapësirë më të pastër.',
  'development',
  '021_project_summary_tab.sql'
)
ON DUPLICATE KEY UPDATE
  title = VALUES(title), summary = VALUES(summary),
  release_channel = VALUES(release_channel), migration_name = VALUES(migration_name);

SET @release_id = (SELECT id FROM application_releases WHERE version = '0.10.8' LIMIT 1);
DELETE FROM application_release_changes WHERE release_id = @release_id;

INSERT INTO application_release_changes (release_id, change_type, description, sort_order)
VALUES
  (@release_id, 'IMPROVEMENT', 'U shtua tabi Përmbledhja pas Puna, Dokumentet dhe Detajet.', 10),
  (@release_id, 'IMPROVEMENT', 'Te Puna mbeten fazat operative dhe Kanban-i, ndërsa statistikat paraqiten veçmas.', 20),
  (@release_id, 'IMPROVEMENT', 'Menaxhimi i fazave është vendosur në tabin Fazat.', 30),
  (@release_id, 'IMPROVEMENT', 'Shënimet dhe historiku i punës janë vendosur në tabin Aktiviteti.', 40),
  (@release_id, 'IMPROVEMENT', 'Navigimi dhe fazat operative janë bërë kompakte dhe janë integruar vizualisht.', 50);

-- ===== database/migrations/022_administrator_login.sql =====
-- SIRA App v0.11.0
-- Administrator login and protected application routes.
-- No schema changes are required for the environment-based administrator.

INSERT INTO application_releases (version, title, summary, release_channel, migration_name)
VALUES (
  '0.11.0',
  'Login-i i administratorit',
  'Shton login, session të sigurt, mbrojtje të faqeve dhe API-ve, kufizim tentativash dhe logout.',
  'development',
  '022_administrator_login.sql'
)
ON DUPLICATE KEY UPDATE
  title = VALUES(title), summary = VALUES(summary),
  release_channel = VALUES(release_channel), migration_name = VALUES(migration_name);

SET @release_id = (SELECT id FROM application_releases WHERE version = '0.11.0' LIMIT 1);
DELETE FROM application_release_changes WHERE release_id = @release_id;

INSERT INTO application_release_changes (release_id, change_type, description, sort_order)
VALUES
  (@release_id, 'FEATURE', 'U shtua faqja moderne e login-it për administratorin.', 10),
  (@release_id, 'SECURITY', 'Faqet dhe API-t e aplikacionit kërkojnë session të vlefshëm.', 20),
  (@release_id, 'SECURITY', 'Session-i ruhet në cookie HttpOnly të nënshkruar me HMAC-SHA256.', 30),
  (@release_id, 'SECURITY', 'Pas pesë tentativave të pasakta login-i bllokohet për 15 minuta.', 40),
  (@release_id, 'FEATURE', 'U shtua butoni Dil për mbylljen e session-it.', 50);

-- ===== database/migrations/023_login_runtime_config_fix.sql =====
-- SIRA App v0.11.1
-- Ensures login configuration is evaluated at server runtime.
-- No schema changes are required.

INSERT INTO application_releases (version, title, summary, release_channel, migration_name)
VALUES (
  '0.11.1',
  'Korrigjimi i konfigurimit të login-it',
  'Login-i nuk e ruan më gjatë build-it gjendjen e variablave; validimi kryhet nga serveri në momentin e kyçjes.',
  'development',
  '023_login_runtime_config_fix.sql'
)
ON DUPLICATE KEY UPDATE
  title = VALUES(title), summary = VALUES(summary),
  release_channel = VALUES(release_channel), migration_name = VALUES(migration_name);

SET @release_id = (SELECT id FROM application_releases WHERE version = '0.11.1' LIMIT 1);
DELETE FROM application_release_changes WHERE release_id = @release_id;

INSERT INTO application_release_changes (release_id, change_type, description, sort_order)
VALUES
  (@release_id, 'FIX', 'U hoq kontrolli statik i konfigurimit nga formulari i login-it.', 10),
  (@release_id, 'FIX', 'Faqja e login-it gjenerohet dinamikisht dhe validimi kryhet në API gjatë kërkesës.', 20);

-- ===== database/migrations/024_users_roles_client_portal.sql =====
-- SIRA App v0.12.0
-- Database users, roles and client-specific portal access.

ALTER TABLE organization_memberships
  ADD COLUMN IF NOT EXISTS client_id BIGINT UNSIGNED NULL AFTER role_code;

INSERT INTO application_releases (version, title, summary, release_channel, migration_name)
VALUES (
  '0.12.0',
  'Përdoruesit, rolet dhe Client Portal',
  'Shton përdorues në databazë, role Global Admin/Punëtor/Klient, autorizim në faqe dhe API, si dhe portalin e izoluar të klientit.',
  'development',
  '024_users_roles_client_portal.sql'
)
ON DUPLICATE KEY UPDATE
  title = VALUES(title), summary = VALUES(summary),
  release_channel = VALUES(release_channel), migration_name = VALUES(migration_name);

SET @release_id = (SELECT id FROM application_releases WHERE version = '0.12.0' LIMIT 1);
DELETE FROM application_release_changes WHERE release_id = @release_id;

INSERT INTO application_release_changes (release_id, change_type, description, sort_order)
VALUES
  (@release_id, 'FEATURE', 'U shtua Settings → Përdoruesit & Rolet.', 10),
  (@release_id, 'SECURITY', 'Password-et e përdoruesve ruhen si hash scrypt me salt unik.', 20),
  (@release_id, 'SECURITY', 'Global Admin, Punëtor dhe Klient kanë kufizime të ndryshme në faqe dhe API.', 30),
  (@release_id, 'FEATURE', 'Roli Klient lidhet me një klient dhe hap vetëm Client Portal.', 40),
  (@release_id, 'FEATURE', 'Client Portal paraqet vetëm projektet dhe progresin e klientit të lidhur.', 50),
  (@release_id, 'IMPROVEMENT', 'Global Admin mund të krijojë, çaktivizojë dhe resetoje password-in e përdoruesve.', 60);

-- ===== database/migrations/025_business_dashboard_products_contracts.sql =====
-- SIRA App v0.13.0
-- Dashboard refresh, expanded Products & Services, and Contracts & Subscriptions.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS category VARCHAR(100) NOT NULL DEFAULT 'Tjetër' AFTER name,
  ADD COLUMN IF NOT EXISTS elements_json TEXT NULL AFTER description,
  ADD COLUMN IF NOT EXISTS includes_json TEXT NULL AFTER elements_json,
  ADD COLUMN IF NOT EXISTS billing_cycle ENUM('ONE_TIME','MONTHLY','YEARLY') NOT NULL DEFAULT 'ONE_TIME' AFTER vat_rate,
  ADD COLUMN IF NOT EXISTS unit_label VARCHAR(60) NOT NULL DEFAULT 'Një herë' AFTER billing_cycle;

CREATE TABLE IF NOT EXISTS contracts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  organization_id BIGINT UNSIGNED NOT NULL,
  owner_type ENUM('CLIENT','COMPANY') NOT NULL DEFAULT 'CLIENT',
  client_id BIGINT UNSIGNED NULL,
  product_id BIGINT UNSIGNED NULL,
  title VARCHAR(190) NOT NULL,
  category VARCHAR(120) NOT NULL,
  provider VARCHAR(190) NULL,
  reference_code VARCHAR(255) NULL,
  start_date DATE NOT NULL,
  end_date DATE NULL,
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  billing_cycle ENUM('MONTHLY','QUARTERLY','YEARLY','ONE_TIME') NOT NULL DEFAULT 'YEARLY',
  reminder_days INT UNSIGNED NOT NULL DEFAULT 30,
  cancellation_notice_days INT UNSIGNED NOT NULL DEFAULT 30,
  auto_renew BOOLEAN NOT NULL DEFAULT FALSE,
  status ENUM('ACTIVE','INACTIVE','CANCELLED') NOT NULL DEFAULT 'ACTIVE',
  description TEXT NULL,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_contracts_org_status (organization_id, status),
  INDEX idx_contracts_client (organization_id, client_id),
  INDEX idx_contracts_end_date (organization_id, end_date),
  CONSTRAINT fk_contracts_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT fk_contracts_client FOREIGN KEY (client_id) REFERENCES clients(id),
  CONSTRAINT fk_contracts_product FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO application_releases (version, title, summary, release_channel, migration_name)
VALUES (
  '0.13.0',
  'Dashboard, Produktet dhe Kontratat',
  'Rifreskon Dashboard-in, zgjeron Produktet & Shërbimet dhe aktivizon modulin Kontratat & Abonimet me afate dhe kujtesa.',
  'development',
  '025_business_dashboard_products_contracts.sql'
)
ON DUPLICATE KEY UPDATE
  title = VALUES(title), summary = VALUES(summary),
  release_channel = VALUES(release_channel), migration_name = VALUES(migration_name);

SET @release_id = (SELECT id FROM application_releases WHERE version = '0.13.0' LIMIT 1);
DELETE FROM application_release_changes WHERE release_id = @release_id;
INSERT INTO application_release_changes (release_id, change_type, description, sort_order) VALUES
  (@release_id, 'IMPROVEMENT', 'Dashboard-i u ridizajnua në formë më clean dhe compact me projekte, detyra, faturim dhe kontrata.', 10),
  (@release_id, 'FEATURE', 'U aktivizua moduli Kontratat & Abonimet me klient, furnitor, afat, çmim, cikël dhe rinovim automatik.', 20),
  (@release_id, 'FEATURE', 'Kontratat që afrohen te skadimi shfaqen automatikisht në Dashboard.', 30),
  (@release_id, 'IMPROVEMENT', 'Produktet & Shërbimet tani kanë kategori, elemente, përmbajtje, cikël dhe njësi.', 40),
  (@release_id, 'IMPROVEMENT', 'Release Notes u bënë më compact por me font më të lexueshëm.', 50),
  (@release_id, 'DATABASE', 'U shtua tabela contracts dhe kolonat e reja të katalogut products.', 60);

-- ===== database/migrations/026_consistent_delete_actions.sql =====
-- SIRA App v0.13.1
-- Consistent delete actions across modules.
-- Corrected to match application_releases schema from migration 014_release_history.sql.

INSERT INTO application_releases (
  version, title, summary, release_channel, migration_name
) VALUES (
  '0.13.1',
  'Butonat Fshi në modulet kryesore',
  'U standardizuan veprimet e fshirjes aty ku ka kuptim, me konfirmim dhe mbrojtje të të dhënave historike.',
  'development',
  '026_consistent_delete_actions.sql'
)
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  summary = VALUES(summary),
  release_channel = VALUES(release_channel),
  migration_name = VALUES(migration_name);

INSERT INTO application_release_changes (
  release_id, change_type, description, sort_order
)
SELECT id, 'FEATURE',
       'Produktet & Shërbimet: u shtua butoni Fshi me soft-delete dhe konfirmim.',
       10
FROM application_releases
WHERE version = '0.13.1'
ON DUPLICATE KEY UPDATE
  change_type = VALUES(change_type),
  description = VALUES(description);

INSERT INTO application_release_changes (
  release_id, change_type, description, sort_order
)
SELECT id, 'FEATURE',
       'Përdoruesit & Rolet: u shtua butoni Fshi; Global Admin-i i fundit mbrohet nga fshirja.',
       20
FROM application_releases
WHERE version = '0.13.1'
ON DUPLICATE KEY UPDATE
  change_type = VALUES(change_type),
  description = VALUES(description);

INSERT INTO application_release_changes (
  release_id, change_type, description, sort_order
)
SELECT id, 'IMPROVEMENT',
       'U ruajt logjika e sigurt ekzistuese: klientët fshihen vetëm nga arkiva, faturat anulohen dhe projektet/kontratat kanë konfirmim.',
       30
FROM application_releases
WHERE version = '0.13.1'
ON DUPLICATE KEY UPDATE
  change_type = VALUES(change_type),
  description = VALUES(description);

-- ===== database/migrations/027_task_delete_action.sql =====
-- SIRA App v0.13.2
-- Butoni Fshi te Detyrat & Punët.


INSERT INTO application_releases (version, title, summary, release_channel, migration_name)
VALUES (
  '0.13.2',
  'Fshirja e detyrave',
  'U shtua veprimi Fshi në kartat Kanban dhe në listën e detyrave, me konfirmim dhe soft-delete.',
  'development',
  '027_task_delete_action.sql'
)
ON DUPLICATE KEY UPDATE
  title = VALUES(title), summary = VALUES(summary), release_channel = VALUES(release_channel), migration_name = VALUES(migration_name);

INSERT INTO application_release_changes (release_id, change_type, description, sort_order)
SELECT id, 'FEATURE', 'Detyrat: butoni Fshi u shtua pranë Edito në Kanban dhe në pamjen Listë.', 10
FROM application_releases WHERE version = '0.13.2';

INSERT INTO application_release_changes (release_id, change_type, description, sort_order)
SELECT id, 'IMPROVEMENT', 'Fshirja përdor soft-delete; detyrat e lidhura me faturë të krijuar/finalizuar mbrohen nga fshirja.', 20
FROM application_releases WHERE version = '0.13.2';

-- ===== database/migrations/027_ticket_system.sql =====
CREATE TABLE IF NOT EXISTS tickets (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  organization_id BIGINT UNSIGNED NOT NULL,
  ticket_number VARCHAR(40) NOT NULL,
  client_id BIGINT UNSIGNED NOT NULL,
  created_by_user_id BIGINT UNSIGNED NULL,
  created_by_role ENUM('GLOBAL_ADMIN','WORKER','CLIENT') NOT NULL DEFAULT 'GLOBAL_ADMIN',
  title VARCHAR(190) NOT NULL,
  description TEXT NOT NULL,
  priority ENUM('NORMAL','HIGH','URGENT') NOT NULL DEFAULT 'NORMAL',
  due_at DATETIME NULL,
  status ENUM('NEW','IN_PROGRESS','WAITING_CLIENT','CLOSED') NOT NULL DEFAULT 'NEW',
  resolution_notes TEXT NULL,
  accepted_at DATETIME NULL,
  closed_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  UNIQUE KEY uq_ticket_number (organization_id,ticket_number),
  INDEX idx_ticket_org_status (organization_id,status),
  INDEX idx_ticket_client (client_id),
  CONSTRAINT fk_ticket_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT fk_ticket_client FOREIGN KEY (client_id) REFERENCES clients(id),
  CONSTRAINT fk_ticket_creator FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ticket_notes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  organization_id BIGINT UNSIGNED NOT NULL,
  ticket_id BIGINT UNSIGNED NOT NULL,
  author_user_id BIGINT UNSIGNED NULL,
  author_role ENUM('GLOBAL_ADMIN','WORKER','CLIENT') NOT NULL,
  author_name VARCHAR(160) NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ticket_note_ticket (ticket_id,created_at),
  CONSTRAINT fk_ticket_note_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT fk_ticket_note_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  CONSTRAINT fk_ticket_note_user FOREIGN KEY (author_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO application_releases (version,title,summary,release_channel,migration_name)
VALUES ('0.14.0','Ticket System & Client Support Portal','Shton Ticket System-in funksional me Client Portal, komunikim përmes Notes, statuset e punës dhe Resolution Notes të detyrueshme para mbylljes.','development','027_ticket_system.sql')
ON DUPLICATE KEY UPDATE title=VALUES(title),summary=VALUES(summary),release_channel=VALUES(release_channel),migration_name=VALUES(migration_name);

INSERT INTO application_release_changes (release_id,change_type,description,sort_order)
SELECT id,'FEATURE','Ticket System me katër faza: Në pritje, Duke u përpunuar, Në pritje të klientit dhe Përfunduar/Mbyllur.',10 FROM application_releases WHERE version='0.14.0'
ON DUPLICATE KEY UPDATE change_type=VALUES(change_type),description=VALUES(description);
INSERT INTO application_release_changes (release_id,change_type,description,sort_order)
SELECT id,'FEATURE','Klienti sheh vetëm ticket-at e vet në Client Portal dhe mund të krijojë ticket të ri.',20 FROM application_releases WHERE version='0.14.0'
ON DUPLICATE KEY UPDATE change_type=VALUES(change_type),description=VALUES(description);
INSERT INTO application_release_changes (release_id,change_type,description,sort_order)
SELECT id,'FEATURE','Notes krijojnë komunikim dypalësh mes SIRA Solutions dhe klientit brenda ticket-it.',30 FROM application_releases WHERE version='0.14.0'
ON DUPLICATE KEY UPDATE change_type=VALUES(change_type),description=VALUES(description);
INSERT INTO application_release_changes (release_id,change_type,description,sort_order)
SELECT id,'IMPROVEMENT','Prano ticket-in e kalon automatikisht nga New në Duke u përpunuar; mbyllja kërkon Resolution Notes.',40 FROM application_releases WHERE version='0.14.0'
ON DUPLICATE KEY UPDATE change_type=VALUES(change_type),description=VALUES(description);
INSERT INTO application_release_changes (release_id,change_type,description,sort_order)
SELECT id,'IMPROVEMENT','Dashboard-i shfaq automatikisht numrin real të ticket-ave sipas statusit.',50 FROM application_releases WHERE version='0.14.0'
ON DUPLICATE KEY UPDATE change_type=VALUES(change_type),description=VALUES(description);

-- ===== database/migrations/028_client_portal_preview_ticket_form.sql =====
-- SIRA App v0.14.1

INSERT INTO application_releases (version,title,summary,release_channel,migration_name)
VALUES ('0.14.1','Client Portal Preview dhe Ticket Form','U shtua Client Portal Preview në top menu dhe u standardizua forma e krijimit/editimit të ticket-it.','development','028_client_portal_preview_ticket_form.sql')
ON DUPLICATE KEY UPDATE title=VALUES(title),summary=VALUES(summary),release_channel=VALUES(release_channel),migration_name=VALUES(migration_name);

INSERT INTO application_release_changes (release_id,change_type,description,sort_order)
SELECT id,'FEATURE','Client Portal tani mund të testohet nga Global Admin direkt nga top menu, me zgjedhje të klientit.',10 FROM application_releases WHERE version='0.14.1';
INSERT INTO application_release_changes (release_id,change_type,description,sort_order)
SELECT id,'IMPROVEMENT','Forma Ticket i ri dhe Edito ticket-in përdorin të njëjtin layout clean dhe compact.',20 FROM application_releases WHERE version='0.14.1';
INSERT INTO application_release_changes (release_id,change_type,description,sort_order)
SELECT id,'FEATURE','Editimi i ticket-it tani përfshin klientin, titullin, përshkrimin, prioritetin dhe afatin.',30 FROM application_releases WHERE version='0.14.1';

-- ===== database/migrations/029_ticket_modal_surface_fix.sql =====
-- SIRA App v0.14.2

INSERT INTO application_releases (
  version, title, summary, release_channel, migration_name
) VALUES (
  '0.14.2',
  'Ticket modal background fix',
  'U rregullua pamja e modalit të ticket-it: Edito, Detajet, Notes dhe veprimet tani shfaqen në një card të bardhë, clean dhe compact mbi backdrop-in.',
  'development',
  '029_ticket_modal_surface_fix.sql'
)
ON DUPLICATE KEY UPDATE
  title=VALUES(title),
  summary=VALUES(summary),
  release_channel=VALUES(release_channel),
  migration_name=VALUES(migration_name);

INSERT INTO application_release_changes (
  release_id, change_type, description, sort_order
)
SELECT id,'FIX','U shtua background i bardhë, border, radius dhe shadow për modalCard te Ticket System.',10
FROM application_releases WHERE version='0.14.2';

-- ===== database/migrations/030_dashboard_ticket_tabs_nav_dropdown.sql =====
-- SIRA App v0.14.3

INSERT INTO application_releases (version,title,summary,release_channel,migration_name) VALUES ('0.14.3','Dashboard & Ticket tabs','Dashboard Detyrat tani ka taba funksionale për Sot, Nesër dhe Të gjitha; Ticket System i integron 4 statuset në taba; dropdown-i Më shumë nuk pritet më nga menuja.','development','030_dashboard_ticket_tabs_nav_dropdown.sql') ON DUPLICATE KEY UPDATE title=VALUES(title),summary=VALUES(summary),release_channel=VALUES(release_channel),migration_name=VALUES(migration_name);

INSERT INTO application_release_changes (release_id,change_type,description,sort_order) SELECT id,'FEATURE','Detyrat në Dashboard: Sot, Nesër dhe Të gjitha janë taba të klikueshme me listën përkatëse.',10 FROM application_releases WHERE version='0.14.3';
INSERT INTO application_release_changes (release_id,change_type,description,sort_order) SELECT id,'IMPROVEMENT','Ticket System: katër kolonat e statusit u kthyen në taba compact me një hapësirë të vetme për listën aktive.',20 FROM application_releases WHERE version='0.14.3';
INSERT INTO application_release_changes (release_id,change_type,description,sort_order) SELECT id,'FIX','Dropdown-i Më shumë tani shfaqet mbi përmbajtjen dhe nuk pritet nga navigimi.',30 FROM application_releases WHERE version='0.14.3';

-- ===== SIRA-APP-v0.14.4-database.sql (replaces/updates migrations/031_version_source_of_truth.sql) =====
-- SIRA App v0.14.4

INSERT INTO application_releases (
  version, title, summary, release_channel, migration_name
) VALUES (
  '0.14.4',
  'Versioni aktual dhe Ticket workflow i përmirësuar',
  'U sinkronizua versioni real i build-it dhe u riorganizua pamja e detajeve të Ticket-it: përshkrimi, komunikimi dhe menaxhimi standard i statusit.',
  'development',
  '031_version_source_of_truth.sql'
)
ON DUPLICATE KEY UPDATE
  title=VALUES(title),
  summary=VALUES(summary),
  release_channel=VALUES(release_channel),
  migration_name=VALUES(migration_name);

INSERT INTO application_release_changes (
  release_id, change_type, description, sort_order
)
SELECT id, 'FIX',
       'Admin Dashboard tani shfaq versionin real të build-it dhe nuk mbetet te një APP_VERSION i vjetër nga .env.',
       10
FROM application_releases r
WHERE r.version='0.14.4'
  AND NOT EXISTS (
    SELECT 1 FROM application_release_changes c
    WHERE c.release_id=r.id AND c.sort_order=10
  );

INSERT INTO application_release_changes (
  release_id, change_type, description, sort_order
)
SELECT id, 'IMPROVEMENT',
       'Ticket Detail u riorganizua: përshkrimi shfaqet i pari, Notes/Komunikimi poshtë dhe statusi menaxhohet nga një dropdown me Në pritje, Duke u përpunuar, Në pritje të klientit dhe Përfunduar/Mbyllur. Resolution Notes kërkohen për mbyllje.',
       20
FROM application_releases r
WHERE r.version='0.14.4'
  AND NOT EXISTS (
    SELECT 1 FROM application_release_changes c
    WHERE c.release_id=r.id AND c.sort_order=20
  );

