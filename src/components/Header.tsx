import React, { useState } from 'react';
import { Flame, LogIn, LogOut, Plus, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { Navigation } from './Navigation.tsx';
import { NavigationTab } from '../types.ts';
import { SportsCta } from './SportsCta.tsx';

interface HeaderProps {
  currentTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  onOpenPostModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  onOpenPostModal,
}) => {
  const { user, signInWithGoogle, signOut } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header
      id="app-header"
      className="sticky top-0 z-30 bg-[#121212]/95 backdrop-blur-md border-b border-[#222225] shadow-xl"
    >
      <div className="w-full px-[4vw] sm:px-[5vw] h-20 flex items-center justify-between gap-4">
        {/* Athletic Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onTabChange('runs')}
            className="flex items-center gap-3 text-left group"
          >
            <div className="w-11 h-11 rounded-xl bg-[#FF4500] flex items-center justify-center text-white shadow-[0_4px_16px_rgba(255,69,0,0.4)] group-hover:scale-105 group-hover:rotate-2 transition-all duration-200">
              <Flame className="w-6 h-6 stroke-[2.5px] fill-white/20" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-black text-2xl tracking-[-1px] text-white uppercase">
                  STRIDE
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded font-heading font-black bg-[#CCFF00] text-[#121212] tracking-wide">
                  RUN CLUB
                </span>
              </div>
              <p className="text-[11px] font-semibold text-[#8E95A5] uppercase tracking-wider hidden sm:block">
                COMMUNITY RUN CLUB · PACE & ROUTES
              </p>
            </div>
          </button>
        </div>

        {/* Center Desktop Navigation */}
        <Navigation currentTab={currentTab} onTabChange={onTabChange} />

        {/* Right Actions: Comic Sports Ribbon CTA & Auth */}
        <div className="flex items-center gap-3">
          {/* POST A RUN Sports CTA Button */}
          <SportsCta
            id="header-post-run-btn"
            onClick={onOpenPostModal}
            size="sm"
            className="hidden sm:inline-flex"
          >
            <span className="flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 stroke-[3.5px]" />
              <span>POST A RUN</span>
            </span>
          </SportsCta>

          {/* User Profile or Google Sign In */}
          {user ? (
            <div className="relative">
              <button
                id="user-profile-button"
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2.5 p-1 pl-2.5 pr-1.5 rounded-xl bg-[#1E1E1E] border border-[#2E2E32] hover:border-[#FF4500] transition-colors"
              >
                <span className="text-xs font-heading font-black text-white uppercase tracking-tight max-w-[110px] truncate hidden md:inline">
                  {user.displayName?.split(' ')[0] || 'RUNNER'}
                </span>
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Avatar'}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-lg object-cover ring-2 ring-[#FF4500]"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-[#FF4500] text-white flex items-center justify-center font-heading font-black text-xs">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
              </button>

              {/* User Dropdown */}
              {showDropdown && (
                <div
                  id="user-menu-dropdown"
                  className="absolute right-0 mt-2 w-60 bg-[#1C1C1E] rounded-2xl shadow-2xl border border-[#2E2E32] p-2 z-50 animate-in fade-in slide-in-from-top-2 text-white"
                >
                  <div className="px-3 py-2.5 border-b border-[#2A2A2E] mb-1">
                    <p className="font-heading font-black text-sm uppercase text-white truncate">
                      {user.displayName || 'CLUB RUNNER'}
                    </p>
                    <p className="text-xs text-[#8E95A5] truncate">{user.email}</p>
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#FFE600] font-heading font-black uppercase">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>MEMBER VERIFIED · STRIDE PASS</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onTabChange('profile');
                      setShowDropdown(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-heading font-black uppercase text-[#E0E2EC] hover:text-[#121212] hover:bg-[#CCFF00] transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span>MY CLUB PROFILE</span>
                  </button>

                  <button
                    onClick={() => {
                      signOut();
                      setShowDropdown(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-heading font-black uppercase text-[#FF4500] hover:bg-[#FF4500]/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>SIGN OUT</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              id="google-signin-btn"
              onClick={signInWithGoogle}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1E1E1E] border border-[#2E2E32] text-white hover:border-[#CCFF00] hover:text-[#CCFF00] active:scale-95 transition-all text-xs font-heading font-black uppercase"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>SIGN IN</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
