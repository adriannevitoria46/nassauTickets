import { Navigate } from 'react-router-dom';
import { sessao } from '../services/api.js';

// Só renderiza os filhos se houver login (e o perfil exigido, quando informado).
export default function RotaProtegida({ perfil, children }) {
  const atual = sessao.ler();
  if (!atual) return <Navigate to="/login" replace />;
  if (perfil && atual.usuario.perfil !== perfil) return <Navigate to="/atendente" replace />;
  return children;
}
