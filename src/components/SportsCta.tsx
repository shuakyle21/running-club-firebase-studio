import React from 'react';
import { ArrowRight, Check } from 'lucide-react';

export interface SportsCtaProps {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: 'rsvp' | 'action' | 'secondary';
  isRsvpd?: boolean;
  children?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  id?: string;
  title?: string;
}

export const SportsCta: React.FC<SportsCtaProps> = ({
  onClick,
  variant = 'action',
  isRsvpd = false,
  children,
  className = '',
  size = 'md',
  fullWidth = false,
  type = 'button',
  disabled = false,
  id,
  title,
}) => {
  const isRsvpMode = variant === 'rsvp';

  // Sizing definitions
  const sizeStyles = {
    sm: 'h-10 px-3.5 text-xs',
    md: 'h-11 px-5 text-xs sm:text-sm',
    lg: 'h-13 px-7 text-sm sm:text-base',
  };

  return (
    <button
      id={id}
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`relative inline-flex items-center justify-center select-none group font-heading font-black uppercase tracking-wider transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#121212] focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
    >
      {/* Underlying Comic / Sports Yellow Jagged Accent Layer */}
      <div
        aria-hidden="true"
        className="absolute -inset-x-2 -inset-y-1.5 pointer-events-none transition-transform duration-150 group-hover:scale-x-[1.02] group-hover:scale-y-[1.04] group-active:scale-[0.98]"
        style={{
          filter: 'drop-shadow(3.5px 3.5px 0px #121212)',
        }}
      >
        <svg
          viewBox="0 0 200 50"
          preserveAspectRatio="none"
          className="w-full h-full overflow-visible"
        >
          {/* Jagged angular polygon ribbon burst inspired by race-day bib & comic banner */}
          <polygon
            points="
              2,22 8,12 3,5 18,3 55,5 120,2 175,0 196,4
              193,16 200,26 195,36 198,46 172,49 110,48
              45,50 15,48 4,46 8,34 0,26
            "
            fill={isRsvpMode && isRsvpd ? '#CCFF00' : '#FFE600'}
            stroke="#121212"
            strokeWidth="2.5"
            strokeLinejoin="miter"
          />
        </svg>
      </div>

      {/* Primary Foreground Button Surface Plate */}
      <span
        className={`relative z-10 w-full flex items-center justify-center gap-2 border-[2.5px] border-[#121212] transition-all duration-150 shadow-[2px_2px_0px_#121212] group-hover:-translate-y-0.5 group-hover:shadow-[3px_3px_0px_#121212] group-active:translate-y-0.5 group-active:translate-x-0.5 group-active:shadow-[1px_1px_0px_#121212] whitespace-nowrap ${
          sizeStyles[size]
        } ${
          isRsvpMode && isRsvpd
            ? 'bg-[#121212] text-[#FFE600] border-[#121212]'
            : isRsvpMode
            ? 'bg-[#E5E7EB] text-[#121212] group-hover:bg-[#ECEEF2]'
            : variant === 'secondary'
            ? 'bg-white text-[#121212] group-hover:bg-[#F3F4F6]'
            : 'bg-[#E5E7EB] text-[#121212] group-hover:bg-[#ECEEF2]'
        }`}
      >
        {isRsvpMode ? (
          isRsvpd ? (
            <>
              <Check className="w-4 h-4 stroke-[3.5px] text-[#FFE600] shrink-0" />
              <span>GOING ✓</span>
            </>
          ) : (
            <>
              <span>I'M GOING</span>
              <ArrowRight className="w-4 h-4 stroke-[3px] text-[#121212] shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </>
          )
        ) : (
          children
        )}
      </span>
    </button>
  );
};
