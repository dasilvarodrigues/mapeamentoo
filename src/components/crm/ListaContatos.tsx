"use client";

import { Search, Phone, Mail } from "lucide-react";
import type { ContatoType } from "@/types/crm";

interface ListaContatosProps {
  contatos: ContatoType[];
  busca: string;
  onBuscaChange: (v: string) => void;
  onSelect: (contato: ContatoType) => void;
}

export function ListaContatos({ contatos, busca, onBuscaChange, onSelect }: ListaContatosProps) {
  return (
    <div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={busca}
          onChange={(e) => onBuscaChange(e.target.value)}
          placeholder="Buscar por nome..."
          className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm"
        />
      </div>

      {contatos.length === 0 ? (
        <div className="glass rounded-xl p-8 text-center text-muted-foreground">
          Nenhum contato encontrado.
        </div>
      ) : (
        <div className="glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 font-medium text-muted-foreground">Nome</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Telefone</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Cargo</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Contato</th>
                </tr>
              </thead>
              <tbody>
                {contatos.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => onSelect(c)}
                    className="border-b border-border hover:bg-muted/50 cursor-pointer transition"
                  >
                    <td className="p-3 font-medium">{c.nome}</td>
                    <td className="p-3">{c.telefone}</td>
                    <td className="p-3 text-muted-foreground">{c.cargo || "-"}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        {c.email && <Mail className="w-4 h-4 text-muted-foreground" />}
                        <Phone className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 border-t border-border text-sm text-muted-foreground">
            {contatos.length} contato(s)
          </div>
        </div>
      )}
    </div>
  );
}
