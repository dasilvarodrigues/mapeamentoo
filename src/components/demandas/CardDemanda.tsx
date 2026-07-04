"use client";

import { Draggable } from "@hello-pangea/dnd";
import { AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import type { DemandaType } from "@/types/demandas";

interface CardDemandaProps {
  demanda: DemandaType;
  index: number;
  onClick: () => void;
}

const prioridadeIcon = (p: number) => {
  if (p >= 4) return <AlertTriangle className="w-3.5 h-3.5 text-red-500" />;
  if (p >= 2) return <Clock className="w-3.5 h-3.5 text-amber-500" />;
  return <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />;
};

export function CardDemanda({ demanda, index, onClick }: CardDemandaProps) {
  return (
    <Draggable draggableId={demanda.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={`bg-card rounded-lg p-3 border border-border cursor-pointer transition ${
            snapshot.isDragging ? "shadow-lg rotate-2" : "shadow-sm hover:shadow-md"
          }`}
        >
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <span className="text-xs font-medium capitalize text-muted-foreground">
              {demanda.categoria}
            </span>
            {prioridadeIcon(demanda.prioridade)}
          </div>
          <p className="text-sm leading-snug line-clamp-2">{demanda.descricao}</p>
          {demanda.responsavel && (
            <p className="text-xs text-muted-foreground mt-2">{demanda.responsavel}</p>
          )}
        </div>
      )}
    </Draggable>
  );
}
