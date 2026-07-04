"use client";

import dynamic from "next/dynamic";

const MapaCalorLeaflet = dynamic(
  () => import("./MapaCalorLeaflet"),
  { ssr: false }
);

interface MapaCalorProps {
  altura?: string;
}

export function MapaCalor({ altura = "400px" }: MapaCalorProps) {
  return <MapaCalorLeaflet altura={altura} />;
}
