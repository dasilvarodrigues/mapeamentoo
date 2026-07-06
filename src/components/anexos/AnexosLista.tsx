"use client";

import { useState, useEffect, useCallback } from "react";
import { Download, Trash2, FileText } from "lucide-react";
import type { AnexoType, EntidadeTipo } from "@/types/anexos";

interface AnexosListaProps {
  entidadeTipo: EntidadeTipo;
  entidadeId: string;
  refreshKey?: number;
}

const formatTamanho = (bytes: number) => {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
};

export function AnexosLista({ entidadeTipo, entidadeId, refreshKey = 0 }: AnexosListaProps) {
  const [anexos, setAnexos] = useState<AnexoType[]>([]);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/anexos?entidadeTipo=${entidadeTipo}&entidadeId=${entidadeId}`);
      if (res.ok) setAnexos(await res.json());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [entidadeTipo, entidadeId]);

  useEffect(() => { carregar(); }, [carregar, refreshKey]);

  const handleDelete = async (id: string) => {
    if (!confirm("Remover este anexo?")) return;
    const res = await fetch(`/api/anexos/${id}`, { method: "DELETE" });
    if (res.ok) setAnexos((prev) => prev.filter((a) => a.id !== id));
  };

  if (loading) return <p className="text-xs text-muted-foreground">Carregando anexos...</p>;
  if (anexos.length === 0) return null;

  return (
    <div className="space-y-1">
      {anexos.map((anexo) => (
        <div key={anexo.id} className="flex items-center gap-2 p-2 rounded-lg border border-border bg-muted/20">
          <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="text-sm flex-1 truncate">{anexo.nomeOriginal}</span>
          <span className="text-xs text-muted-foreground shrink-0">{formatTamanho(anexo.tamanho)}</span>
          <a
            href={`/api/anexos/${anexo.id}/arquivo`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 hover:bg-muted rounded transition"
          >
            <Download className="w-3.5 h-3.5" />
          </a>
          <button
            type="button"
            onClick={() => handleDelete(anexo.id)}
            className="p-1 hover:bg-red-50 rounded transition text-muted-foreground hover:text-red-600"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
