import { Profile } from '../../../lib/types';
import { useLang } from '../../../lib/LanguageContext';
import LogoCropperModal from './LogoCropperModal';
import { useBioLinkForm } from './biolink/useBioLinkForm';
import PublicLinkCard from './biolink/PublicLinkCard';
import AnnouncementSection from './biolink/AnnouncementSection';
import WhatsAppSection from './biolink/WhatsAppSection';
import ProfileSection from './biolink/ProfileSection';
import SocialLinksSection from './biolink/SocialLinksSection';
import TrustBadgesSection from './biolink/TrustBadgesSection';

interface BioLinkProps {
  profile: Profile;
  onUpdate: (p: Partial<Profile>) => void;
  onGoToSubscription?: () => void;
}

/** Onglet « Mon lien bio » : adresse publique, annonce, WhatsApp, profil de la boutique et liens sociaux. */
export default function BioLink({ profile, onUpdate, onGoToSubscription }: BioLinkProps) {
  const { lang } = useLang();
  const state = useBioLinkForm(profile, onUpdate, lang);

  return (
    <>
      <div className="space-y-6">
        {/* Adresse publique — pleine largeur */}
        <PublicLinkCard state={state} />

        {/* Grille 2 colonnes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          <div className="space-y-5">
            <AnnouncementSection state={state} />
            <WhatsAppSection state={state} profile={profile} onGoToSubscription={onGoToSubscription} />
          </div>
          <div className="space-y-5">
            <ProfileSection state={state} />
            <SocialLinksSection state={state} />
          </div>
        </div>

        {/* Badges de confiance — pleine largeur, en dernier */}
        <TrustBadgesSection />
      </div>

      {/* Recadrage du logo */}
      {state.cropperFile && (
        <LogoCropperModal
          file={state.cropperFile}
          onConfirm={state.handleCropConfirm}
          onCancel={() => state.setCropperFile(null)}
        />
      )}
    </>
  );
}
