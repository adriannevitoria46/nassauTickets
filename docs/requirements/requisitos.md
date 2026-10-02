# Requisitos — nassauTickets

Base: documento "Sistema para controle de atendimento" (v06) e a atividade do projeto.

## 1. Agentes

| Sigla | Agente | Papel |
|-------|--------|-------|
| AS | Agente Sistema | Executa as regras, acessa o banco, emite senhas, atualiza o painel |
| AA | Agente Atendente | Chama o próximo, inicia e finaliza o atendimento no guichê |
| AC | Agente Cliente | Emite a senha no totem (anônimo) e aguarda no painel |

Perfis de login: **ATENDENTE** e **GESTOR** (atendente com cadastros e relatórios).

## 2. Requisitos funcionais

| ID | Requisito |
|----|-----------|
| RF01 | O totem permite ao AC emitir uma senha SP, SG ou SE, sem identificação. |
| RF02 | O sistema numera a senha no padrão `YYMMDD-PPSQ` (ex.: `261002-SP001`). |
| RF03 | A sequência `SQ` é independente por tipo e reinicia todo dia. |
| RF04 | O AA autentica-se com login e senha. |
| RF05 | O AA informa o guichê e aciona "Chamar próxima"; o sistema escolhe a senha pelas regras de prioridade (RN03–RN06). |
| RF06 | O AA pode "Chamar novamente" a senha chamada, uma única vez, que passa a exibir "Última chamada". |
| RF07 | O AA inicia o atendimento quando o AC comparece ao guichê. |
| RF08 | O AA finaliza o atendimento em andamento. |
| RF09 | Após a segunda chamada sem comparecimento, o AA registra "Não compareceu" e o sistema libera o AA para a próxima senha. |
| RF10 | O painel exibe as 5 últimas senhas chamadas, com o guichê, e nunca exibe a próxima senha. |
| RF11 | O painel atualiza-se automaticamente, sem ação do AC. |
| RF12 | Ao final do expediente, as senhas que continuam na fila são descartadas. |
| RF13 | O gestor cadastra novos atendentes. |
| RF14 | O gestor consulta o relatório diário e o mensal com: total de senhas emitidas e atendidas; emitidas e atendidas por prioridade; relatório detalhado; tempo médio de atendimento (TM); auditoria. |
| RF15 | O relatório detalhado traz número, tipo, data/hora de emissão, data/hora de atendimento e guichê; para senhas não atendidas, os campos de atendimento ficam em branco. |
| RF16 | O relatório de auditoria traz atendente, guichê, senha, horário da 1ª chamada, da 2ª chamada (se houver), do início e da finalização. |

## 3. Regras de negócio

| ID | Regra |
|----|-------|
| RN01 | Tipos de senha: SP (prioritária), SG (geral) e SE (retirada de exames). |
| RN02 | Qualquer guichê atende qualquer tipo de senha. |
| RN03 | O ciclo de chamada é `[SP] → [SE\|SG] → [SP] → [SE\|SG]`: cada nova chamada tem tipo diferente de SP em relação à anterior quando houver fila. |
| RN04 | Logo após uma SP, a SE (quando houver) é chamada antes da SG. Nas demais chamadas, sem SP na fila, SE e SG se alternam para que nenhuma fique sem atendimento. |
| RN05 | Se a fila do tipo da vez estiver vazia, o sistema segue a ordem de prioridade (SP > SE > SG) entre as filas não vazias. |
| RN06 | Dentro de cada tipo, a fila é FIFO (ordem de emissão). |
| RN07 | O expediente vai das 07h às 17h. Fora dele não se emitem nem se chamam senhas. |
| RN08 | Atendimentos já iniciados no fim do expediente são concluídos pelo AA. |
| RN09 | Senhas que sobrarem na fila ao fim do expediente são descartadas (estado `DESCARTADA`). |
| RN10 | A senha chamada duas vezes sem comparecimento é considerada abandonada (`NAO_COMPARECEU`). |
| RN11 | Historicamente cerca de 5% das senhas emitidas não são atendidas por responsabilidade do AC; o relatório exibe esse percentual para acompanhamento. |
| RN12 | Cada AA só pode ter uma senha em andamento (chamada ou em atendimento) por vez. |
| RN13 | Somente o AA que chamou a senha pode iniciá-la, finalizá-la ou registrar ausência. |
| RN14 | Tempo médio de atendimento = média de `fim − início` das senhas ATENDIDAS, por tipo e geral. |
| RN15 | Tempos de referência do atendimento (para análise, não impostos pelo sistema): SP 15 ± 5 min; SG 5 ± 3 min; SE 1 min em 95% dos casos e 5 min em 5%. |

