
"use client";

import { useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet icon issue with webpack
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconRetinaUrl: iconRetinaUrl.src,
    iconUrl: iconUrl.src,
    shadowUrl: shadowUrl.src,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface InteractiveMapProps {
    position: { lat: number; lng: number } | null | undefined;
    onPositionChange: (position: { lat: number; lng: number }) => void;
}

function MapEvents({ onPositionChange }: { onPositionChange: (pos: L.LatLng) => void }) {
    useMapEvents({
        click(e) {
            onPositionChange(e.latlng);
        },
    });
    return null;
}

function MarkerAndCenter({ position, onPositionChange }: InteractiveMapProps) {
    const map = useMap();
    const markerRef = useRef<L.Marker>(null);

    const eventHandlers = useMemo(
        () => ({
            dragend() {
                const marker = markerRef.current;
                if (marker != null) {
                    onPositionChange(marker.getLatLng());
                }
            },
        }),
        [onPositionChange],
    );

    if (position && (map.getCenter().lat !== position.lat || map.getCenter().lng !== position.lng)) {
        map.setView(position, map.getZoom());
    }

    return position ? (
        <Marker
            draggable={true}
            eventHandlers={eventHandlers}
            position={position}
            ref={markerRef}
        />
    ) : null;
}


export default function InteractiveMap({ position, onPositionChange }: InteractiveMapProps) {
    const mapCenter: L.LatLngExpression = position || [19.4326, -99.1332];

    return (
        <MapContainer
            center={mapCenter}
            zoom={position ? 15 : 5}
            style={{ height: '100%', width: '100%' }}
            className="z-0"
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapEvents onPositionChange={(pos) => onPositionChange(pos)} />
            <MarkerAndCenter position={position} onPositionChange={onPositionChange} />
        </MapContainer>
    );
}
