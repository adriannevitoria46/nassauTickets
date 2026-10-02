import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from './db.js';
import { ErroNegocio } from './erros.js';

const SEGREDO = process.env.JWT_SECRET;
if (!SEGREDO) throw new Error('JWT_SECRET não definido (veja .env.example)');

export async function login(usuario, senha) {
  if (typeof usuario !== 'string' || typeof senha !== 'string') {
    throw new ErroNegocio('Usuário ou senha inválidos', 401);
  }
  const [[u]] = await pool.query('SELECT * FROM usuarios WHERE login=?', [usuario]);
  if (!u || !(await bcrypt.compare(senha, u.senha_hash))) {
    throw new ErroNegocio('Usuário ou senha inválidos', 401);
  }
  const dados = { id: u.id, nome: u.nome, perfil: u.perfil };
  return { token: jwt.sign(dados, SEGREDO, { expiresIn: '10h' }), usuario: dados };
}

// exigir('GESTOR') só deixa o gestor passar; sem argumento basta estar autenticado.
export const exigir = (perfil) => (req, _res, next) => {
  try {
    const token = (req.headers.authorization ?? '').replace(/^Bearer /, '');
    req.usuario = jwt.verify(token, SEGREDO);
  } catch {
    throw new ErroNegocio('Não autenticado', 401);
  }
  if (perfil && req.usuario.perfil !== perfil) throw new ErroNegocio('Acesso negado', 403);
  next();
};

export async function cadastrarAtendente({ nome, login: usuario, senha }) {
  if (![nome, usuario, senha].every((v) => typeof v === 'string' && v.trim()) || senha.length < 6) {
    throw new ErroNegocio('Informe nome, login e senha (mínimo 6 caracteres)', 400);
  }
  const hash = await bcrypt.hash(senha, 10);
  const [r] = await pool.query(
    `INSERT INTO usuarios (nome, login, senha_hash, perfil) VALUES (?, ?, ?, 'ATENDENTE')`,
    [nome.trim(), usuario.trim(), hash],
  );
  return { id: r.insertId, nome: nome.trim(), login: usuario.trim(), perfil: 'ATENDENTE' };
}
