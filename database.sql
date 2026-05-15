CREATE DATABASE IF NOT EXISTS analise_performance
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Se o usuario root do MySQL/MariaDB usar autenticacao do Windows/GSSAPI,
-- crie um usuario proprio para o sistema e configure o .env com esses dados.
-- Ajuste a senha antes de executar em producao:

CREATE USER IF NOT EXISTS 'analise_app'@'%' IDENTIFIED BY 'troque_esta_senha';
GRANT ALL PRIVILEGES ON analise_performance.* TO 'analise_app'@'%';
FLUSH PRIVILEGES;

USE analise_performance;

CREATE TABLE IF NOT EXISTS app_storage (
  storage_key VARCHAR(80) NOT NULL PRIMARY KEY,
  payload LONGTEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CHECK (JSON_VALID(payload))
);
