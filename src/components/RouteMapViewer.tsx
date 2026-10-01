import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { RunItem, LatLngTuple } from '../types.ts';
import { RouteMiniMap } from './RouteMiniMap.tsx';
import { parseRouteCoordinates, generateGpxString } from '../utils/mapUtils.ts';
import {
  Calendar,
  MapPin,
  Users,
  Share2,
  Download,
  CheckCircle2,
  Check,
  ArrowRight,
  Plus,
  Maximize2,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

interface RouteMapViewerProps {
  runs: RunItem[];
  onSelectRun: (run: RunItem) => void;
  onToggleRsvp: (runId: number) => void;
  selectedRunId?: number | null;
}

export const RouteMapViewer: React.FC<RouteMapViewerProps> = ({
  runs,
  onSelectRun,
  onToggleRsvp,
  selectedRunId,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polylinesRef = useRef<{ [runId: number]: L.Polyline }>({});
  const markersRef = useRef<{ [runId: number]: L.Marker }>({});

  const [activeFilter, setActiveFilter] = useState<'all' | '5k' | '10k' | 'long'>('all');
  const [selectedRun, setSelectedRun] = useState<RunItem | null>(
    runs.find((r) => r.id === selectedRunId) || runs[0] || null
  );
  const [copiedNotification, setCopiedNotification] = useState(false);

  useEffect(() => {
    if (selectedRunId) {
      const found = runs.find((r) => r.id === selectedRunId);
      if (found) setSelectedRun(found);
    } else if (!selectedRun && runs.length > 0) {
      setSelectedRun(runs[0]);
    }
  }, [selectedRunId, runs]);

  const filteredRuns = runs.filter((run) => {
    const dist = parseFloat(run.distanceKm);
    if (activeFilter === '5k') return dist <= 6;
    if (activeFilter === '10k') return dist > 6 && dist <= 12;
    if (activeFilter === 'long') return dist > 12;
    return true;
  });

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const initialCenter: LatLngTuple =
      runs.length > 0
        ? [parseFloat(runs[0].startLat) || 1.2838, parseFloat(runs[0].startLng) || 103.8591]
        : [1.2838, 103.8591];

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 13,
      attributionControl: false,
    });

    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

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

  // Render Polylines and Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    Object.values(polylinesRef.current).forEach((p) => p.remove());
    Object.values(markersRef.current).forEach((m) => m.remove());
    polylinesRef.current = {};
    markersRef.current = {};

    const allBounds = L.latLngBounds([]);

    filteredRuns.forEach((run) => {
      const isCurrentSelected = selectedRun?.id === run.id;
      const points = parseRouteCoordinates(run.routeCoordinates);
      if (!points || points.length === 0) return;

      points.forEach((p) => allBounds.extend(p));

      // Draw polyline: Vibrant Orange #FF4500 if selected, Dark Asphalt if not
      const polyline = L.polyline(points, {
        color: isCurrentSelected ? '#FF4500' : '#121212',
        weight: isCurrentSelected ? 6 : 3.5,
        opacity: isCurrentSelected ? 1 : 0.6,
        dashArray: isCurrentSelected ? undefined : '6, 6',
        lineJoin: 'round',
      }).addTo(map);

      polyline.on('click', () => {
        setSelectedRun(run);
      });

      polylinesRef.current[run.id] = polyline;

      // Draw Custom Start Marker Pin
      const startPoint = points[0];
      const distBadge = `${Math.round(parseFloat(run.distanceKm))}KM`;

      const markerIcon = L.divIcon({
        className: 'route-start-pin',
        html: `
          <div style="
            background: ${isCurrentSelected ? '#FF4500' : '#121212'};
            color: ${isCurrentSelected ? '#FFFFFF' : '#CCFF00'};
            border: 2px solid ${isCurrentSelected ? '#FFFFFF' : '#121212'};
            box-shadow: 0 4px 14px rgba(0,0,0,0.3);
            padding: 4px 10px;
            border-radius: 8px;
            font-family: 'Montserrat', sans-serif;
            font-size: 11px;
            font-weight: 900;
            display: flex;
            align-items: center;
            gap: 6px;
            white-space: nowrap;
            transform: translateY(-50%);
            transition: all 0.2s ease;
          ">
            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${
              isCurrentSelected ? '#CCFF00' : '#FF4500'
            };"></span>
            ${distBadge} · ${run.title.slice(0, 16).toUpperCase()}
          </div>
        `,
        iconSize: [130, 32],
        iconAnchor: [65, 16],
      });

      const marker = L.marker(startPoint, { icon: markerIcon }).addTo(map);
      marker.on('click', () => {
        setSelectedRun(run);
      });
      markersRef.current[run.id] = marker;
    });

    if (selectedRun) {
      const selectedPoints = parseRouteCoordinates(selectedRun.routeCoordinates);
      if (selectedPoints.length > 0) {
        const routeBounds = L.latLngBounds(selectedPoints);
        map.fitBounds(routeBounds, { padding: [60, 60], maxZoom: 15 });
      }
    } else if (allBounds.isValid()) {
      map.fitBounds(allBounds, { padding: [50, 50] });
    }
  }, [filteredRuns, selectedRun?.id]);

  const handleShareRoute = (run: RunItem) => {
    const text = `Stride Running Club: ${run.title} (${run.distanceKm}km)\nMeeting Point: ${run.meetingPoint}\nDate: ${new Date(run.scheduledAt).toLocaleDateString()}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 2500);
    }
  };

  const handleDownloadGpx = (run: RunItem) => {
    const points = parseRouteCoordinates(run.routeCoordinates);
    const gpxData = generateGpxString(run.title, points);
    const blob = new Blob([gpxData], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${run.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_route.gpx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRecenterAll = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const allBounds = L.latLngBounds([]);
    runs.forEach((r) => {
      const pts = parseRouteCoordinates(r.routeCoordinates);
      pts.forEach((p) => allBounds.extend(p));
    });
    if (allBounds.isValid()) {
      map.fitBounds(allBounds, { padding: [50, 50] });
    }
  };

  return (
    <section
      className="relative w-full h-[calc(100vh-140px)] md:h-[calc(100vh-80px)] overflow-hidden bg-[#121212]"
      aria-label="Integrated Route Map Explorer"
    >
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Filter Chips Bar (Asphalt & Neon Styling) */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-1.5 bg-[#121212]/95 backdrop-blur-md p-1.5 rounded-xl shadow-xl border border-[#2E2E32] pointer-events-auto overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-lg text-xs font-heading font-black uppercase whitespace-nowrap transition-all ${
              activeFilter === 'all'
                ? 'bg-[#CCFF00] text-[#121212] shadow-sm scale-102'
                : 'text-[#C5C8D0] hover:text-white hover:bg-[#1E1E1E]'
            }`}
          >
            ALL ROUTES ({runs.length})
          </button>
          <button
            onClick={() => setActiveFilter('5k')}
            className={`px-4 py-2 rounded-lg text-xs font-heading font-black uppercase whitespace-nowrap transition-all ${
              activeFilter === '5k'
                ? 'bg-[#CCFF00] text-[#121212] shadow-sm scale-102'
                : 'text-[#C5C8D0] hover:text-white hover:bg-[#1E1E1E]'
            }`}
          >
            ≤ 5KM
          </button>
          <button
            onClick={() => setActiveFilter('10k')}
            className={`px-4 py-2 rounded-lg text-xs font-heading font-black uppercase whitespace-nowrap transition-all ${
              activeFilter === '10k'
                ? 'bg-[#CCFF00] text-[#121212] shadow-sm scale-102'
                : 'text-[#C5C8D0] hover:text-white hover:bg-[#1E1E1E]'
            }`}
          >
            6 – 12KM
          </button>
          <button
            onClick={() => setActiveFilter('long')}
            className={`px-4 py-2 rounded-lg text-xs font-heading font-black uppercase whitespace-nowrap transition-all ${
              activeFilter === 'long'
                ? 'bg-[#CCFF00] text-[#121212] shadow-sm scale-102'
                : 'text-[#C5C8D0] hover:text-white hover:bg-[#1E1E1E]'
            }`}
          >
            12KM+ LONG
          </button>
        </div>

        {/* Re-center Control */}
        <button
          onClick={handleRecenterAll}
          title="Fit all routes"
          className="hidden sm:flex items-center gap-2 bg-[#121212]/95 backdrop-blur-md px-4 py-2.5 rounded-xl shadow-xl border border-[#2E2E32] text-xs font-heading font-black uppercase text-[#CCFF00] hover:bg-[#1E1E1E] pointer-events-auto transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
          <span>FIT ALL</span>
        </button>
      </div>

      {/* Copy Notification Toast */}
      {copiedNotification && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 bg-[#121212] text-[#CCFF00] border border-[#CCFF00] px-5 py-2.5 rounded-xl shadow-2xl text-xs font-heading font-black uppercase flex items-center gap-2 animate-in fade-in zoom-in-95">
          <CheckCircle2 className="w-4 h-4 text-[#CCFF00]" />
          <span>ROUTE DETAILS COPIED TO CLIPBOARD</span>
        </div>
      )}

      {/* Selected Run Card: Refined Athletic Card */}
      {selectedRun && (
        <aside
          id="map-selected-run-card"
          className="athletic-card absolute bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:w-[400px] z-30 p-5 transition-all duration-200 animate-in slide-in-from-bottom-6 shadow-xl"
        >
          {/* Badges & Title */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="px-3 py-1 rounded bg-[#FF4500] text-white font-heading font-black text-xs uppercase tracking-tight shadow-xs">
                  {selectedRun.distanceKm} KM
                </span>
                <span className="px-2.5 py-1 rounded bg-[#121212] text-[#CCFF00] font-heading font-black text-xs uppercase tracking-tight">
                  {selectedRun.pace}
                </span>
                <span className="px-2 py-0.5 rounded bg-[#F0F2F5] text-[#595E68] font-heading font-bold text-[10px] uppercase">
                  {selectedRun.terrainType}
                </span>
              </div>
              <h3 className="font-heading font-black text-base text-[#121212] uppercase tracking-tight line-clamp-1">
                {selectedRun.title}
              </h3>
            </div>
          </div>

          {/* Meeting Point & Schedule */}
          <div className="space-y-1.5 text-xs text-[#595E68] mb-3">
            <div className="flex items-center gap-2 font-heading font-bold text-[#FF4500] uppercase">
              <div className="w-5 h-5 rounded-md bg-[#FF4500]/10 flex items-center justify-center shrink-0">
                <Calendar className="w-3 h-3 text-[#FF4500] stroke-[2.5px]" />
              </div>
              <span>
                {new Date(selectedRun.scheduledAt).toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <div className="flex items-center gap-2 font-medium text-[#121212]">
              <div className="w-5 h-5 rounded-md bg-[#FF4500]/10 flex items-center justify-center shrink-0">
                <MapPin className="w-3 h-3 text-[#FF4500] stroke-[2.5px]" />
              </div>
              <span className="truncate">{selectedRun.meetingPoint}</span>
            </div>
            {selectedRun.elevationGainM > 0 && (
              <div className="flex items-center gap-2 text-[#595E68] font-semibold">
                <div className="w-5 h-5 rounded-md bg-[#121212]/5 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-3 h-3 text-[#121212] stroke-[2.5px]" />
                </div>
                <span>+{selectedRun.elevationGainM}m elevation</span>
              </div>
            )}
          </div>

          {/* Attendees Counter & Roster */}
          <div className="p-3 rounded-xl bg-[#F8F9FA] border border-[#E9ECEF] mb-3.5">
            <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-[#E9ECEF]">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-md bg-[#121212] text-[#CCFF00] flex items-center justify-center shrink-0">
                  <Users className="w-3.5 h-3.5 stroke-[2.5px]" />
                </div>
                <div className="min-w-0">
                  <span className="font-heading font-black text-xs uppercase text-[#121212] tracking-tight block leading-none truncate">
                    {selectedRun.attendeeCount} {selectedRun.attendeeCount === 1 ? 'RUNNER' : 'RUNNERS'}
                  </span>
                  <span className="text-[9px] font-bold text-[#8E95A5] uppercase tracking-wider block mt-1 leading-none">
                    ATTENDING
                  </span>
                </div>
              </div>
              {selectedRun.isUserRsvpd ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#121212] text-[#CCFF00] text-[9px] font-heading font-black uppercase tracking-wider shrink-0 whitespace-nowrap border border-[#2E2E32]">
                  <CheckCircle2 className="w-3 h-3 stroke-[2.5px] text-[#CCFF00]" />
                  <span>YOU'RE GOING</span>
                </span>
              ) : (
                <span className="text-[9px] font-heading font-bold text-[#8E95A5] uppercase tracking-wider shrink-0 whitespace-nowrap bg-white px-2 py-0.5 rounded border border-[#E9ECEF]">
                  MAX {selectedRun.maxParticipants || 30}
                </span>
              )}
            </div>

            {selectedRun.attendees && selectedRun.attendees.length > 0 ? (
              <div className="flex items-center gap-2.5">
                <div className="flex items-center -space-x-1.5 shrink-0">
                  {selectedRun.attendees.slice(0, 4).map((att, idx) => (
                    <div
                      key={att.id || idx}
                      title={att.userName || 'Member'}
                      className="relative"
                    >
                      {att.userPhoto ? (
                        <img
                          src={att.userPhoto}
                          alt={att.userName || 'Runner'}
                          className="w-6 h-6 rounded-full object-cover ring-2 ring-white border border-[#E9ECEF] shadow-2xs"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-[#121212] text-[#CCFF00] font-heading font-black text-[9px] flex items-center justify-center ring-2 ring-white border border-[#2E2E32] shadow-2xs">
                          {(att.userName || 'R')[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                  ))}
                  {selectedRun.attendees.length > 4 && (
                    <div className="w-6 h-6 rounded-full bg-[#FF4500] text-white font-heading font-black text-[9px] flex items-center justify-center ring-2 ring-white shadow-2xs">
                      +{selectedRun.attendees.length - 4}
                    </div>
                  )}
                </div>
                <span className="text-xs text-[#595E68] font-medium truncate">
                  {selectedRun.attendees.slice(0, 2).map((a) => a.userName?.split(' ')[0] || 'Runner').join(', ')}
                  {selectedRun.attendees.length > 2 ? ` +${selectedRun.attendees.length - 2}` : ''}
                </span>
              </div>
            ) : (
              <p className="text-xs text-[#8E95A5] italic">No runners RSVP'd yet</p>
            )}
          </div>

          {/* Host Info */}
          <div className="flex items-center justify-between py-1.5 border-t border-[#E9ECEF] mb-3 text-xs">
            <div className="flex items-center gap-2">
              {selectedRun.creatorPhoto ? (
                <img
                  src={selectedRun.creatorPhoto}
                  alt={selectedRun.creatorName || 'Host'}
                  className="w-6 h-6 rounded-md object-cover ring-1 ring-[#FF4500]"
                />
              ) : (
                <div className="w-6 h-6 rounded-md bg-[#121212] text-[#CCFF00] flex items-center justify-center font-heading font-black text-[10px]">
                  {selectedRun.creatorName?.[0] || 'C'}
                </div>
              )}
              <span className="text-[#595E68] text-xs font-semibold">
                HOST: <strong className="text-[#121212]">{selectedRun.creatorName?.split(' ')[0] || 'PACER'}</strong>
              </span>
            </div>
          </div>

          {/* Action Buttons: Clean Athletic RSVP + Share/GPX buttons */}
          <div className="grid grid-cols-2 gap-2.5 items-center">
            {selectedRun.isUserRsvpd ? (
              <button
                onClick={() => onToggleRsvp(selectedRun.id)}
                className="h-10 px-3 bg-[#121212] hover:bg-[#1E1E1E] border-[2.5px] border-[#121212] text-[#FFE600] font-heading font-black text-xs uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#121212] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#121212] active:translate-y-0.5 active:translate-x-0.5 active:shadow-[1px_1px_0px_#121212]"
              >
                <Check className="w-4 h-4 stroke-[3.5px] text-[#FFE600]" />
                <span>GOING</span>
              </button>
            ) : (
              <button
                onClick={() => onToggleRsvp(selectedRun.id)}
                className="h-10 px-3 bg-[#FF4500] hover:bg-[#E03E00] border-[2.5px] border-[#121212] text-white font-heading font-black text-xs uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#121212] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#121212] active:translate-y-0.5 active:translate-x-0.5 active:shadow-[1px_1px_0px_#121212]"
              >
                <span>I'M GOING</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[3px]" />
              </button>
            )}

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleShareRoute(selectedRun)}
                title="Share route link"
                className="flex-1 h-10 flex items-center justify-center gap-1 px-2 bg-white border-[2.5px] border-[#121212] font-heading font-black text-xs uppercase text-[#121212] hover:bg-[#121212] hover:text-white transition-all shadow-[2px_2px_0px_#121212] hover:-translate-y-0.5 active:translate-y-0.5 active:translate-x-0.5 active:shadow-[1px_1px_0px_#121212]"
              >
                <Share2 className="w-3.5 h-3.5 stroke-[2.5px]" />
                <span>SHARE</span>
              </button>

              <button
                onClick={() => handleDownloadGpx(selectedRun)}
                title="Download GPX file for Garmin/Apple Watch"
                className="h-10 px-2.5 bg-white border-[2.5px] border-[#121212] text-[#121212] hover:bg-[#121212] hover:text-white transition-all shadow-[2px_2px_0px_#121212] hover:-translate-y-0.5 active:translate-y-0.5 active:translate-x-0.5 active:shadow-[1px_1px_0px_#121212]"
              >
                <Download className="w-3.5 h-3.5 stroke-[2.5px]" />
              </button>

              <button
                onClick={() => onSelectRun(selectedRun)}
                title="View full specification modal"
                className="h-10 px-2.5 bg-white border-[2.5px] border-[#121212] text-[#121212] hover:bg-[#121212] hover:text-white transition-all shadow-[2px_2px_0px_#121212] hover:-translate-y-0.5 active:translate-y-0.5 active:translate-x-0.5 active:shadow-[1px_1px_0px_#121212]"
              >
                <Maximize2 className="w-3.5 h-3.5 stroke-[2.5px]" />
              </button>
            </div>
          </div>
        </aside>
      )}
    </section>
  );
};
