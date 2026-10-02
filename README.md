# nassauTickets

Sistema de controle de atendimento (emissão, fila, chamada e atendimento de senhas) para um Laboratório de Análises Clínicas.

## Membros

| Nome | Matrícula | Papel |
|------|-----------|-------|
| Adrianne Vitória Araújo de Lima | 01888546 | Scrum Master |
| Dimitrys Belarmino de Souza | 01357199 | Desenvolvedor |
| Carlos Eduardo de Vasconcelos Luis | 01904246 | Testador |
| Maria Eduarda Oliveira de Souza | 01889250 | Documentador |
| Gabrielle Sophia Félix Nunes de Souza | 01888389 | Documentador |
| Júlia Coimbra Ricca | 01881648 | Testador |

## Descrição e objetivo

O nassauTickets controla o fluxo de atendimento de um laboratório: o cliente retira uma senha no **totem**, acompanha a chamada no **painel** e o **atendente** chama, inicia e finaliza o atendimento no guichê. O gestor acompanha tudo por relatórios (diário e mensal) e auditoria.

Objetivo: aplicar desenvolvimento Web com React, API REST, banco relacional, documentação e versionamento com Git/GitHub, a partir da especificação "Sistema para controle de atendimento".

Funcionalidades:

- Três tipos de senha: **SP** (prioritária), **SG** (geral) e **SE** (retirada de exames), numeradas como `YYMMDD-PPSQ` (ex.: `261002-SP001`), com sequência reiniciada por dia.
- Ciclo de chamada `[SP] → [SE|SG] → [SP] → [SE|SG]`, qualquer guichê atende qualquer tipo.
- Máquina de estados: `EMITIDA → AGUARDANDO → CHAMADA → CHAMADA_NOVAMENTE → EM_ATENDIMENTO → ATENDIDA`, além de `NAO_COMPARECEU` e `DESCARTADA`.
- Painel com as 5 últimas senhas chamadas e indicação de "Última chamada".
- Expediente das 07h às 17h; senhas que sobram na fila são descartadas.
- Login de atendente; perfil gestor com relatórios e cadastro de atendentes.
- Tratamento de concorrência na chamada da próxima senha.

Fora do escopo desta entrega: áudio nas chamadas, simulação automática dos tempos de atendimento, recuperação de desastres além do aviso no painel e aplicativos mobile.

## Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 19, React Router, Vite |
| Backend | Node.js 22 (LTS) + Express 5, JWT, bcryptjs |
| Banco | MySQL 8.0 (script compatível também com MariaDB 10.4+) |

**Por que Node.js + Express no backend:** é uma das opções homologadas pelo laboratório e usa a mesma linguagem do frontend (JavaScript), o que reduz o custo de aprendizado do grupo, permite compartilhar convenções e mantém uma API enxuta, sem configuração pesada. O driver `mysql2` oferece transações e bloqueio de linha, essenciais para a concorrência na fila.

## Arquitetura

```
 Totem (/)         Painel (/painel)      Atendente (/atendente)   Gestor (/relatorios)
      \                  |                        |                      /
       +-------- Frontend React (Vite, porta 5173) ---------------------+
                              |  /api (proxy do Vite)
                    Backend Express (porta 3000)
              rotas -> regras (senhas, prioridade) -> MySQL
```

```
nassauTickets/
├── backend/
│   ├── db/            schema.sql e init.js (cria banco e usuários iniciais)
│   └── src/           app.js (rotas), senhas.js (fila e estados), prioridade.js,
│                      auth.js, relatorios.js, db.js
├── docs/
│   ├── branding/
│   ├── mer/           modelo entidade-relacionamento
│   ├── mockups/       protótipos das telas
│   ├── models/uml/    casos de uso, estados, sequência e classes
│   └── requirements/  requisitos funcionais/não funcionais e regras de negócio
├── frontend/
│   └── src/           pages/, components/, services/ (api.js), assets/
├── .gitignore
├── LICENSE
└── README.md
```

Documentação completa em [`docs/`](docs/): [requisitos](docs/requirements/requisitos.md), [MER](docs/mer/mer.md), [UML](docs/models/uml/diagramas.md) e [mockups](docs/mockups/telas.md).

## Instalação

Pré-requisitos: Node.js 22+, npm e um servidor MySQL 8.0 (ou MariaDB 10.4+) em execução.

```bash
# backend
cd backend
npm install
cp .env.example .env      # ajuste DB_USER / DB_PASSWORD e JWT_SECRET
npm run db:init           # cria o banco, as tabelas e os usuários iniciais

# frontend
cd ../frontend
npm install
```

## Configuração

Variáveis do `backend/.env` (modelo em `backend/.env.example`):

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `PORT` | Porta da API | `3000` |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Conexão com o banco | `localhost`, `3306`, `root`, vazio, `nassautickets` |
| `JWT_SECRET` | Segredo de assinatura do token (obrigatório; use um valor forte em produção) | — |
| `EXPEDIENTE_INICIO` / `EXPEDIENTE_FIM` | Horário de funcionamento (horas) | `7` / `17` |

> Para testar fora do horário comercial, use `EXPEDIENTE_INICIO=0` e `EXPEDIENTE_FIM=24`.

Usuários criados por `npm run db:init` (**apenas desenvolvimento — troque as senhas**):

| Login | Senha | Perfil |
|-------|-------|--------|
| `gestor` | `gestor123` | Gestor |
| `atendente1` | `atendente123` | Atendente |

## Execução

Em dois terminais:

```bash
cd backend && npm run dev        # API em http://localhost:3000
cd frontend && npm run dev       # app em http://localhost:5173
```

| Tela | Endereço | Quem usa |
|------|----------|----------|
| Totem | `/` | Cliente (anônimo) |
| Painel | `/painel` | Sala de espera |
| Login | `/login` | Atendente e gestor |
| Atendimento | `/atendente` | Atendente |
| Relatórios e cadastros | `/relatorios` | Gestor |

Testes do backend (regra de prioridade): `cd backend && npm test`.

## API (resumo)

| Método e rota | Acesso | Função |
|---------------|--------|--------|
| `POST /api/senhas` `{tipo}` | público | Emite senha |
| `GET /api/painel` | público | 5 últimas chamadas |
| `POST /api/login` | público | Autentica |
| `POST /api/atendimento/chamar` `{guiche}` | atendente | Chama a próxima senha |
| `GET /api/atendimento/atual` | atendente | Senha em andamento |
| `POST /api/senhas/:id/chamar-novamente`, `iniciar`, `finalizar`, `nao-compareceu` | atendente | Ações sobre a senha |
| `POST /api/usuarios` | gestor | Cadastra atendente |
| `GET /api/relatorios/diario?valor=AAAA-MM-DD` · `/mensal?valor=AAAA-MM` | gestor | Relatórios e auditoria |

## Branches

- `main`: versão estável, recebe apenas merges da `dev`.
- `dev`: desenvolvimento; todo o código entra primeiro aqui.

Commits pequenos e objetivos, no padrão `feat:`, `fix:`, `docs:`, `chore:`.

## Licença

[MIT](LICENSE)
