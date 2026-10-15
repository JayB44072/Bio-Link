import { useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import { prefersReducedMotion } from '../../lib/product3d/env';

interface Particle { x: number; y: number; r: number; speed: number; color: string; alpha: number; phase: number }

/** Particules lumineuses qui montent doucement ; le défilement les accélère et les décale (parallaxe). */
function Particles({ colors, progress }: { colors: string[]; progress: MutableRefObject<number> }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const reduced = prefersReducedMotion();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let particles: Particle[] = [];

    const init = () => {
      w = Math.max(1, canvas.clientWidth);
      h = Math.max(1, canvas.clientHeight);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(90, Math.max(28, (w * h) / 14000)));
      particles = Array.from({ length: count }, (_, i) => ({
        x: Math.random() * w, y: Math.random() * h,
        r: 0.6 + Math.random() * 2.2, speed: 8 + Math.random() * 26,
        color: colors[i % colors.length], alpha: 0.15 + Math.random() * 0.5, phase: Math.random() * Math.PI * 2,
      }));
    };

    let raf = 0;
    let last = performance.now();
    let lastP = progress.current;
    let visible = true;

    const draw = (now: number, still = false) => {
      const dt = Math.min(0.05, (now - last) / 1000) || 0.016;
      last = now;
      // Vitesse de défilement : plus on défile vite, plus les particules filent
      const velocity = Math.abs(progress.current - lastP) / dt;
      lastP = progress.current;
      const boost = 1 + Math.min(7, velocity * 45);
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      for (const p of particles) {
        if (!still) {
          p.y -= p.speed * dt * boost;
          p.x += Math.sin(now / 1000 + p.phase) * 6 * dt;
          if (p.y < -8) { p.y = h + 8; p.x = Math.random() * w; }
        }
        // Parallaxe : les grosses particules (au premier plan) bougent davantage
        const y = (p.y - progress.current * h * 0.35 * (p.r / 2.8) + h * 2) % (h + 16) - 8;
        ctx.globalAlpha = p.alpha * 0.35;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, y, p.r * 3, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = p.alpha;
        ctx.beginPath(); ctx.arc(p.x, y, p.r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const loop = (now: number) => { draw(now); raf = requestAnimationFrame(loop); };
    const start = () => { if (!raf && !reduced && visible && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(loop); } };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };

    init();
    if (reduced) draw(performance.now(), true); else start();

    const ro = new ResizeObserver(() => { init(); if (reduced) draw(performance.now(), true); });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) start(); else stop(); });
    io.observe(canvas);
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVis);
    return () => { stop(); ro.disconnect(); io.disconnect(); document.removeEventListener('visibilitychange', onVis); };
  }, [colors, progress]);

  return <canvas ref={ref} className="absolute inset-0 w-full h-full" aria-hidden="true" />;
}

interface StageBackdropProps {
  accent: string;
  rim: string;
  /** Progression du défilement (0..1) ; la variable CSS `--p` du parent suit la même valeur. */
  progress: MutableRefObject<number>;
}

/** Fond animé de la scène « Cinéma » : lueurs en dérive, faisceau, plancher en perspective, particules, grain. */
export default function StageBackdrop({ accent, rim, progress }: StageBackdropProps) {
  const colors = useMemo(() => [accent, rim, '#ffffff'], [accent, rim]);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Lueurs : deux grandes taches de couleur qui dérivent lentement et suivent le défilement */}
      <div className="absolute -left-[25%] -top-[10%] w-[75%] aspect-square" style={{ transform: 'translateY(calc(var(--p, 0) * -140px))' }}>
        <div className="cinema-drift-a w-full h-full rounded-full blur-3xl opacity-50"
          style={{ background: `radial-gradient(circle, color-mix(in srgb, ${accent} 70%, transparent), transparent 68%)` }} />
      </div>
      <div className="absolute -right-[20%] bottom-[-15%] w-[70%] aspect-square" style={{ transform: 'translateY(calc(var(--p, 0) * 160px))' }}>
        <div className="cinema-drift-b w-full h-full rounded-full blur-3xl opacity-45"
          style={{ background: `radial-gradient(circle, color-mix(in srgb, ${rim} 70%, transparent), transparent 68%)` }} />
      </div>

      {/* Faisceau de lumière qui balaie la scène */}
      <div className="cinema-sweep absolute top-[-20%] bottom-[-20%] w-[28%]"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)', transform: 'skewX(-18deg)' }} />

      {/* Plancher en perspective : les lignes avancent avec le défilement */}
      <div className="absolute inset-x-[-30%] bottom-0 h-[42%]"
        style={{
          transform: 'perspective(520px) rotateX(62deg)', transformOrigin: '50% 100%',
          backgroundImage: `linear-gradient(color-mix(in srgb, ${rim} 40%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, ${rim} 40%, transparent) 1px, transparent 1px)`,
          backgroundSize: '56px 56px',
          backgroundPosition: '0 calc(var(--p, 0) * 900px)',
          maskImage: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent 85%)',
          WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent 85%)',
          opacity: 0.55,
        }} />

      <Particles colors={colors} progress={progress} />

      {/* Grain de pellicule */}
      <div className="absolute inset-0 opacity-[0.07] mix-blend-overlay"
        style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")" }} />
    </div>
  );
}
