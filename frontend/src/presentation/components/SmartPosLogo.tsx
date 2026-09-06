import React from 'react';

interface SmartPosLogoProps {
  variant?: 'icon' | 'full' | 'compact';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  subtitle?: string;
  showSubtitle?: boolean;
}

export const SmartPosLogo: React.FC<SmartPosLogoProps> = ({
  variant = 'full',
  size = 'md',
  className = '',
  subtitle = 'HQ-01 Phnom Penh',
  showSubtitle = true,
}) => {
  // Size mappings for icon container
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const textMap = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-2xl',
  };

  const subTextMap = {
    sm: 'text-[9px]',
    md: 'text-[10px]',
    lg: 'text-[11px]',
    xl: 'text-xs',
  };

  // The Icon Graphic Mark
  const IconMark = (
    <div
      className={`${sizeMap[size]} rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-200 shrink-0 relative overflow-hidden transition transform group-hover:scale-105`}
    >
      {/* Subtle glossy overlay */}
      <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/20 rounded-t-xl pointer-events-none" />

      {/* SVG Stylized POS Symbol */}
      <svg
        className="w-3/5 h-3/5 text-white"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Terminal Body */}
        <rect
          x="3"
          y="2"
          width="18"
          height="20"
          rx="4"
          className="stroke-white"
          strokeWidth="2"
          fill="rgba(255, 255, 255, 0.15)"
        />
        {/* Screen */}
        <rect
          x="6"
          y="5"
          width="12"
          height="8"
          rx="1.5"
          fill="white"
        />
        {/* Screen Active Status / Pulse */}
        <line x1="8" y1="8" x2="13" y2="8" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="15.5" cy="8" r="1" fill="#059669" />

        {/* Contactless Arcs */}
        <path
          d="M7 16.5C7.8 15.5 9 15 10.5 15"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M9.5 18.5C10 18 10.8 17.5 11.8 17.5"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* Card Slot */}
        <rect x="14" y="15.5" width="4" height="2.5" rx="1" fill="white" />
      </svg>
    </div>
  );

  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        {IconMark}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center space-x-2.5 select-none ${className}`}>
      {IconMark}
      <div className="leading-tight flex flex-col justify-center">
        <div className="flex items-center space-x-0.5">
          <span className={`font-black text-gray-900 tracking-tight ${textMap[size]}`}>
            Smart
          </span>
          <span className={`font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 tracking-tight ${textMap[size]}`}>
            POS
          </span>
        </div>
        {showSubtitle && subtitle && (
          <span className={`font-bold text-emerald-600 uppercase tracking-wider ${subTextMap[size]}`}>
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};
