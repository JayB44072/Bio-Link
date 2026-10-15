import { Crown, MessageCircle } from 'lucide-react';
import type { Profile } from '../../../../lib/types';
import Field from '../../../ui/Field';
import { FieldView, SectionHeader, Switch, ToggleView } from './sectionParts';
import { INPUT_CLS, LABEL_CLS, useBioTheme } from './bioTheme';
import type { BioLinkState } from './useBioLinkForm';

interface Props {
  state: BioLinkState;
  profile: Profile;
  onGoToSubscription?: () => void;
}

/** Section « Commande via WhatsApp » (forfait Premium). */
export default function WhatsAppSection({ state, profile, onGoToSubscription }: Props) {
  const { fr, surface, border, txtPrim, txtLabel, txtSub, inputBg, inputBorder } = useBioTheme();
  const { form, setField, editing, cancelEdit } = state;
  const isPremium = profile.plan_type === 'premium';
  const active = form.whatsapp_enabled && isPremium;
  const inputStyle = { background: inputBg, border: `1px solid ${inputBorder}`, color: txtPrim };

  return (
    <div className="rounded-3xl p-5 relative" style={{ background: surface, border: `1px solid ${border}` }}>
      {!isPremium && (
        <div className="absolute -top-2.5 right-5 flex items-center gap-1 px-2 py-1 rounded-full"
          style={{ background: 'linear-gradient(135deg,#f59e0b,#f97316)' }}>
          <Crown size={10} aria-hidden className="text-white" />
          <span className="text-[9px] font-black text-white uppercase tracking-wider">Premium</span>
        </div>
      )}
      <SectionHeader state={state} icon={<MessageCircle size={17} />} section="whatsapp"
        label={fr ? 'Commande via WhatsApp' : 'Order via WhatsApp'}
        iconBg="rgba(37,211,102,0.15)" iconColor="#25D366" />

      {!editing.whatsapp ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ToggleView active={active} labelOn={fr ? 'Activé' : 'Enabled'} labelOff={fr ? 'Désactivé' : 'Disabled'} />
            {!isPremium && (
              <span className="text-[11px]" style={{ color: txtSub }}>{fr ? 'Forfait Premium requis' : 'Premium plan required'}</span>
            )}
          </div>
          {active && (
            <>
              <FieldView label={fr ? 'Numéro WhatsApp' : 'WhatsApp number'} value={form.whatsapp_number} />
              {form.whatsapp_greeting && <FieldView label={fr ? "Message d'accueil" : 'Greeting'} value={form.whatsapp_greeting} />}
            </>
          )}
          {!active && (
            <p className="text-xs" style={{ color: txtSub }}>
              {fr ? 'Recevez les commandes de vos clients directement sur WhatsApp.' : 'Receive customer orders directly on WhatsApp.'}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between py-1">
            <span className="text-sm font-medium" style={{ color: txtLabel }}>
              {fr ? 'Activer les commandes WhatsApp' : 'Enable WhatsApp orders'}
            </span>
            <Switch checked={active} color="#25D366" disabled={!isPremium}
              label={fr ? 'Activer les commandes WhatsApp' : 'Enable WhatsApp orders'}
              onChange={() => {
                if (!isPremium) { cancelEdit('whatsapp'); onGoToSubscription?.(); return; }
                setField('whatsapp_enabled', !form.whatsapp_enabled);
              }} />
          </div>
          <div className={`space-y-4 transition-opacity ${active ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            <Field labelClassName={LABEL_CLS} labelStyle={{ color: txtLabel }}
              label={fr ? 'Numéro WhatsApp (format international)' : 'WhatsApp number (international)'}>
              {({ id }) => (
                <>
                  <input id={id} type="tel" inputMode="tel" value={form.whatsapp_number}
                    onChange={e => setField('whatsapp_number', e.target.value)}
                    placeholder="+237 6 00 00 00 00" className={INPUT_CLS} style={inputStyle} />
                  <p className="text-[11px] mt-1" style={{ color: txtSub }}>
                    {fr ? 'Avec indicatif pays, ex : +2250712345678' : 'With country code, e.g. +2250712345678'}
                  </p>
                </>
              )}
            </Field>
            <Field labelClassName={LABEL_CLS} labelStyle={{ color: txtLabel }}
              label={fr ? "Message d'accueil (optionnel)" : 'Greeting message (optional)'}>
              {({ id }) => (
                <textarea id={id} value={form.whatsapp_greeting}
                  onChange={e => setField('whatsapp_greeting', e.target.value)}
                  placeholder={fr ? 'Bonjour, je souhaite passer commande.' : 'Hello, I would like to place an order.'}
                  rows={2} className={`${INPUT_CLS} resize-none`} style={inputStyle} />
              )}
            </Field>
          </div>
        </div>
      )}
    </div>
  );
}
