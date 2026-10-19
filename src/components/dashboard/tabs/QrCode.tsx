import React, { useEffect, useMemo, useRef, useState } from 'react';
import { appOrigin } from '../../../lib/appOrigin';
import QRCode from 'qrcode';
import { Profile } from '../../../lib/types';
import { useAppPrefs } from '../../../lib/AppPrefsContext';
import { BRAND, GRADIENTS } from '../../../lib/theme';
import { dashPalette } from '../../../lib/dashPalette';
import {
  Download, QrCode as QrCodeIcon, Sparkles, Printer, Palette, Link as LinkIcon,
  Check, Copy, FileImage,
} from 'lucide-react';

interface QrCodeTabProps {
  profile: Profile;
}

type LangKey = 'fr' | 'en' | 'pt' | 'de';

const L: Record<LangKey, {
  title: string;
  subtitle: string;
  yourUrl: string;
  copy: string;
  copied: string;
  livePreview: string;
  brandColor: string;
  downloads: string;
  downloadsSub: string;
  simple: string;
  simpleSub: string;
  branded: string;
  brandedSub: string;
  poster: string;
  posterSub: string;
  scanMe: string;
  scanCta: string;
  visitShop: string;
  isFree: string;
  freeNote: string;
  generating: string;
}> = {
  fr: {
    title: 'QR Code de ma boutique',
    subtitle: 'Génère un QR code magnifique à imprimer, coller sur un stand, distribuer sur des cartes de visite.',
    yourUrl: 'URL de ta boutique',
    copy: 'Copier',
    copied: 'Copié !',
    livePreview: 'Aperçu en direct',
    brandColor: 'Couleur de marque',
    downloads: 'Téléchargements',
    downloadsSub: 'Choisis le format qui te convient.',
    simple: 'QR simple',
    simpleSub: 'PNG 400×400 — parfait pour le web',
    branded: 'QR avec branding',
    brandedSub: 'PNG 600×600 — logo, nom et couleur de marque',
    poster: 'Affiche A4 imprimable',
    posterSub: 'PNG 2480×3508 — à imprimer et coller partout',
    scanMe: 'SCANNEZ-MOI',
    scanCta: 'SCANNEZ POUR VISITER MA BOUTIQUE',
    visitShop: 'Visitez ma boutique en ligne',
    isFree: '100% gratuit',
    freeNote: 'Le QR code est offert à tous les plans — un cadeau pour tes clients physiques.',
    generating: 'Génération…',
  },
  en: {
    title: 'My shop QR code',
    subtitle: 'Generate a beautiful QR code to print, stick on a market stall, hand out on business cards.',
    yourUrl: 'Your shop URL',
    copy: 'Copy',
    copied: 'Copied!',
    livePreview: 'Live preview',
    brandColor: 'Brand color',
    downloads: 'Downloads',
    downloadsSub: 'Pick the format you need.',
    simple: 'Simple QR',
    simpleSub: 'PNG 400×400 — perfect for the web',
    branded: 'Branded QR',
    brandedSub: 'PNG 600×600 — logo, name and brand color',
    poster: 'Printable A4 poster',
    posterSub: 'PNG 2480×3508 — print it, stick it anywhere',
    scanMe: 'SCAN ME',
    scanCta: 'SCAN TO VISIT MY SHOP',
    visitShop: 'Visit my online shop',
    isFree: '100% free',
    freeNote: 'The QR code feature is available on every plan — a gift for your in-person customers.',
    generating: 'Generating…',
  },
  pt: {
    title: 'QR Code da minha loja',
    subtitle: 'Gera um QR code lindo para imprimir, colar numa banca ou distribuir em cartões.',
    yourUrl: 'URL da tua loja',
    copy: 'Copiar',
    copied: 'Copiado!',
    livePreview: 'Pré-visualização',
    brandColor: 'Cor da marca',
    downloads: 'Descargas',
    downloadsSub: 'Escolhe o formato que precisas.',
    simple: 'QR simples',
    simpleSub: 'PNG 400×400 — ideal para a web',
    branded: 'QR com marca',
    brandedSub: 'PNG 600×600 — logotipo, nome e cor',
    poster: 'Poster A4 imprimível',
    posterSub: 'PNG 2480×3508 — para imprimir e colar',
    scanMe: 'DIGITALIZE',
    scanCta: 'DIGITALIZE PARA VISITAR A MINHA LOJA',
    visitShop: 'Visite a minha loja online',
    isFree: '100% grátis',
    freeNote: 'O QR code está disponível em todos os planos — uma oferta para os teus clientes.',
    generating: 'A gerar…',
  },
  de: {
    title: 'QR-Code meines Shops',
    subtitle: 'Erstelle einen schönen QR-Code zum Drucken, für Marktstände oder Visitenkarten.',
    yourUrl: 'Shop-URL',
    copy: 'Kopieren',
    copied: 'Kopiert!',
    livePreview: 'Live-Vorschau',
    brandColor: 'Markenfarbe',
    downloads: 'Downloads',
    downloadsSub: 'Wähle das passende Format.',
    simple: 'Einfacher QR',
    simpleSub: 'PNG 400×400 — perfekt fürs Web',
    branded: 'QR mit Branding',
    brandedSub: 'PNG 600×600 — Logo, Name und Farbe',
    poster: 'A4-Poster zum Drucken',
    posterSub: 'PNG 2480×3508 — drucken und aufhängen',
    scanMe: 'SCANNEN',
    scanCta: 'SCANNEN, UM MEINEN SHOP ZU BESUCHEN',
    visitShop: 'Besuche meinen Online-Shop',
    isFree: '100% kostenlos',
    freeNote: 'Der QR-Code ist in jedem Plan enthalten — ein Geschenk für deine Kunden vor Ort.',
    generating: 'Erstellen…',
  },
};

