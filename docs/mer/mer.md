# MER — nassauTickets

Script físico: [`backend/db/schema.sql`](../../backend/db/schema.sql)

```mermaid
erDiagram
    USUARIOS ||--o{ SENHAS : "atende"
    USUARIOS {
        int id PK
        varchar nome
        varchar login UK
        varchar senha_hash
        enum perfil "ATENDENTE | GESTOR"
    }
    SENHAS {
        int id PK
        varchar codigo UK "YYMMDD-PPSQ"
        date dia
        enum tipo "SP | SG | SE"
        int sequencia
        enum estado
        datetime emitida_em
        datetime chamada1_em
        datetime chamada2_em
        datetime inicio_em
        datetime fim_em
        tinyint guiche
        int atendente_id FK
    }
    SEQUENCIAS {
        date dia PK
        enum tipo PK
        int ultimo
    }
    TRAVA_FILA {
        tinyint id PK
    }
```

- `SENHAS.atendente_id` é nulo até a senha ser chamada.
- `SEQUENCIAS` gera o `SQ` por dia e tipo (reinício diário).
- `TRAVA_FILA` tem uma única linha, bloqueada (`FOR UPDATE`) a cada "chamar próxima" para serializar chamadas concorrentes (RNF05).
- O cliente é anônimo: não existe tabela de clientes (LGPD, RNF10).
