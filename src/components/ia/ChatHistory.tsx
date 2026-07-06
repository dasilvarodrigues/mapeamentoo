"use client";

import { MessageSquare, Trash2, Plus } from "lucide-react";
import type { IaConversaType } from "@/types/ia";
import { formatDateTime } from "@/lib/utils";

interface ChatHistoryProps {
  conversas: IaConversaType[];
  conversaAtiva?: string;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  loading?: boolean;
}

export function ChatHistory({
  conversas,
  conversaAtiva,
  onSelect,
  onDelete,
  onNew,
  loading,
}: ChatHistoryProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b flex items-center justify-between">
        <h3 className="text-sm font-semibold">Histórico</h3>
        <button
          onClick={onNew}
          className="p-1.5 rounded-lg hover:bg-muted transition"
          title="Nova conversa"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-sm text-muted-foreground text-center">
            Carregando...
          </div>
        ) : conversas.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground text-center">
            Nenhuma conversa ainda
          </div>
        ) : (
          conversas.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={`w-full text-left px-3 py-2.5 flex items-start gap-2 hover:bg-muted transition text-sm ${
                c.id === conversaAtiva ? "bg-muted" : ""
              }`}
            >
              <MessageSquare className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{c.titulo}</div>
                {c.ultimaMensagem && (
                  <div className="text-xs text-muted-foreground truncate mt-0.5">
                    {c.ultimaMensagem}
                  </div>
                )}
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {formatDateTime(c.createdAt)} · {c.totalMensagens} msgs
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(c.id);
                }}
                className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
