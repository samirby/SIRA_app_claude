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
