import { Link, useNavigate } from 'react-router-dom';
import { sessao } from '../services/api.js';

export default function Cabecalho() {
  const navegar = useNavigate();
  const { usuario } = sessao.ler();

  function sair() {
    sessao.limpar();
    navegar('/login');
  }

  return (
    <header className="cabecalho">
      <strong>nassauTickets</strong>
      <nav aria-label="Principal">
        <Link to="/atendente">Atendimento</Link>
        {usuario.perfil === 'GESTOR' && <Link to="/relatorios">Relatórios</Link>}
      </nav>
      <span>
        {usuario.nome} <button onClick={sair}>Sair</button>
      </span>
    </header>
  );
}
