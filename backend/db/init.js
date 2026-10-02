// Cria o banco/tabelas e os usuários iniciais (somente para desenvolvimento).
import { readFileSync } from 'node:fs';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  multipleStatements: true,
});
await conn.query(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));
await conn.query(`USE ${process.env.DB_NAME}`);

const iniciais = [
  ['Gestor', 'gestor', 'gestor123', 'GESTOR'],
  ['Atendente 1', 'atendente1', 'atendente123', 'ATENDENTE'],
];
for (const [nome, login, senha, perfil] of iniciais) {
  await conn.query(
    'INSERT IGNORE INTO usuarios (nome, login, senha_hash, perfil) VALUES (?, ?, ?, ?)',
    [nome, login, await bcrypt.hash(senha, 10), perfil],
  );
}
console.log('Banco pronto. Usuários: gestor/gestor123 e atendente1/atendente123');
await conn.end();
