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

