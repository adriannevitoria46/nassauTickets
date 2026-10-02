// Ciclo [SP] -> [SE|SG] -> [SP] -> [SE|SG].
// Após SP vem SE (se houver) e depois SG; nas demais vezes SP tem a vez e
// SE/SG se alternam, para que nenhuma fila fique sem atendimento.
const ORDEM = {
  SP: ['SE', 'SG', 'SP'],
  SE: ['SP', 'SG', 'SE'],
};
const PADRAO = ['SP', 'SE', 'SG'];

// temFila: { SP: bool, SG: bool, SE: bool }. Retorna o tipo a chamar ou null.
export function escolherTipo(ultimoTipo, temFila) {
  return (ORDEM[ultimoTipo] ?? PADRAO).find((t) => temFila[t]) ?? null;
}
