-- SIRA App v0.13.0
-- Dashboard refresh, expanded Products & Services, and Contracts & Subscriptions.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS category VARCHAR(100) NOT NULL DEFAULT 'Tjetër' AFTER name,
  ADD COLUMN IF NOT EXISTS elements_json TEXT NULL AFTER description,
  ADD COLUMN IF NOT EXISTS includes_json TEXT NULL AFTER elements_json,
  ADD COLUMN IF NOT EXISTS billing_cycle ENUM('ONE_TIME','MONTHLY','YEARLY') NOT NULL DEFAULT 'ONE_TIME' AFTER vat_rate,
  ADD COLUMN IF NOT EXISTS unit_label VARCHAR(60) NOT NULL DEFAULT 'Një herë' AFTER billing_cycle;

CREATE TABLE IF NOT EXISTS contracts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  organization_id BIGINT UNSIGNED NOT NULL,
  owner_type ENUM('CLIENT','COMPANY') NOT NULL DEFAULT 'CLIENT',
  client_id BIGINT UNSIGNED NULL,
  product_id BIGINT UNSIGNED NULL,
  title VARCHAR(190) NOT NULL,
  category VARCHAR(120) NOT NULL,
  provider VARCHAR(190) NULL,
  reference_code VARCHAR(255) NULL,
  start_date DATE NOT NULL,
  end_date DATE NULL,
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  billing_cycle ENUM('MONTHLY','QUARTERLY','YEARLY','ONE_TIME') NOT NULL DEFAULT 'YEARLY',
  reminder_days INT UNSIGNED NOT NULL DEFAULT 30,
  cancellation_notice_days INT UNSIGNED NOT NULL DEFAULT 30,
  auto_renew BOOLEAN NOT NULL DEFAULT FALSE,
  status ENUM('ACTIVE','INACTIVE','CANCELLED') NOT NULL DEFAULT 'ACTIVE',
  description TEXT NULL,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_contracts_org_status (organization_id, status),
  INDEX idx_contracts_client (organization_id, client_id),
  INDEX idx_contracts_end_date (organization_id, end_date),
  CONSTRAINT fk_contracts_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT fk_contracts_client FOREIGN KEY (client_id) REFERENCES clients(id),
  CONSTRAINT fk_contracts_product FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO application_releases (version, title, summary, release_channel, migration_name)
VALUES (
  '0.13.0',
  'Dashboard, Produktet dhe Kontratat',
  'Rifreskon Dashboard-in, zgjeron Produktet & Shërbimet dhe aktivizon modulin Kontratat & Abonimet me afate dhe kujtesa.',
  'development',
  '025_business_dashboard_products_contracts.sql'
)
ON DUPLICATE KEY UPDATE
  title = VALUES(title), summary = VALUES(summary),
  release_channel = VALUES(release_channel), migration_name = VALUES(migration_name);

SET @release_id = (SELECT id FROM application_releases WHERE version = '0.13.0' LIMIT 1);
DELETE FROM application_release_changes WHERE release_id = @release_id;
INSERT INTO application_release_changes (release_id, change_type, description, sort_order) VALUES
  (@release_id, 'IMPROVEMENT', 'Dashboard-i u ridizajnua në formë më clean dhe compact me projekte, detyra, faturim dhe kontrata.', 10),
  (@release_id, 'FEATURE', 'U aktivizua moduli Kontratat & Abonimet me klient, furnitor, afat, çmim, cikël dhe rinovim automatik.', 20),
  (@release_id, 'FEATURE', 'Kontratat që afrohen te skadimi shfaqen automatikisht në Dashboard.', 30),
  (@release_id, 'IMPROVEMENT', 'Produktet & Shërbimet tani kanë kategori, elemente, përmbajtje, cikël dhe njësi.', 40),
  (@release_id, 'IMPROVEMENT', 'Release Notes u bënë më compact por me font më të lexueshëm.', 50),
  (@release_id, 'DATABASE', 'U shtua tabela contracts dhe kolonat e reja të katalogut products.', 60);
