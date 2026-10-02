import { useEffect, useState } from 'react';
import Aviso from '../components/Aviso.jsx';
import { api } from '../services/api.js';

export default function Painel() {
  const [chamadas, setChamadas] = useState([]);
  const [offline, setOffline] = useState(false);

  // RNF09: consulta a cada 3 s; se falhar, mantém a última lista e avisa.
  useEffect(() => {
    let ativo = true;
    async function atualizar() {
      try {
        const lista = await api.painel();
        if (ativo) {
          setChamadas(lista);
          setOffline(false);
        }
      } catch {
        if (ativo) setOffline(true);
      }
    }
    atualizar();
    const t = setInterval(atualizar, 3000);
    return () => {
      ativo = false;
      clearInterval(t);
    };
  }, []);

  const [atual, ...anteriores] = chamadas;

  return (
    <main className="pagina painel">
      <h1>Painel de chamadas</h1>
      <Aviso texto={offline ? 'Sistema indisponível — exibindo a última lista conhecida.' : ''} />
      {!atual ? (
        <p>Nenhuma senha chamada até o momento.</p>
      ) : (
        <>
          <section className="chamada-atual" aria-live="polite">
            <p>{atual.estado === 'CHAMADA_NOVAMENTE' ? 'Última chamada' : 'Senha atual'}</p>
            <strong>{atual.codigo}</strong>
            <p>Guichê {atual.guiche}</p>
          </section>
          <h2>Anteriores</h2>
          <ul className="lista-chamadas">
            {anteriores.map((c) => (
              <li key={c.codigo}>
                <span>{c.codigo}</span> <span>Guichê {c.guiche}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
