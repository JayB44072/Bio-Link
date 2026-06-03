import React from 'react';
import { Profile, SocialLink } from '../../lib/types';
import { THEMES } from '../../lib/planLimits';
import ThemeBackground from '../ui/ThemeBackground';
import { Instagram, Music, Facebook, Twitter, Youtube, Linkedin, MessageCircle, Send, Globe, ShoppingBag } from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Instagram, Music, Facebook, Twitter, Youtube, Linkedin, MessageCircle, Send, Globe,
};

interface MobilePreviewProps {
  profile: Partial<Profile>;
  productCount: number;
}

export default function MobilePreview({ profile, productCount }: MobilePreviewProps) {
  const theme = THEMES.find(t => t.id === profile.theme) || THEMES[0];
  const socials = (profile.social_links || []) as SocialLink[];
  const isDark = profile.theme !== 'default' && profile.theme !== 'minimalist' && profile.theme !== 'pastel';
  const bgClass = theme.bg.split(' ')[0];
  const accentText = isDark || bgClass.includes('from-yellow') || bgClass.includes('from-pink') || bgClass.includes('from-white')
    ? theme.text.includes('white') ? 'text-white' : 'text-gray-900'
    : 'text-gray-900';

  return (
    <div className="flex flex-col items-center">
      {/* Phone frame */}
      <div className="relative w-[240px] h-[480px] bg-gray-900 rounded-[2.5rem] border-[6px] border-gray-700 shadow-2xl overflow-hidden">
        {/* Notch */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-4 bg-gray-800 rounded-full z-10" />

        {/* Screen */}
        <div className={`w-full h-full ${theme.bg} overflow-y-auto scrollbar-hide relative`}>
          {/* Background pattern */}
          <ThemeBackground themeId={profile.theme || 'default'} />

          <div className="relative flex flex-col items-center pt-10 pb-6 px-4 z-10">
            {/* Avatar */}
            <div className={`w-16 h-16 rounded-full overflow-hidden border-2 mb-3 bg-gray-300 flex items-center justify-center ${
              profile.theme === 'gold' ? 'border-yellow-200' : 'border-white/20'
            }`}>
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className={`text-2xl font-bold ${theme.text}`}>
                  {(profile.display_name || 'U')[0].toUpperCase()}
                </span>
              )}
            </div>

            <h2 className={`font-bold text-sm ${theme.text}`}>
              {profile.display_name || 'Votre nom'}
            </h2>
            {profile.username && (
              <p className={`text-xs opacity-60 ${theme.text}`}>@{profile.username}</p>
            )}
            {profile.bio && (
              <p className={`text-xs text-center mt-2 opacity-70 ${theme.text} leading-relaxed`}>
                {profile.bio}
              </p>
            )}

            {/* Social links */}
            {socials.length > 0 && (
              <div className="flex flex-wrap gap-1.5 justify-center mt-3">
                {socials.slice(0, 6).map((s, i) => {
                  const Icon = ICON_MAP[s.icon] || Globe;
                  const accentClass = theme.accent.includes('yellow') ? 'text-yellow-900' : 'text-gray-900';
                  return (
                    <div key={i} className={`w-7 h-7 rounded-full ${theme.accent} flex items-center justify-center`}>
                      <Icon size={12} className={accentClass} />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Products button */}
            <div className={`mt-4 w-full ${theme.accent} rounded-xl py-2 flex items-center justify-center gap-2`}>
              <ShoppingBag size={12} className={theme.accent.includes('yellow') ? 'text-yellow-900' : 'text-gray-900'} />
              <span className={`text-xs font-semibold ${theme.accent.includes('yellow') ? 'text-yellow-900' : 'text-gray-900'}`}>
                {productCount} produits
              </span>
            </div>

            {/* Badge placeholder */}
            <div className="mt-4 text-center">
              <span className={`text-[9px] opacity-40 ${theme.text}`}>Propulsé par WhiteDukeSaas</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
