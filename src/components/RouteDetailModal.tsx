import React, { useEffect, useRef } from 'react';
import { RouteItem } from '../types.ts';
import { X, MapPin, Gauge, Mountain, Calendar, ArrowRight, User } from 'lucide-react';
import L from 'leaflet';
import { parseRouteCoordinates } from '../utils/mapUtils.ts';

interface RouteDetailModalProps {
  route: RouteItem | null;
  isOpen: boolean;
  onClose: () => void;
  onScheduleWithRoute: (route: RouteItem) => void;
}

export const RouteDetailModal: React.FC<RouteDetailModalProps> = ({
  route,
  isOpen,
  onClose,
  onScheduleWithRoute,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!isOpen || !route || !mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const points = parseRouteCoordinates(route.routeCoordinates);
    if (!points || points.length === 0) return;

    const startPoint = points[0];

    const map = L.map(mapContainerRef.current, {
      center: startPoint,
      zoom: 14,
      zoomControl: true,
      attributionControl: false,
    });

    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    // Route polyline
    const polyline = L.polyline(points, {
      color: '#FF4500',
      weight: 6,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);

    // Start Marker
    const startIcon = L.divIcon({
      className: 'custom-start-marker',
      html: `
        <div style="background-color: #121212; color: #CCFF00; border: 2px solid #CCFF00; font-family: 'Montserrat', sans-serif; font-weight: 900; font-size: 10px; padding: 4px 8px; border-radius: 6px; box-shadow: 0 4px 10px rgba(0,0,0,0.35); text-transform: uppercase; white-space: nowrap; display: flex; align-items: center; gap: 4px;">
          <span style="width: 6px; height: 6px; border-radius: 50%; background-color: #CCFF00;"></span>
          START
        </div>
      `,
      iconSize: [60, 24],
      iconAnchor: [30, 12],
    });
    L.marker(startPoint, { icon: startIcon }).addTo(map);

    // End Marker
    if (points.length > 1) {
      const endPoint = points[points.length - 1];
      const endIcon = L.divIcon({
        className: 'custom-end-marker',
        html: `
          <div style="background-color: #FF4500; color: #FFFFFF; font-family: 'Montserrat', sans-serif; font-weight: 900; font-size: 10px; padding: 4px 8px; border-radius: 6px; box-shadow: 0 4px 10px rgba(0,0,0,0.35); text-transform: uppercase; white-space: nowrap;">
            FINISH
          </div>
        `,
        iconSize: [60, 24],
        iconAnchor: [30, 12],
      });
      L.marker(endPoint, { icon: endIcon }).addTo(map);
    }

    map.fitBounds(polyline.getBounds(), { padding: [40, 40] });

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, route]);

  if (!isOpen || !route) return null;

  const difficultyColors = {
    Easy: 'bg-[#10B981] text-white',
    Moderate: 'bg-[#CCFF00] text-[#121212]',
    Hard: 'bg-[#FF4500] text-white',
    Challenging: 'bg-[#7F1D1D] text-white',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="athletic-card w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden bg-[#FFFFFF] shadow-2xl">
        {/* Modal Header */}
        <div className="bg-[#121212] text-white px-6 py-4 flex items-center justify-between border-b border-[#2A2A2E]">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded bg-[#FF4500] text-white font-heading font-black text-xs uppercase tracking-tight">
              {route.distanceKm} KM
            </span>
            <span
              className={`px-3 py-1 rounded font-heading font-black text-xs uppercase tracking-tight ${
                difficultyColors[route.difficulty] || 'bg-[#CCFF00] text-[#121212]'
              }`}
            >
              {route.difficulty} DIFFICULTY
            </span>
            <span className="px-2.5 py-1 rounded bg-[#28282D] text-[#C5C8D0] font-heading font-bold text-xs uppercase">
              {route.terrainType}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8E95A5] hover:text-white hover:bg-[#28282D] transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title & Creator */}
          <div>
            <h2 className="section-title-clamp text-[#121212] mb-2">{route.title}</h2>
            <div className="flex flex-wrap items-center gap-4 text-xs text-[#595E68]">
              <div className="flex items-center gap-2">
                {route.creatorPhoto ? (
                  <img
                    src={route.creatorPhoto}
                    alt={route.creatorName || 'Creator'}
                    referrerPolicy="no-referrer"
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-[#121212] text-[#CCFF00] flex items-center justify-center font-bold text-[10px]">
                    <User className="w-3 h-3" />
                  </div>
                )}
                <span className="font-heading font-bold text-[#121212] uppercase">
                  Saved by {route.creatorName || 'Club Runner'}
                </span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#FF4500]" />
                <span>{new Date(route.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Interactive Map */}
          <div className="athletic-card p-2 overflow-hidden bg-white">
            <div ref={mapContainerRef} className="w-full h-80 rounded-lg overflow-hidden" />
          </div>

          {/* Route Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="athletic-card p-4 text-center">
              <span className="text-[10px] font-heading font-black text-[#8E95A5] uppercase block mb-1">
                DISTANCE
              </span>
              <span className="text-2xl font-heading font-black text-[#FF4500]">
                {route.distanceKm} <span className="text-xs">KM</span>
              </span>
            </div>

            <div className="athletic-card p-4 text-center">
              <span className="text-[10px] font-heading font-black text-[#8E95A5] uppercase block mb-1">
                DIFFICULTY
              </span>
              <span className="text-lg font-heading font-black text-[#121212]">
                {route.difficulty}
              </span>
            </div>

            <div className="athletic-card p-4 text-center">
              <span className="text-[10px] font-heading font-black text-[#8E95A5] uppercase block mb-1">
                ELEVATION GAIN
              </span>
              <span className="text-2xl font-heading font-black text-[#121212] flex items-center justify-center gap-1">
                <Mountain className="w-4 h-4 text-[#FF4500]" />
                +{route.elevationGainM || 0}m
              </span>
            </div>

            <div className="athletic-card p-4 text-center">
              <span className="text-[10px] font-heading font-black text-[#8E95A5] uppercase block mb-1">
                TERRAIN
              </span>
              <span className="text-sm font-heading font-black text-[#121212] truncate block">
                {route.terrainType}
              </span>
            </div>
          </div>

          {/* Start Location Card */}
          <div className="athletic-card p-5 bg-[#F8F9FA]">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-[#121212] text-[#CCFF00] shrink-0 mt-0.5">
                <MapPin className="w-5 h-5 stroke-[2.5px]" />
              </div>
              <div>
                <span className="text-[10px] font-heading font-black text-[#8E95A5] uppercase tracking-wider block">
                  START & ASSEMBLY LOCATION
                </span>
                <p className="font-heading font-black text-base text-[#121212] uppercase tracking-tight">
                  {route.startLocation}
                </p>
                <p className="text-xs text-[#595E68] mt-0.5">
                  GPS Waypoint: {Number(route.startLat).toFixed(4)}, {Number(route.startLng).toFixed(4)}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          {route.description && (
            <div>
              <h4 className="text-xs font-heading font-black text-[#121212] uppercase tracking-wider mb-2">
                ROUTE NOTES & PACING TIPS
              </h4>
              <p className="text-sm text-[#595E68] leading-relaxed bg-[#F8F9FA] p-4 rounded-xl border border-[#E9ECEF]">
                {route.description}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer: Action Button to Schedule Run */}
        <div className="bg-[#121212] p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#2A2A2E]">
          <span className="text-xs font-heading font-bold text-[#8E95A5] uppercase text-center sm:text-left">
            Ready to host a group run with this course?
          </span>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="px-5 py-3 rounded-xl border border-[#2E2E32] text-white hover:bg-[#28282D] text-xs font-heading font-black uppercase transition-colors flex-1 sm:flex-initial"
            >
              CLOSE
            </button>
            <button
              onClick={() => {
                onClose();
                onScheduleWithRoute(route);
              }}
              className="btn-electric px-6 py-3 rounded-xl text-xs font-black flex-1 sm:flex-initial flex items-center justify-center gap-2"
            >
              <span>SCHEDULE RUN WITH THIS ROUTE</span>
              <ArrowRight className="w-4 h-4 stroke-[3px]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
