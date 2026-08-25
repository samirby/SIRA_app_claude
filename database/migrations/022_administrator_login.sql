-- SIRA App v0.11.0
-- Administrator login and protected application routes.
-- No schema changes are required for the environment-based administrator.

INSERT INTO application_releases (version, title, summary, release_channel, migration_name)
VALUES (
  '0.11.0',
  'Login-i i administratorit',
  'Shton login, session të sigurt, mbrojtje të faqeve dhe API-ve, kufizim tentativash dhe logout.',
  'development',
  '022_administrator_login.sql'
)
ON DUPLICATE KEY UPDATE
  title = VALUES(title), summary = VALUES(summary),
  release_channel = VALUES(release_channel), migration_name = VALUES(migration_name);

SET @release_id = (SELECT id FROM application_releases WHERE version = '0.11.0' LIMIT 1);
DELETE FROM application_release_changes WHERE release_id = @release_id;

INSERT INTO application_release_changes (release_id, change_type, description, sort_order)
VALUES
  (@release_id, 'FEATURE', 'U shtua faqja moderne e login-it për administratorin.', 10),
  (@release_id, 'SECURITY', 'Faqet dhe API-t e aplikacionit kërkojnë session të vlefshëm.', 20),
  (@release_id, 'SECURITY', 'Session-i ruhet në cookie HttpOnly të nënshkruar me HMAC-SHA256.', 30),
  (@release_id, 'SECURITY', 'Pas pesë tentativave të pasakta login-i bllokohet për 15 minuta.', 40),
  (@release_id, 'FEATURE', 'U shtua butoni Dil për mbylljen e session-it.', 50);
