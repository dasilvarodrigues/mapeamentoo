"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, History, MessageSquare } from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { ChatSkeleton } from "./ChatSkeleton";
import { ChatHistory } from "./ChatHistory";
import type { IaConversaType, IaMensagemType, ChatStreamToken } from "@/types/ia";

interface ChatDrawerProps {
  open: boolean;
  onClose: () => void;
}

type ChatState = "empty" | "loading" | "streaming" | "complete" | "error";

export function ChatDrawer({ open, onClose }: ChatDrawerProps) {
  const [state, setState] = useState<ChatState>("empty");
  const [conversaId, setConversaId] = useState<string | undefined>();
  const [mensagens, setMensagens] = useState<IaMensagemType[]>([]);
  const [respostaAtual, setRespostaAtual] = useState("");
  const [mostrarHistorico, setMostrarHistorico] = useState(false);
  const [conversas, setConversas] = useState<IaConversaType[]>([]);
  const [historicoLoading, setHistoricoLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const mensagensRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      mensagensRef.current?.scrollTo({ top: mensagensRef.current.scrollHeight, behavior: "smooth" });
    }, 50);
  };

  useEffect(() => {
    scrollToBottom();
  }, [mensagens, respostaAtual]);

  const carregarConversas = useCallback(async () => {
    setHistoricoLoading(true);
    try {
      const res = await fetch("/api/ia/conversas");
      const json = await res.json();
      setConversas(json.data || []);
    } catch {
      // silent
    } finally {
      setHistoricoLoading(false);
    }
  }, []);

  const carregarMensagens = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/ia/conversas/${id}/mensagens`);
      const json = await res.json();
      setMensagens(json.data || []);
      setConversaId(id);
      setState(json.data.length > 0 ? "complete" : "empty");
    } catch {
      setState("error");
    }
  }, []);

  const handleSend = async (mensagem: string) => {
    setState("loading");
    setErrorMsg("");
    setRespostaAtual("");

    const userMsg: IaMensagemType = {
      id: crypto.randomUUID(),
      conversaId: conversaId || "",
      papel: "user",
      conteudo: mensagem,
      chunksFonte: null,
      createdAt: new Date().toISOString(),
    };
    setMensagens((prev) => [...prev, userMsg]);

    try {
      const res = await fetch("/api/ia/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversaId, mensagem }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erro ao conectar" }));
        throw new Error(err.error || `Erro ${res.status}`);
      }

      setState("streaming");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("Sem resposta do servidor");

      const decoder = new TextDecoder();
      let buffer = "";
      let novaConversaId = conversaId;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data: ChatStreamToken = JSON.parse(line.slice(6));
            if (data.conversaId) novaConversaId = data.conversaId;
            if (data.done) {
              setConversaId(novaConversaId);
              setRespostaAtual("");
              setMensagens((prev) => [
                ...prev,
                {
                  id: crypto.randomUUID(),
                  conversaId: novaConversaId || "",
                  papel: "assistant",
                  conteudo: data.token || respostaAtual,
                  chunksFonte: null,
                  createdAt: new Date().toISOString(),
                },
              ]);
              setState("complete");
              carregarConversas();
            } else {
              setRespostaAtual((prev) => prev + data.token);
            }
          } catch {
            // skip
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      setErrorMsg(msg);
      setState("error");
    } finally {
      scrollToBottom();
    }
  };

  const handleSelectConversa = (id: string) => {
    setMostrarHistorico(false);
    carregarMensagens(id);
  };

  const handleDeleteConversa = async (id: string) => {
    try {
      await fetch(`/api/ia/conversas/${id}`, { method: "DELETE" });
      if (conversaId === id) {
        setConversaId(undefined);
        setMensagens([]);
        setState("empty");
      }
      carregarConversas();
    } catch {
      // silent
    }
  };

  const handleNovaConversa = () => {
    setConversaId(undefined);
    setMensagens([]);
    setState("empty");
    setRespostaAtual("");
    setErrorMsg("");
  };

  const sugestoes = [
    "Quantas regiões o sistema possui?",
    "Quais bairros têm mais demandas abertas?",
    "Resumo executivo do território",
    "Top 10 bairros com mais contatos no CRM",
  ];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-background border-l shadow-2xl flex flex-col animate-in slide-in-from-right">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
              IA
            </div>
            <span className="font-semibold text-sm">Assistente IA</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setMostrarHistorico(!mostrarHistorico);
                if (!mostrarHistorico) carregarConversas();
              }}
              className="p-1.5 rounded-lg hover:bg-muted transition"
              title="Histórico"
            >
              <History className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-muted transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Chat messages */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div ref={mensagensRef} className="flex-1 overflow-y-auto">
              {state === "empty" && mensagens.length === 0 && (
                <div className="p-6 space-y-4">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white mx-auto mb-3">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-semibold">Olá! Como posso ajudar?</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Faça perguntas sobre regiões, demandas, território e CRM
                    </p>
                  </div>
                  <div className="space-y-2">
                    {sugestoes.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSend(s)}
                        className="w-full text-left text-xs p-2.5 rounded-xl border hover:bg-muted transition"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {mensagens.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  papel={msg.papel}
                  conteudo={msg.conteudo}
                />
              ))}

              {(state === "loading" || state === "streaming") && (
                <>
                  {respostaAtual ? (
                    <ChatMessage papel="assistant" conteudo={respostaAtual} isStreaming={state === "streaming"} />
                  ) : (
                    <ChatSkeleton />
                  )}
                </>
              )}

              {state === "error" && !respostaAtual && (
                <div className="px-4 py-3">
                  <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
                    <p className="font-medium">Erro</p>
                    <p className="text-xs mt-1">{errorMsg}</p>
                    <button
                      onClick={() => setState("empty")}
                      className="mt-2 text-xs underline"
                    >
                      Tentar novamente
                    </button>
                  </div>
                </div>
              )}
            </div>

            <ChatInput onSend={handleSend} disabled={state === "loading" || state === "streaming"} />
          </div>

          {/* Sidebar historico */}
          {mostrarHistorico && (
            <div className="w-56 border-l bg-muted/30 flex-shrink-0">
              <ChatHistory
                conversas={conversas}
                conversaAtiva={conversaId}
                onSelect={handleSelectConversa}
                onDelete={handleDeleteConversa}
                onNew={handleNovaConversa}
                loading={historicoLoading}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
