import React from 'react';

interface ThemeBackgroundProps {
  themeId: string;
}

export default function ThemeBackground({ themeId }: ThemeBackgroundProps) {
  if (themeId === 'default') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-50 rounded-full blur-3xl opacity-60 -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-50 rounded-full blur-3xl opacity-50 translate-y-1/3 -translate-x-1/4" />
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="grid-default" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#6366f1" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-default)" />
        </svg>
      </div>
    );
  }

  if (themeId === 'dark') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-3xl" />
        <svg className="absolute inset-0 w-full h-full opacity-[0.06]" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="grid-dark" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#ffffff" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-dark)" />
        </svg>
        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400 rounded-full opacity-40 animate-pulse" />
        <div className="absolute top-3/4 right-1/3 w-1 h-1 bg-purple-400 rounded-full opacity-60 animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-1/4 w-1.5 h-1.5 bg-blue-300 rounded-full opacity-30 animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
    );
  }

  if (themeId === 'minimalist') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-12 left-8 w-40 h-40 border border-gray-200 rounded-3xl opacity-50 rotate-12" />
        <div className="absolute top-32 right-6 w-20 h-20 border-2 border-gray-200 rounded-full opacity-40" />
        <div className="absolute bottom-40 left-1/3 w-28 h-28 border border-gray-200 rounded-2xl opacity-30 -rotate-6" />
        <div className="absolute bottom-20 right-12 w-48 h-0.5 bg-gray-200 rounded-full opacity-60" />
        <div className="absolute top-1/2 left-6 w-0.5 h-32 bg-gray-200 rounded-full opacity-40" />
        <div className="absolute top-20 left-1/2 w-6 h-6 border border-gray-300 rounded-full opacity-50" />
        <div className="absolute bottom-1/3 right-1/4 w-10 h-10 border border-gray-200 opacity-40" style={{ transform: 'rotate(45deg)' }} />
      </div>
    );
  }

  if (themeId === 'geometric') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-500/8 rounded-full blur-3xl" />
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="dots-geo" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="1" fill="rgba(34,211,238,0.25)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots-geo)" />
          {/* Geometric shapes */}
          <polygon points="0,0 120,0 0,120" fill="rgba(34,211,238,0.04)" />
          <polygon points="100%,100% calc(100% - 150px),100% 100%,calc(100% - 150px)" fill="rgba(168,85,247,0.05)" />
          <line x1="0" y1="30%" x2="100%" y2="30%" stroke="rgba(34,211,238,0.08)" strokeWidth="1" />
          <line x1="0" y1="60%" x2="100%" y2="60%" stroke="rgba(34,211,238,0.06)" strokeWidth="1" />
          <line x1="30%" y1="0" x2="30%" y2="100%" stroke="rgba(34,211,238,0.05)" strokeWidth="1" />
          <rect x="10%" y="15%" width="50" height="50" fill="none" stroke="rgba(34,211,238,0.15)" strokeWidth="1" transform="rotate(15, calc(10% + 25), calc(15% + 25))" />
          <circle cx="75%" cy="25%" r="40" fill="none" stroke="rgba(34,211,238,0.1)" strokeWidth="1" />
        </svg>
      </div>
    );
  }

  if (themeId === 'pastel') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-pink-300/40 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute top-1/3 -right-20 w-72 h-72 bg-blue-300/35 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
        <div className="absolute -bottom-20 left-1/3 w-64 h-64 bg-purple-200/40 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }} />
        <svg className="absolute inset-0 w-full h-full opacity-20" preserveAspectRatio="xMidYMid slice">
          <circle cx="20%" cy="30%" r="60" fill="none" stroke="rgba(236,72,153,0.4)" strokeWidth="1" />
          <circle cx="20%" cy="30%" r="90" fill="none" stroke="rgba(236,72,153,0.2)" strokeWidth="1" />
          <circle cx="80%" cy="70%" r="50" fill="none" stroke="rgba(147,51,234,0.4)" strokeWidth="1" />
          <circle cx="80%" cy="70%" r="80" fill="none" stroke="rgba(147,51,234,0.2)" strokeWidth="1" />
          <circle cx="50%" cy="10%" r="30" fill="rgba(251,207,232,0.3)" />
        </svg>
      </div>
    );
  }

  if (themeId === 'cyberpunk') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Glow blobs */}
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-cyan-500/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-pink-500/12 rounded-full blur-3xl" />
        {/* Grid lines */}
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="cyber-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(34,211,238,0.08)" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#cyber-grid)" />
          {/* Neon accent lines */}
          <line x1="0" y1="20%" x2="100%" y2="20%" stroke="rgba(34,211,238,0.12)" strokeWidth="1" />
          <line x1="0" y1="80%" x2="100%" y2="80%" stroke="rgba(236,72,153,0.1)" strokeWidth="1" />
          <line x1="15%" y1="0" x2="15%" y2="100%" stroke="rgba(34,211,238,0.06)" strokeWidth="1" />
          <line x1="85%" y1="0" x2="85%" y2="100%" stroke="rgba(236,72,153,0.06)" strokeWidth="1" />
          {/* Corner brackets */}
          <path d="M 20 20 L 60 20 L 60 60" fill="none" stroke="rgba(34,211,238,0.3)" strokeWidth="1.5" />
          <path d="M calc(100% - 20px) calc(100% - 20px) L calc(100% - 60px) calc(100% - 20px) L calc(100% - 60px) calc(100% - 60px)" fill="none" stroke="rgba(236,72,153,0.3)" strokeWidth="1.5" />
        </svg>
        {/* Scan line effect */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,255,1) 2px, rgba(0,255,255,1) 4px)'
        }} />
      </div>
    );
  }

  if (themeId === 'ocean') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-cyan-900/20 to-transparent" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
        <svg className="absolute inset-0 w-full h-full opacity-20" preserveAspectRatio="xMidYMid slice">
          {/* Wave shapes */}
          <path d="M0,60 C150,100 350,20 500,60 C650,100 850,20 1000,60 L1000,0 L0,0 Z" fill="rgba(34,211,238,0.08)" />
          <path d="M0,80 C200,40 400,120 600,80 C800,40 1000,120 1200,80 L1200,0 L0,0 Z" fill="rgba(59,130,246,0.06)" />
          {/* Bubbles */}
          <circle cx="10%" cy="70%" r="3" fill="rgba(34,211,238,0.2)" />
          <circle cx="25%" cy="50%" r="2" fill="rgba(34,211,238,0.15)" />
          <circle cx="60%" cy="80%" r="4" fill="rgba(34,211,238,0.1)" />
          <circle cx="80%" cy="40%" r="2" fill="rgba(34,211,238,0.2)" />
          <circle cx="90%" cy="65%" r="3" fill="rgba(34,211,238,0.15)" />
          {/* Concentric circles like sonar */}
          <circle cx="15%" cy="85%" r="30" fill="none" stroke="rgba(34,211,238,0.1)" strokeWidth="1" />
          <circle cx="15%" cy="85%" r="60" fill="none" stroke="rgba(34,211,238,0.06)" strokeWidth="1" />
          <circle cx="85%" cy="20%" r="40" fill="none" stroke="rgba(59,130,246,0.1)" strokeWidth="1" />
          <circle cx="85%" cy="20%" r="80" fill="none" stroke="rgba(59,130,246,0.05)" strokeWidth="1" />
        </svg>
      </div>
    );
  }

  if (themeId === 'forest') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-emerald-900/20 via-transparent to-green-900/10" />
        <div className="absolute top-0 left-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-green-400/8 rounded-full blur-3xl" />
        <svg className="absolute inset-0 w-full h-full opacity-20" preserveAspectRatio="xMidYMid slice">
          {/* Tree-like shapes */}
          <polygon points="50%,5% calc(50% - 60px),40% calc(50% + 60px),40%" fill="rgba(52,211,153,0.06)" />
          <polygon points="50%,15% calc(50% - 80px),55% calc(50% + 80px),55%" fill="rgba(52,211,153,0.05)" />
          <polygon points="15%,10% 5%,50% 25%,50%" fill="rgba(52,211,153,0.05)" />
          <polygon points="85%,5% 75%,45% 95%,45%" fill="rgba(52,211,153,0.04)" />
          {/* Leaf-like circles */}
          <circle cx="30%" cy="20%" r="25" fill="rgba(52,211,153,0.06)" />
          <circle cx="70%" cy="25%" r="20" fill="rgba(34,197,94,0.07)" />
          <circle cx="15%" cy="60%" r="35" fill="rgba(52,211,153,0.04)" />
          {/* Ground lines */}
          <line x1="0" y1="90%" x2="100%" y2="90%" stroke="rgba(52,211,153,0.1)" strokeWidth="1" />
          <line x1="0" y1="95%" x2="100%" y2="95%" stroke="rgba(52,211,153,0.06)" strokeWidth="1" />
        </svg>
      </div>
    );
  }

  if (themeId === 'sunset') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-orange-800/20 to-transparent" />
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-amber-500/15 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-20 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl" />
        <svg className="absolute inset-0 w-full h-full opacity-25" preserveAspectRatio="xMidYMid slice">
          {/* Sun */}
          <circle cx="50%" cy="0" r="80" fill="rgba(251,146,60,0.12)" />
          <circle cx="50%" cy="0" r="120" fill="rgba(251,146,60,0.07)" />
          <circle cx="50%" cy="0" r="160" fill="rgba(251,146,60,0.04)" />
          {/* Sun rays */}
          <line x1="50%" y1="0" x2="20%" y2="40%" stroke="rgba(251,191,36,0.08)" strokeWidth="1" />
          <line x1="50%" y1="0" x2="80%" y2="40%" stroke="rgba(251,191,36,0.08)" strokeWidth="1" />
          <line x1="50%" y1="0" x2="0" y2="30%" stroke="rgba(251,191,36,0.06)" strokeWidth="1" />
          <line x1="50%" y1="0" x2="100%" y2="30%" stroke="rgba(251,191,36,0.06)" strokeWidth="1" />
          {/* Horizon waves */}
          <path d="M0,75% C200,70% 400,80% 600,75% C800,70% 1000,80% 1200,75% L1200,100% L0,100% Z" fill="rgba(251,146,60,0.06)" />
          <path d="M0,85% C150,82% 350,88% 550,85% C750,82% 950,88% 1200,85% L1200,100% L0,100% Z" fill="rgba(239,68,68,0.05)" />
        </svg>
      </div>
    );
  }

  if (themeId === 'rose') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 right-0 w-80 h-80 bg-rose-400/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-0 w-72 h-72 bg-pink-300/12 rounded-full blur-3xl" />
        <svg className="absolute inset-0 w-full h-full opacity-20" preserveAspectRatio="xMidYMid slice">
          {/* Rose petal shapes */}
          <ellipse cx="50%" cy="20%" rx="80" ry="50" fill="rgba(251,113,133,0.08)" transform="rotate(-20, 50%, 20%)" />
          <ellipse cx="60%" cy="25%" rx="70" ry="45" fill="rgba(251,113,133,0.06)" transform="rotate(30, 60%, 25%)" />
          <ellipse cx="40%" cy="22%" rx="65" ry="40" fill="rgba(244,63,94,0.05)" transform="rotate(-45, 40%, 22%)" />
          {/* Dots pattern */}
          <circle cx="15%" cy="30%" r="2" fill="rgba(251,113,133,0.3)" />
          <circle cx="85%" cy="40%" r="2" fill="rgba(251,113,133,0.25)" />
          <circle cx="25%" cy="75%" r="1.5" fill="rgba(251,113,133,0.3)" />
          <circle cx="70%" cy="80%" r="2" fill="rgba(251,113,133,0.2)" />
          <circle cx="50%" cy="60%" r="1" fill="rgba(251,113,133,0.25)" />
          {/* Concentric hearts approximation */}
          <circle cx="80%" cy="15%" r="20" fill="none" stroke="rgba(251,113,133,0.15)" strokeWidth="1" />
          <circle cx="80%" cy="15%" r="40" fill="none" stroke="rgba(251,113,133,0.08)" strokeWidth="1" />
          <circle cx="20%" cy="85%" r="25" fill="none" stroke="rgba(244,63,94,0.12)" strokeWidth="1" />
          <circle cx="20%" cy="85%" r="50" fill="none" stroke="rgba(244,63,94,0.06)" strokeWidth="1" />
        </svg>
      </div>
    );
  }

  if (themeId === 'gold') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-yellow-300/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-200/10 rounded-full blur-2xl" />
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="gold-dots" width="50" height="50" patternUnits="userSpaceOnUse">
              <circle cx="25" cy="25" r="1.5" fill="rgba(217,119,6,0.35)" />
            </pattern>
            <radialGradient id="gold-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(251,191,36,0.1)" />
              <stop offset="100%" stopColor="rgba(251,191,36,0)" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#gold-dots)" />
          <rect width="100%" height="100%" fill="url(#gold-glow)" />
          {/* Diamond shapes */}
          <rect x="10%" y="10%" width="40" height="40" fill="none" stroke="rgba(217,119,6,0.2)" strokeWidth="1" transform="rotate(45, calc(10% + 20px), calc(10% + 20px))" />
          <rect x="80%" y="70%" width="30" height="30" fill="none" stroke="rgba(217,119,6,0.25)" strokeWidth="1" transform="rotate(45, calc(80% + 15px), calc(70% + 15px))" />
          <rect x="5%" y="75%" width="25" height="25" fill="none" stroke="rgba(251,191,36,0.2)" strokeWidth="1" transform="rotate(45, calc(5% + 12px), calc(75% + 12px))" />
          {/* Lines */}
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="rgba(217,119,6,0.08)" strokeWidth="0.5" />
          <line x1="50%" y1="0" x2="50%" y2="100%" stroke="rgba(217,119,6,0.08)" strokeWidth="0.5" />
        </svg>
      </div>
    );
  }

  return null;
}
