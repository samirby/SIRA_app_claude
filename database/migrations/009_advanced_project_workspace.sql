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
