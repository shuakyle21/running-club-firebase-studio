import React, { useState } from 'react';
import { RunItem } from '../types.ts';
import { RouteMiniMap } from './RouteMiniMap.tsx';
import { SportsCta } from './SportsCta.tsx';
import {
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  Plus,
  ArrowRight,
  TrendingUp,
  Search,
  Flame,
  Zap,
  Check,
  Share2,
} from 'lucide-react';

interface RunsFeedProps {
  runs: RunItem[];
  onSelectRun: (run: RunItem) => void;
  onViewOnMap: (run: RunItem) => void;
  onToggleRsvp: (runId: number) => void;
  onOpenPostModal: () => void;
}

export const RunsFeed: React.FC<RunsFeedProps> = ({
  runs,
  onSelectRun,
  onViewOnMap,
  onToggleRsvp,
  onOpenPostModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [distanceFilter, setDistanceFilter] = useState<'all' | '5k' | '10k' | 'long'>('all');
  const [copiedRunId, setCopiedRunId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Copy shareable invite link
  const handleCopyInvite = (e: React.MouseEvent, run: RunItem) => {
    e.stopPropagation();
    const inviteUrl = `${window.location.origin}${window.location.pathname}?run=${run.id}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(inviteUrl).catch(() => {
        fallbackCopyTextToClipboard(inviteUrl);
      });
    } else {
      fallbackCopyTextToClipboard(inviteUrl);
    }

    setCopiedRunId(run.id);
    setToastMessage(`Invite link for "${run.title}" copied!`);

    setTimeout(() => {
      setCopiedRunId(null);
    }, 2500);

    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const fallbackCopyTextToClipboard = (text: string) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
    } catch (err) {
      console.error('Fallback clipboard copy failed:', err);
    }
    document.body.removeChild(textArea);
  };

  // Filter logic
  const filteredRuns = runs.filter((run) => {
    const matchesSearch =
      run.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      run.meetingPoint.toLowerCase().includes(searchQuery.toLowerCase()) ||
      run.description.toLowerCase().includes(searchQuery.toLowerCase());

    const dist = parseFloat(run.distanceKm);
    let matchesDistance = true;
    if (distanceFilter === '5k') matchesDistance = dist <= 6;
    if (distanceFilter === '10k') matchesDistance = dist > 6 && dist <= 12;
    if (distanceFilter === 'long') matchesDistance = dist > 12;

    return matchesSearch && matchesDistance;
  });

  return (
    <section className="w-full pb-24 md:pb-16" aria-label="Upcoming Club Runs">
      {/* 1. HERO SECTION: Dark Asphalt (#121212) with Kinetic Clamp Typography */}
      <header
        id="club-hero"
        className="w-full bg-[#121212] text-white px-[5vw] py-14 sm:py-20 relative overflow-hidden border-b-4 border-[#FF4500]"
      >
        {/* Athletic Kinetic Track Lines Background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, #1C1C1E 0px, #1C1C1E 2px, transparent 2px, transparent 16px)',
          }}
        />
        <div className="absolute -right-20 -bottom-20 w-96 h-96 rounded-full bg-[#FF4500]/15 blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -top-20 w-80 h-80 rounded-full bg-[#CCFF00]/10 blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto relative z-10">
          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#1E1E1E] border border-[#2E2E32] text-xs font-heading font-black text-[#FFE600] tracking-wider uppercase mb-5">
            <Zap className="w-4 h-4 fill-[#FFE600]" />
            <span>COMMUNITY GROUP RUNS · PACE & ROUTES</span>
          </div>

          {/* Massive Clamp Headline */}
          <h1 className="hero-title-clamp text-white mb-4">
            CHASE THE PACK. <br className="hidden sm:inline" />
            <span className="text-[#FF4500]">OWN EVERY STRIDE.</span>
          </h1>

          <p className="max-w-2xl text-base sm:text-lg text-[#C5C8D0] font-normal leading-relaxed mb-8">
            Lock in your next group run, inspect verified GPS turn-by-turn routes on the interactive map, and push your threshold with fellow club runners.
          </p>

          {/* Actions & Metrics Row */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Primary Action Button (Sports Ribbon CTA) */}
            <SportsCta id="hero-post-run-cta" onClick={onOpenPostModal} size="md">
              <span className="flex items-center gap-2">
                <Plus className="w-4 h-4 stroke-[3.5px]" />
                <span>POST A GROUP RUN</span>
              </span>
            </SportsCta>

            {/* View Route Map Link */}
            <button
              onClick={() => onSelectRun(runs[0])}
              className="h-11 px-6 bg-[#1E1E1E] border-2 border-[#2E2E32] hover:border-[#FFE600] text-white hover:text-[#FFE600] font-heading font-black text-xs uppercase tracking-tight transition-all duration-150 flex items-center justify-center"
            >
              EXPLORE ACTIVE ROUTES
            </button>

            <div className="flex items-center gap-4 ml-auto pt-2 sm:pt-0">
              <div className="bg-[#1C1C1E] border border-[#2E2E32] rounded-xl px-4 py-2.5">
                <span className="text-[10px] font-heading font-black text-[#8E95A5] uppercase block">
                  ACTIVE SESSIONS
                </span>
                <span className="text-xl font-heading font-black text-[#FFE600]">
                  {runs.length}
                </span>
              </div>
              <div className="bg-[#1C1C1E] border border-[#2E2E32] rounded-xl px-4 py-2.5">
                <span className="text-[10px] font-heading font-black text-[#8E95A5] uppercase block">
                  COMMUNITY
                </span>
                <span className="text-xs font-heading font-black text-[#FF4500]">
                  ACTIVE CHAPTER
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 2. MAIN CONTENT AREA: Crisp Light (#F8F9FA) with Generous 5vw Padding */}
      <div className="w-full px-[5vw] py-10">
        <div className="max-w-7xl mx-auto">
          {/* Controls Bar: Search & Distance Filter Chips */}
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between mb-8 pb-6 border-b border-[#E9ECEF]">
            {/* Search Input with high contrast */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#595E68]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="SEARCH RUNS BY TITLE OR LANDMARK..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border-2 border-[#E9ECEF] text-xs font-semibold text-[#121212] placeholder-[#8E95A5] focus:outline-none focus:border-[#FF4500] uppercase tracking-tight transition-all shadow-2xs"
              />
            </div>

            {/* Athletic Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <span className="font-heading font-black text-[#121212] uppercase tracking-wider text-[11px] shrink-0 mr-1">
                FILTER:
              </span>
              <button
                onClick={() => setDistanceFilter('all')}
                className={`px-4 py-2 rounded-lg font-heading font-black uppercase text-xs transition-all ${
                  distanceFilter === 'all'
                    ? 'bg-[#121212] text-[#CCFF00] shadow-sm'
                    : 'bg-white border border-[#E9ECEF] text-[#595E68] hover:border-[#121212]'
                }`}
              >
                ALL DISTANCES ({runs.length})
              </button>
              <button
                onClick={() => setDistanceFilter('5k')}
                className={`px-4 py-2 rounded-lg font-heading font-black uppercase text-xs transition-all ${
                  distanceFilter === '5k'
                    ? 'bg-[#121212] text-[#CCFF00] shadow-sm'
                    : 'bg-white border border-[#E9ECEF] text-[#595E68] hover:border-[#121212]'
                }`}
              >
                ≤ 5KM SHORT
              </button>
              <button
                onClick={() => setDistanceFilter('10k')}
                className={`px-4 py-2 rounded-lg font-heading font-black uppercase text-xs transition-all ${
                  distanceFilter === '10k'
                    ? 'bg-[#121212] text-[#CCFF00] shadow-sm'
                    : 'bg-white border border-[#E9ECEF] text-[#595E68] hover:border-[#121212]'
                }`}
              >
                6 – 12KM TEMPO
              </button>
              <button
                onClick={() => setDistanceFilter('long')}
                className={`px-4 py-2 rounded-lg font-heading font-black uppercase text-xs transition-all ${
                  distanceFilter === 'long'
                    ? 'bg-[#121212] text-[#CCFF00] shadow-sm'
                    : 'bg-white border border-[#E9ECEF] text-[#595E68] hover:border-[#121212]'
                }`}
              >
                12KM+ ENDURANCE
              </button>
            </div>
          </div>

          {/* Run Cards Grid */}
          {filteredRuns.length === 0 ? (
            <div className="athletic-card p-12 text-center max-w-lg mx-auto">
              <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-[#121212] text-[#CCFF00] flex items-center justify-center">
                <Flame className="w-7 h-7" />
              </div>
              <h3 className="section-title-clamp text-[#121212] mb-2">NO RUNS FOUND</h3>
              <p className="text-sm text-[#595E68] mb-6">
                No scheduled group runs match this filter. Be the pacer to kick off a new community run!
              </p>
              <button
                onClick={onOpenPostModal}
                className="btn-electric px-6 py-3 rounded-xl text-xs font-black"
              >
                POST A GROUP RUN
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredRuns.map((run) => {
                const dateObj = new Date(run.scheduledAt);
                const isToday = dateObj.toDateString() === new Date().toDateString();

                return (
                  /* CONTENT CARD: Clean athletic card with high-contrast theme */
                  <article
                    key={run.id}
                    id={`run-card-${run.id}`}
                    className="athletic-card flex flex-col justify-between overflow-hidden relative group"
                  >
                    {/* Top: Mini Map Route Preview with High-Contrast Athletic Overlay */}
                    <div
                      onClick={() => onViewOnMap(run)}
                      className="p-4 pb-0 relative cursor-pointer"
                      title="Click to view route on map"
                    >
                      <RouteMiniMap coordinates={run.routeCoordinates} height="160px" />

                      {/* Distance & Pace Badges in Theme Colors */}
                      <div className="absolute top-6 left-6 flex items-center gap-1.5 z-20">
                        <span className="px-3 py-1 rounded-lg bg-[#FF4500] text-white font-heading font-black text-xs uppercase tracking-tight shadow-md">
                          {run.distanceKm} KM
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-[#121212] text-[#CCFF00] font-heading font-black text-xs uppercase tracking-tight shadow-md">
                          {run.pace}
                        </span>
                      </div>
                    </div>

                    {/* Middle: Content Body */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Date & Terrain Tag */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 text-xs font-heading font-black text-[#FF4500] uppercase">
                            <div className="w-5 h-5 rounded-md bg-[#FF4500]/10 flex items-center justify-center shrink-0">
                              <Calendar className="w-3 h-3 text-[#FF4500] stroke-[2.5px]" />
                            </div>
                            <span className="truncate">
                              {isToday
                                ? 'TODAY'
                                : dateObj.toLocaleDateString(undefined, {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                              {' · '}
                              {dateObj.toLocaleTimeString(undefined, {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-md bg-[#F0F2F5] text-[#595E68] font-heading font-bold text-[10px] uppercase tracking-wider border border-[#E9ECEF] shrink-0 whitespace-nowrap">
                            {run.terrainType}
                          </span>
                        </div>

                        {/* Title */}
                        <h2
                          onClick={() => onSelectRun(run)}
                          className="font-heading font-black text-lg text-[#121212] uppercase tracking-tight mb-1.5 line-clamp-1 hover:text-[#FF4500] transition-colors cursor-pointer"
                        >
                          {run.title}
                        </h2>

                        {/* Description */}
                        <p className="text-xs text-[#595E68] line-clamp-2 leading-relaxed mb-3">
                          {run.description}
                        </p>

                        {/* Meeting Point with Themed Track Marker */}
                        <div className="flex items-center gap-2.5 text-xs font-medium text-[#121212] mb-3.5 bg-[#F8F9FA] p-2.5 rounded-xl border border-[#E9ECEF]">
                          <div className="w-6 h-6 rounded-md bg-[#FF4500]/10 flex items-center justify-center shrink-0">
                            <MapPin className="w-3.5 h-3.5 text-[#FF4500] stroke-[2.5px]" />
                          </div>
                          <span className="line-clamp-1 font-semibold">{run.meetingPoint}</span>
                        </div>

                        {/* ATTENDEE SECTION: Attendee Counter & Attending Runners Roster */}
                        <div className="mb-4 p-3.5 rounded-xl bg-[#F8F9FA] border border-[#E9ECEF]">
                          {/* Attendee Counter Header */}
                          <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-[#E9ECEF]">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-[#121212] text-[#CCFF00] flex items-center justify-center shrink-0">
                                <Users className="w-3.5 h-3.5 stroke-[2.5px]" />
                              </div>
                              <div className="min-w-0">
                                <span className="font-heading font-black text-xs uppercase text-[#121212] tracking-tight block leading-none truncate">
                                  {run.attendeeCount} {run.attendeeCount === 1 ? 'RUNNER' : 'RUNNERS'}
                                </span>
                                <span className="text-[10px] font-bold text-[#8E95A5] uppercase tracking-wider block mt-1 leading-none">
                                  ATTENDING
                                </span>
                              </div>
                            </div>

                            {/* Runner Status Tag */}
                            {run.isUserRsvpd ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#121212] text-[#CCFF00] text-[10px] font-heading font-black uppercase tracking-wider shrink-0 whitespace-nowrap border border-[#2E2E32] shadow-xs">
                                <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5px] text-[#CCFF00] shrink-0" />
                                <span>YOU'RE GOING</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-heading font-bold text-[#8E95A5] uppercase tracking-wider shrink-0 whitespace-nowrap bg-white px-2 py-0.5 rounded-md border border-[#E9ECEF]">
                                MAX {run.maxParticipants || 30}
                              </span>
                            )}
                          </div>

                          {/* Attending Runners List */}
                          <div className="flex items-center justify-between gap-3">
                            {run.attendees && run.attendees.length > 0 ? (
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                {/* Overlapping Avatars */}
                                <div className="flex items-center -space-x-2 shrink-0">
                                  {run.attendees.slice(0, 5).map((att, idx) => (
                                    <div
                                      key={att.id || idx}
                                      title={`${att.userName || 'Club Runner'}${att.userPaceCategory ? ` · ${att.userPaceCategory}` : ''}`}
                                      className="relative transition-transform hover:scale-110 hover:z-20 cursor-default"
                                    >
                                      {att.userPhoto ? (
                                        <img
                                          src={att.userPhoto}
                                          alt={att.userName || 'Member'}
                                          className="w-7 h-7 rounded-full object-cover ring-2 ring-white border border-[#E9ECEF] shadow-2xs"
                                        />
                                      ) : (
                                        <div className="w-7 h-7 rounded-full bg-[#121212] text-[#CCFF00] font-heading font-black text-[10px] flex items-center justify-center ring-2 ring-white border border-[#2E2E32] shadow-2xs">
                                          {(att.userName || 'R')[0].toUpperCase()}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                  {run.attendees.length > 5 && (
                                    <div
                                      title={`${run.attendees.length - 5} more runners attending`}
                                      className="w-7 h-7 rounded-full bg-[#FF4500] text-white font-heading font-black text-[9px] flex items-center justify-center ring-2 ring-white shadow-2xs"
                                    >
                                      +{run.attendees.length - 5}
                                    </div>
                                  )}
                                </div>

                                {/* Names Roster Preview */}
                                <p className="text-xs text-[#595E68] font-medium truncate leading-normal">
                                  {run.isUserRsvpd ? (
                                    <>
                                      <strong className="text-[#121212] font-black">You</strong>
                                      {run.attendees.filter((a) => a.userName && a.userName !== 'Runner').length > 1 ? (
                                        <span>
                                          , {run.attendees.find((a) => a.userName && a.userName !== 'Runner')?.userName?.split(' ')[0]}
                                          {run.attendees.length > 2 ? ` & ${run.attendees.length - 2} more` : ''}
                                        </span>
                                      ) : run.attendees.length > 1 ? (
                                        <span> & {run.attendees.length - 1} other{run.attendees.length > 2 ? 's' : ''}</span>
                                      ) : (
                                        <span> attending</span>
                                      )}
                                    </>
                                  ) : (
                                    <>
                                      <strong className="text-[#121212] font-black">
                                        {run.attendees[0]?.userName?.split(' ')[0] || 'Runner'}
                                      </strong>
                                      {run.attendees.length > 1 ? (
                                        <span>
                                          , {run.attendees[1]?.userName?.split(' ')[0] || 'Runner'}
                                          {run.attendees.length > 2 ? ` +${run.attendees.length - 2}` : ''}
                                        </span>
                                      ) : (
                                        <span> attending</span>
                                      )}
                                    </>
                                  )}
                                </p>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 py-0.5 text-xs text-[#8E95A5] italic">
                                <span className="w-2 h-2 rounded-full bg-[#FF4500] animate-pulse shrink-0" />
                                <span>No runners RSVP'd yet. Be the first to join!</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Bottom Footer: Host, Copy Invite Link, and Electric Neon CTA */}
                      <div>
                        <div className="flex items-center justify-between pt-3.5 border-t border-[#E9ECEF] mb-3.5">
                          {/* Host info */}
                          <div className="flex items-center gap-2 min-w-0">
                            {run.creatorPhoto ? (
                              <img
                                src={run.creatorPhoto}
                                alt={run.creatorName || 'Host'}
                                className="w-7 h-7 rounded-md object-cover ring-1 ring-[#FF4500] shrink-0"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-md bg-[#121212] text-[#CCFF00] flex items-center justify-center font-heading font-black text-[10px] shrink-0">
                                {run.creatorName?.[0] || 'C'}
                              </div>
                            )}
                            <span className="text-xs text-[#595E68] font-semibold truncate">
                              HOST: <strong className="text-[#121212]">{run.creatorName?.split(' ')[0] || 'PACER'}</strong>
                            </span>
                          </div>

                          {/* Copy Invite Link Action */}
                          <button
                            onClick={(e) => handleCopyInvite(e, run)}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-heading font-black transition-all shrink-0 whitespace-nowrap ${
                              copiedRunId === run.id
                                ? 'bg-[#121212] text-[#CCFF00] border border-[#CCFF00] shadow-xs'
                                : 'text-[#121212] hover:text-[#FF4500] bg-[#F0F2F5] hover:bg-[#E9ECEF]'
                            }`}
                            title="Copy invite link to share with friends"
                          >
                            {copiedRunId === run.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-[#CCFF00] stroke-[2.5px]" />
                                <span className="uppercase text-[10px] tracking-wider">COPIED!</span>
                              </>
                            ) : (
                              <>
                                <Share2 className="w-3.5 h-3.5 text-[#FF4500] stroke-[2.5px]" />
                                <span className="uppercase text-[10px] tracking-wider">INVITE</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Action Buttons: Clean Athletic RSVP + Outline Details */}
                        <div className="grid grid-cols-2 gap-3 items-center pt-1">
                          {run.isUserRsvpd ? (
                            <button
                              id={`run-rsvp-cta-${run.id}`}
                              onClick={() => onToggleRsvp(run.id)}
                              className="h-10 px-3.5 bg-[#121212] hover:bg-[#1E1E1E] border-[2.5px] border-[#121212] text-[#FFE600] font-heading font-black text-xs uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#121212] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#121212] active:translate-y-0.5 active:translate-x-0.5 active:shadow-[1px_1px_0px_#121212]"
                              title="Click to cancel RSVP"
                            >
                              <Check className="w-4 h-4 stroke-[3.5px] text-[#FFE600]" />
                              <span>GOING</span>
                            </button>
                          ) : (
                            <button
                              id={`run-rsvp-cta-${run.id}`}
                              onClick={() => onToggleRsvp(run.id)}
                              className="h-10 px-3.5 bg-[#FF4500] hover:bg-[#E03E00] border-[2.5px] border-[#121212] text-white font-heading font-black text-xs uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#121212] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#121212] active:translate-y-0.5 active:translate-x-0.5 active:shadow-[1px_1px_0px_#121212]"
                              title="RSVP to join this group run"
                            >
                              <span>I'M GOING</span>
                              <ArrowRight className="w-3.5 h-3.5 stroke-[3px]" />
                            </button>
                          )}

                          <button
                            onClick={() => onSelectRun(run)}
                            className="h-10 px-3 bg-white border-[2.5px] border-[#121212] text-[#121212] hover:bg-[#121212] hover:text-white font-heading font-black text-xs uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-1.5 whitespace-nowrap shadow-[2px_2px_0px_#121212] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#121212] active:translate-y-0.5 active:translate-x-0.5 active:shadow-[1px_1px_0px_#121212]"
                          >
                            <span>DETAILS</span>
                            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5px] shrink-0" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Floating Athletic Toast Notification */}
      {toastMessage && (
        <div
          id="toast-notification"
          className="fixed bottom-20 md:bottom-8 right-6 z-50 bg-[#121212] text-white px-5 py-3 rounded-xl shadow-2xl border-2 border-[#CCFF00] flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3"
        >
          <div className="w-6 h-6 rounded-md bg-[#CCFF00] text-[#121212] flex items-center justify-center shrink-0 font-black">
            <Check className="w-4 h-4 stroke-[3px]" />
          </div>
          <div>
            <p className="font-heading font-black text-xs uppercase text-white tracking-wide">
              {toastMessage}
            </p>
            <p className="text-[10px] text-[#A0A5B0]">
              Share this link with your running crew
            </p>
          </div>
        </div>
      )}
    </section>
  );
};
