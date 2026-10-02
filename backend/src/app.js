import express from 'express';
import * as auth from './auth.js';
import { ErroNegocio } from './erros.js';
import { relatorio } from './relatorios.js';
import * as senhas from './senhas.js';

export const app = express();
app.use(express.json());

const api = express.Router();
const atendente = auth.exigir();
const gestor = auth.exigir('GESTOR');

// --- público (totem e painel) ---
api.post('/senhas', async (req, res) => res.status(201).json(await senhas.emitir(req.body.tipo)));
api.get('/painel', async (_req, res) => res.json(await senhas.painel()));
api.post('/login', async (req, res) => res.json(await auth.login(req.body.login, req.body.senha)));

// --- atendente ---
api.get('/atendimento/atual', atendente, async (req, res) =>
  res.json(await senhas.atual(req.usuario.id)));
api.post('/atendimento/chamar', atendente, async (req, res) => {
  const guiche = Number(req.body.guiche);
  if (!Number.isInteger(guiche) || guiche < 1 || guiche > 99) {
    throw new ErroNegocio('Guichê inválido', 400);
  }
  res.json(await senhas.chamarProxima(req.usuario.id, guiche));
});
for (const [rota, acao] of [
  ['chamar-novamente', senhas.chamarNovamente],
  ['iniciar', senhas.iniciar],
  ['finalizar', senhas.finalizar],
  ['nao-compareceu', senhas.naoCompareceu],
]) {
  api.post(`/senhas/:id/${rota}`, atendente, async (req, res) =>
    res.json(await acao(Number(req.params.id), req.usuario.id)));
}

// --- gestor ---
api.post('/usuarios', gestor, async (req, res) =>
  res.status(201).json(await auth.cadastrarAtendente(req.body)));
api.get('/relatorios/:periodo', gestor, async (req, res) =>
  res.json(await relatorio(req.params.periodo, req.query.valor)));

app.use('/api', api);

app.use((erro, _req, res, _next) => {
  if (erro instanceof ErroNegocio) return res.status(erro.status).json({ erro: erro.message });
  if (erro.code === 'ER_DUP_ENTRY') return res.status(409).json({ erro: 'Login já cadastrado' });
  console.error(erro);
  res.status(500).json({ erro: 'Erro interno' });
});
