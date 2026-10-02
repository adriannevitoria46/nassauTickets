import { Route, Routes } from 'react-router-dom';
import RotaProtegida from './components/RotaProtegida.jsx';
import Atendente from './pages/Atendente.jsx';
import Login from './pages/Login.jsx';
import Painel from './pages/Painel.jsx';
import Relatorios from './pages/Relatorios.jsx';
import Totem from './pages/Totem.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Totem />} />
      <Route path="/painel" element={<Painel />} />
      <Route path="/login" element={<Login />} />
      <Route path="/atendente" element={<RotaProtegida><Atendente /></RotaProtegida>} />
      <Route path="/relatorios" element={<RotaProtegida perfil="GESTOR"><Relatorios /></RotaProtegida>} />
      <Route path="*" element={<p className="pagina">Página não encontrada.</p>} />
    </Routes>
  );
}
