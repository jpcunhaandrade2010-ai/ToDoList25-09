CREATE DATABASE IF NOT EXISTS agenda;
USE agenda;

CREATE TABLE usuario (
    usuario_id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE categoria (
    categoria_id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    nome VARCHAR(50) NOT NULL,

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_user_cat
        UNIQUE (usuario_id, nome),

    CONSTRAINT uq_categoria_usuario
        UNIQUE (categoria_id, usuario_id),

    FOREIGN KEY (usuario_id)
        REFERENCES usuario(usuario_id)
        ON DELETE CASCADE
);

CREATE TABLE tarefa (
    tarefa_id INT AUTO_INCREMENT PRIMARY KEY,

    usuario_id INT NOT NULL,
    categoria_id INT NULL,

    titulo VARCHAR(255) NOT NULL,
    descricao TEXT NULL,

    concluida BOOLEAN NOT NULL DEFAULT FALSE,

    prioridade ENUM('baixa', 'media', 'alta')
        DEFAULT 'media',

    prazo DATETIME NULL,

    concluida_em TIMESTAMP NULL,

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT chk_prazo
        CHECK (prazo IS NULL OR prazo >= criado_em),

    CONSTRAINT chk_conclusao
        CHECK (
            (concluida = FALSE AND concluida_em IS NULL)
            OR
            (concluida = TRUE AND concluida_em IS NOT NULL)
        ),

    FOREIGN KEY (usuario_id)
        REFERENCES usuario(usuario_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_tarefa_categoria_usuario
        FOREIGN KEY (categoria_id, usuario_id)
        REFERENCES categoria(categoria_id, usuario_id)
        ON DELETE SET NULL
);

CREATE TABLE subtarefa (
    subtarefa_id INT AUTO_INCREMENT PRIMARY KEY,

    tarefa_id INT NOT NULL,

    titulo VARCHAR(255) NOT NULL,

    concluida BOOLEAN NOT NULL DEFAULT FALSE,

    ordem INT NOT NULL DEFAULT 0,

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (tarefa_id)
        REFERENCES tarefa(tarefa_id)
        ON DELETE CASCADE
);

CREATE TABLE logs (
    logs_id INT AUTO_INCREMENT PRIMARY KEY,

    usuario_id INT NOT NULL,

    tarefa_id INT NULL,
    categoria_id INT NULL,

    acao VARCHAR(100) NOT NULL,

    descricao VARCHAR(255) NULL,

    data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id)
        REFERENCES usuario(usuario_id)
        ON DELETE CASCADE,

    FOREIGN KEY (tarefa_id)
        REFERENCES tarefa(tarefa_id)
        ON DELETE SET NULL,

    FOREIGN KEY (categoria_id)
        REFERENCES categoria(categoria_id)
        ON DELETE SET NULL
);

CREATE TABLE tag (
    tag_id INT AUTO_INCREMENT PRIMARY KEY,

    usuario_id INT NOT NULL,

    nome VARCHAR(50) NOT NULL,

    cor VARCHAR(7) DEFAULT '#808080',

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_tag_usuario
        UNIQUE (usuario_id, nome),

    CONSTRAINT uq_tag_usuario_id
        UNIQUE (tag_id, usuario_id),

    FOREIGN KEY (usuario_id)
        REFERENCES usuario(usuario_id)
        ON DELETE CASCADE
);

CREATE TABLE tarefa_tag (
    tarefa_id INT NOT NULL,
    tag_id INT NOT NULL,
    usuario_id INT NOT NULL,

    PRIMARY KEY (tarefa_id, tag_id),

    FOREIGN KEY (tarefa_id, usuario_id)
        REFERENCES tarefa(tarefa_id, usuario_id)
        ON DELETE CASCADE,

    FOREIGN KEY (tag_id, usuario_id)
        REFERENCES tag(tag_id, usuario_id)
        ON DELETE CASCADE
);

CREATE TABLE recuperacao_senha (
    recuperacao_id INT AUTO_INCREMENT PRIMARY KEY,

    usuario_id INT NOT NULL,

    token_hash VARCHAR(255) NOT NULL UNIQUE,

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    expira_em DATETIME NOT NULL,

    utilizado BOOLEAN NOT NULL DEFAULT FALSE,

    FOREIGN KEY (usuario_id)
        REFERENCES usuario(usuario_id)
        ON DELETE CASCADE
);

CREATE TABLE recorrencia (
    recorrencia_id INT AUTO_INCREMENT PRIMARY KEY,

    tarefa_id INT NOT NULL UNIQUE,

    tipo ENUM(
        'diaria',
        'semanal',
        'mensal',
        'anual'
    ) NOT NULL,

    intervalo INT NOT NULL DEFAULT 1,

    proxima_execucao DATETIME NOT NULL,

    data_fim DATETIME NULL,

    ativo BOOLEAN NOT NULL DEFAULT TRUE,

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_intervalo
        CHECK (intervalo > 0),

    CONSTRAINT chk_data_recorrencia
        CHECK (
            data_fim IS NULL
            OR data_fim >= proxima_execucao
        ),

    FOREIGN KEY (tarefa_id)
        REFERENCES tarefa(tarefa_id)
        ON DELETE CASCADE
);

CREATE INDEX idx_tarefa_usuario
ON tarefa(usuario_id);

CREATE INDEX idx_tarefa_concluida
ON tarefa(usuario_id, concluida);

CREATE INDEX idx_tarefa_prazo
ON tarefa(usuario_id, prazo);

CREATE INDEX idx_tarefa_prioridade
ON tarefa(usuario_id, prioridade);

CREATE INDEX idx_subtarefa_tarefa
ON subtarefa(tarefa_id, ordem);

CREATE INDEX idx_logs_usuario_data
ON logs(usuario_id, data_hora);

CREATE INDEX idx_recuperacao_token
ON recuperacao_senha(token_hash, expira_em);

CREATE INDEX idx_recorrencia_execucao
ON recorrencia(ativo, proxima_execucao);


DELIMITER $$

CREATE PROCEDURE concluir_tarefa (
    IN p_tarefa_id INT,
    IN p_usuario_id INT
)
BEGIN

    DECLARE qtd_tarefa INT DEFAULT 0;
    DECLARE qtd_subtarefas INT DEFAULT 0;
    DECLARE v_concluida BOOLEAN DEFAULT FALSE;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    SELECT COUNT(*)
    INTO qtd_tarefa
    FROM tarefa
    WHERE tarefa_id = p_tarefa_id
      AND usuario_id = p_usuario_id
    FOR UPDATE;

    IF qtd_tarefa = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
            'Acesso negado ou tarefa inexistente';
    END IF;

    SELECT concluida
    INTO v_concluida
    FROM tarefa
    WHERE tarefa_id = p_tarefa_id
      AND usuario_id = p_usuario_id;

    IF v_concluida = TRUE THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
            'Esta tarefa ja esta concluida';
    END IF;

    SELECT COUNT(*)
    INTO qtd_subtarefas
    FROM subtarefa
    WHERE tarefa_id = p_tarefa_id
      AND concluida = FALSE;

    IF qtd_subtarefas > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
            'Existem subtarefas pendentes';
    END IF;

    UPDATE tarefa
    SET concluida = TRUE,
        concluida_em = CURRENT_TIMESTAMP
    WHERE tarefa_id = p_tarefa_id
      AND usuario_id = p_usuario_id;

    INSERT INTO logs (
        usuario_id,
        tarefa_id,
        acao,
        descricao
    )
    VALUES (
        p_usuario_id,
        p_tarefa_id,
        'CONCLUSAO',
        'Tarefa concluida com sucesso'
    );

    COMMIT;

END$$

DELIMITER ;
