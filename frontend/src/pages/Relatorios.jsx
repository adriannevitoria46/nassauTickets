import { useState } from 'react';
import Aviso from '../components/Aviso.jsx';
import Cabecalho from '../components/Cabecalho.jsx';
import Tabela from '../components/Tabela.jsx';
import { api } from '../services/api.js';

const hoje = () => new Date().toLocaleDateString('sv'); // AAAA-MM-DD
const minutos = (s) => (s === null ? '—' : `${Math.floor(s / 60)}min ${s % 60}s`);

const COLUNAS_TIPO = [
  { titulo: 'Tipo', campo: 'tipo' },
  { titulo: 'Emitidas', campo: 'emitidas' },
  { titulo: 'Atendidas', campo: 'atendidas' },
  { titulo: 'Não compareceu', campo: 'naoCompareceu' },
  { titulo: 'Descartadas', campo: 'descartadas' },
  { titulo: 'Tempo médio', campo: 'tmSegundos', formatar: minutos },
];
const COLUNAS_DETALHE = [
  { titulo: 'Senha', campo: 'codigo' },
  { titulo: 'Tipo', campo: 'tipo' },
  { titulo: 'Situação', campo: 'estado' },
  { titulo: 'Emissão', campo: 'emitidaEm' },
  { titulo: 'Atendimento', campo: 'atendidaEm' },
  { titulo: 'Guichê', campo: 'guiche' },
];
const COLUNAS_AUDITORIA = [
  { titulo: 'Atendente', campo: 'atendente' },
  { titulo: 'Guichê', campo: 'guiche' },
  { titulo: 'Senha', campo: 'codigo' },
  { titulo: '1ª chamada', campo: 'primeiraChamada' },
  { titulo: '2ª chamada', campo: 'segundaChamada' },
  { titulo: 'Início', campo: 'inicio' },
  { titulo: 'Fim', campo: 'fim' },
];

export default function Relatorios() {
  const [periodo, setPeriodo] = useState('diario');
  const [valor, setValor] = useState(hoje());
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState('');

  const [novo, setNovo] = useState({ nome: '', login: '', senha: '' });
  const [cadastro, setCadastro] = useState('');

  function trocarPeriodo(p) {
    setPeriodo(p);
    setValor(p === 'mensal' ? hoje().slice(0, 7) : hoje());
  }

  async function consultar(e) {
    e.preventDefault();
    setErro('');
    try {
      setDados(await api.relatorio(periodo, valor));
    } catch (err) {
      setErro(err.message);
    }
  }

  async function cadastrar(e) {
    e.preventDefault();
    setCadastro('');
    try {
      const criado = await api.cadastrarAtendente(novo);
      setCadastro(`Atendente "${criado.nome}" cadastrado.`);
      setNovo({ nome: '', login: '', senha: '' });
    } catch (err) {
      setCadastro(err.message);
    }
  }

  const campo = (nome) => ({ value: novo[nome], onChange: (e) => setNovo({ ...novo, [nome]: e.target.value }) });

  return (
    <>
      <Cabecalho />
      <main className="pagina">
        <h1>Relatórios</h1>
        <form className="linha" onSubmit={consultar}>
          <label>
            Período
            <select value={periodo} onChange={(e) => trocarPeriodo(e.target.value)}>
              <option value="diario">Diário</option>
              <option value="mensal">Mensal</option>
            </select>
          </label>
          <label>
            {periodo === 'mensal' ? 'Mês' : 'Data'}
            <input type={periodo === 'mensal' ? 'month' : 'date'} value={valor} onChange={(e) => setValor(e.target.value)} required />
          </label>
          <button type="submit">Consultar</button>
        </form>
        <Aviso texto={erro} />

        {dados && (
          <>
            <ul className="resumo">
              <li><strong>{dados.resumo.emitidas}</strong> emitidas</li>
              <li><strong>{dados.resumo.atendidas}</strong> atendidas</li>
              <li><strong>{dados.resumo.naoCompareceu}</strong> não compareceram</li>
              <li><strong>{dados.resumo.percentualNaoAtendidas}%</strong> não atendidas (referência: 5%)</li>
              <li><strong>{minutos(dados.resumo.tmSegundos)}</strong> tempo médio</li>
            </ul>
            <Tabela titulo="Por prioridade" colunas={COLUNAS_TIPO} linhas={dados.porTipo} />
            <Tabela titulo="Detalhado" colunas={COLUNAS_DETALHE} linhas={dados.detalhado} />
            <Tabela titulo="Auditoria" colunas={COLUNAS_AUDITORIA} linhas={dados.auditoria} />
          </>
        )}

        <h2>Cadastrar atendente</h2>
        <form className="linha" onSubmit={cadastrar}>
          <label>Nome <input {...campo('nome')} required /></label>
          <label>Login <input {...campo('login')} required /></label>
          <label>Senha (mín. 6) <input type="password" minLength={6} {...campo('senha')} required /></label>
          <button type="submit">Cadastrar</button>
        </form>
        <p role="status">{cadastro}</p>
      </main>
    </>
  );
}
