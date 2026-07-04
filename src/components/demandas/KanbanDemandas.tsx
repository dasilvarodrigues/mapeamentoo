"use client";

import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { CardDemanda } from "./CardDemanda";
import type { DemandaType } from "@/types/demandas";

interface KanbanDemandasProps {
  demandas: DemandaType[];
  onStatusChange: (id: string, newStatus: string) => void;
  onSelect: (demanda: DemandaType) => void;
}

const columns = [
  { id: "aberta", label: "Aberta", color: "border-red-400" },
  { id: "em_andamento", label: "Em Andamento", color: "border-amber-400" },
  { id: "resolvida", label: "Resolvida", color: "border-green-400" },
];

export function KanbanDemandas({ demandas, onStatusChange, onSelect }: KanbanDemandasProps) {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    if (result.source.droppableId === result.destination.droppableId) return;
    onStatusChange(result.draggableId, result.destination.droppableId);
  };

  const getDemandasPorColuna = (status: string) =>
    demandas.filter((d) => d.status === status);

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map((col) => (
          <div
            key={col.id}
            className={`glass rounded-xl p-3 border-t-4 ${col.color}`}
          >
            <h3 className="font-semibold text-sm mb-3 px-1">
              {col.label}
              <span className="text-muted-foreground font-normal ml-2">
                ({getDemandasPorColuna(col.id).length})
              </span>
            </h3>
            <Droppable droppableId={col.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`space-y-2 min-h-[200px] rounded-lg p-1 transition ${
                    snapshot.isDraggingOver ? "bg-muted/50" : ""
                  }`}
                >
                  {getDemandasPorColuna(col.id).map((d, idx) => (
                    <CardDemanda
                      key={d.id}
                      demanda={d}
                      index={idx}
                      onClick={() => onSelect(d)}
                    />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}
