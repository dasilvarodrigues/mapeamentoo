"use client";

import { ReactNode } from "react";

interface RelatorioPrintProps {
  titulo: string;
  children: ReactNode;
}

export function RelatorioPrint({ titulo, children }: RelatorioPrintProps) {
  return (
    <div className="print-only">
      <div className="hidden print:block">
        <h1 className="text-xl font-bold mb-4">{titulo}</h1>
        {children}
      </div>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { font-family: Georgia, serif; color: #000; }
          .print-only { display: block !important; width: 100%; }
          table { page-break-inside: avoid; }
          section { page-break-after: always; }
        }
      `}</style>
    </div>
  );
}
