import React from 'react';
import { Compass, Flame, Map, PlusCircle, User } from 'lucide-react';
import { NavigationTab } from '../types.ts';

interface NavigationProps {
  currentTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  unreadCount?: number;
}

export const Navigation: React.FC<NavigationProps> = ({ currentTab, onTabChange }) => {
  const tabs = [
    { id: 'runs' as NavigationTab, label: 'UPCOMING RUNS', icon: Flame },
    { id: 'routes' as NavigationTab, label: 'ROUTE LIBRARY', icon: Compass },
    { id: 'map' as NavigationTab, label: 'ROUTE EXPLORER', icon: Map },
    { id: 'post' as NavigationTab, label: 'POST A RUN', icon: PlusCircle },
    { id: 'profile' as NavigationTab, label: 'CLUB ROSTER', icon: User },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation Bar (Athletic Asphalt Dock) */}
      <nav
        id="mobile-bottom-nav"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#121212]/95 backdrop-blur-md border-t border-[#2A2A2A] px-2 py-2 shadow-2xl"
        aria-label="Mobile Navigation"
      >
        <div className="flex items-center justify-around max-w-md mx-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`nav-tab-mobile-${tab.id}`}
                onClick={() => onTabChange(tab.id)}
                className="flex flex-col items-center justify-center flex-1 py-1 px-1 transition-all duration-150 active:scale-90"
              >
                <div
                  className={`flex items-center justify-center p-1.5 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-[#CCFF00] text-[#121212] shadow-[0_0_12px_rgba(204,255,0,0.5)]'
                      : 'text-[#A0A5B0] hover:text-white'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} />
                </div>
                <span
                  className={`text-[9px] mt-1 tracking-tighter uppercase font-heading ${
                    isActive ? 'font-black text-[#CCFF00]' : 'font-bold text-[#808590]'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Desktop Navigation Links */}
      <nav
        id="desktop-nav-pills"
        className="hidden md:flex items-center gap-2 bg-[#1E1E1E] p-1.5 rounded-xl border border-[#2E2E32]"
        aria-label="Main Navigation"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`nav-tab-desktop-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase font-heading tracking-tight transition-all duration-150 ${
                isActive
                  ? 'bg-[#CCFF00] text-[#121212] shadow-[0_2px_10px_rgba(204,255,0,0.3)] scale-[1.02]'
                  : 'text-[#C5C8D0] hover:text-white hover:bg-[#28282D]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.8px] text-[#121212]' : 'stroke-[2px]'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
