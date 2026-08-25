-- SIRA App v0.11.1
-- Ensures login configuration is evaluated at server runtime.
-- No schema changes are required.

INSERT INTO application_releases (version, title, summary, release_channel, migration_name)
VALUES (
  '0.11.1',
  'Korrigjimi i konfigurimit të login-it',
  'Login-i nuk e ruan më gjatë build-it gjendjen e variablave; validimi kryhet nga serveri në momentin e kyçjes.',
  'development',
  '023_login_runtime_config_fix.sql'
)
ON DUPLICATE KEY UPDATE
  title = VALUES(title), summary = VALUES(summary),
  release_channel = VALUES(release_channel), migration_name = VALUES(migration_name);

SET @release_id = (SELECT id FROM application_releases WHERE version = '0.11.1' LIMIT 1);
DELETE FROM application_release_changes WHERE release_id = @release_id;

INSERT INTO application_release_changes (release_id, change_type, description, sort_order)
VALUES
  (@release_id, 'FIX', 'U hoq kontrolli statik i konfigurimit nga formulari i login-it.', 10),
  (@release_id, 'FIX', 'Faqja e login-it gjenerohet dinamikisht dhe validimi kryhet në API gjatë kërkesës.', 20);
