-- SIRA App v0.14.7
-- Progresi total i projektit tani llogaritet me peshë të barabartë për çdo fazë
-- (25% për fazë me 4 fazat fikse), jo më sipas numrit total të detyrave në projekt.
-- Kështu një fazë me 2 detyra ndikon njësoj në progresin total sa një fazë me 20 detyra.

INSERT INTO application_releases (
  version, title, summary, release_channel, migration_name
) VALUES (
  '0.14.7',
  'Progresi i projektit i peshuar sipas fazave',
  'Progresi total i projektit llogaritet tani si mesatarja e 4 fazave (25% secila), jo më sipas numrit të përgjithshëm të detyrave — çdo fazë ndikon njësoj në progresin total, pavarësisht sa detyra ka brenda.',
  'development',
  '035_phase_weighted_progress.sql'
)
ON DUPLICATE KEY UPDATE
  title = VALUES(title), summary = VALUES(summary), release_channel = VALUES(release_channel), migration_name = VALUES(migration_name);

INSERT INTO application_release_changes (release_id, change_type, description, sort_order)
SELECT id, 'IMPROVEMENT', 'Progresi total i projektit peshohet tani njësoj për çdo fazë (25% secila me 4 fazat), jo sipas numrit të detyrave brenda saj.', 10
FROM application_releases WHERE version = '0.14.7'
ON DUPLICATE KEY UPDATE change_type = VALUES(change_type), description = VALUES(description);
