CREATE TABLE IF NOT EXISTS platform_capabilities (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(120) NOT NULL UNIQUE,
  kind ENUM('core','module','addon','integration','automation','platform') NOT NULL,
  current_version VARCHAR(30) NOT NULL,
  default_status ENUM('enabled','disabled','hidden','coming_soon','maintenance') NOT NULL,
  dependencies JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS organization_capabilities (
  organization_id BIGINT UNSIGNED NOT NULL,
  capability_id BIGINT UNSIGNED NOT NULL,
  status ENUM('enabled','disabled','hidden','coming_soon','maintenance') NOT NULL,
  configuration JSON NULL,
  enabled_at DATETIME NULL,
  disabled_at DATETIME NULL,
  PRIMARY KEY (organization_id, capability_id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (capability_id) REFERENCES platform_capabilities(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS connected_platforms (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  organization_id BIGINT UNSIGNED NOT NULL,
  code VARCHAR(120) NOT NULL,
  name VARCHAR(180) NOT NULL,
  platform_type VARCHAR(100) NOT NULL,
  base_url VARCHAR(255) NOT NULL,
  environment ENUM('development','staging','production') NOT NULL,
  current_version VARCHAR(30) NULL,
  status ENUM('online','degraded','maintenance','offline','unknown') DEFAULT 'unknown',
  repository_url VARCHAR(255) NULL,
  active_branch VARCHAR(100) NULL,
  last_seen_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_connected_platform (organization_id, code),
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS background_jobs (
  id CHAR(36) PRIMARY KEY,
  organization_id BIGINT UNSIGNED NOT NULL,
  job_type VARCHAR(120) NOT NULL,
  payload JSON NOT NULL,
  status ENUM('pending','processing','completed','failed','retrying','cancelled') NOT NULL,
  attempts INT UNSIGNED NOT NULL DEFAULT 0,
  max_attempts INT UNSIGNED NOT NULL DEFAULT 3,
  scheduled_at DATETIME NULL,
  started_at DATETIME NULL,
  completed_at DATETIME NULL,
  error_message TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_jobs_status (status, scheduled_at),
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS stored_files (
  id CHAR(36) PRIMARY KEY,
  organization_id BIGINT UNSIGNED NOT NULL,
  storage_provider VARCHAR(80) NOT NULL,
  storage_key VARCHAR(500) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  content_type VARCHAR(120) NOT NULL,
  file_size BIGINT UNSIGNED NOT NULL,
  checksum VARCHAR(128) NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_files_org (organization_id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS notifications (
  id CHAR(36) PRIMARY KEY,
  organization_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NULL,
  channel ENUM('in_app','email','push','desktop','mobile','sms','webhook') NOT NULL,
  title VARCHAR(190) NOT NULL,
  message TEXT NOT NULL,
  status ENUM('pending','sent','failed','read') NOT NULL DEFAULT 'pending',
  data JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sent_at DATETIME NULL,
  read_at DATETIME NULL,
  INDEX idx_notifications_user (organization_id, user_id, status),
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
