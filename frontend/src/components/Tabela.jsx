// colunas: [{ titulo, campo, formatar? }]; células vazias aparecem como "—" (RF15).
export default function Tabela({ titulo, colunas, linhas }) {
  return (
    <section>
      <h3>{titulo}</h3>
      <div className="rolagem">
        <table>
          <thead>
            <tr>{colunas.map((c) => <th key={c.campo} scope="col">{c.titulo}</th>)}</tr>
          </thead>
          <tbody>
            {linhas.length === 0 && (
              <tr><td colSpan={colunas.length}>Sem registros no período.</td></tr>
            )}
            {linhas.map((linha, i) => (
              <tr key={linha.codigo ?? i}>
                {colunas.map((c) => {
                  const valor = linha[c.campo];
                  const vazio = valor === null || valor === undefined;
                  return <td key={c.campo}>{vazio ? '—' : (c.formatar ? c.formatar(valor) : valor)}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