/* ── Utility: load an image element from a URL (returns null on failure) ── */
function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise(resolve => {
    if (!url) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/* ── Utility: trigger a browser download from a data URL ── */
function triggerDownload(dataUrl: string, filename: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/* ── Utility: approximate PNG size in KB from a data URL ── */
function approxSizeKB(dataUrl: string): number {
  const b64 = dataUrl.split(',')[1] || '';
  const bytes = Math.floor(b64.length * 0.75);
  return Math.max(1, Math.round(bytes / 1024));
}

export default function QrCodeTab({ profile }: QrCodeTabProps) {
  const { isDark: dk, lang } = useAppPrefs();
  const langKey: LangKey = (['fr', 'en', 'pt', 'de'].includes(lang as string) ? (lang as LangKey) : 'fr');
  const tt = L[langKey];

  /* ── Theme tokens ── */
  const { surface, surfaceAlt, border, txtPrim, txtSub } = dashPalette(dk);
  const cardShadow = dk ? 'none' : '0 6px 24px rgba(108,99,255,0.08)';

  const publicUrl = useMemo(
    () => `${appOrigin()}/u/${profile.username}`,
    [profile.username]
  );

  const shopName = profile.shop_name || profile.display_name || profile.username;
  const logoUrl = profile.shop_logo_url || '/logo.png';

  const [brandColor, setBrandColor] = useState<string>(BRAND.violet);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [busy, setBusy] = useState<'simple' | 'branded' | 'poster' | null>(null);
  const [copied, setCopied] = useState(false);

  /* Sizes (approx KB) of what would be produced, refreshed after a download */
  const [sizes, setSizes] = useState<{ simple?: number; branded?: number; poster?: number }>({});

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  /* ── Live preview: branded QR (600) ── */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const dataUrl = await renderBrandedQR({
        url: publicUrl,
        size: 600,
        color: brandColor,
        logoUrl,
        shopName,
        withText: false,
      });
      if (!cancelled) setPreviewUrl(dataUrl);
    })();
    return () => { cancelled = true; };
  }, [publicUrl, brandColor, logoUrl, shopName]);

  async function handleDownloadSimple() {
    setBusy('simple');
    try {
      const dataUrl = await QRCode.toDataURL(publicUrl, {
        errorCorrectionLevel: 'H',
        width: 400,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' },
      });
      setSizes(s => ({ ...s, simple: approxSizeKB(dataUrl) }));
      triggerDownload(dataUrl, `${profile.username}-qr.png`);
    } finally {
      setBusy(null);
    }
  }

  async function handleDownloadBranded() {
    setBusy('branded');
    try {
      const dataUrl = await renderBrandedQR({
        url: publicUrl,
        size: 600,
        color: brandColor,
        logoUrl,
        shopName,
        withText: true,
      });
      setSizes(s => ({ ...s, branded: approxSizeKB(dataUrl) }));
      triggerDownload(dataUrl, `${profile.username}-qr-brand.png`);
    } finally {
      setBusy(null);
    }
  }

  async function handleDownloadPoster() {
    setBusy('poster');
    try {
      const dataUrl = await renderPoster({
        url: publicUrl,
        color: brandColor,
        logoUrl,
        shopName,
        phone: profile.contact_phone || '',
        ctaLine: tt.scanCta,
        visitLine: tt.visitShop,
      });
      setSizes(s => ({ ...s, poster: approxSizeKB(dataUrl) }));
      triggerDownload(dataUrl, `${profile.username}-affiche-a4.png`);
    } finally {
      setBusy(null);
    }
  }

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* ignore */ }
  }

  const PALETTE = [BRAND.violet, BRAND.pink, BRAND.cyan, '#22c55e', '#f59e0b', '#000000'];

  return (
    <div className="space-y-6">
      {/* Header hero */}
      <div
        className="rounded-3xl p-6 md:p-8 relative overflow-hidden"
        style={{
          background: dk
            ? 'linear-gradient(135deg, rgba(108,99,255,0.16), rgba(255,107,157,0.08))'
            : 'linear-gradient(135deg, #f0edff 0%, #ffeaf4 100%)',
          border: `1px solid ${border}`,
        }}
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-40"
          style={{ background: 'radial-gradient(circle,#8B7CFF,transparent 70%)' }} />
        <div className="relative flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg,#8B7CFF,#FF6B9D)' }}>
            <QrCodeIcon size={22} color="#fff" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-black text-xl md:text-2xl" style={{ color: txtPrim }}>
                {tt.title}
              </h2>
              <span className="text-[10px] font-black px-2 py-1 rounded-full flex items-center gap-1"
                style={{ background: 'rgba(34,197,94,0.15)', color: '#16a34a' }}>
                <Sparkles size={10} /> {tt.isFree}
              </span>
            </div>
            <p className="text-sm mt-1.5 leading-relaxed" style={{ color: txtSub }}>
              {tt.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* URL card */}
      <div className="rounded-3xl p-5 md:p-6"
        style={{ background: surface, border: `1px solid ${border}`, boxShadow: cardShadow }}>
        <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: txtSub }}>
          <LinkIcon size={11} className="inline mr-1 -mt-0.5" /> {tt.yourUrl}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <code
            className="flex-1 min-w-0 truncate text-sm font-semibold px-3 py-2.5 rounded-xl"
            style={{ background: surfaceAlt, color: txtPrim, border: `1px solid ${border}` }}
          >
            {publicUrl}
          </code>
          <button
            onClick={copyUrl}
            className="px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
            style={{
              background: copied ? 'linear-gradient(135deg,#22c55e,#16a34a)' : GRADIENTS.violetSoft,
              color: '#fff',
              boxShadow: '0 4px 14px rgba(108,99,255,0.35)',
            }}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? tt.copied : tt.copy}
          </button>
        </div>
      </div>

      {/* Preview + controls grid */}
      <div className="grid md:grid-cols-[1.15fr_1fr] gap-6">
        {/* Live preview */}
        <div className="rounded-3xl p-6 flex flex-col items-center justify-center"
          style={{ background: surface, border: `1px solid ${border}`, boxShadow: cardShadow, minHeight: 380 }}>
          <p className="text-[11px] font-bold uppercase tracking-wider mb-4 self-start" style={{ color: txtSub }}>
            {tt.livePreview}
          </p>
          <div
            className="rounded-3xl p-5 relative"
            style={{
              background: 'linear-gradient(135deg,#ffffff 0%, #fafafa 100%)',
              boxShadow: `0 20px 55px ${brandColor}22, 0 4px 12px rgba(0,0,0,0.08)`,
              border: `2px solid ${brandColor}22`,
            }}
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="QR preview"
                className="w-[260px] h-[260px] md:w-[300px] md:h-[300px] block"
              />
            ) : (
              <div className="w-[260px] h-[260px] md:w-[300px] md:h-[300px] flex items-center justify-center text-xs"
                style={{ color: txtSub }}>
                {tt.generating}
              </div>
            )}
          </div>
          <canvas ref={previewCanvasRef} className="hidden" />
        </div>

        {/* Controls */}
        <div className="space-y-4">
          {/* Color palette */}
          <div className="rounded-3xl p-5"
            style={{ background: surface, border: `1px solid ${border}`, boxShadow: cardShadow }}>
            <p className="text-[11px] font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: txtSub }}>
              <Palette size={11} /> {tt.brandColor}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {PALETTE.map(c => (
                <button
                  key={c}
                  onClick={() => setBrandColor(c)}
                  className="w-9 h-9 rounded-full transition-transform hover:scale-110"
                  aria-label={c}
                  style={{
                    background: c,
                    boxShadow: brandColor === c
                      ? `0 0 0 3px ${surface}, 0 0 0 5px ${c}`
                      : '0 2px 8px rgba(0,0,0,0.12)',
                  }}
                />
              ))}
              <label className="w-9 h-9 rounded-full cursor-pointer flex items-center justify-center border-2 border-dashed"
                style={{ borderColor: border, color: txtSub }}>
                <input
                  type="color"
                  value={brandColor}
                  onChange={e => setBrandColor(e.target.value)}
                  className="opacity-0 absolute w-9 h-9 cursor-pointer"
                />
                <Palette size={14} />
              </label>
            </div>
          </div>

          {/* Downloads */}
          <div className="rounded-3xl p-5"
            style={{ background: surface, border: `1px solid ${border}`, boxShadow: cardShadow }}>
            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: txtSub }}>
              {tt.downloads}
            </p>
            <p className="text-[11px] mt-0.5 mb-3" style={{ color: txtSub }}>{tt.downloadsSub}</p>

            <DownloadRow
              icon={<FileImage size={16} />}
              iconBg={GRADIENTS.brandReverse}
              title={tt.simple}
              subtitle={tt.simpleSub}
              sizeKB={sizes.simple}
              busy={busy === 'simple'}
              onClick={handleDownloadSimple}
              txtPrim={txtPrim}
              txtSub={txtSub}
              border={border}
              surfaceAlt={surfaceAlt}
              busyLabel={tt.generating}
            />
            <DownloadRow
              icon={<QrCodeIcon size={16} />}
              iconBg={GRADIENTS.violetPink}
              title={tt.branded}
              subtitle={tt.brandedSub}
              sizeKB={sizes.branded}
              busy={busy === 'branded'}
              onClick={handleDownloadBranded}
              txtPrim={txtPrim}
              txtSub={txtSub}
              border={border}
              surfaceAlt={surfaceAlt}
              busyLabel={tt.generating}
            />
            <DownloadRow
              icon={<Printer size={16} />}
              iconBg="linear-gradient(135deg,#FF6B9D,#f59e0b)"
              title={tt.poster}
              subtitle={tt.posterSub}
              sizeKB={sizes.poster}
              busy={busy === 'poster'}
              onClick={handleDownloadPoster}
              txtPrim={txtPrim}
              txtSub={txtSub}
              border={border}
              surfaceAlt={surfaceAlt}
              busyLabel={tt.generating}
              last
            />
          </div>

          {/* Free note */}
          <div className="rounded-2xl p-4 flex items-start gap-3"
            style={{
              background: dk ? 'rgba(34,197,94,0.08)' : '#f0fdf4',
              border: `1px solid ${dk ? 'rgba(34,197,94,0.2)' : '#bbf7d0'}`,
            }}>
            <Sparkles size={16} className="mt-0.5 shrink-0" style={{ color: '#16a34a' }} />
            <p className="text-[12px] leading-relaxed" style={{ color: dk ? '#a7f3d0' : '#166534' }}>
              {tt.freeNote}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   DownloadRow — one row with icon, title, subtitle and CTA
   ═══════════════════════════════════════════════════════════════════ */
