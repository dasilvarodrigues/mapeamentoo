"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface CardKPIProps {
  titulo: string;
  valor: number;
  icone: LucideIcon;
  cor: string;
  formato?: "numero" | "porcentagem";
  delay?: number;
}

export function CardKPI({
  titulo,
  valor,
  icone: Icone,
  cor,
  formato = "numero",
  delay = 0,
}: CardKPIProps) {
  const [contagem, setContagem] = useState(0);

  useEffect(() => {
    let start = 0;
    const duracao = 1000;
    const incremento = Math.ceil(valor / 60);
    const timer = setInterval(() => {
      start += incremento;
      if (start >= valor) {
        setContagem(valor);
        clearInterval(timer);
      } else {
        setContagem(start);
      }
    }, duracao / 60);
    return () => clearInterval(timer);
  }, [valor]);

  const exibirValor =
    formato === "porcentagem" ? `${contagem}%` : contagem.toLocaleString("pt-BR");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="glass rounded-xl p-5 flex items-start gap-4"
    >
      <div
        className="rounded-xl p-3 shrink-0"
        style={{ backgroundColor: `${cor}20` }}
      >
        <Icone className="w-6 h-6" style={{ color: cor }} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-muted-foreground truncate">
          {titulo}
        </p>
        <motion.p
          key={valor}
          initial={{ scale: 1.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-2xl font-bold mt-1"
          style={{ color: cor }}
        >
          {exibirValor}
        </motion.p>
      </div>
    </motion.div>
  );
}
