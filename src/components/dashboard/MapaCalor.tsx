"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet.heat";
import { GeoJSONData } from "@/types/dashboard";

function HeatMapLayer() {
  const map = useMap();
  const layerRef = useRef<L.HeatLayer | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/mapa")
      .then((r) => r.json())
      .then((data: GeoJSONData) => {
        if (layerRef.current) {
          map.removeLayer(layerRef.current);
        }

        const points: [number, number, number][] = data.features
          .filter((f) => f.geometry.type === "Point")
          .map((f) => {
            const coords = f.geometry.coordinates;
            return [coords[1], coords[0], 1] as [number, number, number];
          });

        if (points.length > 0) {
          layerRef.current = L.heatLayer(points, {
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
          layerRef.current.addTo(map);
        }
      })
      .catch(console.error);

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
      }
    };
  }, [map]);

  return null;
}

interface MapaCalorProps {
  altura?: string;
}

export function MapaCalor({ altura = "400px" }: MapaCalorProps) {
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