function DownloadRow(props: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  sizeKB?: number;
  busy: boolean;
  onClick: () => void;
  txtPrim: string;
  txtSub: string;
  border: string;
  surfaceAlt: string;
  busyLabel: string;
  last?: boolean;
}) {
  const { icon, iconBg, title, subtitle, sizeKB, busy, onClick, txtPrim, txtSub, border, busyLabel, last } = props;
  return (
    <div
      className={`flex items-center gap-3 py-3 ${last ? '' : 'border-b'}`}
      style={{ borderColor: border }}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white"
        style={{ background: iconBg }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold truncate" style={{ color: txtPrim }}>{title}</p>
        <p className="text-[11px] truncate" style={{ color: txtSub }}>
          {subtitle}{sizeKB ? ` • ~${sizeKB} KB` : ''}
        </p>
      </div>
      <button
        onClick={onClick}
        disabled={busy}
        className="px-3.5 py-2 rounded-xl text-[11.5px] font-bold flex items-center gap-1.5 transition-all disabled:opacity-60"
        style={{
          background: GRADIENTS.violetSoft,
          color: '#fff',
          boxShadow: '0 4px 12px rgba(108,99,255,0.3)',
        }}
      >
        <Download size={12} />
        {busy ? busyLabel : 'PNG'}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Branded QR renderer
   Draws QR + circular white background + logo overlay, optionally with
   the shop name below.
   ═══════════════════════════════════════════════════════════════════ */
async function renderBrandedQR(opts: {
  url: string;
  size: number;
  color: string;
  logoUrl: string;
  shopName: string;
  withText: boolean;
}): Promise<string> {
  const { url, size, color, logoUrl, shopName, withText } = opts;
  const canvas = document.createElement('canvas');
  const textHeight = withText ? Math.round(size * 0.15) : 0;
  canvas.width = size;
  canvas.height = size + textHeight;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw QR into a temporary canvas so we can tint it
  const qrCanvas = document.createElement('canvas');
  await QRCode.toCanvas(qrCanvas, url, {
    errorCorrectionLevel: 'H',
    width: size,
    margin: 2,
    color: { dark: color, light: '#FFFFFF' },
  });
  ctx.drawImage(qrCanvas, 0, 0, size, size);

  // Logo overlay
  const logo = await loadImage(logoUrl);
  const logoBoxSize = Math.round(size * 0.22);
  const cx = size / 2;
  const cy = size / 2;

  // White rounded box behind the logo (helps scanning)
  ctx.fillStyle = '#ffffff';
  const r = Math.round(logoBoxSize * 0.22);
  roundRect(ctx, cx - logoBoxSize / 2, cy - logoBoxSize / 2, logoBoxSize, logoBoxSize, r);
  ctx.fill();

  if (logo) {
    const inner = Math.round(logoBoxSize * 0.78);
    ctx.save();
    ctx.beginPath();
    roundRect(ctx, cx - inner / 2, cy - inner / 2, inner, inner, Math.round(inner * 0.2));
    ctx.clip();
    ctx.drawImage(logo, cx - inner / 2, cy - inner / 2, inner, inner);
    ctx.restore();
  } else {
    // Fallback: draw a colored dot with initials
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, logoBoxSize * 0.32, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = `900 ${Math.round(logoBoxSize * 0.35)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText((shopName || 'B').slice(0, 1).toUpperCase(), cx, cy + 1);
  }

  // Shop name below
  if (withText && textHeight > 0) {
    ctx.fillStyle = color;
    ctx.font = `900 ${Math.round(textHeight * 0.42)}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const trimmed = shopName.length > 26 ? shopName.slice(0, 25) + '…' : shopName;
    ctx.fillText(trimmed, size / 2, size + textHeight / 2);
  }

  return canvas.toDataURL('image/png');
}

/* ═══════════════════════════════════════════════════════════════════
   A4 poster renderer (300 DPI → 2480 × 3508 px, portrait)
   ═══════════════════════════════════════════════════════════════════ */
async function renderPoster(opts: {
  url: string;
  color: string;
  logoUrl: string;
  shopName: string;
  phone: string;
  ctaLine: string;
  visitLine: string;
}): Promise<string> {
  const { url, color, logoUrl, shopName, phone, ctaLine, visitLine } = opts;
  const W = 2480;
  const H = 3508;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  // Decorative gradient border
  const borderPad = 90;
  const borderRadius = 90;
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, color);
  grad.addColorStop(1, shadeColor(color, -25));
  ctx.strokeStyle = grad;
  ctx.lineWidth = 22;
  roundRect(ctx, borderPad, borderPad, W - borderPad * 2, H - borderPad * 2, borderRadius);
  ctx.stroke();

  // Inner accent band at top
  const bandY = borderPad + 60;
  const bandH = 380;
  ctx.fillStyle = color;
  roundRect(ctx, borderPad + 60, bandY, W - (borderPad + 60) * 2, bandH, 60);
  ctx.fill();

  // CTA text on band
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 130px system-ui, -apple-system, sans-serif';
  ctx.fillText('SCAN ME', W / 2, bandY + 130);
  ctx.font = '700 66px system-ui, -apple-system, sans-serif';
  const cta = ctaLine.length > 44 ? ctaLine.slice(0, 43) + '…' : ctaLine;
  ctx.fillText(cta, W / 2, bandY + 260);

  // Huge QR in the center
  const qrSize = 1600;
  const qrX = (W - qrSize) / 2;
  const qrY = bandY + bandH + 180;

  const qrCanvas = document.createElement('canvas');
  await QRCode.toCanvas(qrCanvas, url, {
    errorCorrectionLevel: 'H',
    width: qrSize,
    margin: 2,
    color: { dark: '#000000', light: '#FFFFFF' },
  });

  // Soft shadow behind QR
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.14)';
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 30;
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, qrX - 60, qrY - 60, qrSize + 120, qrSize + 120, 60);
  ctx.fill();
  ctx.restore();

  ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

  // Logo overlay in QR center
  const logo = await loadImage(logoUrl);
  const logoBox = Math.round(qrSize * 0.2);
  const lcx = qrX + qrSize / 2;
  const lcy = qrY + qrSize / 2;
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, lcx - logoBox / 2, lcy - logoBox / 2, logoBox, logoBox, Math.round(logoBox * 0.22));
  ctx.fill();
  if (logo) {
    const inner = Math.round(logoBox * 0.78);
    ctx.save();
    ctx.beginPath();
    roundRect(ctx, lcx - inner / 2, lcy - inner / 2, inner, inner, Math.round(inner * 0.2));
    ctx.clip();
    ctx.drawImage(logo, lcx - inner / 2, lcy - inner / 2, inner, inner);
    ctx.restore();
  } else {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(lcx, lcy, logoBox * 0.32, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = `900 ${Math.round(logoBox * 0.35)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText((shopName || 'B').slice(0, 1).toUpperCase(), lcx, lcy + 8);
  }

  // Footer block: shop name + visit line + optional phone + url
  let footerY = qrY + qrSize + 200;
  ctx.fillStyle = '#111827';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.font = '900 110px system-ui, -apple-system, sans-serif';
  const displayName = shopName.length > 28 ? shopName.slice(0, 27) + '…' : shopName;
  ctx.fillText(displayName, W / 2, footerY);
  footerY += 150;

  ctx.fillStyle = '#6b7280';
  ctx.font = '600 56px system-ui, -apple-system, sans-serif';
  const visit = visitLine.length > 60 ? visitLine.slice(0, 59) + '…' : visitLine;
  ctx.fillText(visit, W / 2, footerY);
  footerY += 90;

  if (phone) {
    ctx.fillStyle = color;
    ctx.font = '800 58px system-ui, -apple-system, sans-serif';
    ctx.fillText(phone, W / 2, footerY);
    footerY += 90;
  }

  // Small URL at very bottom
  ctx.fillStyle = '#9ca3af';
  ctx.font = '600 40px system-ui, -apple-system, sans-serif';
  const displayUrl = url.replace(/^https?:\/\//, '');
  ctx.fillText(displayUrl, W / 2, H - borderPad - 130);

  // BioLinkWD watermark
  ctx.fillStyle = color;
  ctx.font = '900 44px system-ui, -apple-system, sans-serif';
  ctx.fillText('BioLinkWD', W / 2, H - borderPad - 75);

  return canvas.toDataURL('image/png');
}

/* ── Helpers ── */
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function shadeColor(hex: string, percent: number): string {
  const h = hex.replace('#', '');
  const num = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  const p = percent / 100;
  r = Math.max(0, Math.min(255, Math.round(r + 255 * p)));
  g = Math.max(0, Math.min(255, Math.round(g + 255 * p)));
  b = Math.max(0, Math.min(255, Math.round(b + 255 * p)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
