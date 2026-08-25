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
