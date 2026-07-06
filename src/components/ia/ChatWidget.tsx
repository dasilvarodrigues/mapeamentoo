"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { ChatDrawer } from "./ChatDrawer";

export function ChatWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
        title="Assistente IA"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
      <ChatDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
