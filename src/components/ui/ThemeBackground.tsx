import React from 'react';

interface ThemeBackgroundProps {
  themeId: string;
}

export default function ThemeBackground({ themeId }: ThemeBackgroundProps) {
  if (themeId === 'minimalist') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-10 left-10 w-32 h-32 border border-gray-200 rounded-3xl" />
        <div className="absolute bottom-20 right-16 w-48 h-1 bg-gray-300 rounded-full" />
        <div className="absolute top-1/2 right-1/4 w-16 h-16 border-2 border-gray-300 rounded-full" />
      </div>
    );
  }

  if (themeId === 'geometric') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-25">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <defs>
            <pattern id="dots" x="50" y="50" width="50" height="50" patternUnits="userSpaceOnUse">
              <circle cx="25" cy="25" r="2" fill="rgba(34,197,94,0.2)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>
    );
  }

  if (themeId === 'pastel') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-pink-300/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-blue-300/30 rounded-full blur-3xl" />
        <div className="absolute top-1/3 left-1/2 w-60 h-60 bg-purple-200/30 rounded-full blur-3xl" />
      </div>
    );
  }

  if (themeId === 'cyberpunk') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
        <div className="absolute bottom-1/3 left-0 w-1 h-32 bg-gradient-to-b from-transparent via-cyan-500 to-transparent" />
        <div className="absolute top-1/2 right-0 w-1 h-40 bg-gradient-to-b from-transparent via-pink-500 to-transparent" />
        <svg className="absolute inset-0 w-full h-full opacity-20" preserveAspectRatio="none">
          <line x1="0%" y1="25%" x2="100%" y2="25%" stroke="rgb(34,211,238)" strokeWidth="1" />
          <line x1="0%" y1="50%" x2="100%" y2="50%" stroke="rgb(34,211,238)" strokeWidth="1" />
          <line x1="0%" y1="75%" x2="100%" y2="75%" stroke="rgb(34,211,238)" strokeWidth="1" />
        </svg>
      </div>
    );
  }

  if (themeId === 'gold') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-yellow-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl" />
        <svg className="absolute inset-0 w-full h-full opacity-15" preserveAspectRatio="none">
          <defs>
            <pattern id="gold-dots" x="60" y="60" width="60" height="60" patternUnits="userSpaceOnUse">
              <circle cx="30" cy="30" r="3" fill="rgba(217,119,6,0.6)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#gold-dots)" />
        </svg>
      </div>
    );
  }

  return null;
}
