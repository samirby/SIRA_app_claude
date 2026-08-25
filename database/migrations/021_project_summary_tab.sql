-- SIRA App v0.10.8
-- Project summary moved into a dedicated tab.
-- No schema changes are required.

INSERT INTO application_releases (version, title, summary, release_channel, migration_name)
VALUES (
  '0.10.8',
  'Tabi Përmbledhja',
  'Përmbledhja, fazat dhe aktiviteti janë vendosur në tab-e të veçanta për një hapësirë më të pastër.',
  'development',
  '021_project_summary_tab.sql'
)
ON DUPLICATE KEY UPDATE
  title = VALUES(title), summary = VALUES(summary),
  release_channel = VALUES(release_channel), migration_name = VALUES(migration_name);

SET @release_id = (SELECT id FROM application_releases WHERE version = '0.10.8' LIMIT 1);
DELETE FROM application_release_changes WHERE release_id = @release_id;

INSERT INTO application_release_changes (release_id, change_type, description, sort_order)
VALUES
  (@release_id, 'IMPROVEMENT', 'U shtua tabi Përmbledhja pas Puna, Dokumentet dhe Detajet.', 10),
  (@release_id, 'IMPROVEMENT', 'Te Puna mbeten fazat operative dhe Kanban-i, ndërsa statistikat paraqiten veçmas.', 20),
  (@release_id, 'IMPROVEMENT', 'Menaxhimi i fazave është vendosur në tabin Fazat.', 30),
  (@release_id, 'IMPROVEMENT', 'Shënimet dhe historiku i punës janë vendosur në tabin Aktiviteti.', 40),
  (@release_id, 'IMPROVEMENT', 'Navigimi dhe fazat operative janë bërë kompakte dhe janë integruar vizualisht.', 50);
