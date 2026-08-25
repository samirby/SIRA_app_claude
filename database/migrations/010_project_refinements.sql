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
