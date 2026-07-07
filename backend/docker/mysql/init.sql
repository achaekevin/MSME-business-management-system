-- MySQL initialization script
-- Runs once on first container start

SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE DATABASE IF NOT EXISTS msme_bms
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS msme_bms_test
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

GRANT ALL PRIVILEGES ON msme_bms.* TO 'msme_user'@'%';
GRANT ALL PRIVILEGES ON msme_bms_test.* TO 'msme_user'@'%';
FLUSH PRIVILEGES;
