"use client";

import { Phone, Users, MessageSquare } from "lucide-react";
import type { InteracaoType } from "@/types/crm";

interface TimelineInteracoesProps {
  interacoes: InteracaoType[];
}

const tipoIcon: Record<string, React.ReactNode> = {
  visita: <Users className="w-4 h-4" />,
  ligacao: <Phone className="w-4 h-4" />,
  reuniao: <Users className="w-4 h-4" />,
  mensagem: <MessageSquare className="w-4 h-4" />,
};

const tipoLabel: Record<string, string> = {
  visita: "Visita",
  ligacao: "Ligação",
  reuniao: "Reunião",
  mensagem: "Mensagem",
};

export function TimelineInteracoes({ interacoes }: TimelineInteracoesProps) {
  if (interacoes.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">Nenhuma interação registrada.</p>;
  }

  return (
    <div className="relative pl-6 space-y-4">
      <div className="absolute left-2.5 top-1 bottom-0 w-px bg-border" />
      {interacoes.map((i) => (
        <div key={i.id} className="relative">
          <div className="absolute -left-[18px] top-1 w-3 h-3 rounded-full bg-brand-600 ring-2 ring-background flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
          </div>
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-brand-600">{tipoIcon[i.tipo] || <MessageSquare className="w-4 h-4" />}</span>
              <span className="text-xs font-medium">{tipoLabel[i.tipo] || i.tipo}</span>
              <span className="text-xs text-muted-foreground ml-auto">
                {new Date(i.data).toLocaleDateString("pt-BR")}
              </span>
            </div>
            <p className="text-sm">{i.descricao}</p>
            <p className="text-xs text-muted-foreground mt-1">por {i.responsavel}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
