/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Header } from './components/Header.tsx';
import { RunsFeed } from './components/RunsFeed.tsx';
import { RouteMapViewer } from './components/RouteMapViewer.tsx';
import { RouteLibraryView } from './components/RouteLibraryView.tsx';
import { SaveRouteModal } from './components/SaveRouteModal.tsx';
import { RouteDetailModal } from './components/RouteDetailModal.tsx';
import { PostRunModal } from './components/PostRunModal.tsx';
import { RunDetailsModal } from './components/RunDetailsModal.tsx';
import { ProfileView } from './components/ProfileView.tsx';
import { NavigationTab, RunItem, RouteItem } from './types.ts';
import { Flame, ShieldCheck, Zap } from 'lucide-react';

function StrideApp() {
  const { user, idToken, signInWithGoogle } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavigationTab>('runs');
  const [runs, setRuns] = useState<RunItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Route Library State
  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [isRoutesLoading, setIsRoutesLoading] = useState(true);
  const [isSaveRouteModalOpen, setIsSaveRouteModalOpen] = useState(false);
  const [selectedRouteForDetails, setSelectedRouteForDetails] = useState<RouteItem | null>(null);
  const [selectedRouteForSchedule, setSelectedRouteForSchedule] = useState<RouteItem | null>(null);

  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [focusedMapRunId, setFocusedMapRunId] = useState<number | null>(null);

  // Fetch runs from Cloud SQL API
  const fetchRuns = useCallback(async () => {
    try {
      const headers: Record<string, string> = {};
      if (idToken) {
        headers.Authorization = `Bearer ${idToken}`;
      }
      const res = await fetch('/api/runs', { headers });
      if (res.ok) {
        const data = await res.json();
        setRuns(data);
      }
    } catch (err) {
      console.error('Failed to fetch runs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [idToken]);

  // Fetch Route Library from Cloud SQL API
  const fetchRoutes = useCallback(async () => {
    try {
      const res = await fetch('/api/routes');
      if (res.ok) {
        const data = await res.json();
        setRoutes(data);
      }
    } catch (err) {
      console.error('Failed to fetch route library:', err);
    } finally {
      setIsRoutesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRuns();
    fetchRoutes();
  }, [fetchRuns, fetchRoutes]);

  // Handle Tab changes
  const handleTabChange = (tab: NavigationTab) => {
    if (tab === 'post') {
      setSelectedRouteForSchedule(null);
      setIsPostModalOpen(true);
    } else {
      setCurrentTab(tab);
    }
  };

  // Open run details modal
  const handleSelectRun = (run: RunItem) => {
    setSelectedRunId(run.id);
    setIsDetailsOpen(true);
  };

  // Inspect run on full map
  const handleViewOnMap = (run: RunItem) => {
    setFocusedMapRunId(run.id);
    setCurrentTab('map');
  };

  // Schedule a run pre-loaded with a library route
  const handleScheduleWithRoute = (route: RouteItem) => {
    setSelectedRouteForSchedule(route);
    setIsPostModalOpen(true);
  };

  // Delete route from library
  const handleDeleteRoute = async (routeId: number) => {
    if (!idToken) return;
    try {
      const res = await fetch(`/api/routes/${routeId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });
      if (res.ok) {
        setRoutes((prev) => prev.filter((r) => r.id !== routeId));
      }
    } catch (err) {
      console.error('Failed to delete route:', err);
    }
  };

  // Check for invite link parameter in URL (?run=123)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const runParam = params.get('run');
    if (runParam) {
      const id = parseInt(runParam, 10);
      if (!isNaN(id)) {
        setSelectedRunId(id);
        setIsDetailsOpen(true);
      }
    }
  }, []);

  // Toggle RSVP with optimistic update & Cloud SQL sync
  const handleToggleRsvp = async (runId: number) => {
    let currentUser = user;
    let currentToken = idToken;

    if (!currentUser || !currentToken) {
      try {
        const authedUser = await signInWithGoogle();
        if (!authedUser) return;
        currentUser = authedUser;
        currentToken = await authedUser.getIdToken();
      } catch (err) {
        console.error('Sign in cancelled or failed:', err);
        return;
      }
    }

    if (!currentUser || !currentToken) return;

    // Optimistically update run list
    setRuns((prevRuns) =>
      prevRuns.map((r) => {
        if (r.id === runId) {
          const nextRsvpd = !r.isUserRsvpd;
          let updatedAttendees = r.attendees ? [...r.attendees] : [];

          if (nextRsvpd) {
            // Add user to attendees
            if (!updatedAttendees.some((a) => a.userUid === currentUser!.uid)) {
              updatedAttendees.push({
                id: Date.now(),
                runId,
                userUid: currentUser!.uid,
                status: 'going',
                userName: currentUser!.displayName || 'Runner',
                userPhoto: currentUser!.photoURL || null,
                userPaceCategory: null,
              });
            }
          } else {
            // Remove user from attendees
            updatedAttendees = updatedAttendees.filter((a) => a.userUid !== currentUser!.uid);
          }

          return {
            ...r,
            isUserRsvpd: nextRsvpd,
            attendeeCount: nextRsvpd ? r.attendeeCount + 1 : Math.max(0, r.attendeeCount - 1),
            attendees: updatedAttendees,
          };
        }
        return r;
      })
    );

    try {
      const res = await fetch(`/api/runs/${runId}/rsvp`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });
      if (res.ok) {
        // Silently sync fresh database records
        fetchRuns();
      } else {
        await fetchRuns();
      }
    } catch (err) {
      console.error('Failed to toggle RSVP in Cloud SQL:', err);
      await fetchRuns();
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#121212] flex flex-col font-body selection:bg-[#CCFF00] selection:text-[#121212]">
      {/* Top Header */}
      <Header
        currentTab={currentTab}
        onTabChange={handleTabChange}
        onOpenPostModal={() => {
          setSelectedRouteForSchedule(null);
          setIsPostModalOpen(true);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-28 text-center px-4">
            <div className="w-12 h-12 border-4 border-[#FF4500] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-xs font-heading font-black text-[#121212] uppercase tracking-wider">
              LOADING UPCOMING GROUP RUNS...
            </p>
          </div>
        ) : (
          <>
            {currentTab === 'runs' && (
              <RunsFeed
                runs={runs}
                onSelectRun={handleSelectRun}
                onViewOnMap={handleViewOnMap}
                onToggleRsvp={handleToggleRsvp}
                onOpenPostModal={() => {
                  setSelectedRouteForSchedule(null);
                  setIsPostModalOpen(true);
                }}
              />
            )}

            {currentTab === 'routes' && (
              <RouteLibraryView
                routes={routes}
                isLoading={isRoutesLoading}
                onOpenSaveModal={() => setIsSaveRouteModalOpen(true)}
                onSelectRouteDetails={(route) => setSelectedRouteForDetails(route)}
                onScheduleWithRoute={handleScheduleWithRoute}
                onDeleteRoute={handleDeleteRoute}
              />
            )}

            {currentTab === 'map' && (
              <RouteMapViewer
                runs={runs}
                selectedRunId={focusedMapRunId}
                onSelectRun={handleSelectRun}
                onToggleRsvp={handleToggleRsvp}
              />
            )}

            {currentTab === 'profile' && (
              <ProfileView
                runs={runs}
                onSelectRun={handleSelectRun}
                onOpenPostModal={() => {
                  setSelectedRouteForSchedule(null);
                  setIsPostModalOpen(true);
                }}
              />
            )}
          </>
        )}
      </main>

      {/* Semantic Footer: Deep Asphalt Theme with Kinetic Badges */}
      {currentTab !== 'map' && (
        <footer
          id="app-footer"
          className="w-full bg-[#121212] text-white border-t-4 border-[#FF4500] px-[5vw] py-12"
        >
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#FF4500] flex items-center justify-center text-white">
                <Flame className="w-5 h-5 fill-white/30" />
              </div>
              <div>
                <span className="font-heading font-black text-lg tracking-tight uppercase text-white">
                  STRIDE RUN CLUB
                </span>
                <p className="text-xs text-[#8E95A5]">
                  High-Performance Community Pacing & Route Exploration
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-heading font-bold text-[#8E95A5] uppercase">
              <span className="flex items-center gap-1 text-[#FFE600]">
                <Zap className="w-3.5 h-3.5 fill-[#FFE600]" />
                COMMUNITY PACE SESSIONS
              </span>
              <span>·</span>
              <span className="flex items-center gap-1 text-white">
                <ShieldCheck className="w-3.5 h-3.5 text-[#FF4500]" />
                OFFICIAL COMMUNITY RUN CLUB
              </span>
            </div>
          </div>
        </footer>
      )}

      {/* Modals */}
      <PostRunModal
        isOpen={isPostModalOpen}
        initialRoute={selectedRouteForSchedule}
        onClose={() => {
          setIsPostModalOpen(false);
          setSelectedRouteForSchedule(null);
        }}
        onRunCreated={() => {
          fetchRuns();
          setSelectedRouteForSchedule(null);
        }}
      />

      <SaveRouteModal
        isOpen={isSaveRouteModalOpen}
        onClose={() => setIsSaveRouteModalOpen(false)}
        onRouteSaved={(newRoute) => {
          setRoutes((prev) => [newRoute, ...prev]);
        }}
      />

      <RouteDetailModal
        route={selectedRouteForDetails}
        isOpen={!!selectedRouteForDetails}
        onClose={() => setSelectedRouteForDetails(null)}
        onScheduleWithRoute={handleScheduleWithRoute}
      />

      <RunDetailsModal
        runId={selectedRunId}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedRunId(null);
        }}
        onToggleRsvp={handleToggleRsvp}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StrideApp />
    </AuthProvider>
  );
}
