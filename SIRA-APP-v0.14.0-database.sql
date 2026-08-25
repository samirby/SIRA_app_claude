CREATE TABLE IF NOT EXISTS tickets (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  organization_id BIGINT UNSIGNED NOT NULL,
  ticket_number VARCHAR(40) NOT NULL,
  client_id BIGINT UNSIGNED NOT NULL,
  created_by_user_id BIGINT UNSIGNED NULL,
  created_by_role ENUM('GLOBAL_ADMIN','WORKER','CLIENT') NOT NULL DEFAULT 'GLOBAL_ADMIN',
  title VARCHAR(190) NOT NULL,
  description TEXT NOT NULL,
  priority ENUM('NORMAL','HIGH','URGENT') NOT NULL DEFAULT 'NORMAL',
  due_at DATETIME NULL,
  status ENUM('NEW','IN_PROGRESS','WAITING_CLIENT','CLOSED') NOT NULL DEFAULT 'NEW',
  resolution_notes TEXT NULL,
  accepted_at DATETIME NULL,
  closed_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  UNIQUE KEY uq_ticket_number (organization_id,ticket_number),
  INDEX idx_ticket_org_status (organization_id,status),
  INDEX idx_ticket_client (client_id),
  CONSTRAINT fk_ticket_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT fk_ticket_client FOREIGN KEY (client_id) REFERENCES clients(id),
  CONSTRAINT fk_ticket_creator FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ticket_notes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  organization_id BIGINT UNSIGNED NOT NULL,
  ticket_id BIGINT UNSIGNED NOT NULL,
  author_user_id BIGINT UNSIGNED NULL,
  author_role ENUM('GLOBAL_ADMIN','WORKER','CLIENT') NOT NULL,
  author_name VARCHAR(160) NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ticket_note_ticket (ticket_id,created_at),
  CONSTRAINT fk_ticket_note_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT fk_ticket_note_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  CONSTRAINT fk_ticket_note_user FOREIGN KEY (author_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO application_releases (version,title,summary,release_channel,migration_name)
VALUES ('0.14.0','Ticket System & Client Support Portal','Shton Ticket System-in funksional me Client Portal, komunikim përmes Notes, statuset e punës dhe Resolution Notes të detyrueshme para mbylljes.','development','027_ticket_system.sql')
ON DUPLICATE KEY UPDATE title=VALUES(title),summary=VALUES(summary),release_channel=VALUES(release_channel),migration_name=VALUES(migration_name);

INSERT INTO application_release_changes (release_id,change_type,description,sort_order)
SELECT id,'FEATURE','Ticket System me katër faza: Në pritje, Duke u përpunuar, Në pritje të klientit dhe Përfunduar/Mbyllur.',10 FROM application_releases WHERE version='0.14.0'
ON DUPLICATE KEY UPDATE change_type=VALUES(change_type),description=VALUES(description);
INSERT INTO application_release_changes (release_id,change_type,description,sort_order)
SELECT id,'FEATURE','Klienti sheh vetëm ticket-at e vet në Client Portal dhe mund të krijojë ticket të ri.',20 FROM application_releases WHERE version='0.14.0'
ON DUPLICATE KEY UPDATE change_type=VALUES(change_type),description=VALUES(description);
INSERT INTO application_release_changes (release_id,change_type,description,sort_order)
SELECT id,'FEATURE','Notes krijojnë komunikim dypalësh mes SIRA Solutions dhe klientit brenda ticket-it.',30 FROM application_releases WHERE version='0.14.0'
ON DUPLICATE KEY UPDATE change_type=VALUES(change_type),description=VALUES(description);
INSERT INTO application_release_changes (release_id,change_type,description,sort_order)
SELECT id,'IMPROVEMENT','Prano ticket-in e kalon automatikisht nga New në Duke u përpunuar; mbyllja kërkon Resolution Notes.',40 FROM application_releases WHERE version='0.14.0'
ON DUPLICATE KEY UPDATE change_type=VALUES(change_type),description=VALUES(description);
INSERT INTO application_release_changes (release_id,change_type,description,sort_order)
SELECT id,'IMPROVEMENT','Dashboard-i shfaq automatikisht numrin real të ticket-ave sipas statusit.',50 FROM application_releases WHERE version='0.14.0'
ON DUPLICATE KEY UPDATE change_type=VALUES(change_type),description=VALUES(description);
