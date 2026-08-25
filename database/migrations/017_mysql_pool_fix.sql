INSERT INTO application_releases (version, title, summary, release_channel, migration_name)
VALUES (
  '0.10.4',
  'Stabilizimi i lidhjes me databazën',
  'Përdor një MySQL connection pool të vetëm edhe në production dhe shmang lidhjet e përsëritura EPERM.',
  'development',
  '017_mysql_pool_fix.sql'
)
ON DUPLICATE KEY UPDATE title = VALUES(title), summary = VALUES(summary),
  release_channel = VALUES(release_channel), migration_name = VALUES(migration_name);

INSERT INTO application_release_changes (release_id, change_type, description, sort_order)
SELECT id, 'FIX', 'MySQL pool ruhet dhe ripërdoret në production në vend që të krijohet për çdo query.', 10
FROM application_releases WHERE version = '0.10.4'
ON DUPLICATE KEY UPDATE change_type = VALUES(change_type), description = VALUES(description);

INSERT INTO application_release_changes (release_id, change_type, description, sort_order)
SELECT id, 'FIX', 'U shmang krijimi parcial i projektit nga dështimi i lidhjeve të njëpasnjëshme me databazën.', 20
FROM application_releases WHERE version = '0.10.4'
ON DUPLICATE KEY UPDATE change_type = VALUES(change_type), description = VALUES(description);
