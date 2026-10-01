import React, { useState, useEffect } from 'react';
import { RoutePlannerMap } from './RoutePlannerMap.tsx';
import { LatLngTuple, RouteItem } from '../types.ts';
import { ROUTE_PRESETS, parseRouteCoordinates } from '../utils/mapUtils.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  X,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  LogIn,
  Zap,
  Compass,
  Bookmark,
  Check,
  RotateCcw,
} from 'lucide-react';

interface PostRunModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunCreated: () => void;
  initialRoute?: RouteItem | null;
}

export const PostRunModal: React.FC<PostRunModalProps> = ({
  isOpen,
  onClose,
  onRunCreated,
  initialRoute = null,
}) => {
  const { user, idToken, signInWithGoogle } = useAuth();

  const [libraryRoutes, setLibraryRoutes] = useState<RouteItem[]>([]);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<RouteItem | null>(initialRoute);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [meetingPoint, setMeetingPoint] = useState(ROUTE_PRESETS[0].meetingPoint);
  const [scheduledDate, setScheduledDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [scheduledTime, setScheduledTime] = useState('06:30');
  const [pace, setPace] = useState('All Paces Welcome');
  const [terrainType, setTerrainType] = useState('Road');
  const [elevationGainM, setElevationGainM] = useState<number>(18);
  const [maxParticipants, setMaxParticipants] = useState<number>(30);
  const [coordinates, setCoordinates] = useState<LatLngTuple[]>(ROUTE_PRESETS[0].coordinates);
  const [distanceKm, setDistanceKm] = useState<number>(ROUTE_PRESETS[0].distance);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch available routes from Route Library on modal open
  useEffect(() => {
    if (!isOpen) return;

    const fetchRoutes = async () => {
      setIsLoadingRoutes(true);
      try {
        const res = await fetch('/api/routes');
        if (res.ok) {
          const data = await res.json();
          setLibraryRoutes(data);
        }
      } catch (err) {
        console.warn('Failed to fetch routes for scheduler:', err);
      } finally {
        setIsLoadingRoutes(false);
      }
    };

    fetchRoutes();
  }, [isOpen]);

  // Apply initialRoute or preselected route
  useEffect(() => {
    if (initialRoute) {
      applyRoute(initialRoute);
    }
  }, [initialRoute]);

  const applyRoute = (route: RouteItem) => {
    setSelectedRoute(route);
    setTitle((prev) => (prev ? prev : `Club Run: ${route.title}`));
    setMeetingPoint(route.startLocation);
    setDistanceKm(parseFloat(route.distanceKm));
    setTerrainType(route.terrainType);
    setElevationGainM(route.elevationGainM || 0);

    const parsed = parseRouteCoordinates(route.routeCoordinates);
    if (parsed.length > 0) {
      setCoordinates(parsed);
    }
  };

  const clearSelectedRoute = () => {
    setSelectedRoute(null);
    setCoordinates(ROUTE_PRESETS[0].coordinates);
    setDistanceKm(ROUTE_PRESETS[0].distance);
    setMeetingPoint(ROUTE_PRESETS[0].meetingPoint);
  };

  if (!isOpen) return null;

  const handleCoordinatesChange = (newCoords: LatLngTuple[], computedDistance: number) => {
    setCoordinates(newCoords);
    setDistanceKm(computedDistance);
  };

  const handleMeetingPointCoords = (_lat: number, _lng: number) => {
    // optional coordinate callback
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!user || !idToken) {
      setErrorMsg('Please sign in with Google to publish your group run.');
      return;
    }

    if (!title.trim()) {
      setErrorMsg('Please enter a run title.');
      return;
    }

    if (!meetingPoint.trim()) {
      setErrorMsg('Please specify a meeting point for members.');
      return;
    }

    if (coordinates.length === 0) {
      setErrorMsg('Please plot a route or select a template on the map.');
      return;
    }

    setIsSubmitting(true);

    try {
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}:00`);
      const startLat = coordinates[0][0];
      const startLng = coordinates[0][1];

      const res = await fetch('/api/runs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          meetingPoint: meetingPoint.trim(),
          startLat: String(startLat),
          startLng: String(startLng),
          distanceKm: String(distanceKm),
          pace,
          scheduledAt: scheduledAt.toISOString(),
          terrainType,
          elevationGainM: Number(elevationGainM) || 0,
          routeCoordinates: JSON.stringify(coordinates),
          maxParticipants: Number(maxParticipants) || 30,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to publish run');
      }

      onRunCreated();
      onClose();
    } catch (err: any) {
      console.error('Post run error:', err);
      setErrorMsg(err.message || 'Error creating run. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="athletic-card w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden bg-[#FFFFFF] shadow-2xl">
        {/* Modal Header */}
        <div className="bg-[#121212] text-white px-6 py-4 flex items-center justify-between border-b border-[#2A2A2E]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#FF4500] flex items-center justify-center text-white">
              <Zap className="w-4 h-4 fill-white/20" />
            </div>
            <div>
              <h2 className="font-heading font-black text-lg tracking-tight uppercase text-white">
                HOST A GROUP RUN
              </h2>
              <p className="text-[11px] text-[#8E95A5] uppercase font-bold tracking-wider">
                STRIDE PACING & LOGISTICS · RACE DAY PROTOCOL
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8E95A5] hover:text-white hover:bg-[#28282D] transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!user && (
            <div className="p-4 rounded-xl bg-[#1C1C1E] border border-[#2E2E32] text-white flex items-center justify-between gap-4">
              <div className="text-xs">
                <span className="font-heading font-black uppercase text-[#CCFF00] block mb-0.5">
                  AUTHENTICATION REQUIRED
                </span>
                <span className="text-[#A0A5B0]">
                  Sign in with your Google account to record and host this group session.
                </span>
              </div>
              <button
                type="button"
                onClick={signInWithGoogle}
                className="btn-electric px-4 py-2 rounded-lg text-xs font-black flex items-center gap-1.5 shrink-0"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>GOOGLE SIGN-IN</span>
              </button>
            </div>
          )}

          {/* Route Library Course Selector */}
          <div className="athletic-card p-5 bg-[#F8F9FA]">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-[#121212] text-[#CCFF00] flex items-center justify-center">
                  <Compass className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs font-heading font-black text-[#121212] uppercase tracking-wide">
                  SELECT FROM ROUTE LIBRARY
                </h3>
              </div>

              {selectedRoute && (
                <button
                  type="button"
                  onClick={clearSelectedRoute}
                  className="inline-flex items-center gap-1 text-[11px] font-heading font-bold text-[#FF4500] hover:underline"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>CUSTOM / CLEAR</span>
                </button>
              )}
            </div>

            {/* Active Selected Route Banner */}
            {selectedRoute ? (
              <div className="p-3.5 rounded-xl bg-white border border-[#CCFF00] shadow-xs flex items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#CCFF00] text-[#121212] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-4 h-4 stroke-[3px]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-heading font-black text-[#121212] uppercase">
                        {selectedRoute.title}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#FF4500] text-white text-[10px] font-heading font-black uppercase">
                        {selectedRoute.distanceKm} KM
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#121212] text-[#CCFF00] text-[10px] font-heading font-black uppercase">
                        {selectedRoute.difficulty}
                      </span>
                    </div>
                    <p className="text-xs text-[#595E68] flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#FF4500]" />
                      <span>Starts at: {selectedRoute.startLocation}</span>
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-xs text-[#595E68] mb-3">
                  Select a verified course from the Route Library to auto-populate GPS coordinates, distance, and assembly spot, or draw a custom route below.
                </p>

                {isLoadingRoutes ? (
                  <div className="py-2 text-xs text-[#8E95A5] flex items-center gap-2">
                    <div className="w-3.5 h-3.5 border-2 border-[#FF4500] border-t-transparent rounded-full animate-spin" />
                    <span>Loading courses from library...</span>
                  </div>
                ) : libraryRoutes.length === 0 ? (
                  <p className="text-xs text-[#8E95A5] italic">
                    No routes saved in the library yet. You can draw a course on the map below.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
                    {libraryRoutes.map((route) => (
                      <button
                        key={route.id}
                        type="button"
                        onClick={() => applyRoute(route)}
                        className="text-left p-3 rounded-xl border border-[#E9ECEF] hover:border-[#FF4500] bg-white hover:bg-orange-50/40 transition-all flex flex-col justify-between group cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-heading font-black text-xs text-[#121212] uppercase truncate group-hover:text-[#FF4500]">
                            {route.title}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-[#121212] text-[#CCFF00] font-heading font-black text-[10px] uppercase shrink-0">
                            {route.distanceKm} KM
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-[#595E68]">
                          <span className="truncate flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#FF4500] shrink-0" />
                            <span className="truncate">{route.startLocation}</span>
                          </span>
                          <span className="text-[10px] font-heading font-bold text-[#FF4500] uppercase shrink-0 ml-2">
                            {route.difficulty}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 1: Interactive Route Planner */}
          <div className="athletic-card p-5">
            <h3 className="text-xs font-heading font-black text-[#121212] uppercase mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-[#FF4500] text-white flex items-center justify-center text-[10px] font-black">
                1
              </span>
              <span>
                {selectedRoute ? 'COURSE GPS MAP PREVIEW & WAYPOINTS' : 'INTERACTIVE ROUTE MAP & GPS WAYPOINTS'}
              </span>
            </h3>
            <RoutePlannerMap
              key={selectedRoute ? `route-${selectedRoute.id}` : 'custom-route'}
              initialCoordinates={coordinates}
              onChange={handleCoordinatesChange}
              onMeetingPointSelected={handleMeetingPointCoords}
            />
          </div>

          {/* Step 2: Run Details */}
          <div className="athletic-card p-5">
            <h3 className="text-xs font-heading font-black text-[#121212] uppercase mb-4 flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-[#FF4500] text-white flex items-center justify-center text-[10px] font-black">
                2
              </span>
              <span>RUN SCHEDULE & PACE LOGISTICS</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Title */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-heading font-black text-[#121212] uppercase mb-1.5">
                  RUN TITLE *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., SATURDAY SUNRISE TEMPO 10K"
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#E9ECEF] text-xs font-semibold text-[#121212] focus:border-[#FF4500] focus:outline-none uppercase tracking-tight"
                />
              </div>

              {/* Meeting Point */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-heading font-black text-[#121212] uppercase mb-1.5">
                  MEETING POINT LANDMARK *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FF4500]" />
                  <input
                    type="text"
                    required
                    value={meetingPoint}
                    onChange={(e) => setMeetingPoint(e.target.value)}
                    placeholder="e.g., Marina Bay Sands Event Square"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#E9ECEF] text-xs font-semibold text-[#121212] focus:border-[#FF4500] focus:outline-none tracking-tight"
                  />
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-heading font-black text-[#121212] uppercase mb-1.5">
                  DATE *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FF4500]" />
                  <input
                    type="date"
                    required
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#E9ECEF] text-xs font-semibold text-[#121212] focus:border-[#FF4500] focus:outline-none"
                  />
                </div>
              </div>

              {/* Time */}
              <div>
                <label className="block text-xs font-heading font-black text-[#121212] uppercase mb-1.5">
                  START TIME *
                </label>
                <div className="relative">
                  <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FF4500]" />
                  <input
                    type="time"
                    required
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#E9ECEF] text-xs font-semibold text-[#121212] focus:border-[#FF4500] focus:outline-none"
                  />
                </div>
              </div>

              {/* Target Pace */}
              <div>
                <label className="block text-xs font-heading font-black text-[#121212] uppercase mb-1.5">
                  TARGET PACE CATEGORY
                </label>
                <select
                  value={pace}
                  onChange={(e) => setPace(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#E9ECEF] text-xs font-semibold text-[#121212] focus:border-[#FF4500] focus:outline-none uppercase"
                >
                  <option value="All Paces Welcome">All Paces Welcome</option>
                  <option value="Easy (6:30 - 7:30 /km)">Easy (6:30 - 7:30 /km)</option>
                  <option value="Moderate (5:30 - 6:30 /km)">Moderate (5:30 - 6:30 /km)</option>
                  <option value="Tempo (4:45 - 5:30 /km)">Tempo (4:45 - 5:30 /km)</option>
                  <option value="Speed / Fast (Under 4:45 /km)">Speed / Fast (&lt; 4:45 /km)</option>
                </select>
              </div>

              {/* Terrain */}
              <div>
                <label className="block text-xs font-heading font-black text-[#121212] uppercase mb-1.5">
                  TERRAIN
                </label>
                <select
                  value={terrainType}
                  onChange={(e) => setTerrainType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#E9ECEF] text-xs font-semibold text-[#121212] focus:border-[#FF4500] focus:outline-none uppercase"
                >
                  <option value="Road">Road (Flat Asphalt)</option>
                  <option value="Trail">Trail (Dirt / Hills)</option>
                  <option value="Track">Track (All-Weather)</option>
                  <option value="Mixed">Mixed (Urban + Park)</option>
                </select>
              </div>

              {/* Elevation Gain */}
              <div>
                <label className="block text-xs font-heading font-black text-[#121212] uppercase mb-1.5">
                  ESTIMATED ELEVATION GAIN (M)
                </label>
                <input
                  type="number"
                  min="0"
                  max="2000"
                  value={elevationGainM}
                  onChange={(e) => setElevationGainM(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#E9ECEF] text-xs font-semibold text-[#121212] focus:border-[#FF4500] focus:outline-none"
                />
              </div>

              {/* Max Runners */}
              <div>
                <label className="block text-xs font-heading font-black text-[#121212] uppercase mb-1.5">
                  MAX RUNNERS CAP
                </label>
                <input
                  type="number"
                  min="5"
                  max="200"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#E9ECEF] text-xs font-semibold text-[#121212] focus:border-[#FF4500] focus:outline-none"
                />
              </div>

              {/* Distance Display */}
              <div className="sm:col-span-2 p-3.5 rounded-xl bg-[#F0F2F5] flex items-center justify-between">
                <span className="text-xs font-heading font-black text-[#595E68] uppercase">
                  CALCULATED COURSE DISTANCE:
                </span>
                <span className="font-heading font-black text-xl text-[#FF4500]">
                  {distanceKm} KM
                </span>
              </div>

              {/* Notes */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-heading font-black text-[#121212] uppercase mb-1.5">
                  COURSE NOTES & ADVICE
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Water refill stations, locker locations, hydration advice..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#E9ECEF] text-xs text-[#121212] focus:border-[#FF4500] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#E9ECEF]">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-5 bg-white border-[2px] border-[#121212] text-[#121212] text-xs font-heading font-black uppercase tracking-wider transition-all shadow-[2px_2px_0px_#121212] active:translate-x-0.5 active:translate-y-0.5"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-10 px-6 bg-[#FF4500] hover:bg-[#E03E00] border-[2.5px] border-[#121212] text-white text-xs font-heading font-black uppercase tracking-wider disabled:opacity-50 transition-all shadow-[2px_2px_0px_#121212] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#121212] active:translate-y-0.5 active:translate-x-0.5 active:shadow-[1px_1px_0px_#121212]"
            >
              {isSubmitting ? 'PUBLISHING GROUP RUN...' : 'PUBLISH GROUP RUN →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
