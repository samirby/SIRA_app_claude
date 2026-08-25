-- SIRA App v0.10.6
-- New projects receive their four base phases without automatic tasks.
-- No schema changes are required.

INSERT INTO application_releases (version, title, summary, release_channel, migration_name)
VALUES (
  '0.10.6',
  'Fazat pa detyra automatike',
  'Projektet e reja krijojnë vetëm katër fazat bazë. Detyrat shtohen manualisht sipas nevojës së projektit.',
  'development',
  '019_project_phases_without_tasks.sql'
)
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  summary = VALUES(summary),
  release_channel = VALUES(release_channel),
  migration_name = VALUES(migration_name);

SET @release_id = (SELECT id FROM application_releases WHERE version = '0.10.6' LIMIT 1);

DELETE FROM application_release_changes WHERE release_id = @release_id;

INSERT INTO application_release_changes (release_id, change_type, description, sort_order)
VALUES
  (@release_id, 'IMPROVEMENT', 'Projektet e reja krijojnë katër fazat bazë pa shtuar detyra automatike.', 10),
  (@release_id, 'IMPROVEMENT', 'Detyrat shtohen manualisht dhe lidhen me fazën përkatëse sipas nevojës.', 20),
  (@release_id, 'FIX', 'Projektet e llojeve të ndryshme nuk ngarkohen më me lista të paracaktuara detyrash.', 30);
