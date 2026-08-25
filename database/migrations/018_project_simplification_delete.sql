-- SIRA App v0.10.5
-- Simplified project workspace and safe project deletion.
-- No schema changes are required: projects.deleted_at already exists.

INSERT INTO application_releases (version, title, summary, release_channel, migration_name)
VALUES (
  '0.10.5',
  'Projektet e thjeshtuara dhe fshirja',
  'Lista e projekteve është thjeshtuar dhe projektet pa faturë mund të largohen në mënyrë të sigurt nga lista aktive.',
  'development',
  '018_project_simplification_delete.sql'
)
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  summary = VALUES(summary),
  release_channel = VALUES(release_channel),
  migration_name = VALUES(migration_name);

SET @release_id = (SELECT id FROM application_releases WHERE version = '0.10.5' LIMIT 1);

DELETE FROM application_release_changes WHERE release_id = @release_id;

INSERT INTO application_release_changes (release_id, change_type, description, sort_order)
VALUES
  (@release_id, 'IMPROVEMENT', 'Lista paraqet vetëm projektin, klientin, progresin, afatin dhe veprimet.', 10),
  (@release_id, 'IMPROVEMENT', 'Projekti ka tri seksione kryesore: Puna, Dokumentet dhe Detajet.', 20),
  (@release_id, 'FEATURE', 'Menyja me tri pika lejon fshirjen pas një konfirmimi të qartë.', 30),
  (@release_id, 'SECURITY', 'Përdoret deleted_at; klienti dhe historiku ruhen, ndërsa projektet e lidhura me faturë mbrohen.', 40);
