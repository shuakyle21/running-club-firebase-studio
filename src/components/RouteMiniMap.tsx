import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { LatLngTuple } from '../types.ts';
import { parseRouteCoordinates } from '../utils/mapUtils.ts';

interface RouteMiniMapProps {
  coordinates: string | LatLngTuple[];
  height?: string;
  interactive?: boolean;
}

export const RouteMiniMap: React.FC<RouteMiniMapProps> = ({
  coordinates,
  height = '180px',
  interactive = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const points = parseRouteCoordinates(coordinates);
    if (!points || points.length === 0) return;

    const startPoint = points[0];

    const map = L.map(mapContainerRef.current, {
      center: startPoint,
      zoom: 14,
      zoomControl: interactive,
      dragging: interactive,
      scrollWheelZoom: false,
      doubleClickZoom: interactive,
      attributionControl: false,
    });

    mapInstanceRef.current = map;

    // Crisp high-contrast clean tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    // Kinetic Vibrant Orange Polyline
    const polyline = L.polyline(points, {
      color: '#FF4500',
      weight: 5,
      opacity: 0.95,
      lineJoin: 'round',
      lineCap: 'round',
    }).addTo(map);

    // Start Marker (Electric Neon #CCFF00 with bold dark text)
    const startIcon = L.divIcon({
      className: 'custom-start-marker',
      html: `
        <div style="
          background-color: #CCFF00;
          color: #121212;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Montserrat', sans-serif;
          font-weight: 900;
          font-size: 11px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.35);
          border: 2px solid #121212;
        ">S</div>
      `,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    });

    L.marker(startPoint, { icon: startIcon }).addTo(map);

    // End Marker
    const endPoint = points[points.length - 1];
    const isLoop =
      Math.abs(startPoint[0] - endPoint[0]) < 0.0005 &&
      Math.abs(startPoint[1] - endPoint[1]) < 0.0005;

    if (!isLoop && points.length > 2) {
      const endIcon = L.divIcon({
        className: 'custom-end-marker',
        html: `
          <div style="
            background-color: #121212;
            color: #CCFF00;
            width: 26px;
            height: 26px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Montserrat', sans-serif;
            font-weight: 900;
            font-size: 11px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.35);
            border: 2px solid #CCFF00;
          ">F</div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });
      L.marker(endPoint, { icon: endIcon }).addTo(map);
    }

    try {
      const bounds = polyline.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [25, 25] });
      }
    } catch {
      // ignore
    }

    setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [coordinates, interactive]);

  return (
    <div
      ref={mapContainerRef}
      style={{ height, width: '100%' }}
      className="relative rounded-xl overflow-hidden bg-[#F0F2F5] border border-[#E9ECEF]"
    />
  );
};
