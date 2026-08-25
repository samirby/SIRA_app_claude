-- SIRA App v0.12.0
-- Database users, roles and client-specific portal access.

ALTER TABLE organization_memberships
  ADD COLUMN IF NOT EXISTS client_id BIGINT UNSIGNED NULL AFTER role_code;

INSERT INTO application_releases (version, title, summary, release_channel, migration_name)
VALUES (
  '0.12.0',
  'Përdoruesit, rolet dhe Client Portal',
  'Shton përdorues në databazë, role Global Admin/Punëtor/Klient, autorizim në faqe dhe API, si dhe portalin e izoluar të klientit.',
  'development',
  '024_users_roles_client_portal.sql'
)
ON DUPLICATE KEY UPDATE
  title = VALUES(title), summary = VALUES(summary),
  release_channel = VALUES(release_channel), migration_name = VALUES(migration_name);

SET @release_id = (SELECT id FROM application_releases WHERE version = '0.12.0' LIMIT 1);
DELETE FROM application_release_changes WHERE release_id = @release_id;

INSERT INTO application_release_changes (release_id, change_type, description, sort_order)
VALUES
  (@release_id, 'FEATURE', 'U shtua Settings → Përdoruesit & Rolet.', 10),
  (@release_id, 'SECURITY', 'Password-et e përdoruesve ruhen si hash scrypt me salt unik.', 20),
  (@release_id, 'SECURITY', 'Global Admin, Punëtor dhe Klient kanë kufizime të ndryshme në faqe dhe API.', 30),
  (@release_id, 'FEATURE', 'Roli Klient lidhet me një klient dhe hap vetëm Client Portal.', 40),
  (@release_id, 'FEATURE', 'Client Portal paraqet vetëm projektet dhe progresin e klientit të lidhur.', 50),
  (@release_id, 'IMPROVEMENT', 'Global Admin mund të krijojë, çaktivizojë dhe resetoje password-in e përdoruesve.', 60);
