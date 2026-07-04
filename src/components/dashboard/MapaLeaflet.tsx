"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { GeoJSONData } from "@/types/dashboard";

// @ts-expect-error - Leaflet icon type issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface MapaLeafletProps {
  altura: string;
}

export default function MapaLeaflet({ altura }: MapaLeafletProps) {
  const [dados, setDados] = useState<GeoJSONData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/mapa")
      .then((r) => r.json())
      .then(setDados)
      .catch(console.error);
  }, []);

  if (!dados) {
    return (
      <div
        className="glass rounded-xl flex items-center justify-center"
        style={{ height: altura }}
      >
        <p className="text-muted-foreground">Carregando mapa...</p>
      </div>
    );
  }

  const pontos = dados.features.filter(
    (f): f is {
      type: "Feature";
      geometry: { type: "Point"; coordinates: number[] };
      properties: { id: string; nome: string; totalDemandas: number; categoria?: string; status?: string };
    } => f.geometry.type === "Point"
  );

  return (
    <div className="glass rounded-xl overflow-hidden" style={{ height: altura }}>
      <MapContainer
        center={[-23.5505, -46.6333]}
        zoom={10}
        className="w-full h-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {pontos.map((p, idx) => {
          const [lng, lat] = p.geometry.coordinates;
          if (typeof lat !== "number" || typeof lng !== "number") return null;
          return (
            <Marker key={p.properties.id || String(idx)} position={[lat, lng]}>
              <Popup>
                <strong>{p.properties.nome || p.properties.categoria || ""}</strong>
                <br />
                {p.properties.status && `Status: ${p.properties.status}`}
                {p.properties.totalDemandas !== undefined &&
                  ` Demandas: ${p.properties.totalDemandas}`}
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
