import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { RoutePlannerMap } from './RoutePlannerMap.tsx';
import { LatLngTuple, RouteDifficulty, RouteItem } from '../types.ts';
import { ROUTE_PRESETS } from '../utils/mapUtils.ts';
import { X, MapPin, Gauge, Mountain, AlertCircle, Bookmark, Compass } from 'lucide-react';

interface SaveRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRouteSaved: (newRoute: RouteItem) => void;
}

export const SaveRouteModal: React.FC<SaveRouteModalProps> = ({
  isOpen,
  onClose,
  onRouteSaved,
}) => {
  const { user, idToken, signInWithGoogle } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [distanceKm, setDistanceKm] = useState<number>(5.2);
  const [difficulty, setDifficulty] = useState<RouteDifficulty>('Moderate');
  const [startLocation, setStartLocation] = useState('Marina Bay Waterfront Promenade');
  const [startLat, setStartLat] = useState<number>(1.2838);
  const [startLng, setStartLng] = useState<number>(103.8591);
  const [terrainType, setTerrainType] = useState('Road');
  const [elevationGainM, setElevationGainM] = useState<number>(15);
  const [coordinates, setCoordinates] = useState<LatLngTuple[]>(ROUTE_PRESETS[0].coordinates);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCoordinatesChange = (newCoords: LatLngTuple[], calcDistance: number) => {
    setCoordinates(newCoords);
    if (calcDistance > 0) {
      setDistanceKm(calcDistance);
    }
    if (newCoords.length > 0) {
      setStartLat(newCoords[0][0]);
      setStartLng(newCoords[0][1]);
    }
  };

  const handleMeetingPointCoords = (lat: number, lng: number) => {
    setStartLat(lat);
    setStartLng(lng);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!user || !idToken) {
      try {
        await signInWithGoogle();
      } catch {
        setErrorMsg('Sign-in required to save routes to the community library.');
        return;
      }
      return;
    }

    if (!title.trim()) {
      setErrorMsg('Route title is required.');
      return;
    }

    if (!startLocation.trim()) {
      setErrorMsg('Start location is required.');
      return;
    }

    if (distanceKm <= 0) {
      setErrorMsg('Distance must be greater than 0.');
      return;
    }

    if (coordinates.length < 2) {
      setErrorMsg('Please click on the map to plot at least 2 route points.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        distanceKm: Number(distanceKm).toFixed(1),
        difficulty,
        startLocation: startLocation.trim(),
        startLat: String(startLat),
        startLng: String(startLng),
        terrainType,
        elevationGainM: Number(elevationGainM) || 0,
        routeCoordinates: JSON.stringify(coordinates),
      };

      const res = await fetch('/api/routes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save route to library');
      }

      const createdRoute = await res.json();
      onRouteSaved(createdRoute);
      onClose();
    } catch (err: any) {
      console.error('Save route error:', err);
      setErrorMsg(err.message || 'Error saving route. Please try again.');
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
              <Bookmark className="w-4 h-4 fill-white/20" />
            </div>
            <div>
              <h2 className="font-heading font-black text-lg tracking-tight uppercase text-white">
                SAVE ROUTE TO LIBRARY
              </h2>
              <p className="text-[11px] text-[#8E95A5] uppercase font-bold tracking-wider">
                COMMUNITY ROUTE DIRECTORY · VERIFIED TRACKS
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

          {/* Section 1: Route Planner Map */}
          <div className="athletic-card p-5">
            <h3 className="text-xs font-heading font-black text-[#121212] uppercase mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-[#FF4500] text-white flex items-center justify-center text-[10px] font-black">
                1
              </span>
              <span>PLOT GPS COURSE OR SELECT PRESET</span>
            </h3>
            <RoutePlannerMap
              initialCoordinates={coordinates}
              onChange={handleCoordinatesChange}
              onMeetingPointSelected={handleMeetingPointCoords}
            />
          </div>

          {/* Section 2: Route Specs */}
          <div className="athletic-card p-5">
            <h3 className="text-xs font-heading font-black text-[#121212] uppercase mb-4 flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-[#FF4500] text-white flex items-center justify-center text-[10px] font-black">
                2
              </span>
              <span>ROUTE METRICS & SPECIFICATIONS</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Title */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-heading font-black text-[#121212] uppercase mb-1.5">
                  ROUTE TITLE *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Marina Bay Waterfront Loop"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E9ECEF] focus:border-[#FF4500] focus:ring-1 focus:ring-[#FF4500] text-sm bg-white font-medium outline-none transition-all"
                />
              </div>

              {/* Start Location */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-heading font-black text-[#121212] uppercase mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#FF4500]" />
                  <span>START LOCATION / ASSEMBLY SPOT *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Marina Bay Sands Event Square"
                  value={startLocation}
                  onChange={(e) => setStartLocation(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E9ECEF] focus:border-[#FF4500] focus:ring-1 focus:ring-[#FF4500] text-sm bg-white font-medium outline-none transition-all"
                />
              </div>

              {/* Distance in KM */}
              <div>
                <label className="block text-xs font-heading font-black text-[#121212] uppercase mb-1.5">
                  DISTANCE (KM) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="100"
                  required
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E9ECEF] focus:border-[#FF4500] focus:ring-1 focus:ring-[#FF4500] text-sm bg-white font-bold outline-none transition-all"
                />
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-xs font-heading font-black text-[#121212] uppercase mb-1.5">
                  DIFFICULTY LEVEL *
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as RouteDifficulty)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E9ECEF] focus:border-[#FF4500] focus:ring-1 focus:ring-[#FF4500] text-sm bg-white font-bold outline-none transition-all"
                >
                  <option value="Easy">Easy (Flat & Scenic)</option>
                  <option value="Moderate">Moderate (Standard Pace)</option>
                  <option value="Hard">Hard (Elevated / Tempo)</option>
                  <option value="Challenging">Challenging (Long & Steep)</option>
                </select>
              </div>

              {/* Terrain Type */}
              <div>
                <label className="block text-xs font-heading font-black text-[#121212] uppercase mb-1.5">
                  TERRAIN TYPE
                </label>
                <select
                  value={terrainType}
                  onChange={(e) => setTerrainType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E9ECEF] focus:border-[#FF4500] focus:ring-1 focus:ring-[#FF4500] text-sm bg-white font-medium outline-none transition-all"
                >
                  <option value="Road">Road / Paved</option>
                  <option value="Trail">Trail / Off-Road</option>
                  <option value="Track">Track (All-Weather)</option>
                  <option value="Mixed">Mixed / Beach Path</option>
                </select>
              </div>

              {/* Elevation Gain */}
              <div>
                <label className="block text-xs font-heading font-black text-[#121212] uppercase mb-1.5">
                  ELEVATION GAIN (METERS)
                </label>
                <input
                  type="number"
                  min="0"
                  max="3000"
                  value={elevationGainM}
                  onChange={(e) => setElevationGainM(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E9ECEF] focus:border-[#FF4500] focus:ring-1 focus:ring-[#FF4500] text-sm bg-white font-medium outline-none transition-all"
                />
              </div>

              {/* Route Notes */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-heading font-black text-[#121212] uppercase mb-1.5">
                  ROUTE NOTES & ADVICE
                </label>
                <textarea
                  rows={2}
                  placeholder="Water fountain locations, lighting at night, elevation surges..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E9ECEF] focus:border-[#FF4500] focus:ring-1 focus:ring-[#FF4500] text-sm bg-white outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer */}
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
              className="h-10 px-6 bg-[#FF4500] hover:bg-[#E03E00] border-[2.5px] border-[#121212] text-white text-xs font-heading font-black uppercase tracking-wider disabled:opacity-50 flex items-center gap-2 transition-all shadow-[2px_2px_0px_#121212] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#121212] active:translate-y-0.5 active:translate-x-0.5 active:shadow-[1px_1px_0px_#121212]"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>SAVING ROUTE...</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4 fill-white/30" />
                  <span>SAVE TO ROUTE LIBRARY</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
