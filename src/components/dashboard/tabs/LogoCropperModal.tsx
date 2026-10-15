import React, { useState, useRef, useEffect, useCallback } from 'react';
import { RotateCcw, RotateCw, ZoomIn, ZoomOut, Check, X } from 'lucide-react';
import { useAppPrefs } from '../../../lib/AppPrefsContext';
import { BRAND, GRADIENTS } from '../../../lib/theme';
import { dashPalette } from '../../../lib/dashPalette';

const DISPLAY = 260;
const OUTPUT  = 480;

interface Props {
  file: File;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
}

export default function LogoCropperModal({ file, onConfirm, onCancel }: Props) {
  const { isDark: dk } = useAppPrefs();

  const [imgSrc, setImgSrc]   = useState('');
  const [rotation, setRot]    = useState(0);
  const [zoom, setZoom]       = useState(1);
  const [offset, setOffset]   = useState({ x: 0, y: 0 });
  const [processing, setProc] = useState(false);

  const imgRef  = useRef<HTMLImageElement>(null);
  const dragRef = useRef(false);
  const lastRef = useRef({ x: 0, y: 0 });
  const touchRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImgSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Calculate initial zoom to fill the square on image load
  function onImgLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget;
    const fill = Math.max(DISPLAY / img.naturalWidth, DISPLAY / img.naturalHeight);
    setZoom(Math.max(1, fill));
  }

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragRef.current = true;
    lastRef.current = { x: e.clientX, y: e.clientY };
  }, []);
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - lastRef.current.x;
    const dy = e.clientY - lastRef.current.y;
    lastRef.current = { x: e.clientX, y: e.clientY };
    setOffset(p => ({ x: p.x + dx, y: p.y + dy }));
  }, []);
  const onMouseUp = useCallback(() => { dragRef.current = false; }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    touchRef.current = { x: t.clientX, y: t.clientY };
  }, []);
  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchRef.current) return;
    e.preventDefault();
    const t = e.touches[0];
    const dx = t.clientX - touchRef.current.x;
    const dy = t.clientY - touchRef.current.y;
    touchRef.current = { x: t.clientX, y: t.clientY };
    setOffset(p => ({ x: p.x + dx, y: p.y + dy }));
  }, []);
  const onTouchEnd = useCallback(() => { touchRef.current = null; }, []);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(p => Math.min(5, Math.max(0.3, p - e.deltaY * 0.001)));
  }, []);

  function rotate(dir: -1 | 1) {
    setRot(p => (p + dir * 90 + 360) % 360);
    setOffset({ x: 0, y: 0 });
  }

  async function handleConfirm() {
    if (!imgRef.current || !imgSrc) return;
    setProc(true);
    const img = imgRef.current;
    const canvas = document.createElement('canvas');
    canvas.width  = OUTPUT;
    canvas.height = OUTPUT;
    const ctx = canvas.getContext('2d')!;

    ctx.save();
    ctx.translate(OUTPUT / 2, OUTPUT / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    const ratio = OUTPUT / DISPLAY;
    ctx.scale(zoom * ratio, zoom * ratio);
    ctx.translate(offset.x / zoom, offset.y / zoom);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    ctx.restore();

    canvas.toBlob(blob => {
      setProc(false);
      if (blob) onConfirm(blob);
    }, 'image/jpeg', 0.92);
  }

  const { surface, txtPrim, txtSub } = dashPalette(dk);
  const border  = dk ? 'rgba(139,124,255,0.2)' : '#eeebfb';
  const btnBg   = dk ? 'rgba(139,124,255,0.14)' : '#f0eeff';

  const ctrlBtn = `flex items-center gap-1 text-xs font-bold px-2.5 py-2 rounded-xl transition`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
      <div className="rounded-3xl p-5 w-full max-w-xs shadow-2xl"
        style={{ background: surface, border: `1px solid ${border}` }}>

        <h3 className="font-black text-base mb-0.5" style={{ color: txtPrim }}>
          Ajuster le logo
        </h3>
        <p className="text-[11px] mb-4" style={{ color: txtSub }}>
          Glissez · molette pour zoomer · tournez si besoin
        </p>

        {/* ── Zone de prévisualisation ── */}
        <div
          className="relative mx-auto overflow-hidden rounded-2xl select-none cursor-grab active:cursor-grabbing"
          style={{ width: DISPLAY, height: DISPLAY, background: '#0a0a14', touchAction: 'none' }}
          onMouseDown={onMouseDown} onMouseMove={onMouseMove}
          onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
          onWheel={onWheel}>

          {imgSrc && (
            <img
              ref={imgRef}
              src={imgSrc}
              alt=""
              draggable={false}
              onLoad={onImgLoad}
              className="absolute pointer-events-none"
              style={{
                top: '50%', left: '50%',
                transform: `translate(-50%,-50%) translate(${offset.x}px,${offset.y}px) rotate(${rotation}deg) scale(${zoom})`,
                maxWidth: 'none', maxHeight: 'none',
                transformOrigin: 'center center',
              }}
            />
          )}

          {/* Grille de composition */}
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: [
              `linear-gradient(rgba(255,255,255,0.07) 1px,transparent 1px)`,
              `linear-gradient(90deg,rgba(255,255,255,0.07) 1px,transparent 1px)`,
            ].join(','),
            backgroundSize: `${DISPLAY / 3}px ${DISPLAY / 3}px`,
          }} />

          {/* Marqueurs de coins */}
          {(['tl','tr','bl','br'] as const).map(c => (
            <div key={c} className="absolute pointer-events-none"
              style={{
                width: 22, height: 22,
                top: c.startsWith('t') ? 8 : undefined,
                bottom: c.startsWith('b') ? 8 : undefined,
                left: c.endsWith('l') ? 8 : undefined,
                right: c.endsWith('r') ? 8 : undefined,
                borderTop: c.startsWith('t') ? '2px solid rgba(255,255,255,0.65)' : 'none',
                borderBottom: c.startsWith('b') ? '2px solid rgba(255,255,255,0.65)' : 'none',
                borderLeft: c.endsWith('l') ? '2px solid rgba(255,255,255,0.65)' : 'none',
                borderRight: c.endsWith('r') ? '2px solid rgba(255,255,255,0.65)' : 'none',
                borderRadius: c === 'tl' ? '4px 0 0 0' : c === 'tr' ? '0 4px 0 0' : c === 'bl' ? '0 0 0 4px' : '0 0 4px 0',
              }} />
          ))}
        </div>

        {/* ── Contrôles ── */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <button onClick={() => rotate(-1)} className={ctrlBtn} style={{ background: btnBg, color: BRAND.violet }}>
            <RotateCcw size={13} /> −90°
          </button>
          <button onClick={() => setZoom(p => Math.min(5, p + 0.25))}
            className={ctrlBtn} style={{ background: btnBg, color: BRAND.violet }}>
            <ZoomIn size={15} />
          </button>
          <button onClick={() => setZoom(p => Math.max(0.3, p - 0.25))}
            className={ctrlBtn} style={{ background: btnBg, color: BRAND.violet }}>
            <ZoomOut size={15} />
          </button>
          <button onClick={() => rotate(1)} className={ctrlBtn} style={{ background: btnBg, color: BRAND.violet }}>
            +90° <RotateCw size={13} />
          </button>
        </div>

        {/* Slider de zoom */}
        <div className="mt-3 px-1">
          <input type="range" min={30} max={500} value={Math.round(zoom * 100)}
            onChange={e => setZoom(Number(e.target.value) / 100)}
            className="w-full accent-violet-500 h-1.5" />
          <p className="text-[10px] text-center mt-0.5" style={{ color: txtSub }}>
            Zoom {Math.round(zoom * 100)} %
          </p>
        </div>

        {/* Boutons de confirmation */}
        <div className="flex gap-3 mt-5">
          <button onClick={onCancel}
            className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium py-2.5 rounded-xl"
            style={{ background: btnBg, color: txtSub }}>
            <X size={14} /> Annuler
          </button>
          <button onClick={handleConfirm} disabled={processing || !imgSrc}
            className="flex-1 flex items-center justify-center gap-1.5 text-sm font-bold py-2.5 rounded-xl text-white disabled:opacity-50"
            style={{ background: GRADIENTS.brand }}>
            {processing
              ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Traitement…</>
              : <><Check size={14} /> Appliquer</>}
          </button>
        </div>
      </div>
    </div>
  );
}
