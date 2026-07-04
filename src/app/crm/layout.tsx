import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CRM Comunitário | Cassol Mapeamento Regional",
};

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
