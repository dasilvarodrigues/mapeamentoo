import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gestão de Demandas | Cassol Mapeamento Regional",
};

export default function DemandasLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
