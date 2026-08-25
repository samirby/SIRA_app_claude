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
