import { pool } from './db.js';
import { ErroNegocio } from './erros.js';
import { descartarPendentes } from './senhas.js';

const UNIDADE = { diario: 'DAY', mensal: 'MONTH' };

// periodo: 'diario' (data AAAA-MM-DD) ou 'mensal' (mês AAAA-MM)
export async function relatorio(periodo, valor) {
  const formato = periodo === 'mensal' ? /^\d{4}-\d{2}$/ : /^\d{4}-\d{2}-\d{2}$/;
  if (!UNIDADE[periodo] || !formato.test(valor ?? '')) {
    throw new ErroNegocio('Período inválido', 400);
  }
  const de = periodo === 'mensal' ? `${valor}-01` : valor;
  const intervalo = (col) => `${col} >= ? AND ${col} < DATE_ADD(?, INTERVAL 1 ${UNIDADE[periodo]})`;
  await descartarPendentes();

  const [porTipo] = await pool.query(
    `SELECT tipo,
            COUNT(*) AS emitidas,
            SUM(estado='ATENDIDA') AS atendidas,
            SUM(estado='NAO_COMPARECEU') AS naoCompareceu,
            SUM(estado='DESCARTADA') AS descartadas,
            SUM(CASE WHEN estado='ATENDIDA' THEN TIMESTAMPDIFF(SECOND, inicio_em, fim_em) END) AS segundos
     FROM senhas WHERE ${intervalo('dia')} GROUP BY tipo`,
    [de, de],
  );
  const tipos = porTipo.map((t) => ({
    tipo: t.tipo,
    emitidas: Number(t.emitidas),
    atendidas: Number(t.atendidas),
    naoCompareceu: Number(t.naoCompareceu),
    descartadas: Number(t.descartadas),
    tmSegundos: Number(t.atendidas) > 0 ? Math.round(Number(t.segundos) / Number(t.atendidas)) : null,
  }));

  const soma = (campo) => tipos.reduce((acc, t) => acc + t[campo], 0);
  const segundosTotal = porTipo.reduce((acc, t) => acc + Number(t.segundos ?? 0), 0);
  const emitidas = soma('emitidas');
  const atendidas = soma('atendidas');

  const [detalhado] = await pool.query(
    `SELECT codigo, tipo, estado, emitida_em AS emitidaEm,
            CASE WHEN estado='ATENDIDA' THEN inicio_em END AS atendidaEm,
            CASE WHEN estado='ATENDIDA' THEN guiche END AS guiche
     FROM senhas WHERE ${intervalo('dia')} ORDER BY id`,
    [de, de],
  );
  const [auditoria] = await pool.query(
    `SELECT u.nome AS atendente, s.guiche, s.codigo,
            s.chamada1_em AS primeiraChamada, s.chamada2_em AS segundaChamada,
            s.inicio_em AS inicio, s.fim_em AS fim
     FROM senhas s JOIN usuarios u ON u.id = s.atendente_id
     WHERE ${intervalo('s.dia')} ORDER BY s.id`,
    [de, de],
  );

  return {
    periodo,
    valor,
    resumo: {
      emitidas,
      atendidas,
      naoCompareceu: soma('naoCompareceu'),
      // RN11: referência histórica ~5% de senhas não atendidas
      percentualNaoAtendidas: emitidas ? Math.round((1000 * (emitidas - atendidas)) / emitidas) / 10 : 0,
      tmSegundos: atendidas ? Math.round(segundosTotal / atendidas) : null,
    },
    porTipo: tipos,
    detalhado,
    auditoria,
  };
}
