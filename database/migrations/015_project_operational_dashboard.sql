INSERT INTO application_releases (
  version, title, summary, release_channel, migration_name
) VALUES (
  '0.10.2',
  'Përmbledhja operative e projekteve',
  'Shton pamjen e re testuese të projektit me faza, detyra aktive, financa, bllokues dhe aktivitet.',
  'development',
  '015_project_operational_dashboard.sql'
)
ON DUPLICATE KEY UPDATE
  title = VALUES(title), summary = VALUES(summary),
  release_channel = VALUES(release_channel), migration_name = VALUES(migration_name);

INSERT INTO application_release_changes (release_id, change_type, description, sort_order)
SELECT id, 'FEATURE', 'U shtua dashboard-i operativ në Përmbledhjen e projektit.', 10
FROM application_releases WHERE version = '0.10.2'
ON DUPLICATE KEY UPDATE change_type = VALUES(change_type), description = VALUES(description);

INSERT INTO application_release_changes (release_id, change_type, description, sort_order)
SELECT id, 'FEATURE', 'U shtua skeda e veçantë Aktiviteti me shënime, vendime, probleme dhe kërkesa të klientit.', 20
FROM application_releases WHERE version = '0.10.2'
ON DUPLICATE KEY UPDATE change_type = VALUES(change_type), description = VALUES(description);

INSERT INTO application_release_changes (release_id, change_type, description, sort_order)
SELECT id, 'IMPROVEMENT', 'Përmbledhja shfaq fazën aktuale, progresin, afatin, buxhetin, detyrat aktive dhe bllokuesit.', 30
FROM application_releases WHERE version = '0.10.2'
ON DUPLICATE KEY UPDATE change_type = VALUES(change_type), description = VALUES(description);
