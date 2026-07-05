"use client";

import { useRef, useState } from "react";
import { Upload, X, File } from "lucide-react";
import type { AnexoType, EntidadeTipo } from "@/types/anexos";

interface AnexosUploadProps {
  entidadeTipo: EntidadeTipo;
  entidadeId: string;
  onUpload: (anexo: AnexoType) => void;
}

export function AnexosUpload({ entidadeTipo, entidadeId, onUpload }: AnexosUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [arquivo, setArquivo] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Arquivo muito grande. Máximo 2MB.");
      return;
    }
    setArquivo(file);
  };

  const handleUpload = async () => {
    if (!arquivo) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("arquivo", arquivo);
      formData.append("entidadeTipo", entidadeTipo);
      formData.append("entidadeId", entidadeId);

      const res = await fetch("/api/anexos", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Erro ao fazer upload");
        return;
      }
      const anexo = await res.json();
      onUpload(anexo);
      setArquivo(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch {
      alert("Erro ao fazer upload");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        onChange={handleFileChange}
        className="hidden"
      />
      {!arquivo ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 transition"
        >
          <Upload className="w-4 h-4" />
          Adicionar anexo
        </button>
      ) : (
        <div className="flex items-center gap-2 p-2 rounded-lg border border-border bg-muted/30">
          <File className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm flex-1 truncate">{arquivo.name}</span>
          <span className="text-xs text-muted-foreground">
            {(arquivo.size / 1024).toFixed(1)}KB
          </span>
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading}
            className="text-xs bg-brand-600 text-white rounded px-2 py-1 hover:bg-brand-700 transition disabled:opacity-50"
          >
            {uploading ? "..." : "Upload"}
          </button>
          <button
            type="button"
            onClick={() => { setArquivo(null); if (inputRef.current) inputRef.current.value = ""; }}
            className="p-1 hover:bg-muted rounded transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
