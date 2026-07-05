"use client";

import { Printer } from "lucide-react";

interface ExportarPDFProps {
  label?: string;
}

export function ExportarPDF({ label = "Exportar PDF" }: ExportarPDFProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <button
      onClick={handlePrint}
      className="flex items-center gap-2 bg-brand-600 text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-brand-700 transition no-print"
    >
      <Printer className="w-4 h-4" />
      {label}
    </button>
  );
}
