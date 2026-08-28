-- SIRA App v0.14.6
-- Lidhja e fazave (Milestones) me statuset e Kanban-it të detyrave: çdo projekt merr 4 faza fikse
-- (Ide / Ndërtim / Implementim & Testim / Publikim & Përfundim), të lidhura 1-për-1 me statuset e
-- Kanban-it (E re/Në punë/Në pritje/Përfunduar) — kur ndryshon statusi i një detyre, detyra kalon
-- vetë te faza përkatëse (dhe anasjelltas kur ndryshohet faza manualisht). Përfshin edhe
-- automatizimin e mëparshëm të statusit të vetë fazës nga statuset e task-eve brenda saj, si dhe
-- rrumbullakun (donut) e progresit për çdo fazë.

INSERT INTO application_releases (
  version, title, summary, release_channel, migration_name
) VALUES (
  '0.14.6',
  'Fazat e projektit të lidhura me Kanban-in',
  'Çdo projekt tani ka 4 faza fikse (Ide / Ndërtim / Implementim & Testim / Publikim & Përfundim) të lidhura automatikisht me statusin e Kanban-it të detyrave — kur ndryshon statusi i një detyre, ajo kalon vetë te faza përkatëse, dhe anasjelltas.',
  'development',
  '033_phase_kanban_sync.sql'
)
ON DUPLICATE KEY UPDATE
  title = VALUES(title), summary = VALUES(summary), release_channel = VALUES(release_channel), migration_name = VALUES(migration_name);

INSERT INTO application_release_changes (release_id, change_type, description, sort_order)
SELECT id, 'FEATURE', 'Çdo projekt i ri merr 4 faza fikse (Ide / Ndërtim / Implementim & Testim / Publikim & Përfundim), të njëjta për çdo lloj projekti.', 10
FROM application_releases WHERE version = '0.14.6'
ON DUPLICATE KEY UPDATE change_type = VALUES(change_type), description = VALUES(description);

INSERT INTO application_release_changes (release_id, change_type, description, sort_order)
SELECT id, 'FEATURE', 'Kur statusi i një detyre ndryshon te Kanban-i, detyra kalon vetë te faza përkatëse e projektit (dhe anasjelltas kur ndryshohet faza manualisht).', 20
FROM application_releases WHERE version = '0.14.6'
ON DUPLICATE KEY UPDATE change_type = VALUES(change_type), description = VALUES(description);

INSERT INTO application_release_changes (release_id, change_type, description, sort_order)
SELECT id, 'FEATURE', 'Rrumbullak progresi (donut) për çdo fazë — mbushet me ngjyrë sipas % së detyrave të kryera.', 30
FROM application_releases WHERE version = '0.14.6'
ON DUPLICATE KEY UPDATE change_type = VALUES(change_type), description = VALUES(description);

INSERT INTO application_release_changes (release_id, change_type, description, sort_order)
SELECT id, 'IMPROVEMENT', 'Krijimi i një detyre të re për një projekt hap direkt projektin te faza ku u vendos detyra.', 40
FROM application_releases WHERE version = '0.14.6'
ON DUPLICATE KEY UPDATE change_type = VALUES(change_type), description = VALUES(description);

INSERT INTO application_release_changes (release_id, change_type, description, sort_order)
SELECT id, 'IMPROVEMENT', 'Kanban-i te faqja e projektit tregon tani të gjitha detyrat (4 fazat njëherësh), jo të filtruara sipas një faze të vetme.', 50
FROM application_releases WHERE version = '0.14.6'
ON DUPLICATE KEY UPDATE change_type = VALUES(change_type), description = VALUES(description);
