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
