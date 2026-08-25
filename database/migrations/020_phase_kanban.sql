-- SIRA App v0.10.7
-- Phase-specific Kanban directly below the project phases.
-- No schema changes are required.

INSERT INTO application_releases (version, title, summary, release_channel, migration_name)
VALUES (
  '0.10.7',
  'Kanban sipas fazës',
  'Klikimi mbi një fazë shfaq menjëherë Kanban-in me detyrat e asaj faze.',
  'development',
  '020_phase_kanban.sql'
)
ON DUPLICATE KEY UPDATE
  title = VALUES(title), summary = VALUES(summary),
  release_channel = VALUES(release_channel), migration_name = VALUES(migration_name);

SET @release_id = (SELECT id FROM application_releases WHERE version = '0.10.7' LIMIT 1);
DELETE FROM application_release_changes WHERE release_id = @release_id;

INSERT INTO application_release_changes (release_id, change_type, description, sort_order)
VALUES
  (@release_id, 'FEATURE', 'Klikimi mbi fazën hap Kanban-in direkt poshtë listës së fazave.', 10),
  (@release_id, 'IMPROVEMENT', 'Kanban-i filtron dhe paraqet vetëm detyrat e fazës së zgjedhur.', 20),
  (@release_id, 'IMPROVEMENT', 'Detyra e re lidhet automatikisht me fazën që është e hapur.', 30);
