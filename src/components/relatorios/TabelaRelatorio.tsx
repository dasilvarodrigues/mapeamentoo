"use client";

interface Coluna {
  key: string;
  label: string;
  formato?: "numero" | "percentual" | "texto";
}

interface TabelaRelatorioProps {
  colunas: Coluna[];
  dados: Record<string, unknown>[];
}

export function TabelaRelatorio({ colunas, dados }: TabelaRelatorioProps) {
  if (dados.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        Nenhum dado encontrado.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {colunas.map((col) => (
              <th
                key={col.key}
                className="text-left p-2 font-medium text-muted-foreground"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dados.map((linha, idx) => (
            <tr key={idx} className="border-b border-border hover:bg-muted/30">
              {colunas.map((col) => (
                <td key={col.key} className="p-2">
                  {col.formato === "numero"
                    ? Number(linha[col.key]).toLocaleString("pt-BR")
                    : col.formato === "percentual"
                    ? String(linha[col.key])
                    : String(linha[col.key] ?? "-")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
