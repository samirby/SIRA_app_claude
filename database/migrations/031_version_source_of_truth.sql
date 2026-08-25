-- SIRA App v0.14.4
USE `u720236376_siradb`;

INSERT INTO application_releases (
  version, title, summary, release_channel, migration_name
) VALUES (
  '0.14.4',
  'Versioni aktual sinkronizohet automatikisht me build-in',
  'U hoq varësia nga APP_VERSION i vjetër në .env që mund të shfaqte version të gabuar në Admin Dashboard, Settings dhe top menu.',
  'development',
  '031_version_source_of_truth.sql'
)
ON DUPLICATE KEY UPDATE
  title=VALUES(title), summary=VALUES(summary), release_channel=VALUES(release_channel), migration_name=VALUES(migration_name);

INSERT INTO application_release_changes (release_id, change_type, description, sort_order)
SELECT id, 'FIX', 'Admin Dashboard tani shfaq versionin real të build-it dhe nuk mbetet te një APP_VERSION i vjetër nga .env.', 10
FROM application_releases WHERE version='0.14.4';
