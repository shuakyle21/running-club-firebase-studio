import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { RunItem } from '../types.ts';
import {
  User,
  ShieldCheck,
  Calendar,
  Award,
  LogOut,
  MapPin,
  CheckCircle2,
  Plus,
  ArrowRight,
  Users,
  Flame,
  Zap,
  Filter,
  Check,
} from 'lucide-react';

interface ProfileViewProps {
  runs: RunItem[];
  onSelectRun: (run: RunItem) => void;
  onOpenPostModal: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  runs,
  onSelectRun,
  onOpenPostModal,
}) => {
  const { user, profile, signInWithGoogle, signOut, idToken, refreshProfile } = useAuth();
  const [selectedPace, setSelectedPace] = useState<string>(
    profile?.paceCategory || 'Tempo 5:00 - 5:30 min/km'
  );
  const [isSavingPace, setIsSavingPace] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [rosterFilter, setRosterFilter] = useState<'all' | 'pacers' | 'members'>('all');

  // Runs user has RSVP'd to
  const myRsvpdRuns = runs.filter((r) => r.isUserRsvpd);
  // Runs user has created
  const myCreatedRuns = runs.filter((r) => r.creatorUid === user?.uid);

  // Total mileage calculation
  const totalRsvpMileage = myRsvpdRuns.reduce(
    (sum, r) => sum + parseFloat(r.distanceKm || '0'),
    0
  );

  // Extract distinct community athletes from all active runs & attendees for Club Roster
  const clubRoster = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        photo?: string | null;
        pace?: string | null;
        runsAttended: number;
        runsHosted: number;
        isCurrentUser: boolean;
        role: 'PACER / HOST' | 'CLUB RUNNER';
      }
    >();

    // Add current authenticated athlete
    if (user) {
      map.set(user.uid, {
        id: user.uid,
        name: user.displayName || 'You',
        photo: user.photoURL,
        pace: profile?.paceCategory || selectedPace,
        runsAttended: myRsvpdRuns.length,
        runsHosted: myCreatedRuns.length,
        isCurrentUser: true,
        role: myCreatedRuns.length > 0 ? 'PACER / HOST' : 'CLUB RUNNER',
      });
    }

    // Aggregate members and pacers from community runs
    runs.forEach((run) => {
      if (run.creatorUid && run.creatorName) {
        const existing = map.get(run.creatorUid);
        if (existing) {
          existing.runsHosted += 1;
          existing.role = 'PACER / HOST';
        } else {
          map.set(run.creatorUid, {
            id: run.creatorUid,
            name: run.creatorName,
            photo: run.creatorPhoto,
            pace: run.creatorPaceCategory || 'Pacer',
            runsAttended: 0,
            runsHosted: 1,
            isCurrentUser: user ? run.creatorUid === user.uid : false,
            role: 'PACER / HOST',
          });
        }
      }

      run.attendees?.forEach((att) => {
        if (att.userUid && att.userName) {
          const existing = map.get(att.userUid);
          if (existing) {
            existing.runsAttended += 1;
          } else {
            map.set(att.userUid, {
              id: att.userUid,
              name: att.userName,
              photo: att.userPhoto,
              pace: att.userPaceCategory || 'Club Runner',
              runsAttended: 1,
              runsHosted: 0,
              isCurrentUser: user ? att.userUid === user.uid : false,
              role: 'CLUB RUNNER',
            });
          }
        }
      });
    });

    return Array.from(map.values());
  }, [runs, user, profile, selectedPace, myRsvpdRuns.length, myCreatedRuns.length]);

  const filteredRoster = useMemo(() => {
    if (rosterFilter === 'pacers') {
      return clubRoster.filter((m) => m.role === 'PACER / HOST');
    }
    if (rosterFilter === 'members') {
      return clubRoster.filter((m) => m.role === 'CLUB RUNNER');
    }
    return clubRoster;
  }, [clubRoster, rosterFilter]);

  const handleUpdatePace = async () => {
    if (!idToken || !user) return;
    setIsSavingPace(true);
    setSaveSuccess(false);
    try {
      await fetch('/api/users/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          displayName: user.displayName,
          photoURL: user.photoURL,
          paceCategory: selectedPace,
        }),
      });
      await refreshProfile();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to update pace preference:', err);
    } finally {
      setIsSavingPace(false);
    }
  };

  if (!user) {
    return (
      <section className="max-w-md mx-auto px-4 py-16 text-center" aria-label="Member Authentication">
        <div className="w-16 h-16 rounded-2xl bg-[#121212] text-[#CCFF00] border-2 border-[#CCFF00] flex items-center justify-center mx-auto mb-4 shadow-xl">
          <User className="w-8 h-8 stroke-[2.5px]" />
        </div>
        <h2 className="font-heading font-black text-2xl uppercase tracking-tight text-[#121212] mb-2">
          MEMBER ROSTER ACCESS
        </h2>
        <p className="text-xs text-[#595E68] leading-relaxed mb-6">
          Sign in with Google to track your RSVPs, set target pace preference, and join fellow club runners.
        </p>
        <button
          id="profile-google-signin-btn"
          onClick={signInWithGoogle}
          className="h-12 px-6 bg-[#FFE600] hover:bg-[#F2DA00] border-[2.5px] border-[#121212] text-[#121212] font-heading font-black text-sm uppercase tracking-wider transition-all duration-150 inline-flex items-center justify-center gap-3 shadow-[3px_3px_0px_#121212] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#121212] active:translate-y-0.5 active:translate-x-0.5 active:shadow-[1px_1px_0px_#121212]"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#121212"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#121212"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#121212"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#121212"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>SIGN IN WITH GOOGLE →</span>
        </button>
      </section>
    );
  }

  return (
    <section className="w-full max-w-5xl mx-auto px-[5vw] py-10 pb-24 md:pb-16 space-y-10" aria-label="Runner Profile">
      {/* 1. Athlete Bio Card */}
      <article className="athletic-card p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-[#E9ECEF]">
          <div className="flex items-center gap-4">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'Avatar'}
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-xl object-cover ring-2 ring-[#FF4500]"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-[#121212] text-[#CCFF00] flex items-center justify-center font-heading font-black text-2xl">
                {(user.displayName || user.email || 'U')[0].toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading font-black text-xl sm:text-2xl uppercase tracking-tight text-[#121212]">
                  {user.displayName || 'CLUB ATHLETE'}
                </h1>
                <span className="px-2 py-0.5 rounded font-heading font-black text-[10px] bg-[#CCFF00] text-[#121212] uppercase">
                  VERIFIED RUNNER
                </span>
              </div>
              <p className="text-xs text-[#595E68] mt-0.5">{user.email}</p>
              <div className="mt-1.5 flex items-center gap-1.5 text-xs font-heading font-black text-[#FF4500] uppercase">
                <ShieldCheck className="w-4 h-4" />
                <span>RUNNER PROFILE VERIFIED · ACTIVE ROSTER</span>
              </div>
            </div>
          </div>

          <button
            onClick={signOut}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 bg-white border-[2.5px] border-[#121212] text-red-600 hover:bg-red-50 text-xs font-heading font-black uppercase transition-all shadow-[2px_2px_0px_#121212] active:translate-x-0.5 active:translate-y-0.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>SIGN OUT</span>
          </button>
        </div>

        {/* Athletic Stats Grid */}
        <div className="grid grid-cols-3 gap-4 pt-6">
          <div className="p-4 rounded-xl bg-[#121212] text-white border border-[#2E2E32] text-center">
            <span className="text-[10px] font-heading font-black text-[#8E95A5] block uppercase tracking-wider mb-1">
              JOINED RUNS
            </span>
            <span className="text-3xl font-heading font-black text-[#FFE600]">
              {myRsvpdRuns.length}
            </span>
          </div>
          <div className="p-4 rounded-xl bg-[#121212] text-white border border-[#2E2E32] text-center">
            <span className="text-[10px] font-heading font-black text-[#8E95A5] block uppercase tracking-wider mb-1">
              RUNS PACED
            </span>
            <span className="text-3xl font-heading font-black text-[#FF4500]">
              {myCreatedRuns.length}
            </span>
          </div>
          <div className="p-4 rounded-xl bg-[#121212] text-white border border-[#2E2E32] text-center">
            <span className="text-[10px] font-heading font-black text-[#8E95A5] block uppercase tracking-wider mb-1">
              COMMITTED KM
            </span>
            <span className="text-3xl font-heading font-black text-white">
              {Math.round(totalRsvpMileage * 10) / 10}
            </span>
          </div>
        </div>

        {/* Pace Group Selection Bar */}
        <div className="mt-6 pt-6 border-t border-[#E9ECEF]">
          <label className="block text-xs font-heading font-black text-[#121212] uppercase mb-2">
            TARGET PACE PREFERENCE
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <select
              value={selectedPace}
              onChange={(e) => setSelectedPace(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-white border-2 border-[#E9ECEF] text-xs font-heading font-black text-[#121212] uppercase focus:outline-none focus:border-[#FF4500]"
            >
              <option value="Conversational 6:30+ min/km">CONVERSATIONAL (6:30+ MIN/KM) / ALL PACES</option>
              <option value="Easy Aerobic 6:00 - 6:30 min/km">EASY AEROBIC (6:00 - 6:30 MIN/KM)</option>
              <option value="Moderate 5:30 - 6:00 min/km">MODERATE (5:30 - 6:00 MIN/KM)</option>
              <option value="Tempo 5:00 - 5:30 min/km">TEMPO (5:00 - 5:30 MIN/KM)</option>
              <option value="Sub 4:45 min/km (Speed/Marathon)">SUB 4:45 MIN/KM (SPEED / MARATHON PREP)</option>
            </select>
            <button
              onClick={handleUpdatePace}
              disabled={isSavingPace}
              className="h-10 px-5 bg-[#FFE600] border-[2.5px] border-[#121212] text-[#121212] font-heading font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-[2px_2px_0px_#121212] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#121212] active:translate-y-0.5 active:translate-x-0.5 active:shadow-[1px_1px_0px_#121212]"
            >
              {saveSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#121212] stroke-[2.5px]" />
                  <span>PREFERENCE SAVED!</span>
                </>
              ) : (
                <span>UPDATE PACE</span>
              )}
            </button>
          </div>
        </div>
      </article>

      {/* 2. OFFICIAL CLUB ROSTER: Community Athletes & Pacers */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-heading font-black text-lg text-[#121212] uppercase tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-[#FF4500]" />
              <span>OFFICIAL CLUB ROSTER ({filteredRoster.length} ATHLETES)</span>
            </h2>
            <p className="text-xs text-[#595E68] mt-0.5">
              Active verified pacers, community runners, and group members across all scheduled runs.
            </p>
          </div>

          {/* Roster Category Filter Chips */}
          <div className="flex items-center gap-1.5 bg-[#E9ECEF] p-1 rounded-xl border border-[#D3D7DC]">
            <button
              onClick={() => setRosterFilter('all')}
              className={`px-3 py-1 rounded-lg text-[10px] font-heading font-black uppercase tracking-wider transition-all ${
                rosterFilter === 'all'
                  ? 'bg-[#121212] text-[#CCFF00] shadow-xs'
                  : 'text-[#595E68] hover:text-[#121212]'
              }`}
            >
              ALL ({clubRoster.length})
            </button>
            <button
              onClick={() => setRosterFilter('pacers')}
              className={`px-3 py-1 rounded-lg text-[10px] font-heading font-black uppercase tracking-wider transition-all ${
                rosterFilter === 'pacers'
                  ? 'bg-[#121212] text-[#FFE600] shadow-xs'
                  : 'text-[#595E68] hover:text-[#121212]'
              }`}
            >
              PACERS / HOSTS
            </button>
            <button
              onClick={() => setRosterFilter('members')}
              className={`px-3 py-1 rounded-lg text-[10px] font-heading font-black uppercase tracking-wider transition-all ${
                rosterFilter === 'members'
                  ? 'bg-[#121212] text-white shadow-xs'
                  : 'text-[#595E68] hover:text-[#121212]'
              }`}
            >
              MEMBERS
            </button>
          </div>
        </div>

        {filteredRoster.length === 0 ? (
          <div className="athletic-card p-8 text-center">
            <p className="text-xs text-[#595E68]">
              No athletes found in this filter category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredRoster.map((member) => (
              <article
                key={member.id}
                className={`athletic-card p-4 flex items-center justify-between gap-3 ${
                  member.isCurrentUser ? 'ring-2 ring-[#FF4500]' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {member.photo ? (
                    <img
                      src={member.photo}
                      alt={member.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-xl object-cover ring-2 ring-white border border-[#E9ECEF] shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-[#121212] text-[#CCFF00] font-heading font-black text-sm flex items-center justify-center shrink-0 border border-[#2E2E32]">
                      {(member.name || 'R')[0].toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-heading font-black text-sm text-[#121212] uppercase truncate">
                        {member.name}
                      </span>
                      {member.isCurrentUser && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-heading font-black bg-[#FF4500] text-white uppercase shrink-0">
                          YOU
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-[#595E68] truncate font-medium mt-0.5">
                      {member.pace || 'All Paces'}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[9px] font-heading font-black uppercase tracking-wider ${
                      member.role === 'PACER / HOST'
                        ? 'bg-[#121212] text-[#FFE600] border border-[#2E2E32]'
                        : 'bg-[#F0F2F5] text-[#595E68] border border-[#E9ECEF]'
                    }`}
                  >
                    {member.role === 'PACER / HOST' ? 'PACER' : 'MEMBER'}
                  </span>
                  <span className="block text-[10px] text-[#8E95A5] font-bold uppercase mt-1">
                    {member.runsHosted > 0
                      ? `${member.runsHosted} HOSTED`
                      : `${member.runsAttended} JOINED`}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* 3. Attending Runs List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-black text-lg text-[#121212] uppercase tracking-tight flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#FF4500]" />
            <span>RUNS YOU'RE ATTENDING ({myRsvpdRuns.length})</span>
          </h2>
        </div>

        {myRsvpdRuns.length === 0 ? (
          <div className="athletic-card p-8 text-center">
            <p className="text-xs text-[#595E68] mb-3">
              You haven't RSVP'd to any scheduled group runs yet.
            </p>
            <span className="text-xs font-heading font-black text-[#FF4500] uppercase">
              Browse upcoming group sessions on the feed
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {myRsvpdRuns.map((run) => (
              <article
                key={run.id}
                onClick={() => onSelectRun(run)}
                className="athletic-card p-5 cursor-pointer transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded font-heading font-black text-xs bg-[#FF4500] text-white uppercase">
                      {run.distanceKm} KM
                    </span>
                    <span className="text-xs font-heading font-black text-[#121212] uppercase">
                      {new Date(run.scheduledAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <h3 className="font-heading font-black text-base text-[#121212] uppercase tracking-tight mb-1 line-clamp-1">
                    {run.title}
                  </h3>
                  <p className="text-xs text-[#595E68] flex items-center gap-1 line-clamp-1 mb-3">
                    <MapPin className="w-3.5 h-3.5 text-[#FF4500] shrink-0" />
                    <span>{run.meetingPoint}</span>
                  </p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-[#E9ECEF] text-xs">
                  <span className="font-heading font-black text-[#121212] uppercase flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#FF4500]" />
                    <span>GOING</span>
                  </span>
                  <span className="font-heading font-black text-[#FF4500] uppercase flex items-center gap-1">
                    <span>VIEW RUN</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* 4. Created / Hosted Runs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-black text-lg text-[#121212] uppercase tracking-tight flex items-center gap-2">
            <Award className="w-5 h-5 text-[#FF4500]" />
            <span>RUNS YOU'VE HOSTED ({myCreatedRuns.length})</span>
          </h2>
          <button
            onClick={onOpenPostModal}
            className="inline-flex items-center gap-1 text-xs font-heading font-black text-[#FF4500] uppercase hover:underline"
          >
            <Plus className="w-4 h-4" />
            <span>HOST ANOTHER RUN</span>
          </button>
        </div>

        {myCreatedRuns.length === 0 ? (
          <div className="athletic-card p-8 text-center">
            <p className="text-xs text-[#595E68] mb-4">
              You haven't posted any community runs yet.
            </p>
            <button
              onClick={onOpenPostModal}
              className="btn-electric inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black"
            >
              <Plus className="w-4 h-4 stroke-[3px]" />
              <span>POST YOUR FIRST ROUTE</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {myCreatedRuns.map((run) => (
              <article
                key={run.id}
                onClick={() => onSelectRun(run)}
                className="athletic-card p-5 cursor-pointer transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded font-heading font-black text-xs bg-[#FF4500] text-white uppercase">
                      {run.distanceKm} KM
                    </span>
                    <span className="text-xs font-heading font-black text-[#595E68] uppercase">
                      {run.attendeeCount} RUNNERS JOINED
                    </span>
                  </div>
                  <h3 className="font-heading font-black text-base text-[#121212] uppercase tracking-tight mb-1 line-clamp-1">
                    {run.title}
                  </h3>
                  <p className="text-xs text-[#595E68] line-clamp-1 mb-3">
                    {run.meetingPoint}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-[#E9ECEF] text-xs font-heading font-black text-[#FF4500] uppercase">
                  <span>ACTIVE ON BOARD</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
