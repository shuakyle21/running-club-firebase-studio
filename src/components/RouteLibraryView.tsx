import React, { useState, useMemo } from 'react';
import { RouteItem, RouteDifficulty } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { RouteMiniMap } from './RouteMiniMap.tsx';
import { SportsCta } from './SportsCta.tsx';
import {
  Compass,
  Plus,
  Search,
  MapPin,
  Mountain,
  Trash2,
  Calendar,
  ArrowRight,
  User,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';

interface RouteLibraryViewProps {
  routes: RouteItem[];
  isLoading: boolean;
  onOpenSaveModal: () => void;
  onSelectRouteDetails: (route: RouteItem) => void;
  onScheduleWithRoute: (route: RouteItem) => void;
  onDeleteRoute: (routeId: number) => Promise<void>;
}

export const RouteLibraryView: React.FC<RouteLibraryViewProps> = ({
  routes,
  isLoading,
  onOpenSaveModal,
  onSelectRouteDetails,
  onScheduleWithRoute,
  onDeleteRoute,
}) => {
  const { user } = useAuth();
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'distance-asc' | 'distance-desc'>('newest');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const difficultyOptions = ['ALL', 'EASY', 'MODERATE', 'HARD', 'CHALLENGING'];

  const filteredRoutes = useMemo(() => {
    let result = [...routes];

    if (selectedDifficulty !== 'all') {
      result = result.filter(
        (r) => r.difficulty.toLowerCase() === selectedDifficulty.toLowerCase()
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.startLocation.toLowerCase().includes(q) ||
          (r.description && r.description.toLowerCase().includes(q))
      );
    }

    if (sortBy === 'distance-asc') {
      result.sort((a, b) => parseFloat(a.distanceKm) - parseFloat(b.distanceKm));
    } else if (sortBy === 'distance-desc') {
      result.sort((a, b) => parseFloat(b.distanceKm) - parseFloat(a.distanceKm));
    } else {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [routes, selectedDifficulty, searchQuery, sortBy]);

  const handleDelete = async (e: React.MouseEvent, routeId: number) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to remove this route from the library?')) {
      return;
    }
    setDeletingId(routeId);
    try {
      await onDeleteRoute(routeId);
    } finally {
      setDeletingId(null);
    }
  };

  const getDifficultyBadge = (difficulty: RouteDifficulty) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-[#10B981] text-white';
      case 'Moderate':
        return 'bg-[#CCFF00] text-[#121212]';
      case 'Hard':
        return 'bg-[#FF4500] text-white';
      case 'Challenging':
        return 'bg-[#7F1D1D] text-white';
      default:
        return 'bg-[#CCFF00] text-[#121212]';
    }
  };

  return (
    <div className="w-full flex flex-col">
      {/* Hero Athletic Section */}
      <section
        id="routes-hero-banner"
        className="relative bg-[#121212] text-white px-[5vw] py-12 md:py-16 overflow-hidden border-b border-[#222225]"
        aria-label="Route Library Hero"
      >
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 rounded bg-[#FF4500] text-white font-heading font-black text-xs uppercase tracking-tight">
                VERIFIED GPS TRACKS
              </span>
              <span className="px-2.5 py-1 rounded bg-[#1C1C1E] text-[#FFE600] font-heading font-bold text-xs uppercase border border-[#2E2E32]">
                VERIFIED CLUB DIRECTORY
              </span>
            </div>
            <h1 className="hero-title-clamp text-white mb-3">
              ROUTE <span className="text-[#FFE600]">LIBRARY</span>
            </h1>
            <p className="text-sm md:text-base text-[#C5C8D0] max-w-2xl font-normal">
              Explore and save favorite running routes. Pick proven community courses with verified
              start locations, distances, and elevation profiles when scheduling your group runs.
            </p>
          </div>

          {/* Action CTA */}
          <div className="flex items-center gap-3">
            <SportsCta
              id="save-route-hero-cta"
              onClick={onOpenSaveModal}
              size="md"
            >
              <span className="flex items-center gap-2">
                <Plus className="w-4 h-4 stroke-[3.5px]" />
                <span>SAVE NEW ROUTE</span>
              </span>
            </SportsCta>
          </div>
        </div>
      </section>

      {/* Main Filter & Search Bar */}
      <div className="bg-white border-b border-[#E9ECEF] sticky top-20 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-[5vw] py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Difficulty Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            <span className="text-xs font-heading font-black text-[#8E95A5] uppercase mr-1 hidden sm:inline">
              DIFFICULTY:
            </span>
            {difficultyOptions.map((opt) => {
              const isActive =
                (opt === 'ALL' && selectedDifficulty === 'all') ||
                opt.toLowerCase() === selectedDifficulty.toLowerCase();
              return (
                <button
                  key={opt}
                  onClick={() => setSelectedDifficulty(opt === 'ALL' ? 'all' : opt.toLowerCase())}
                  className={`px-3.5 py-1.5 rounded-xl font-heading font-black text-xs uppercase transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-[#121212] text-[#CCFF00] shadow-sm'
                      : 'bg-[#F0F2F5] text-[#595E68] hover:text-[#121212] hover:bg-[#E4E7EB]'
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {/* Search & Sort Controls */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-[#8E95A5] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search routes or locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E9ECEF] focus:border-[#FF4500] focus:ring-1 focus:ring-[#FF4500] text-xs font-medium bg-[#F8F9FA] outline-none"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#8E95A5]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Sort routes"
                className="px-3 py-2 rounded-xl border border-[#E9ECEF] text-xs font-heading font-bold text-[#121212] bg-white outline-none cursor-pointer"
              >
                <option value="newest">Newest Courses</option>
                <option value="distance-asc">Shortest First</option>
                <option value="distance-desc">Longest First</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Routes Grid Section */}
      <section className="w-full max-w-7xl mx-auto px-[5vw] py-10 pb-24 md:pb-16" aria-label="Route Cards">
        {isLoading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-[#FF4500] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-xs font-heading font-black text-[#121212] uppercase tracking-wider">
              LOADING ROUTE LIBRARY...
            </p>
          </div>
        ) : filteredRoutes.length === 0 ? (
          <div className="athletic-card p-12 text-center max-w-md mx-auto">
            <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-[#121212] text-[#CCFF00] flex items-center justify-center">
              <Compass className="w-7 h-7" />
            </div>
            <h3 className="section-title-clamp text-[#121212] mb-2">NO ROUTES FOUND</h3>
            <p className="text-sm text-[#595E68] mb-6">
              {searchQuery || selectedDifficulty !== 'all'
                ? 'No saved routes match the selected filters.'
                : 'The route library is empty. Save your favorite running course to get started!'}
            </p>
            <button
              onClick={onOpenSaveModal}
              className="btn-electric px-6 py-3 rounded-xl text-xs font-black"
            >
              SAVE FIRST ROUTE
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredRoutes.map((route) => {
              const isCreator = user && user.uid === route.creatorUid;

              return (
                <article
                  key={route.id}
                  id={`route-card-${route.id}`}
                  className="athletic-card flex flex-col justify-between overflow-hidden group"
                >
                  {/* Top Map Preview */}
                  <div
                    onClick={() => onSelectRouteDetails(route)}
                    className="p-4 pb-0 relative cursor-pointer"
                  >
                    <RouteMiniMap coordinates={route.routeCoordinates} height="170px" />

                    {/* Distance Badge in Primary Orange */}
                    <div className="absolute top-6 left-6 flex items-center gap-1.5 z-20">
                      <span className="px-3 py-1 rounded bg-[#FF4500] text-white font-heading font-black text-xs uppercase tracking-tight shadow-md">
                        {route.distanceKm} KM
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded font-heading font-black text-[11px] uppercase tracking-tight shadow-md ${getDifficultyBadge(
                          route.difficulty
                        )}`}
                      >
                        {route.difficulty}
                      </span>
                    </div>

                    {/* Terrain Badge */}
                    <div className="absolute bottom-2 right-6 z-20">
                      <span className="px-2.5 py-0.5 rounded bg-[#121212]/90 text-white font-heading font-bold text-[10px] uppercase backdrop-blur-xs">
                        {route.terrainType}
                      </span>
                    </div>
                  </div>

                  {/* Body Details */}
                  <div className="p-5 pt-4 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Title */}
                      <h3
                        onClick={() => onSelectRouteDetails(route)}
                        className="font-heading font-black text-xl text-[#121212] uppercase tracking-tight mb-2 hover:text-[#FF4500] transition-colors cursor-pointer line-clamp-1"
                      >
                        {route.title}
                      </h3>

                      {/* Start Location */}
                      <div className="flex items-start gap-2 text-xs text-[#121212] font-semibold mb-3">
                        <MapPin className="w-4 h-4 text-[#FF4500] shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{route.startLocation}</span>
                      </div>

                      {/* Elevation and Notes */}
                      <div className="flex items-center gap-4 text-xs text-[#595E68] mb-3">
                        <span className="flex items-center gap-1 font-medium">
                          <Mountain className="w-3.5 h-3.5 text-[#8E95A5]" />
                          +{route.elevationGainM || 0}m gain
                        </span>
                        <span>•</span>
                        <span className="truncate">
                          Saved by {route.creatorName?.split(' ')[0] || 'Member'}
                        </span>
                      </div>

                      {route.description && (
                        <p className="text-xs text-[#595E68] line-clamp-2 mb-4 leading-relaxed bg-[#F8F9FA] p-2.5 rounded-lg border border-[#E9ECEF]">
                          {route.description}
                        </p>
                      )}
                    </div>

                    {/* Bottom Actions */}
                    <div className="pt-3 border-t border-[#E9ECEF] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onSelectRouteDetails(route)}
                          className="h-9 px-3 bg-white border-[2px] border-[#121212] text-[#121212] hover:bg-[#121212] hover:text-white font-heading font-black text-xs uppercase tracking-wider transition-all shadow-[2px_2px_0px_#121212] active:translate-x-0.5 active:translate-y-0.5"
                        >
                          DETAILS
                        </button>
                        {isCreator && (
                          <button
                            onClick={(e) => handleDelete(e, route.id)}
                            disabled={deletingId === route.id}
                            className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                            title="Delete route"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Primary CTA: Schedule Run with this route */}
                      <SportsCta
                        onClick={() => onScheduleWithRoute(route)}
                        size="sm"
                        title="Schedule a group run with this course"
                      >
                        <span className="flex items-center gap-1">
                          <span>SCHEDULE</span>
                          <ArrowRight className="w-3.5 h-3.5 stroke-[3px]" />
                        </span>
                      </SportsCta>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
