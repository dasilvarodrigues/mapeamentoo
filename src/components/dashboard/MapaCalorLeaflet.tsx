"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet.heat";
import { GeoJSONData } from "@/types/dashboard";

function HeatMapLayer() {
  const map = useMap();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layerRef = useRef<any>(null);

  useEffect(() => {
    fetch("/api/dashboard/mapa")
      .then((r) => r.json())
      .then((data: GeoJSONData) => {
        if (layerRef.current) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (map as any).removeLayer(layerRef.current);
        }

        const points: [number, number, number][] = data.features
          .filter((f) => f.geometry.type === "Point")
          .map((f) => {
            const coords = f.geometry.coordinates;
            return [coords[1], coords[0], 1] as [number, number, number];
          });

        if (points.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          layerRef.current = (L as any).heatLayer(points, {
            radius: 25,
            blur: 15,
            maxZoom: 17,
            gradient: {
              0.2: "#3b82f6",
              0.4: "#0057D9",
              0.6: "#ff7300",
              0.8: "#ff4500",
              1.0: "#dc2626",
            },
          });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          layerRef.current.addTo(map);
        }
      })
      .catch(console.error);

    return () => {
      if (layerRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (map as any).removeLayer(layerRef.current);
      }
    };
  }, [map]);

  return null;
}

interface MapaCalorLeafletProps {
  altura: string;
}

export default function MapaCalorLeaflet({ altura }: MapaCalorLeafletProps) {
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
        <HeatMapLayer />
      </MapContainer>
    </div>
  );
}
