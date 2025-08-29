'use client'

import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css'
import "leaflet-defaulticon-compatibility"

// This is a client component that will be dynamically loaded to avoid SSR issues.

interface MapProps {
  position: [number, number];
  zoom?: number;
  radius?: number; // in meters
}

const DynamicMap: React.FC<MapProps> = ({ position, zoom = 13, radius }) => {
  return (
    <MapContainer center={position} zoom={zoom} scrollWheelZoom={false} style={{ height: '400px', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={position} />
      {radius && <Circle center={position} radius={radius} />}
    </MapContainer>
  )
}

export default DynamicMap
