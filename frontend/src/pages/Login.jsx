import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Aviso from '../components/Aviso.jsx';
import { api, sessao } from '../services/api.js';

export default function Login() {
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const navegar = useNavigate();

  async function entrar(e) {
    e.preventDefault();
    setErro('');
    try {
      sessao.salvar(await api.login(login, senha));
      navegar('/atendente');
    } catch (err) {
      setErro(err.message);
    }
  }

  return (
    <main className="pagina estreita">
      <h1>Entrar</h1>
      <form onSubmit={entrar}>
        <label>
          Usuário
          <input value={login} onChange={(e) => setLogin(e.target.value)} autoComplete="username" required />
        </label>
        <label>
          Senha
          <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="current-password" required />
        </label>
        <Aviso texto={erro} />
        <button type="submit">Entrar</button>
      </form>
    </main>
  );
}
