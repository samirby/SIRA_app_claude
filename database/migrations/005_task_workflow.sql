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

