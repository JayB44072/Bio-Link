import { Megaphone } from 'lucide-react';
import Field from '../../../ui/Field';
import { FieldView, SectionHeader, Switch, ToggleView } from './sectionParts';
import { INPUT_CLS, LABEL_CLS, useBioTheme } from './bioTheme';
import type { BioLinkState } from './useBioLinkForm';

/** Section « Afficher une annonce » : bannière promo en haut de la boutique. */
export default function AnnouncementSection({ state }: { state: BioLinkState }) {
  const { lang, fr, surface, border, txtPrim, txtLabel, txtSub, inputBg, inputBorder } = useBioTheme();
  const { form, setField, editing } = state;
  const inputStyle = { background: inputBg, border: `1px solid ${inputBorder}`, color: txtPrim };

  return (
    <div className="rounded-3xl p-5" style={{ background: surface, border: `1px solid ${border}` }}>
      <SectionHeader state={state} icon={<Megaphone size={17} />} section="announcement"
        label={fr ? 'Afficher une annonce' : 'Show an announcement'}
        iconBg="rgba(236,72,153,0.15)" iconColor="#EC4899" />

      {!editing.announcement ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ToggleView active={form.announcement_active} labelOn="Active" labelOff="Inactive" />
          </div>
          {form.announcement_active && (
            <>
              <FieldView label="Message" value={form.announcement_text} />
              {form.announcement_expires_at && (
                <FieldView label={fr ? 'Expire le' : 'Expires on'}
                  value={new Date(form.announcement_expires_at).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US')} />
              )}
            </>
          )}
          {!form.announcement_active && (
            <p className="text-xs" style={{ color: txtSub }}>
              {fr ? 'Activez et configurez une bannière promo en haut de votre boutique.' : 'Turn on a promo banner at the top of your shop.'}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between py-1">
            <span id="announcement-switch-label" className="text-sm font-medium" style={{ color: txtLabel }}>
              {fr ? 'Activer la bannière' : 'Enable banner'}
            </span>
            <Switch checked={form.announcement_active} color="#EC4899"
              onChange={() => setField('announcement_active', !form.announcement_active)}
              label={fr ? 'Activer la bannière' : 'Enable banner'} />
          </div>
          <div className={`space-y-4 transition-opacity ${form.announcement_active ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            <Field labelClassName={LABEL_CLS} labelStyle={{ color: txtLabel }} label={fr ? "Message d'annonce" : 'Announcement message'}>
              {({ id }) => (
                <>
                  <textarea id={id} value={form.announcement_text}
                    onChange={e => setField('announcement_text', e.target.value.slice(0, 140))}
                    maxLength={140} rows={2}
                    placeholder={fr ? 'Ex : Promo −20% ce week-end !' : 'E.g. 20% off this weekend!'}
                    className={`${INPUT_CLS} resize-none`} style={inputStyle} />
                  <p className="text-[11px] mt-1 text-right" style={{ color: txtSub }}>{form.announcement_text.length}/140</p>
                </>
              )}
            </Field>
            <Field labelClassName={LABEL_CLS} labelStyle={{ color: txtLabel }} label={fr ? "Date d'expiration (optionnel)" : 'Expiration date (optional)'}>
              {({ id }) => (
                <>
                  <input id={id} type="datetime-local"
                    value={form.announcement_expires_at ? new Date(form.announcement_expires_at).toISOString().slice(0, 16) : ''}
                    onChange={e => setField('announcement_expires_at', e.target.value)}
                    className={INPUT_CLS} style={inputStyle} />
                  <p className="text-[11px] mt-1" style={{ color: txtSub }}>
                    {fr ? "Vide = affichée jusqu'à désactivation." : 'Empty = live until you turn it off.'}
                  </p>
                </>
              )}
            </Field>
          </div>
        </div>
      )}
    </div>
  );
}
