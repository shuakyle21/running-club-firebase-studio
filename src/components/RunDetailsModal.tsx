import React, { useEffect, useState } from 'react';
import { RunItem, RunCommentItem } from '../types.ts';
import { RouteMiniMap } from './RouteMiniMap.tsx';
import { parseRouteCoordinates, generateGpxString } from '../utils/mapUtils.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  X,
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  Plus,
  Share2,
  Download,
  Send,
  MessageSquare,
  TrendingUp,
  Compass,
  Link2,
  Copy,
  Check,
  ArrowRight,
} from 'lucide-react';

interface RunDetailsModalProps {
  runId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleRsvp: (runId: number) => void;
}

export const RunDetailsModal: React.FC<RunDetailsModalProps> = ({
  runId,
  isOpen,
  onClose,
  onToggleRsvp,
}) => {
  const { user, idToken, signInWithGoogle } = useAuth();
  const [run, setRun] = useState<RunItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  useEffect(() => {
    if (!runId || !isOpen) return;

    setLoading(true);
    const headers: Record<string, string> = {};
    if (idToken) {
      headers.Authorization = `Bearer ${idToken}`;
    }

    fetch(`/api/runs/${runId}`, { headers })
      .then((res) => res.json())
      .then((data) => {
        setRun(data);
      })
      .catch((err) => console.error('Failed to fetch run details:', err))
      .finally(() => setLoading(false));
  }, [runId, isOpen, idToken]);

  if (!isOpen) return null;

  const handleToggleRsvp = async () => {
    if (!run) return;
    onToggleRsvp(run.id);

    setRun((prev) => {
      if (!prev) return null;
      const nextRsvpd = !prev.isUserRsvpd;
      let updatedAttendees = prev.attendees ? [...prev.attendees] : [];

      if (user) {
        if (nextRsvpd) {
          if (!updatedAttendees.some((a) => a.userUid === user.uid)) {
            updatedAttendees.push({
              id: Date.now(),
              runId: prev.id,
              userUid: user.uid,
              status: 'going',
              userName: user.displayName || 'Runner',
              userPhoto: user.photoURL || null,
              userPaceCategory: null,
            });
          }
        } else {
          updatedAttendees = updatedAttendees.filter((a) => a.userUid !== user.uid);
        }
      }

      return {
        ...prev,
        isUserRsvpd: nextRsvpd,
        attendeeCount: nextRsvpd ? prev.attendeeCount + 1 : Math.max(0, prev.attendeeCount - 1),
        attendees: updatedAttendees,
      };
    });
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !run) return;

    if (!user || !idToken) {
      signInWithGoogle();
      return;
    }

    setIsSubmittingComment(true);
    try {
      const res = await fetch(`/api/runs/${run.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ message: commentText }),
      });

      if (res.ok) {
        const newComment: RunCommentItem = await res.json();
        setRun((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            comments: [...(prev.comments || []), newComment],
          };
        });
        setCommentText('');
      }
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleShare = () => {
    if (!run) return;
    const inviteUrl = `${window.location.origin}${window.location.pathname}?run=${run.id}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(inviteUrl);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2200);
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = inviteUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2200);
    }
  };

  const handleDownloadGpx = () => {
    if (!run) return;
    const points = parseRouteCoordinates(run.routeCoordinates);
    const gpx = generateGpxString(run.title, points);
    const blob = new Blob([gpx], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${run.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.gpx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      id="run-details-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
    >
      <div
        id="run-details-modal-content"
        className="bg-[#F8F9FA] rounded-2xl shadow-2xl border-2 border-[#121212] w-full max-w-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95"
      >
        {/* Header: Dark Asphalt with Orange accent */}
        <div className="px-6 py-4.5 bg-[#121212] text-white flex items-center justify-between border-b-4 border-[#FF4500]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FFE600] animate-pulse" />
            <span className="text-xs font-heading font-black text-white uppercase tracking-wider">
              OFFICIAL RUN SPECIFICATION · CLUB ROSTER
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8E95A5] hover:text-white hover:bg-[#1E1E1E] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {loading || !run ? (
          <div className="p-16 text-center">
            <div className="w-8 h-8 border-3 border-[#FF4500] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-heading font-black text-[#121212] uppercase tracking-tight">
              LOADING RUN SPECIFICATION...
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Interactive Map View */}
            <div className="athletic-card p-4">
              <RouteMiniMap coordinates={run.routeCoordinates} height="220px" interactive={true} />
              <div className="mt-3 flex items-center justify-between text-xs text-[#595E68]">
                <span className="flex items-center gap-1.5 font-medium">
                  <Compass className="w-3.5 h-3.5 text-[#FF4500]" />
                  Interactive GPS route: Pan and zoom freely
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-1 font-heading font-black text-xs text-[#121212] hover:text-[#FF4500] uppercase"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{copyFeedback ? 'COPIED!' : 'SHARE'}</span>
                  </button>
                  <span className="text-[#E9ECEF]">|</span>
                  <button
                    onClick={handleDownloadGpx}
                    className="flex items-center gap-1 font-heading font-black text-xs text-[#121212] hover:text-[#FF4500] uppercase"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>GPX</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Run Header & Metrics Grid */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="px-3 py-1 rounded bg-[#FF4500] text-white font-heading font-black text-xs uppercase tracking-tight shadow-xs">
                  {run.distanceKm} KM
                </span>
                <span className="px-2.5 py-1 rounded bg-[#121212] text-[#CCFF00] font-heading font-black text-xs uppercase tracking-tight">
                  {run.pace}
                </span>
                <span className="px-2.5 py-1 rounded bg-[#E9ECEF] text-[#121212] font-heading font-black text-xs uppercase">
                  {run.terrainType}
                </span>
                {run.elevationGainM > 0 && (
                  <span className="px-2.5 py-1 rounded bg-[#121212] text-white font-heading font-bold text-xs flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-[#CCFF00]" />
                    <span>+{run.elevationGainM}M ELEVATION</span>
                  </span>
                )}
              </div>

              <h2 className="font-heading font-black text-xl sm:text-2xl text-[#121212] uppercase tracking-tight mb-2">
                {run.title}
              </h2>
              <p className="text-xs text-[#595E68] leading-relaxed mb-4">
                {run.description}
              </p>

              {/* Schedule & Location card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-white border-2 border-[#E9ECEF] text-xs">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#FF4500]/10 flex items-center justify-center shrink-0 text-[#FF4500]">
                    <Calendar className="w-4 h-4 stroke-[2.5px]" />
                  </div>
                  <div>
                    <span className="font-heading font-black text-[#121212] uppercase block text-xs">
                      {new Date(run.scheduledAt).toLocaleDateString(undefined, {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="text-[#595E68] font-semibold">
                      {new Date(run.scheduledAt).toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#FF4500]/10 flex items-center justify-center shrink-0 text-[#FF4500]">
                    <MapPin className="w-4 h-4 stroke-[2.5px]" />
                  </div>
                  <div>
                    <span className="font-heading font-black text-[#121212] uppercase block text-xs">
                      MEETING POINT
                    </span>
                    <span className="text-[#595E68] font-medium">{run.meetingPoint}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Shareable Run Invite Link Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-white border border-[#E9ECEF] shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#121212] text-[#CCFF00] flex items-center justify-center shrink-0">
                  <Link2 className="w-4 h-4 stroke-[2.5px]" />
                </div>
                <div className="min-w-0">
                  <span className="font-heading font-black text-[11px] text-[#121212] uppercase block tracking-wider">
                    SHAREABLE RUN INVITE LINK
                  </span>
                  <span className="text-xs text-[#595E68] truncate block font-mono">
                    {window.location.origin}?run={run.id}
                  </span>
                </div>
              </div>

              <button
                onClick={handleShare}
                className={`px-4 py-2 rounded-xl font-heading font-black text-xs uppercase tracking-tight transition-all shrink-0 flex items-center justify-center gap-2 ${
                  copyFeedback
                    ? 'bg-[#121212] text-[#CCFF00] border-2 border-[#CCFF00] shadow-sm'
                    : 'btn-electric'
                }`}
              >
                {copyFeedback ? (
                  <>
                    <Check className="w-4 h-4 text-[#CCFF00] stroke-[2.5px]" />
                    <span>LINK COPIED!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 stroke-[2.5px]" />
                    <span>COPY INVITE LINK</span>
                  </>
                )}
              </button>
            </div>

            {/* Host & RSVP CTA Bar: Asphalt card with Electric Neon CTA */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#121212] text-white border-2 border-[#2E2E32]">
              <div className="flex items-center gap-3">
                {run.creatorPhoto ? (
                  <img
                    src={run.creatorPhoto}
                    alt={run.creatorName || 'Host'}
                    className="w-10 h-10 rounded-lg object-cover ring-2 ring-[#FF4500]"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-[#FF4500] text-white flex items-center justify-center font-heading font-black text-sm">
                    {run.creatorName?.[0] || 'C'}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-black text-sm uppercase text-white">
                      {run.creatorName || 'CLUB LEADER'}
                    </span>
                    <span className="text-[9px] px-2 py-0.5 rounded font-black bg-[#CCFF00] text-[#121212] uppercase">
                      HOST
                    </span>
                  </div>
                  <p className="text-xs text-[#8E95A5]">
                    {run.creatorPaceCategory || 'Pacer'}
                  </p>
                </div>
              </div>

              {run.isUserRsvpd ? (
                <button
                  id="modal-rsvp-cta"
                  onClick={handleToggleRsvp}
                  className="h-11 px-6 bg-[#121212] hover:bg-[#1E1E1E] border-[2.5px] border-[#FFE600] text-[#FFE600] font-heading font-black text-sm uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-2 shadow-[3px_3px_0px_#FFE600] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#FFE600] active:translate-y-0.5 active:translate-x-0.5 active:shadow-[1px_1px_0px_#FFE600]"
                >
                  <Check className="w-4 h-4 stroke-[3.5px] text-[#FFE600]" />
                  <span>GOING ✓</span>
                </button>
              ) : (
                <button
                  id="modal-rsvp-cta"
                  onClick={handleToggleRsvp}
                  className="h-11 px-6 bg-[#FF4500] hover:bg-[#E03E00] border-[2.5px] border-[#121212] text-white font-heading font-black text-sm uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-2 shadow-[3px_3px_0px_#121212] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#121212] active:translate-y-0.5 active:translate-x-0.5 active:shadow-[1px_1px_0px_#121212]"
                >
                  <span>I'M GOING</span>
                  <ArrowRight className="w-4 h-4 stroke-[3px]" />
                </button>
              )}
            </div>

            {/* Attendees Roster */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-heading font-black text-[#121212] uppercase flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-[#121212] text-[#CCFF00] flex items-center justify-center shrink-0">
                    <Users className="w-3.5 h-3.5 stroke-[2.5px]" />
                  </div>
                  <span>RUNNERS ATTENDING ({run.attendeeCount})</span>
                </h3>
                <span className="text-[11px] font-semibold text-[#8E95A5]">
                  CAPACITY: {run.maxParticipants}
                </span>
              </div>

              {run.attendees && run.attendees.length > 0 ? (
                <div className="flex flex-wrap gap-2.5">
                  {run.attendees.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white border border-[#E9ECEF] text-xs font-heading font-black text-[#121212] uppercase shadow-2xs"
                    >
                      {att.userPhoto ? (
                        <img
                          src={att.userPhoto}
                          alt={att.userName || 'Member'}
                          className="w-6 h-6 rounded-full object-cover ring-1 ring-[#E9ECEF]"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-[#121212] text-[#CCFF00] flex items-center justify-center font-heading font-black text-[10px]">
                          {att.userName?.[0] || 'M'}
                        </div>
                      )}
                      <span>{att.userName?.split(' ')[0] || 'RUNNER'}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#8E95A5] italic">
                  Be the first runner to RSVP!
                </p>
              )}
            </div>

            {/* Run Discussion / Comments */}
            <div className="border-t border-[#E9ECEF] pt-5">
              <h3 className="text-xs font-heading font-black text-[#121212] uppercase mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#FF4500]" />
                <span>RUN ROSTER BRIEFING & Q&A</span>
              </h3>

              <div className="space-y-2.5 mb-4 max-h-48 overflow-y-auto pr-1">
                {run.comments && run.comments.length > 0 ? (
                  run.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="p-3.5 rounded-xl bg-white border border-[#E9ECEF] text-xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-heading font-black text-[#121212] uppercase">
                          {comment.userName}
                        </span>
                        <span className="text-[10px] text-[#8E95A5]">
                          {new Date(comment.createdAt).toLocaleTimeString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-[#595E68] leading-relaxed">{comment.message}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#8E95A5] italic py-2">
                    No questions posted yet. Post below to connect with the pacer!
                  </p>
                )}
              </div>

              {/* Comment Input */}
              <form onSubmit={handlePostComment} className="flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={
                    user
                      ? 'Post a note or question for the pacer...'
                      : 'Sign in with Google to post a comment'
                  }
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white border-2 border-[#E9ECEF] text-xs text-[#121212] placeholder-[#8E95A5] focus:outline-none focus:border-[#FF4500]"
                />
                <button
                  type="submit"
                  disabled={isSubmittingComment || !commentText.trim()}
                  className="btn-electric px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>SEND</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
