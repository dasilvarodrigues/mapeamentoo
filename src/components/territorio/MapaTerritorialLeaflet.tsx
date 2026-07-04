"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet default icon
// @ts-expect-error
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function DrawControl() {
  const map = useMap();

  useEffect(() => {
    let drawnItems: L.FeatureGroup;
    let drawControl: L.Control;
    import("leaflet-draw").then(() => {
      drawnItems = new L.FeatureGroup();
      map.addLayer(drawnItems);

      drawControl = new (L.Control as any).Draw({
        edit: { featureGroup: drawnItems },
        draw: {
          polygon: true,
          polyline: true,
          rectangle: true,
          circle: false,
          marker: true,
          circlemarker: false,
        },
      });
      map.addControl(drawControl);

      map.on((L as any).Draw.Event.CREATED, (e: any) => {
        const layer = e.layer;
        drawnItems.addLayer(layer);
      });
    });

    return () => {
      if (drawControl) map.removeControl(drawControl);
    };
  }, [map]);

  return null;
}

interface MapaTerritorialLeafletProps {
  altura: string;
}

export default function MapaTerritorialLeaflet({ altura }: MapaTerritorialLeafletProps) {
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
        <DrawControl />
      </MapContainer>
    </div>
  );
}
