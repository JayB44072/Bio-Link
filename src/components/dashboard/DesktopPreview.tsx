import React, { useState } from 'react';
import { Profile, SocialLink } from '../../lib/types';
import { THEMES } from '../../lib/planLimits';
import ThemeBackground from '../ui/ThemeBackground';
import { Instagram, Music, Facebook, Twitter, Youtube, Linkedin, MessageCircle, Send, Globe, ShoppingBag } from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Instagram, Music, Facebook, Twitter, Youtube, Linkedin, MessageCircle, Send, Globe,
};

interface DesktopPreviewProps {
  profile: Partial<Profile>;
  productCount: number;
}

export default function DesktopPreview({ profile, productCount }: DesktopPreviewProps) {
  const theme = THEMES.find(t => t.id === profile.theme) || THEMES[0];
  const socials = (profile.social_links || []) as SocialLink[];

  return (
    <div className="w-full">
      {/* Desktop viewport */}
      <div className={`w-full h-[600px] ${theme.bg} relative overflow-hidden border border-gray-700 rounded-2xl shadow-2xl`}>
        {/* Background pattern */}
        <ThemeBackground themeId={profile.theme || 'default'} />

        <div className="relative w-full h-full flex flex-col items-center justify-center z-10 px-12">
          <div className="max-w-2xl text-center">
            {/* Avatar */}
            <div className={`w-32 h-32 rounded-full overflow-hidden border-4 mb-6 bg-gray-300 flex items-center justify-center mx-auto ${
              profile.theme === 'gold' ? 'border-yellow-200 shadow-2xl shadow-yellow-500/30' : 'border-white/20'
            }`}>
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className={`text-6xl font-bold ${theme.text}`}>
                  {(profile.display_name || 'U')[0].toUpperCase()}
                </span>
              )}
            </div>

            <h1 className={`text-4xl font-bold mb-2 ${theme.text}`}>
              {profile.display_name || 'Votre nom'}
            </h1>
            {profile.username && (
              <p className={`text-lg opacity-60 mb-4 ${theme.text}`}>@{profile.username}</p>
            )}
            {profile.bio && (
              <p className={`text-lg mb-8 opacity-75 ${theme.text} leading-relaxed`}>
                {profile.bio}
              </p>
            )}

            {/* Social links */}
            {socials.length > 0 && (
              <div className="flex flex-wrap gap-4 justify-center mb-8">
                {socials.map((s, i) => {
                  const Icon = ICON_MAP[s.icon] || Globe;
                  const accentClass = theme.accent.includes('yellow') ? 'text-yellow-900' : 'text-gray-900';
                  return (
                    <a
                      key={i}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-2 px-6 py-3 rounded-xl border text-sm font-medium transition-all hover:scale-105 ${theme.accent}`}
                    >
                      <Icon size={18} className={accentClass} />
                      <span className={accentClass}>{s.platform}</span>
                    </a>
                  );
                })}
              </div>
            )}

            {/* Products button */}
            {productCount > 0 && (
              <button className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold text-lg transition-all hover:scale-105 ${theme.accent}`}>
                <ShoppingBag size={20} className={theme.accent.includes('yellow') ? 'text-yellow-900' : 'text-gray-900'} />
                <span className={theme.accent.includes('yellow') ? 'text-yellow-900' : 'text-gray-900'}>
                  Voir {productCount} produits
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
