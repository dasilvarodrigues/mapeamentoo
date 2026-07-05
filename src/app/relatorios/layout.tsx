import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Relatórios | Cassol Mapeamento Regional",
};

export default function RelatoriosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
