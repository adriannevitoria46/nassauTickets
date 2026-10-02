import { useEffect, useState } from 'react';
import Aviso from '../components/Aviso.jsx';
import { api } from '../services/api.js';

const TIPOS = [
  { sigla: 'SP', nome: 'Prioritária', detalhe: 'Idosos, gestantes e pessoas com deficiência' },
  { sigla: 'SG', nome: 'Geral', detalhe: 'Atendimento geral' },
  { sigla: 'SE', nome: 'Exames', detalhe: 'Retirada de exames' },
];

export default function Totem() {
  const [senha, setSenha] = useState(null);
  const [erro, setErro] = useState('');

  // volta à tela inicial depois que o cliente anotou a senha
  useEffect(() => {
    if (!senha) return;
    const t = setTimeout(() => setSenha(null), 10000);
    return () => clearTimeout(t);
  }, [senha]);

  async function emitir(tipo) {
    setErro('');
    try {
      setSenha(await api.emitirSenha(tipo));
    } catch (e) {
      setErro(e.message);
    }
  }

  return (
    <main className="pagina totem">
      <h1>Retire a sua senha</h1>
      <Aviso texto={erro} />
      {senha ? (
        <section aria-live="polite" className="senha-emitida">
          <p>Sua senha</p>
          <strong>{senha.codigo}</strong>
          <p>Aguarde ser chamado no painel.</p>
        </section>
      ) : (
        <div className="botoes-totem">
          {TIPOS.map((t) => (
            <button key={t.sigla} className="botao-grande" onClick={() => emitir(t.sigla)}>
              <span>{t.nome}</span>
              <small>{t.detalhe}</small>
            </button>
          ))}
        </div>
      )}
    </main>
  );
}
