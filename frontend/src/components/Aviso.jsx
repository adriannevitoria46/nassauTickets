// Mensagem de erro anunciada por leitores de tela (role="alert"); some quando vazia.
export default function Aviso({ texto }) {
  return texto ? <p className="aviso" role="alert">{texto}</p> : null;
}
