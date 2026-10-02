const CHAVE = 'nassautickets.sessao';

export const sessao = {
  ler() {
    try {
      return JSON.parse(localStorage.getItem(CHAVE));
    } catch {
      return null;
    }
  },
  salvar: (dados) => localStorage.setItem(CHAVE, JSON.stringify(dados)),
  limpar: () => localStorage.removeItem(CHAVE),
};

async function chamar(caminho, corpo) {
  const atual = sessao.ler();
  let resposta;
  try {
    resposta = await fetch(`/api${caminho}`, {
      method: corpo ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(atual && { Authorization: `Bearer ${atual.token}` }),
      },
      body: corpo && JSON.stringify(corpo),
    });
  } catch {
    throw new Error('Sistema indisponível. Tente novamente em instantes.');
  }
  const dados = await resposta.json().catch(() => null);
  if (resposta.status === 401 && atual) {
    sessao.limpar(); // token expirado
    window.location.assign('/login');
  }
  if (!resposta.ok) throw new Error(dados?.erro ?? 'Erro inesperado');
  return dados;
}

export const api = {
  emitirSenha: (tipo) => chamar('/senhas', { tipo }),
  painel: () => chamar('/painel'),
  login: (login, senha) => chamar('/login', { login, senha }),
  atual: () => chamar('/atendimento/atual'),
  chamarProxima: (guiche) => chamar('/atendimento/chamar', { guiche }),
  acaoSenha: (id, acao) => chamar(`/senhas/${id}/${acao}`, {}),
  relatorio: (periodo, valor) => chamar(`/relatorios/${periodo}?valor=${valor}`),
  cadastrarAtendente: (dados) => chamar('/usuarios', dados),
};
