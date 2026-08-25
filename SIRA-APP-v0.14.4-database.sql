-- SIRA App v0.14.4

INSERT INTO application_releases (
  version, title, summary, release_channel, migration_name
) VALUES (
  '0.14.4',
  'Versioni aktual dhe Ticket workflow i përmirësuar',
  'U sinkronizua versioni real i build-it dhe u riorganizua pamja e detajeve të Ticket-it: përshkrimi, komunikimi dhe menaxhimi standard i statusit.',
  'development',
  '031_version_source_of_truth.sql'
)
ON DUPLICATE KEY UPDATE
  title=VALUES(title),
  summary=VALUES(summary),
  release_channel=VALUES(release_channel),
  migration_name=VALUES(migration_name);

INSERT INTO application_release_changes (
  release_id, change_type, description, sort_order
)
SELECT id, 'FIX',
       'Admin Dashboard tani shfaq versionin real të build-it dhe nuk mbetet te një APP_VERSION i vjetër nga .env.',
       10
FROM application_releases r
WHERE r.version='0.14.4'
  AND NOT EXISTS (
    SELECT 1 FROM application_release_changes c
    WHERE c.release_id=r.id AND c.sort_order=10
  );

INSERT INTO application_release_changes (
  release_id, change_type, description, sort_order
)
SELECT id, 'IMPROVEMENT',
       'Ticket Detail u riorganizua: përshkrimi shfaqet i pari, Notes/Komunikimi poshtë dhe statusi menaxhohet nga një dropdown me Në pritje, Duke u përpunuar, Në pritje të klientit dhe Përfunduar/Mbyllur. Resolution Notes kërkohen për mbyllje.',
       20
FROM application_releases r
WHERE r.version='0.14.4'
  AND NOT EXISTS (
    SELECT 1 FROM application_release_changes c
    WHERE c.release_id=r.id AND c.sort_order=20
  );
