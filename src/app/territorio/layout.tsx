import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cadastro Territorial | Cassol Mapeamento Regional",
};

export default function TerritorioLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
