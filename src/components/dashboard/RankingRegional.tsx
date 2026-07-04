"use client";

import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { RankingItem } from "@/types/dashboard";

export function RankingRegional() {
  const [ranking, setRanking] = useState<RankingItem[]>([]);

  useEffect(() => {
    fetch("/api/dashboard/ranking")
      .then((r) => r.json())
      .then(setRanking)
      .catch(console.error);
  }, []);

  if (ranking.length === 0) {
    return (
      <div className="glass rounded-xl p-5">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  const maxTotal = Math.max(...ranking.map((r) => r.total));

  const medalColor = (pos: number) => {
    if (pos === 0) return "text-yellow-500";
    if (pos === 1) return "text-gray-400";
    if (pos === 2) return "text-amber-600";
    return "text-muted-foreground";
  };

  return (
    <div className="glass rounded-xl p-5">
      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-yellow-500" />
        Ranking Regional
      </h3>
      <div className="space-y-3">
        {ranking.map((item, index) => (
          <div key={item.regiao} className="flex items-center gap-3">
            <span
              className={`w-6 text-center font-bold text-sm ${medalColor(index)}`}
            >
              {index + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium truncate">
                  {item.regiao}
                </span>
                <span className="text-sm font-bold">{item.total}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-brand-600 rounded-full h-2 transition-all duration-500"
                  style={{
                    width: `${(item.total / maxTotal) * 100}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
                <span>{item.abertas} abertas</span>
                <span>{item.resolvidas} resolvidas ({item.percentual}%)</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
