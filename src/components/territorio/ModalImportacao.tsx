"use client";

import { useState, useRef } from "react";
import { Upload, X, FileUp } from "lucide-react";

interface ModalImportacaoProps {
  open: boolean;
  onClose: () => void;
}

export function ModalImportacao({ open, onClose }: ModalImportacaoProps) {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [importando, setImportando] = useState(false);
  const [resultado, setResultado] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setArquivo(file);
  };

  const handleImport = async () => {
    if (!arquivo) return;
    setImportando(true);
    setResultado(null);

    const text = await arquivo.text();
    try {
      const data = JSON.parse(text);
      const features = data.features || [];
      setResultado(`${features.length} feições importadas de ${arquivo.name}`);
    } catch {
      setResultado("Erro: formato inválido. Use GeoJSON.");
    }
    setImportando(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Importar Arquivo GIS
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-brand-600 transition mb-4"
        >
          <FileUp className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium">
            {arquivo ? arquivo.name : "Clique para selecionar arquivo"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            GeoJSON, KML, KMZ ou Shapefile (.zip)
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".geojson,.json,.kml,.kmz,.zip"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {resultado && (
          <p className="text-sm text-green-600 mb-4">{resultado}</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg px-4 py-2 text-sm font-medium border border-border hover:bg-muted transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleImport}
            disabled={!arquivo || importando}
            className="flex-1 bg-brand-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-brand-700 transition disabled:opacity-50"
          >
            {importando ? "Importando..." : "Importar"}
          </button>
        </div>
      </div>
    </div>
  );
}
