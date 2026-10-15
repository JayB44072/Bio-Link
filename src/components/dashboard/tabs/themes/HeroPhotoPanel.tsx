import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Box, ImagePlus, Layers, Sparkles, Trash2 } from 'lucide-react';
import { uploadPublicFile } from '../../../../lib/api/storage';
import { backgroundUniformity, removeUniformBackground } from '../../../../lib/photo/cutout';
import { canvasToBlob, canvasToRgba, fileToCanvas, rgbaToCanvas } from '../../../../lib/photo/browser';
import { heroPhotoUrl, loadImage } from '../../../../lib/product3d/heroModel';
import { formatModelToken, heroPhotoPath, newPhotoId, PHOTO_BASE, parseModelToken } from '../../../../lib/product3d/modelToken';
import { useFeedback } from '../../../../lib/feedbackContext';
import { ButtonSpinner } from '../../../ui/Spinner';
import Segmented from '../../../ui/Segmented';

const ACTIVE = '#a855f7';
const CHECKER = 'repeating-conic-gradient(#d4d4dc 0% 25%, #f4f4f8 0% 50%) 50% / 14px 14px';

interface HeroPhotoPanelProps {
  ownerId: string;
  /** Jeton du produit 3D actuel (pour montrer la photo déjà utilisée). */
  value: string | null;
  /** Base du modèle du catalogue sélectionné, si on peut y plaquer une photo. */
  textureBase: string | null;
  textureName: string | null;
  /** Photos des produits du vendeur, proposées comme point de départ. */
  productImages: string[];
  lang: string;
  dark: boolean;
  palette: { surface: string; border: string; txtPrim: string; txtSub: string };
  onApply: (token: string | null) => void;
}

