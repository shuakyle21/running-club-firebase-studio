import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { LatLngTuple } from '../types.ts';
import { calculateTotalRouteDistance, ROUTE_PRESETS } from '../utils/mapUtils.ts';
import { Undo, Trash2, MapPin, Zap } from 'lucide-react';

interface RoutePlannerMapProps {
  initialCoordinates?: LatLngTuple[];
  onChange: (coordinates: LatLngTuple[], distanceKm: number) => void;
  onMeetingPointSelected?: (lat: number, lng: number) => void;
}

export const RoutePlannerMap: React.FC<RoutePlannerMapProps> = ({
  initialCoordinates = [],
  onChange,
  onMeetingPointSelected,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  const [points, setPoints] = useState<LatLngTuple[]>(
    initialCoordinates.length > 0 ? initialCoordinates : ROUTE_PRESETS[0].coordinates
  );
  const [activePreset, setActivePreset] = useState<string>(ROUTE_PRESETS[0].name);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const defaultCenter: LatLngTuple = points.length > 0 ? points[0] : [1.2838, 103.8591];

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 14,
      attributionControl: false,
    });

    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    map.on('click', (e: L.LeafletMouseEvent) => {
      const newPoint: LatLngTuple = [Number(e.latlng.lat.toFixed(5)), Number(e.latlng.lng.toFixed(5))];
      setPoints((prev) => {
        const next = [...prev, newPoint];
        const dist = calculateTotalRouteDistance(next);
        onChange(next, dist);
        return next;
      });
      setActivePreset('');
    });

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    if (points.length === 0) return;

    // Draw kinetic orange route line
    const polyline = L.polyline(points, {
      color: '#FF4500',
      weight: 5,
      opacity: 0.95,
      lineJoin: 'round',
    }).addTo(map);
    polylineRef.current = polyline;

    // Start Marker (Electric Neon)
    const startPoint = points[0];
    const startIcon = L.divIcon({
      className: 'start-marker',
      html: `<div style="background-color: #CCFF00; color: #121212; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: 'Montserrat', sans-serif; font-weight: 900; font-size: 11px; box-shadow: 0 3px 10px rgba(0,0,0,0.4); border: 2px solid #121212;">START</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });

    const startMarker = L.marker(startPoint, { icon: startIcon }).addTo(map);
    markersRef.current.push(startMarker);

    if (onMeetingPointSelected) {
      onMeetingPointSelected(startPoint[0], startPoint[1]);
    }

    if (points.length > 1) {
      const endPoint = points[points.length - 1];
      const isLoop =
        Math.abs(startPoint[0] - endPoint[0]) < 0.0005 &&
        Math.abs(startPoint[1] - endPoint[1]) < 0.0005;

      if (!isLoop) {
        const endIcon = L.divIcon({
          className: 'end-marker',
          html: `<div style="background-color: #121212; color: #CCFF00; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: 'Montserrat', sans-serif; font-weight: 900; font-size: 11px; box-shadow: 0 3px 10px rgba(0,0,0,0.4); border: 2px solid #CCFF00;">FINISH</div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });
        const endMarker = L.marker(endPoint, { icon: endIcon }).addTo(map);
        markersRef.current.push(endMarker);
      }
    }

    try {
      const bounds = polyline.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    } catch {
      // ignore
    }
  }, [points]);

  const handleUndo = () => {
    if (points.length === 0) return;
    const next = points.slice(0, -1);
    setPoints(next);
    const dist = calculateTotalRouteDistance(next);
    onChange(next, dist);
  };

  const handleClear = () => {
    setPoints([]);
    onChange([], 0);
    setActivePreset('');
  };

  const handleSelectPreset = (preset: typeof ROUTE_PRESETS[0]) => {
    setPoints(preset.coordinates);
    setActivePreset(preset.name);
    const dist = calculateTotalRouteDistance(preset.coordinates);
    onChange(preset.coordinates, dist);
    if (mapInstanceRef.current && preset.coordinates.length > 0) {
      mapInstanceRef.current.setView(preset.coordinates[0], 14);
    }
  };

  const totalDistance = calculateTotalRouteDistance(points);

  return (
    <div className="space-y-3">
      {/* Route Presets Bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-heading font-black text-[#121212] uppercase flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-[#FF4500]" />
            <span>CLUB TEMPLATES OR CUSTOM DRAW:</span>
          </label>
          <span className="text-[11px] font-semibold text-[#595E68]">Click map to plot GPS points</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {ROUTE_PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => handleSelectPreset(preset)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-heading font-black uppercase transition-all ${
                activePreset === preset.name
                  ? 'bg-[#121212] text-[#CCFF00] shadow-sm'
                  : 'bg-white border border-[#E9ECEF] text-[#595E68] hover:border-[#121212]'
              }`}
            >
              {preset.name} ({preset.distance}KM)
            </button>
          ))}
        </div>
      </div>

      {/* Map Canvas with Floating HUD */}
      <div className="relative rounded-xl overflow-hidden border-2 border-[#121212] shadow-md">
        <div ref={mapContainerRef} style={{ height: '320px', width: '100%' }} />

        {/* Floating Distance Badge (Asphalt & Neon HUD) */}
        <div className="absolute top-3 left-3 z-20 bg-[#121212]/95 backdrop-blur-md px-4 py-2.5 rounded-xl shadow-xl border border-[#2E2E32] flex items-center gap-4 text-white">
          <div>
            <span className="text-[9px] font-heading font-black text-[#8E95A5] uppercase tracking-wider block">
              TOTAL DISTANCE
            </span>
            <span className="text-xl font-heading font-black text-[#CCFF00]">
              {totalDistance > 0 ? `${totalDistance} KM` : '0.0 KM'}
            </span>
          </div>
          <div className="h-8 w-[1px] bg-[#2E2E32]" />
          <div>
            <span className="text-[9px] font-heading font-black text-[#8E95A5] uppercase tracking-wider block">
              WAYPOINTS
            </span>
            <span className="text-sm font-heading font-black text-white">
              {points.length} PTS
            </span>
          </div>
        </div>

        {/* Floating Actions: Undo, Clear */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-[#121212]/95 backdrop-blur-md p-1.5 rounded-xl shadow-xl border border-[#2E2E32]">
          <button
            type="button"
            onClick={handleUndo}
            disabled={points.length === 0}
            title="Undo last waypoint"
            className="p-2 rounded-lg text-white hover:bg-[#28282D] disabled:opacity-40 transition-colors"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={points.length === 0}
            title="Clear route"
            className="p-2 rounded-lg text-[#FF4500] hover:bg-[#FF4500]/20 disabled:opacity-40 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Floating Bottom Help Helper */}
        <div className="absolute bottom-2 left-3 right-3 z-20 bg-[#121212]/90 backdrop-blur-xs px-3.5 py-1.5 rounded-lg text-[11px] text-[#C5C8D0] font-medium flex items-center justify-between border border-[#2E2E32]">
          <span className="flex items-center gap-1 text-[#CCFF00]">
            <MapPin className="w-3.5 h-3.5" />
            Neon point is meeting & starting line
          </span>
          <span className="text-[#8E95A5]">Tap map anywhere to extend route</span>
        </div>
      </div>
    </div>
  );
};
