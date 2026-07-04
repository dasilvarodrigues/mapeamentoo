"use client";

import dynamic from "next/dynamic";

const MapaLeaflet = dynamic(() => import("./MapaTerritorialLeaflet"), { ssr: false });

interface MapaTerritorialProps {
  altura?: string;
}

export function MapaTerritorial({ altura = "600px" }: MapaTerritorialProps) {
  return <MapaLeaflet altura={altura} />;
}