/** Le vendeur donne la photo de son produit : détourage, aperçu, puis relief 3D ou placage sur un modèle. */
export default function HeroPhotoPanel({ ownerId, value, textureBase, textureName, productImages, lang, dark, palette, onApply }: HeroPhotoPanelProps) {
  const fr = lang === 'fr';
  const { notify } = useFeedback();
  const fileRef = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState<HTMLCanvasElement | null>(null);
  const [tolerance, setTolerance] = useState(48);
  const deferredTolerance = useDeferredValue(tolerance);
  const [mode, setMode] = useState<'relief' | 'model'>('relief');
  const [busy, setBusy] = useState(false);

  const token = parseModelToken(value);
  const canTexture = !!textureBase && textureBase !== PHOTO_BASE;

  const sourceRgba = useMemo(() => (source ? canvasToRgba(source) : null), [source]);
  const uniformity = useMemo(() => (sourceRgba ? backgroundUniformity(sourceRgba) : 1), [sourceRgba]);
  const cutout = useMemo(() => (sourceRgba ? removeUniformBackground(sourceRgba, deferredTolerance) : null), [sourceRgba, deferredTolerance]);
  const cutoutCanvas = useMemo(() => (cutout ? rgbaToCanvas(cutout) : null), [cutout]);
  const [beforeUrl, setBeforeUrl] = useState('');
  const [afterUrl, setAfterUrl] = useState('');
  useEffect(() => { setBeforeUrl(source ? source.toDataURL('image/jpeg', 0.8) : ''); }, [source]);
  useEffect(() => { setAfterUrl(cutoutCanvas ? cutoutCanvas.toDataURL('image/png') : ''); }, [cutoutCanvas]);

  async function pick(file: Blob | undefined) {
    if (!file) return;
    try { setSource(await fileToCanvas(file, 1024)); setMode(canTexture ? mode : 'relief'); }
    catch { notify(fr ? "Cette image n'a pas pu être lue." : 'This image could not be read.', 'error'); }
  }

  async function pickFromProduct(url: string) {
    try {
      const img = await loadImage(url);
      const canvas = document.createElement('canvas');
      const k = Math.min(1, 1024 / Math.max(img.naturalWidth, img.naturalHeight));
      canvas.width = Math.round(img.naturalWidth * k);
      canvas.height = Math.round(img.naturalHeight * k);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.getContext('2d')!.getImageData(0, 0, 1, 1); // échoue si l'image est « teintée » (CORS)
      setSource(canvas);
    } catch {
      notify(fr ? "Cette photo ne peut pas être traitée ici. Importez-la depuis votre appareil." : 'This photo cannot be processed here. Upload it from your device.', 'error');
    }
  }

  async function apply() {
    if (!source || !cutoutCanvas) return;
    setBusy(true);
    try {
      const id = newPhotoId();
      if (mode === 'relief') {
        await uploadPublicFile('product-images', heroPhotoPath(ownerId, id, 'cutout'), await canvasToBlob(cutoutCanvas, 'image/png'), { contentType: 'image/png' });
        onApply(formatModelToken(PHOTO_BASE, id));
      } else {
        await uploadPublicFile('product-images', heroPhotoPath(ownerId, id, 'source'), await canvasToBlob(source, 'image/jpeg', 0.9), { contentType: 'image/jpeg' });
        onApply(formatModelToken(textureBase!, id));
      }
      setSource(null);
      notify(fr ? 'Photo ajoutée à votre héros 3D.' : 'Photo added to your 3D hero.', 'success');
    } catch {
      notify(fr ? "L'envoi de la photo a échoué. Réessayez." : 'Uploading the photo failed. Please try again.', 'error');
    } finally { setBusy(false); }
  }

  const { surface, border, txtPrim, txtSub } = palette;
  const lowUniformity = uniformity < 0.6;

  return (
    <div className="rounded-2xl p-4 md:p-5" style={{ background: surface, border: `1px solid ${border}` }}>
      <div className="flex items-start gap-3">
        <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(168,85,247,0.14)' }}>
          <Box size={17} style={{ color: ACTIVE }} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold" style={{ color: txtPrim }}>{fr ? 'Votre propre produit' : 'Your own product'}</h3>
          <p className="text-xs mt-0.5" style={{ color: txtSub }}>
            {fr ? 'Ajoutez la photo de votre produit : elle est détourée puis mise en relief 3D, fidèle à la photo.' : 'Add a photo of your product: it is cut out and turned into a 3D relief, faithful to the photo.'}
          </p>
        </div>
      </div>

      {/* Photo déjà utilisée */}
      {token.photoId && !source && (
        <div className="mt-3 flex items-center gap-3 rounded-xl p-2.5" style={{ border: `1px solid ${border}` }}>
          <span className="w-14 h-14 rounded-lg overflow-hidden shrink-0" style={{ background: CHECKER }}>
            <img src={heroPhotoUrl(ownerId, token.photoId, token.base === PHOTO_BASE ? 'cutout' : 'source')} alt="" className="w-full h-full object-contain" />
          </span>
          <span className="flex-1 min-w-0 text-xs font-semibold" style={{ color: txtPrim }}>
            {token.base === PHOTO_BASE ? (fr ? 'Relief 3D de votre photo' : 'Your photo in 3D relief') : (fr ? 'Photo sur le modèle du catalogue' : 'Photo on the catalogue model')}
          </span>
          <button type="button" onClick={() => onApply(token.base === PHOTO_BASE ? null : token.base)}
            className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a855f7]"
            aria-label={fr ? 'Retirer la photo' : 'Remove the photo'}>
            <Trash2 size={15} className="text-red-500" />
          </button>
        </div>
      )}

      {!source && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { void pick(e.target.files?.[0]); e.target.value = ''; }} />
          <button type="button" onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-white transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: 'linear-gradient(135deg,#a855f7,#6C63FF)' }}>
            <ImagePlus size={14} /> {fr ? 'Ajouter une photo' : 'Add a photo'}
          </button>
          {productImages.slice(0, 5).map(url => (
            <button key={url} type="button" onClick={() => void pickFromProduct(url)} title={fr ? 'Utiliser la photo de ce produit' : 'Use this product photo'}
              className="w-10 h-10 rounded-lg overflow-hidden transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a855f7]"
              style={{ border: `1px solid ${border}` }}>
              <img src={url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {source && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <figure>
              <div className="rounded-xl overflow-hidden aspect-square flex items-center justify-center" style={{ background: dark ? '#14142a' : '#f4f4f8' }}>
                {beforeUrl && <img src={beforeUrl} alt="" className="max-w-full max-h-full object-contain" />}
              </div>
              <figcaption className="text-[11px] font-semibold mt-1 text-center" style={{ color: txtSub }}>{fr ? 'Photo' : 'Photo'}</figcaption>
            </figure>
            <figure>
              <div className="rounded-xl overflow-hidden aspect-square flex items-center justify-center" style={{ background: CHECKER }}>
                {afterUrl && <img src={afterUrl} alt="" className="max-w-full max-h-full object-contain" />}
              </div>
              <figcaption className="text-[11px] font-semibold mt-1 text-center" style={{ color: txtSub }}>{fr ? 'Détourée' : 'Cut out'}</figcaption>
            </figure>
          </div>

          <label className="block">
            <span className="flex justify-between text-xs font-semibold mb-1" style={{ color: txtPrim }}>
              {fr ? 'Précision du détourage' : 'Cut-out strength'}
              <span style={{ color: txtSub }}>{tolerance}</span>
            </span>
            <input type="range" min={15} max={110} value={tolerance} onChange={e => setTolerance(Number(e.target.value))} className="w-full accent-[#a855f7]" />
            <span className="block text-[11px] mt-0.5" style={{ color: txtSub }}>
              {fr ? 'Augmentez si du fond reste ; réduisez si le produit est grignoté.' : 'Raise it if background remains; lower it if the product gets eaten away.'}
            </span>
          </label>

          {lowUniformity && (
            <p className="flex items-start gap-2 text-xs rounded-xl px-3 py-2" style={{ background: 'rgba(251,191,36,0.12)', color: '#b45309' }}>
              <Sparkles size={14} className="shrink-0 mt-0.5" />
              {fr
                ? 'Le fond de cette photo n’est pas uni : le détourage sera approximatif. Une photo sur fond blanc ou uni donne un bien meilleur résultat.'
                : 'This photo’s background is not plain, so the cut-out will be approximate. A photo on a white or plain background works much better.'}
            </p>
          )}

          {canTexture && (
            <Segmented
              label={fr ? 'Rendu 3D' : '3D result'}
              value={mode}
              onChange={setMode}
              options={[
                { value: 'relief', label: fr ? 'Relief 3D de la photo' : 'Photo in 3D relief', hint: fr ? 'Votre produit lui-même, détouré' : 'Your product itself, cut out' },
                { value: 'model', label: fr ? `Sur : ${textureName}` : `On: ${textureName}`, hint: fr ? 'Imprimé / étiquette / écran' : 'Print / label / screen' },
              ]}
              accent={ACTIVE} txtPrim={txtPrim} txtSub={txtSub} border={border} surface={surface}
            />
          )}

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void apply()} disabled={busy || !cutout}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-white disabled:opacity-60 transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ background: 'linear-gradient(135deg,#a855f7,#6C63FF)' }}>
              {busy ? <ButtonSpinner /> : <Layers size={14} />} {fr ? 'Utiliser pour mon héros 3D' : 'Use for my 3D hero'}
            </button>
            <button type="button" onClick={() => setSource(null)} disabled={busy}
              className="px-4 py-2 rounded-full text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2"
              style={{ color: txtSub, border: `1px solid ${border}` }}>
              {fr ? 'Annuler' : 'Cancel'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
