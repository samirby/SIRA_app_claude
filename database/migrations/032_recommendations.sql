-- SIRA App v0.14.5
-- Modul i ri: Rekomandimet — regjistrim i rekomandimeve për klientët gjatë realizimit të projektit;
-- kur klienti pranon në takimin e ardhshëm, rekomandimi shndërrohet automatikisht në detyrë.

CREATE TABLE IF NOT EXISTS recommendations (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  organization_id BIGINT UNSIGNED NOT NULL,
  client_id BIGINT UNSIGNED NOT NULL,
  project_id BIGINT UNSIGNED NULL,
  title VARCHAR(190) NOT NULL,
  description TEXT NULL,
  status ENUM('PENDING','ACCEPTED','DECLINED') NOT NULL DEFAULT 'PENDING',
  task_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_recommendations_org_status (organization_id, status),
  INDEX idx_recommendations_client (organization_id, client_id),
  INDEX idx_recommendations_project (organization_id, project_id),
  CONSTRAINT fk_recommendations_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT fk_recommendations_client FOREIGN KEY (client_id) REFERENCES clients(id),
  CONSTRAINT fk_recommendations_project FOREIGN KEY (project_id) REFERENCES projects(id),
  CONSTRAINT fk_recommendations_task FOREIGN KEY (task_id) REFERENCES tasks(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO application_releases (
  version, title, summary, release_channel, migration_name
) VALUES (
  '0.14.5',
  'Modul i ri: Rekomandimet',
  'Hapësirë e re ku regjistrohen rekomandime për klientët gjatë realizimit të një projekti. Në takimin e ardhshëm klienti pyetet dhe, nëse pranon, rekomandimi shndërrohet automatikisht në detyrë.',
  'development',
  '032_recommendations.sql'
)
ON DUPLICATE KEY UPDATE
  title = VALUES(title), summary = VALUES(summary), release_channel = VALUES(release_channel), migration_name = VALUES(migration_name);

INSERT INTO application_release_changes (release_id, change_type, description, sort_order)
SELECT id, 'FEATURE', 'Faqe e re "Rekomandimet" në navigim, tab i ri brenda çdo projekti, dhe seksion në profilin e klientit.', 10
FROM application_releases WHERE version = '0.14.5'
ON DUPLICATE KEY UPDATE change_type = VALUES(change_type), description = VALUES(description);

INSERT INTO application_release_changes (release_id, change_type, description, sort_order)
SELECT id, 'FEATURE', 'Butoni "Pranoi → Detyrë" krijon automatikisht një detyrë të lidhur me klientin/projektin kur rekomandimi pranohet.', 20
FROM application_releases WHERE version = '0.14.5'
ON DUPLICATE KEY UPDATE change_type = VALUES(change_type), description = VALUES(description);
