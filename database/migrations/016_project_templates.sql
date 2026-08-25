ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS project_type ENUM('WEBSITE','IT','GRAPHIC','VIDEO','MARKETING','OTHER')
    NOT NULL DEFAULT 'WEBSITE' AFTER product_description_snapshot;

INSERT INTO application_releases (version, title, summary, release_channel, migration_name)
VALUES (
  '0.10.3', 'Projektet me faza automatike',
  'Thjeshton listën e projekteve dhe krijon automatikisht katër faza me detyra sipas llojit të projektit.',
  'development', '016_project_templates.sql'
)
ON DUPLICATE KEY UPDATE title = VALUES(title), summary = VALUES(summary),
  release_channel = VALUES(release_channel), migration_name = VALUES(migration_name);

INSERT INTO application_release_changes (release_id, change_type, description, sort_order)
SELECT id, 'IMPROVEMENT', 'Projektet hapen drejtpërdrejt si listë; pamja Kanban u largua nga ndërfaqja.', 10
FROM application_releases WHERE version = '0.10.3'
ON DUPLICATE KEY UPDATE change_type = VALUES(change_type), description = VALUES(description);

INSERT INTO application_release_changes (release_id, change_type, description, sort_order)
SELECT id, 'FEATURE', 'Krijimi i projektit gjeneron katër faza dhe detyrat standarde sipas llojit.', 20
FROM application_releases WHERE version = '0.10.3'
ON DUPLICATE KEY UPDATE change_type = VALUES(change_type), description = VALUES(description);

INSERT INTO application_release_changes (release_id, change_type, description, sort_order)
SELECT id, 'FEATURE', 'U shtuan template për Website, IT, Grafikë, Video, Marketing dhe projekte të tjera.', 30
FROM application_releases WHERE version = '0.10.3'
ON DUPLICATE KEY UPDATE change_type = VALUES(change_type), description = VALUES(description);

INSERT INTO application_release_changes (release_id, change_type, description, sort_order)
SELECT id, 'IMPROVEMENT', 'Brenda projektit zgjidhet faza dhe shfaqen vetëm detyrat e asaj faze.', 40
FROM application_releases WHERE version = '0.10.3'
ON DUPLICATE KEY UPDATE change_type = VALUES(change_type), description = VALUES(description);
