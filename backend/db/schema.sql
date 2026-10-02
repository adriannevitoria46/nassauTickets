CREATE DATABASE IF NOT EXISTS nassautickets CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE nassautickets;

CREATE TABLE IF NOT EXISTS usuarios (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  nome       VARCHAR(100) NOT NULL,
  login      VARCHAR(50)  NOT NULL UNIQUE,
  senha_hash VARCHAR(100) NOT NULL,
  perfil     ENUM('ATENDENTE','GESTOR') NOT NULL DEFAULT 'ATENDENTE'
);

-- contador diário por tipo (reinício diário da sequência SQ)
CREATE TABLE IF NOT EXISTS sequencias (
  dia    DATE NOT NULL,
  tipo   ENUM('SP','SG','SE') NOT NULL,
  ultimo INT  NOT NULL DEFAULT 0,
  PRIMARY KEY (dia, tipo)
);

-- linha única usada como mutex da fila (concorrência na chamada)
CREATE TABLE IF NOT EXISTS trava_fila (
  id TINYINT PRIMARY KEY
);
INSERT IGNORE INTO trava_fila (id) VALUES (1);

CREATE TABLE IF NOT EXISTS senhas (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  codigo       VARCHAR(12) NOT NULL UNIQUE,          -- YYMMDD-PPSQ
  dia          DATE NOT NULL,
  tipo         ENUM('SP','SG','SE') NOT NULL,
  sequencia    INT NOT NULL,
  estado       ENUM('EMITIDA','AGUARDANDO','CHAMADA','CHAMADA_NOVAMENTE',
                    'EM_ATENDIMENTO','ATENDIDA','NAO_COMPARECEU','DESCARTADA')
               NOT NULL DEFAULT 'EMITIDA',
  emitida_em   DATETIME NOT NULL,
  chamada1_em  DATETIME NULL,
  chamada2_em  DATETIME NULL,
  inicio_em    DATETIME NULL,
  fim_em       DATETIME NULL,
  guiche       TINYINT NULL,
  atendente_id INT NULL,
  FOREIGN KEY (atendente_id) REFERENCES usuarios(id),
  INDEX idx_fila (dia, estado, tipo, sequencia)
);
