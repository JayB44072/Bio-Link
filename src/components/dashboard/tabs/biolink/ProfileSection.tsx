import { Loader2, Lock, MessageCircle, Store, Upload } from 'lucide-react';
import { BRAND } from '../../../../lib/theme';
import Field from '../../../ui/Field';
import { FieldView, SectionHeader } from './sectionParts';
import { INPUT_CLS, LABEL_CLS, useBioTheme } from './bioTheme';
import type { BioLinkState } from './useBioLinkForm';

/** Section « Profil de la boutique » : logo, nom de la boutique, contact et bio. */
export default function ProfileSection({ state }: { state: BioLinkState }) {
  const { t, lang, fr, surface, border, txtPrim, txtLabel, txtSub, inputBg, inputBorder, btnEdit } = useBioTheme();
  const { form, setField, editing, canUseLogo, uploading, fileInputRef, handleFileInput } = state;
  const inputStyle = { background: inputBg, border: `1px solid ${inputBorder}`, color: txtPrim };
  const nameLabel = lang === 'en' ? 'Name' : 'Nom';

  return (
    <div className="rounded-3xl p-5" style={{ background: surface, border: `1px solid ${border}` }}>
      <SectionHeader state={state} icon={<Store size={17} />} section="profile"
        label={fr ? 'Profil de la boutique' : 'Shop profile'}
        iconBg="rgba(108,99,255,0.15)" iconColor={BRAND.violet} />

      {/* Logo — toujours cliquable pour changer */}
      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileInput} className="hidden" disabled={!canUseLogo}
        aria-label={fr ? 'Fichier du logo' : 'Logo file'} />
      <div className="flex items-center gap-3 mb-4">
        <div className="relative w-16 h-16 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center"
          style={{ background: inputBg, border: `1px solid ${inputBorder}`, opacity: canUseLogo ? 1 : 0.5 }}>
          {form.shop_logo_url
            ? <img src={form.shop_logo_url} alt="Logo" className="w-full h-full object-cover" />
            : canUseLogo ? <Store size={24} aria-hidden style={{ color: txtSub }} /> : <Lock size={20} aria-hidden style={{ color: txtSub }} />}
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 size={16} className="text-white animate-spin" />
            </div>
          )}
          {canUseLogo && !uploading && (
            <button type="button" onClick={() => fileInputRef.current?.click()}
              aria-label={fr ? 'Choisir une nouvelle image pour la boutique' : 'Choose a new shop image'}
              className="absolute inset-0 flex items-center justify-center group transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet"
              style={{ background: 'rgba(0,0,0,0)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.45)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0)')}>
              <Upload size={15} aria-hidden className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
        </div>
        <div className="flex-1 min-w-0">
          {!editing.profile ? (
            <>
              <p className="font-bold text-sm leading-snug" style={{ color: txtPrim }}>
                {form.shop_name || (fr ? 'Nom de boutique non défini' : 'Shop name not set')}
              </p>
              {canUseLogo && (
                <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                  className="flex items-center gap-1 text-[11px] font-semibold mt-1.5 px-2.5 py-1 rounded-lg transition disabled:opacity-50"
                  style={{ background: btnEdit, color: BRAND.violet }}>
                  <Upload size={11} aria-hidden />
                  {fr ? 'Changer le logo' : 'Change logo'}
                </button>
              )}
            </>
          ) : (
            <Field labelClassName={LABEL_CLS} labelStyle={{ color: txtLabel }} label={t.shopName}>
              {({ id }) => (
                <input id={id} type="text" value={form.shop_name} onChange={e => setField('shop_name', e.target.value)}
                  placeholder={t.shopNamePlaceholder} className={INPUT_CLS} style={inputStyle} />
              )}
            </Field>
          )}
        </div>
      </div>

      {!canUseLogo && (
        <div className="flex items-start gap-2 rounded-xl px-3 py-2.5 mb-4"
          style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)' }}>
          <Lock size={13} aria-hidden className="text-amber-500 mt-0.5 shrink-0" />
          <p className="text-amber-500 text-[11px] font-medium">
            {fr ? 'Logo réservé aux forfaits payants (Starter+).' : 'Logo available on paid plans (Starter+).'}
          </p>
        </div>
      )}

      {!editing.profile ? (
        <div className="space-y-2">
          <FieldView label={nameLabel} value={form.display_name} />
          <FieldView label={fr ? 'Numéro de contact' : 'Contact number'} value={form.contact_phone} />
          <FieldView label="Bio" value={form.bio} />
        </div>
      ) : (
        <div className="space-y-4">
          <Field labelClassName={LABEL_CLS} labelStyle={{ color: txtLabel }} label={nameLabel}>
            {({ id }) => (
              <input id={id} type="text" value={form.display_name} onChange={e => setField('display_name', e.target.value)}
                className={INPUT_CLS} style={inputStyle} />
            )}
          </Field>
          <Field labelClassName={LABEL_CLS} labelStyle={{ color: txtLabel }}
            label={<span className="inline-flex items-center gap-1.5"><MessageCircle size={11} aria-hidden />{fr ? 'Numéro de contact' : 'Contact number'}</span>}>
            {({ id }) => (
              <>
                <input id={id} type="tel" inputMode="tel" value={form.contact_phone}
                  onChange={e => setField('contact_phone', e.target.value)}
                  placeholder="+237 6 00 00 00 00" className={INPUT_CLS} style={inputStyle} />
                <p className="text-[11px] mt-1" style={{ color: txtSub }}>
                  {fr ? "Vos clients l'utilisent après une commande." : 'Customers use it after an order.'}
                </p>
              </>
            )}
          </Field>
          <Field labelClassName={LABEL_CLS} labelStyle={{ color: txtLabel }} label="Bio">
            {({ id }) => (
              <textarea id={id} value={form.bio} onChange={e => setField('bio', e.target.value)}
                placeholder={t.bioPlaceholder} rows={3} className={`${INPUT_CLS} resize-none`} style={inputStyle} />
            )}
          </Field>
        </div>
      )}
    </div>
  );
}
