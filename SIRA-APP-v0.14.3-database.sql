-- SIRA App v0.14.3
USE `u720236376_siradb`;

INSERT INTO application_releases (version,title,summary,release_channel,migration_name) VALUES ('0.14.3','Dashboard & Ticket tabs','Dashboard Detyrat tani ka taba funksionale për Sot, Nesër dhe Të gjitha; Ticket System i integron 4 statuset në taba; dropdown-i Më shumë nuk pritet më nga menuja.','development','030_dashboard_ticket_tabs_nav_dropdown.sql') ON DUPLICATE KEY UPDATE title=VALUES(title),summary=VALUES(summary),release_channel=VALUES(release_channel),migration_name=VALUES(migration_name);

INSERT INTO application_release_changes (release_id,change_type,description,sort_order) SELECT id,'FEATURE','Detyrat në Dashboard: Sot, Nesër dhe Të gjitha janë taba të klikueshme me listën përkatëse.',10 FROM application_releases WHERE version='0.14.3';
INSERT INTO application_release_changes (release_id,change_type,description,sort_order) SELECT id,'IMPROVEMENT','Ticket System: katër kolonat e statusit u kthyen në taba compact me një hapësirë të vetme për listën aktive.',20 FROM application_releases WHERE version='0.14.3';
INSERT INTO application_release_changes (release_id,change_type,description,sort_order) SELECT id,'FIX','Dropdown-i Më shumë tani shfaqet mbi përmbajtjen dhe nuk pritet nga navigimi.',30 FROM application_releases WHERE version='0.14.3';
