-- SIRA App v0.14.2
USE `u720236376_siradb`;

INSERT INTO application_releases (
  version, title, summary, release_channel, migration_name
) VALUES (
  '0.14.2',
  'Ticket modal background fix',
  'U rregullua pamja e modalit të ticket-it: Edito, Detajet, Notes dhe veprimet tani shfaqen në një card të bardhë, clean dhe compact mbi backdrop-in.',
  'development',
  '029_ticket_modal_surface_fix.sql'
)
ON DUPLICATE KEY UPDATE
  title=VALUES(title),
  summary=VALUES(summary),
  release_channel=VALUES(release_channel),
  migration_name=VALUES(migration_name);

INSERT INTO application_release_changes (
  release_id, change_type, description, sort_order
)
SELECT id,'FIX','U shtua background i bardhë, border, radius dhe shadow për modalCard te Ticket System.',10
FROM application_releases WHERE version='0.14.2';
