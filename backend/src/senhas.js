import { pool } from './db.js';
import { ErroNegocio } from './erros.js';
import { escolherTipo } from './prioridade.js';

const TIPOS = ['SP', 'SG', 'SE'];
const INICIO = Number(process.env.EXPEDIENTE_INICIO ?? 7);
const FIM = Number(process.env.EXPEDIENTE_FIM ?? 17);

const noExpediente = () => {
  const h = new Date().getHours();
  return h >= INICIO && h < FIM;
};

// RN09: senhas que sobraram na fila (de outro dia ou após o expediente) são descartadas.
export async function descartarPendentes() {
  await pool.query(
    `UPDATE senhas SET estado='DESCARTADA'
     WHERE estado='AGUARDANDO' AND (dia < CURDATE() OR ?)`,
    [new Date().getHours() >= FIM],
  );
}

export async function buscar(id) {
  const [[senha]] = await pool.query('SELECT * FROM senhas WHERE id=?', [id]);
  return senha;
}

export async function emitir(tipo) {
  if (!TIPOS.includes(tipo)) throw new ErroNegocio('Tipo de senha inválido', 400);
  if (!noExpediente()) throw new ErroNegocio('Fora do expediente', 403);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(
      `INSERT INTO sequencias (dia, tipo, ultimo) VALUES (CURDATE(), ?, LAST_INSERT_ID(1))
       ON DUPLICATE KEY UPDATE ultimo = LAST_INSERT_ID(ultimo + 1)`,
      [tipo],
    );
    const [[{ seq }]] = await conn.query('SELECT LAST_INSERT_ID() AS seq');
    if (seq > 999) throw new ErroNegocio('Limite diário de senhas deste tipo atingido');

    const [r] = await conn.query(
      `INSERT INTO senhas (codigo, dia, tipo, sequencia, estado, emitida_em)
       VALUES (CONCAT(DATE_FORMAT(CURDATE(), '%y%m%d'), '-', ?, LPAD(?, 3, '0')),
               CURDATE(), ?, ?, 'EMITIDA', NOW())`,
      [tipo, seq, tipo, seq],
    );
    await conn.query(`UPDATE senhas SET estado='AGUARDANDO' WHERE id=?`, [r.insertId]);
    await conn.commit();
    return buscar(r.insertId);
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

// RNF05: a linha de trava_fila serializa chamadas simultâneas; cada senha vai para um único AA.
export async function chamarProxima(atendenteId, guiche) {
  if (!noExpediente()) throw new ErroNegocio('Fora do expediente', 403);
  await descartarPendentes();

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[trava]] = await conn.query(
      'SELECT (dia = CURDATE()) AS hoje, ultimo_tipo FROM trava_fila WHERE id=1 FOR UPDATE',
    );

    const [[aberta]] = await conn.query(
      `SELECT id FROM senhas WHERE atendente_id=? AND dia=CURDATE()
       AND estado IN ('CHAMADA','CHAMADA_NOVAMENTE','EM_ATENDIMENTO') LIMIT 1`,
      [atendenteId],
    );
    if (aberta) throw new ErroNegocio('Conclua a senha em andamento antes de chamar a próxima');

    const [filas] = await conn.query(
      `SELECT DISTINCT tipo FROM senhas WHERE dia=CURDATE() AND estado='AGUARDANDO'`,
    );
    const tipo = escolherTipo(
      trava.hoje ? trava.ultimo_tipo : null,
      Object.fromEntries(filas.map((f) => [f.tipo, true])),
    );
    if (!tipo) throw new ErroNegocio('Não há senhas aguardando', 404);

    const [[proxima]] = await conn.query(
      `SELECT id FROM senhas WHERE dia=CURDATE() AND estado='AGUARDANDO' AND tipo=?
       ORDER BY sequencia LIMIT 1 FOR UPDATE`,
      [tipo],
    );
    await conn.query(
      `UPDATE senhas SET estado='CHAMADA', chamada1_em=NOW(), ultima_chamada_em=NOW(3),
       guiche=?, atendente_id=? WHERE id=?`,
      [guiche, atendenteId, proxima.id],
    );
    await conn.query('UPDATE trava_fila SET dia=CURDATE(), ultimo_tipo=? WHERE id=1', [tipo]);
    await conn.commit();
    return buscar(proxima.id);
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

// RNF06: o WHERE confere dono e estado, então duas ações simultâneas não passam juntas (RN13).
async function transicao(id, atendenteId, de, para, extra = '') {
  const [r] = await pool.query(
    `UPDATE senhas SET estado=?${extra} WHERE id=? AND atendente_id=? AND estado IN (?)`,
    [para, id, atendenteId, de],
  );
  if (!r.affectedRows) throw new ErroNegocio('Operação inválida para o estado atual da senha');
  return buscar(id);
}

export const chamarNovamente = (id, a) =>
  transicao(id, a, ['CHAMADA'], 'CHAMADA_NOVAMENTE', ', chamada2_em=NOW(), ultima_chamada_em=NOW(3)');
export const iniciar = (id, a) =>
  transicao(id, a, ['CHAMADA', 'CHAMADA_NOVAMENTE'], 'EM_ATENDIMENTO', ', inicio_em=NOW()');
export const finalizar = (id, a) =>
  transicao(id, a, ['EM_ATENDIMENTO'], 'ATENDIDA', ', fim_em=NOW()');
export const naoCompareceu = (id, a) =>
  transicao(id, a, ['CHAMADA_NOVAMENTE'], 'NAO_COMPARECEU');

export async function atual(atendenteId) {
  const [[senha]] = await pool.query(
    `SELECT * FROM senhas WHERE atendente_id=? AND dia=CURDATE()
     AND estado IN ('CHAMADA','CHAMADA_NOVAMENTE','EM_ATENDIMENTO') LIMIT 1`,
    [atendenteId],
  );
  return senha ?? null;
}

// RF10: só as 5 últimas chamadas; a próxima senha nunca é exposta.
export async function painel() {
  const [linhas] = await pool.query(
    `SELECT codigo, tipo, guiche, estado FROM senhas
     WHERE dia=CURDATE() AND ultima_chamada_em IS NOT NULL
     ORDER BY ultima_chamada_em DESC LIMIT 5`,
  );
  return linhas;
}
