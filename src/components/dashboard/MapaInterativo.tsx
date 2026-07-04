"use client";

import dynamic from "next/dynamic";
import { GeoJSONData } from "@/types/dashboard";

const MapaLeaflet = dynamic(
  () => import("./MapaLeaflet"),
  { ssr: false }
);

interface MapaInterativoProps {
  altura?: string;
}

export function MapaInterativo({ altura = "400px" }: MapaInterativoProps) {
  return <MapaLeaflet altura={altura} />;
}
