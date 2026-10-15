import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X, Check, ZoomIn, ZoomOut, RotateCw, Move } from 'lucide-react';
import { useAppPrefs } from '../../lib/AppPrefsContext';
import { BRAND, GRADIENTS } from '../../lib/theme';

interface Props {
  file: File;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number; // default 4/3
}

export default function ImageCropModal({ file, onConfirm, onCancel, aspectRatio = 4 / 3 }: Props) {
  const { isDark: dk } = useAppPrefs();
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const wrapRef      = useRef<HTMLDivElement>(null);
  const imgRef       = useRef<HTMLImageElement | null>(null);
  const stateRef     = useRef({ x: 0, y: 0, scale: 1, dragging: false, lastX: 0, lastY: 0, rot: 0 });
  const [zoom, setZoom]   = useState(1);
  const [rot, setRot]     = useState(0);
  const [ready, setReady] = useState(false);
  const [exporting, setExporting] = useState(false);

  const surface  = dk ? '#12122b' : '#fff';
  const border   = dk ? 'rgba(139,124,255,0.18)' : '#e8e4fc';
  const txtPrim  = dk ? '#f2f1ff' : '#16162e';
  const txtSub   = dk ? '#8c8ab0' : '#8a87a3';
  const overlayBg = dk ? 'rgba(7,7,20,0.88)' : 'rgba(0,0,0,0.75)';

  /* ── Load image ── */
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      stateRef.current.scale = 1;
      stateRef.current.x = 0;
      stateRef.current.y = 0;
      stateRef.current.rot = 0;
      setReady(true);
      draw();
    };
    img.src = URL.createObjectURL(file);
    return () => URL.revokeObjectURL(img.src);
  }, [file]);

  /* ── Draw ── */
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img    = imgRef.current;
    if (!canvas || !img) return;
    const ctx    = canvas.getContext('2d')!;
    const cw     = canvas.width;
    const ch     = canvas.height;

    ctx.clearRect(0, 0, cw, ch);

    /* Draw image */
    ctx.save();
    ctx.translate(cw / 2 + stateRef.current.x, ch / 2 + stateRef.current.y);
    ctx.rotate((stateRef.current.rot * Math.PI) / 180);
    ctx.scale(stateRef.current.scale, stateRef.current.scale);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.restore();

    /* Crop box */
    const pad    = 24;
    const cropW  = cw - pad * 2;
    const cropH  = cropW / aspectRatio;
    const cropX  = pad;
    const cropY  = (ch - cropH) / 2;

    /* Dim outside */
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, cw, ch);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0,0,0,1)';
    ctx.fillRect(cropX, cropY, cropW, cropH);
    ctx.restore();

    /* Crop border */
    ctx.strokeStyle = BRAND.pink;
    ctx.lineWidth   = 2;
    ctx.shadowColor = BRAND.pink;
    ctx.shadowBlur  = 12;
    ctx.strokeRect(cropX, cropY, cropW, cropH);
    ctx.shadowBlur  = 0;

    /* Grid thirds */
    ctx.strokeStyle = 'rgba(255,107,157,0.3)';
    ctx.lineWidth   = 0.5;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(cropX + (cropW / 3) * i, cropY);
      ctx.lineTo(cropX + (cropW / 3) * i, cropY + cropH);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cropX, cropY + (cropH / 3) * i);
      ctx.lineTo(cropX + cropW, cropY + (cropH / 3) * i);
      ctx.stroke();
    }

    /* Corner handles */
    const hSize = 12;
    ctx.strokeStyle = BRAND.pink;
    ctx.lineWidth   = 3;
    const corners = [
      [cropX, cropY],
      [cropX + cropW, cropY],
      [cropX, cropY + cropH],
      [cropX + cropW, cropY + cropH],
    ] as [number, number][];
    corners.forEach(([cx, cy]) => {
      const dx = cx === cropX ? 1 : -1;
      const dy = cy === cropY ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(cx, cy + dy * hSize);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx + dx * hSize, cy);
      ctx.stroke();
    });
  }, [aspectRatio]);

  useEffect(() => { if (ready) draw(); }, [ready, zoom, rot, draw]);

  /* ── Resize canvas to container ── */
  useEffect(() => {
    const obs = new ResizeObserver(() => {
      const canvas = canvasRef.current;
      const wrap   = wrapRef.current;
      if (!canvas || !wrap) return;
      canvas.width  = wrap.clientWidth;
      canvas.height = wrap.clientHeight;
      draw();
    });
    if (wrapRef.current) obs.observe(wrapRef.current);
    return () => obs.disconnect();
  }, [draw]);

  /* ── Pointer events ── */
  function onPointerDown(e: React.PointerEvent) {
    stateRef.current.dragging = true;
    stateRef.current.lastX    = e.clientX;
    stateRef.current.lastY    = e.clientY;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!stateRef.current.dragging) return;
    stateRef.current.x += e.clientX - stateRef.current.lastX;
    stateRef.current.y += e.clientY - stateRef.current.lastY;
    stateRef.current.lastX = e.clientX;
    stateRef.current.lastY = e.clientY;
    draw();
  }

  function onPointerUp() { stateRef.current.dragging = false; }

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.08 : 0.93;
    const next   = Math.max(0.3, Math.min(8, stateRef.current.scale * factor));
    stateRef.current.scale = next;
    setZoom(next);
    draw();
  }

  function handleZoom(val: number) {
    stateRef.current.scale = val;
    setZoom(val);
    draw();
  }

  function handleRotate() {
    const next = (stateRef.current.rot + 90) % 360;
    stateRef.current.rot = next;
    setRot(next);
    draw();
  }

  /* ── Export crop ── */
  function exportCrop() {
    const canvas = canvasRef.current;
    const img    = imgRef.current;
    if (!canvas || !img) return;

    setExporting(true);
    const cw   = canvas.width;
    const ch   = canvas.height;
    const pad  = 24;
    const cropW = cw - pad * 2;
    const cropH = cropW / aspectRatio;
    const cropX = pad;
    const cropY = (ch - cropH) / 2;

    const out = document.createElement('canvas');
    out.width  = Math.round(cropW * 2); // 2× for retina quality
    out.height = Math.round(cropH * 2);
    const octx = out.getContext('2d')!;
    octx.scale(2, 2);

    const scx  = stateRef.current.x;
    const scy  = stateRef.current.y;
    const sc   = stateRef.current.scale;
    const ro   = (stateRef.current.rot * Math.PI) / 180;

    octx.translate(-cropX, -cropY);
    octx.translate(cw / 2 + scx, ch / 2 + scy);
    octx.rotate(ro);
    octx.scale(sc, sc);
    octx.drawImage(img, -img.width / 2, -img.height / 2);

    out.toBlob(blob => {
      if (blob) onConfirm(blob);
      setExporting(false);
    }, 'image/jpeg', 0.93);
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      style={{ background: overlayBg, backdropFilter: 'blur(8px)' }}>
      <style>{`
        @keyframes cropIn { from{opacity:0;transform:scale(.94)} to{opacity:1;transform:scale(1)} }
      `}</style>
      <div className="relative w-full max-w-xl rounded-3xl overflow-hidden flex flex-col"
        style={{
          background: surface,
          border: `1px solid ${border}`,
          boxShadow: '0 32px 64px rgba(0,0,0,0.5)',
          animation: 'cropIn 0.25s ease',
          maxHeight: '90vh',
        }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: `1px solid ${border}` }}>
          <div>
            <h3 className="font-black text-sm" style={{ color: txtPrim }}>
              Recadrer l'image
            </h3>
            <p className="text-[11px] mt-0.5" style={{ color: txtSub }}>
              Faites glisser pour repositionner · Molette pour zoomer
            </p>
          </div>
          <button onClick={onCancel}
            className="w-8 h-8 rounded-full flex items-center justify-center transition"
            style={{ background: dk ? 'rgba(255,107,157,0.1)' : '#fff0f5', color: BRAND.pink }}>
            <X size={14} />
          </button>
        </div>

        {/* Canvas area */}
        <div ref={wrapRef} className="relative bg-black"
          style={{ height: 340, cursor: 'move', touchAction: 'none' }}>
          <canvas ref={canvasRef}
            className="w-full h-full"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onWheel={onWheel}
          />
          {!ready && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full animate-spin"
                style={{ border: '3px solid rgba(255,107,157,0.2)', borderTopColor: BRAND.pink }} />
            </div>
          )}
          {/* Hint overlay */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold text-white"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
            <Move size={9} />Glissez pour recadrer
          </div>
        </div>

        {/* Controls */}
        <div className="px-5 py-3 shrink-0" style={{ borderTop: `1px solid ${border}` }}>
          <div className="flex items-center gap-3">
            <ZoomOut size={14} style={{ color: txtSub }} />
            <input type="range" min={0.3} max={4} step={0.05} value={zoom}
              onChange={e => handleZoom(parseFloat(e.target.value))}
              className="flex-1 accent-pink-500 h-1 rounded-full" />
            <ZoomIn size={14} style={{ color: txtSub }} />
            <button onClick={handleRotate}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition hover:scale-110"
              style={{ background: dk ? 'rgba(139,124,255,0.12)' : '#f0eeff', color: BRAND.violet }}>
              <RotateCw size={14} />
            </button>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex gap-3 px-5 pb-5 shrink-0">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-2xl text-sm font-semibold transition"
            style={{ background: dk ? 'rgba(139,124,255,0.08)' : '#f5f3ff', color: txtSub }}>
            Annuler
          </button>
          <button onClick={exportCrop} disabled={!ready || exporting}
            className="flex-1 py-2.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 transition disabled:opacity-50"
            style={{ background: GRADIENTS.pinkViolet, boxShadow: '0 6px 20px rgba(255,107,157,0.35)' }}>
            {exporting
              ? <div className="w-4 h-4 rounded-full animate-spin" style={{ border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
              : <Check size={14} />}
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}
