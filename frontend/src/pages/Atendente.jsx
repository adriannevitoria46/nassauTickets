import { useEffect, useState } from 'react';
import Aviso from '../components/Aviso.jsx';
import Cabecalho from '../components/Cabecalho.jsx';
import { api } from '../services/api.js';

const ROTULO = {
  CHAMADA: 'Chamada',
  CHAMADA_NOVAMENTE: 'Chamada novamente',
  EM_ATENDIMENTO: 'Em atendimento',
};

export default function Atendente() {
  const [senha, setSenha] = useState(null);
  const [guiche, setGuiche] = useState(1);
  const [erro, setErro] = useState('');

  // recupera a senha em andamento caso a página seja recarregada
  useEffect(() => {
    api.atual().then((s) => {
      setSenha(s);
      if (s) setGuiche(s.guiche);
    }).catch((e) => setErro(e.message));
  }, []);

  async function executar(acao) {
    setErro('');
    try {
      const atualizada = acao === 'chamar'
        ? await api.chamarProxima(guiche)
        : await api.acaoSenha(senha.id, acao);
      const encerrada = ['ATENDIDA', 'NAO_COMPARECEU'].includes(atualizada.estado);
      setSenha(encerrada ? null : atualizada);
    } catch (e) {
      setErro(e.message);
    }
  }

  const estado = senha?.estado;

  return (
    <>
      <Cabecalho />
      <main className="pagina estreita">
        <h1>Atendimento</h1>
        <label>
          Guichê
          <input type="number" min="1" max="99" value={guiche} disabled={!!senha}
            onChange={(e) => setGuiche(Number(e.target.value))} />
        </label>
        <Aviso texto={erro} />

        {senha ? (
          <section className="senha-atual" aria-live="polite">
            <p>{ROTULO[estado]}</p>
            <strong>{senha.codigo}</strong>
          </section>
        ) : (
          <p>Nenhuma senha em andamento.</p>
        )}

        <div className="acoes">
          {!senha && <button onClick={() => executar('chamar')}>Chamar próxima</button>}
          {estado === 'CHAMADA' && <button onClick={() => executar('chamar-novamente')}>Chamar novamente</button>}
          {(estado === 'CHAMADA' || estado === 'CHAMADA_NOVAMENTE') && (
            <button onClick={() => executar('iniciar')}>Iniciar atendimento</button>
          )}
          {estado === 'CHAMADA_NOVAMENTE' && (
            <button className="secundario" onClick={() => executar('nao-compareceu')}>Não compareceu</button>
          )}
          {estado === 'EM_ATENDIMENTO' && <button onClick={() => executar('finalizar')}>Finalizar atendimento</button>}
        </div>
      </main>
    </>
  );
}
