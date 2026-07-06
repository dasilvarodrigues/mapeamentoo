"use client";

import { cn } from "@/lib/utils";

interface ChatMessageProps {
  papel: "user" | "assistant";
  conteudo: string;
  isStreaming?: boolean;
}

export function ChatMessage({ papel, conteudo, isStreaming }: ChatMessageProps) {
  const isUser = papel === "user";

  return (
    <div className={cn("flex items-start gap-3 px-4 py-3", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0",
          isUser ? "bg-primary" : "bg-gradient-to-br from-purple-500 to-blue-500"
        )}
      >
        {isUser ? "U" : "IA"}
      </div>
      <div
        className={cn(
          "rounded-2xl px-4 py-2.5 max-w-[85%] text-sm leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-muted rounded-tl-sm"
        )}
      >
        {conteudo}
        {isStreaming && (
          <span className="inline-block w-1.5 h-4 bg-current ml-0.5 animate-pulse" />
        )}
      </div>
    </div>
  );
}
