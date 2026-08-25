-- SIRA App v0.13.2
-- Butoni Fshi te Detyrat & Punët.

USE `u720236376_siradb`;

INSERT INTO application_releases (version, title, summary, release_channel, migration_name)
VALUES (
  '0.13.2',
  'Fshirja e detyrave',
  'U shtua veprimi Fshi në kartat Kanban dhe në listën e detyrave, me konfirmim dhe soft-delete.',
  'development',
  '027_task_delete_action.sql'
)
ON DUPLICATE KEY UPDATE
  title = VALUES(title), summary = VALUES(summary), release_channel = VALUES(release_channel), migration_name = VALUES(migration_name);

INSERT INTO application_release_changes (release_id, change_type, description, sort_order)
SELECT id, 'FEATURE', 'Detyrat: butoni Fshi u shtua pranë Edito në Kanban dhe në pamjen Listë.', 10
FROM application_releases WHERE version = '0.13.2';

INSERT INTO application_release_changes (release_id, change_type, description, sort_order)
SELECT id, 'IMPROVEMENT', 'Fshirja përdor soft-delete; detyrat e lidhura me faturë të krijuar/finalizuar mbrohen nga fshirja.', 20
FROM application_releases WHERE version = '0.13.2';
