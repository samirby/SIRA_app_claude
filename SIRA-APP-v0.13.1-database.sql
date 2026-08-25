-- SIRA App v0.13.1
-- Consistent delete actions across modules.
-- Corrected to match application_releases schema from migration 014_release_history.sql.

INSERT INTO application_releases (
  version, title, summary, release_channel, migration_name
) VALUES (
  '0.13.1',
  'Butonat Fshi në modulet kryesore',
  'U standardizuan veprimet e fshirjes aty ku ka kuptim, me konfirmim dhe mbrojtje të të dhënave historike.',
  'development',
  '026_consistent_delete_actions.sql'
)
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  summary = VALUES(summary),
  release_channel = VALUES(release_channel),
  migration_name = VALUES(migration_name);

INSERT INTO application_release_changes (
  release_id, change_type, description, sort_order
)
SELECT id, 'FEATURE',
       'Produktet & Shërbimet: u shtua butoni Fshi me soft-delete dhe konfirmim.',
       10
FROM application_releases
WHERE version = '0.13.1'
ON DUPLICATE KEY UPDATE
  change_type = VALUES(change_type),
  description = VALUES(description);

INSERT INTO application_release_changes (
  release_id, change_type, description, sort_order
)
SELECT id, 'FEATURE',
       'Përdoruesit & Rolet: u shtua butoni Fshi; Global Admin-i i fundit mbrohet nga fshirja.',
       20
FROM application_releases
WHERE version = '0.13.1'
ON DUPLICATE KEY UPDATE
  change_type = VALUES(change_type),
  description = VALUES(description);

INSERT INTO application_release_changes (
  release_id, change_type, description, sort_order
)
SELECT id, 'IMPROVEMENT',
       'U ruajt logjika e sigurt ekzistuese: klientët fshihen vetëm nga arkiva, faturat anulohen dhe projektet/kontratat kanë konfirmim.',
       30
FROM application_releases
WHERE version = '0.13.1'
ON DUPLICATE KEY UPDATE
  change_type = VALUES(change_type),
  description = VALUES(description);
