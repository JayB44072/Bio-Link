import { Link2, Lock, Plus, Trash2 } from 'lucide-react';
import { BRAND } from '../../../../lib/theme';
import { SOCIAL_PLATFORMS } from '../../../../lib/planLimits';
import { SectionActions } from './sectionParts';
import { useBioTheme } from './bioTheme';
import { getSocialInputConfig, type BioLinkState } from './useBioLinkForm';

/** Section « Liens sociaux » : liste en lecture, ou édition (réseau + adresse) avec limite du forfait. */
export default function SocialLinksSection({ state }: { state: BioLinkState }) {
  const { t, fr, surface, border, txtPrim, txtSub, inputBg, inputBorder, fieldBg, btnEdit } = useBioTheme();
  const { form, editing, maxSocial, atSocialLimit, addSocialLink, removeSocialLink, updateSocialLink } = state;

  return (
    <div className="rounded-3xl p-5" style={{ background: surface, border: `1px solid ${border}` }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(0,194,255,0.12)' }}>
            <Link2 size={17} aria-hidden style={{ color: BRAND.cyan }} />
          </span>
          <div>
            <h2 className="font-black text-base leading-tight" style={{ color: txtPrim }}>{t.socialLinks}</h2>
            <span className="text-[11px]" style={{ color: txtSub }}>
              {form.social_links.length}{maxSocial ? ` / ${maxSocial}` : ''} liens
            </span>
          </div>
        </div>
        <SectionActions state={state} section="socials" />
      </div>

      {atSocialLimit && (
        <div className="flex items-start gap-2 rounded-xl px-3 py-2.5 mb-3"
          style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)' }}>
          <Lock size={13} aria-hidden className="text-amber-500 mt-0.5 shrink-0" />
          <p className="text-amber-500 text-[11px] font-medium">{t.socialLimitMsg}</p>
        </div>
      )}

      {!editing.socials ? (
        <div className="space-y-2">
          {form.social_links.length === 0 ? (
            <p className="text-xs py-2" style={{ color: txtSub }}>
              {fr ? 'Aucun lien social ajouté.' : 'No social links added yet.'}
            </p>
          ) : form.social_links.map((link, idx) => {
            const p = SOCIAL_PLATFORMS.find(p => p.id === link.platform);
            return (
              <div key={idx} className="flex items-center gap-3 px-3 py-2 rounded-xl" style={{ background: fieldBg }}>
                <span className="text-xs font-bold w-20 shrink-0" style={{ color: txtSub }}>{p?.label || link.platform}</span>
                <span className="text-xs truncate flex-1" style={{ color: txtPrim }}>{link.url || '—'}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {form.social_links.map((link, idx) => {
            const cfg = getSocialInputConfig(link.platform);
            const platformLabel = SOCIAL_PLATFORMS.find(p => p.id === link.platform)?.label ?? link.platform;
            return (
              <div key={idx} className="space-y-1">
                <div className="flex gap-2">
                  <select value={link.platform} aria-label={fr ? `Réseau du lien ${idx + 1}` : `Network of link ${idx + 1}`}
                    onChange={e => updateSocialLink(idx, 'platform', e.target.value)}
                    className="rounded-lg px-2.5 py-2 text-sm focus:outline-none shrink-0"
                    style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: txtPrim }}>
                    {SOCIAL_PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                  </select>
                  <div className="flex-1 relative min-w-0">
                    {cfg.prefix && (
                      <span aria-hidden className="absolute left-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none select-none"
                        style={{ color: txtSub }}>{cfg.prefix}</span>
                    )}
                    <input type={cfg.type} value={link.url} aria-label={platformLabel}
                      onChange={e => updateSocialLink(idx, 'url', e.target.value)}
                      placeholder={cfg.placeholder}
                      className="w-full rounded-lg py-2 text-sm transition focus:outline-none"
                      style={{
                        background: inputBg, border: `1px solid ${inputBorder}`, color: txtPrim,
                        paddingLeft: cfg.prefix ? `${cfg.prefix.length * 7 + 12}px` : '12px',
                        paddingRight: '12px',
                      }} />
                  </div>
                  <button onClick={() => removeSocialLink(idx)}
                    aria-label={fr ? 'Supprimer ce lien' : 'Remove this link'}
                    className="p-2 rounded-lg transition shrink-0" style={{ color: BRAND.pink }}>
                    <Trash2 size={15} aria-hidden />
                  </button>
                </div>
                {link.platform === 'whatsapp' && (
                  <p className="text-[11px] pl-1" style={{ color: txtSub }}>Ex : +2250712345678</p>
                )}
              </div>
            );
          })}
          {!atSocialLimit && (
            <button onClick={addSocialLink}
              className="mt-1 flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition w-full justify-center"
              style={{ background: btnEdit, color: BRAND.violet }}>
              <Plus size={15} aria-hidden /> {t.addSocialLink}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