## 4. Máquina de estados da senha

```
EMITIDA → AGUARDANDO → CHAMADA → CHAMADA_NOVAMENTE → EM_ATENDIMENTO → ATENDIDA
                          │              │
                          │              └──────────→ NAO_COMPARECEU
                          └─ (iniciar sem 2ª chamada) → EM_ATENDIMENTO
AGUARDANDO → DESCARTADA (fim do expediente)
```

A transição direta `CHAMADA → EM_ATENDIMENTO` vale quando o cliente comparece já na primeira chamada. `NAO_COMPARECEU` só é permitido a partir de `CHAMADA_NOVAMENTE`. `DESCARTADA` é um estado adicional (RN09), fora da lista de sete estados do documento-base.

## 5. Requisitos não funcionais

| ID | Categoria | Requisito |
|----|-----------|-----------|
| RNF01 | Segurança | Senhas dos usuários armazenadas com hash `bcrypt`; nunca em texto claro. |
| RNF02 | Segurança | Rotas do atendente e do gestor exigem token JWT; relatórios e cadastros exigem perfil GESTOR. |
| RNF03 | Segurança | Todas as consultas SQL usam parâmetros (sem concatenação), prevenindo injeção de SQL. |
| RNF04 | Segurança | O segredo do JWT e as credenciais do banco ficam em variáveis de ambiente, fora do repositório. |
| RNF05 | Concorrência | Chamadas simultâneas de "próxima senha" são serializadas por transação com bloqueio de linha (`SELECT ... FOR UPDATE`), de modo que cada senha vai para um único AA/guichê. |
| RNF06 | Concorrência | Transições de estado são atômicas (`UPDATE ... WHERE estado = <esperado>`), impedindo dupla ação sobre a mesma senha. |
| RNF07 | Auditoria | Cada senha guarda atendente, guichê e os horários de 1ª/2ª chamada, início e fim; o relatório de auditoria é derivado desses dados. |
| RNF08 | Desempenho | Emitir senha e chamar próxima respondem em menos de 1 s com até 1.000 senhas/dia; índices em `(dia, estado, tipo)`. |
| RNF09 | Disponibilidade | O painel repete a consulta a cada 3 s e, se o backend não responder, mantém a última lista exibida e indica "Sistema indisponível". |
| RNF10 | LGPD | O AC é anônimo: nenhum dado pessoal do cliente é coletado. Só há dados de login dos atendentes (nome, login), com finalidade de autenticação e auditoria. |
| RNF11 | Acessibilidade | Interface com HTML semântico, rótulos nos campos, foco visível, contraste adequado e botões grandes no totem (WCAG 2.1 AA como referência; Lei Brasileira de Inclusão, Lei 13.146/2015). |
| RNF12 | Portabilidade | Backend Node.js 22 + Express; banco compatível com MySQL 8.0; frontend React 19. |
| RNF13 | Manutenibilidade | Frontend separado em páginas, componentes e serviços; backend separado em rotas, regras e acesso a dados. |

## 6. Fora do escopo desta entrega

Áudio nas chamadas, recuperação de desastres além do comportamento do painel (RNF09), aplicativos mobile e simulação automática dos tempos de atendimento (RN15).
