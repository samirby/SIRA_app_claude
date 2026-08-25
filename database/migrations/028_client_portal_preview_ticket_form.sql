-- SIRA App v0.14.1

INSERT INTO application_releases (version,title,summary,release_channel,migration_name)
VALUES ('0.14.1','Client Portal Preview dhe Ticket Form','U shtua Client Portal Preview në top menu dhe u standardizua forma e krijimit/editimit të ticket-it.','development','028_client_portal_preview_ticket_form.sql')
ON DUPLICATE KEY UPDATE title=VALUES(title),summary=VALUES(summary),release_channel=VALUES(release_channel),migration_name=VALUES(migration_name);

INSERT INTO application_release_changes (release_id,change_type,description,sort_order)
SELECT id,'FEATURE','Client Portal tani mund të testohet nga Global Admin direkt nga top menu, me zgjedhje të klientit.',10 FROM application_releases WHERE version='0.14.1';
INSERT INTO application_release_changes (release_id,change_type,description,sort_order)
SELECT id,'IMPROVEMENT','Forma Ticket i ri dhe Edito ticket-in përdorin të njëjtin layout clean dhe compact.',20 FROM application_releases WHERE version='0.14.1';
INSERT INTO application_release_changes (release_id,change_type,description,sort_order)
SELECT id,'FEATURE','Editimi i ticket-it tani përfshin klientin, titullin, përshkrimin, prioritetin dhe afatin.',30 FROM application_releases WHERE version='0.14.1';
