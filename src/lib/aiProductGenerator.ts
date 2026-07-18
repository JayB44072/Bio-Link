/**
 * AI product-sheet generator
 * ────────────────────────────────────────────────────────
 * 1) Primary  : Google Gemini (vision + text)  — analyses the product image
 * 2) Fallback : Groq Llama (text only)         — if Gemini fails
 * 3) Ultimate : sensible default               — never throws
 *
 * All errors are caught internally. The caller always receives a valid
 * GeneratedProduct object (with `_error` string metadata when relevant).
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const GROQ_API_KEY   = import.meta.env.VITE_GROQ_API_KEY   as string | undefined;

const GEMINI_MODEL = 'gemini-2.0-flash';
const GROQ_MODEL   = 'llama-3.3-70b-versatile';

const REQUEST_TIMEOUT_MS = 10_000;

export interface GeneratedProduct {
  name: string;
  description: string;
  suggested_price_fcfa: number;
  /** Debug metadata — which backend produced the result (or the fallback reason). */
  _source?: 'gemini' | 'groq' | 'fallback';
  _error?: string;
}

/* ─── Utilities ────────────────────────────────────────────────────────── */

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
    promise.then(v => { clearTimeout(t); resolve(v); }, e => { clearTimeout(t); reject(e); });
  });
}

/** Extract JSON object even when wrapped in ```json fences or extra prose. */
function extractJson(raw: string): unknown {
  const trimmed = raw.trim();
  try { return JSON.parse(trimmed); } catch { /* fallthrough */ }
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced) {
    try { return JSON.parse(fenced[1]); } catch { /* fallthrough */ }
  }
  const objMatch = trimmed.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try { return JSON.parse(objMatch[0]); } catch { /* fallthrough */ }
  }
  throw new Error('AI response is not valid JSON');
}

function coerceProduct(obj: unknown, lang: 'fr' | 'en'): GeneratedProduct {
  const o = (obj ?? {}) as Record<string, unknown>;
  const rawName = typeof o.name === 'string' ? o.name : '';
  const rawDesc = typeof o.description === 'string' ? o.description : '';
  const rawPrice = o.suggested_price_fcfa;

  let price = 0;
  if (typeof rawPrice === 'number' && Number.isFinite(rawPrice)) price = Math.round(rawPrice);
  else if (typeof rawPrice === 'string') {
    const parsed = parseInt(rawPrice.replace(/[^0-9]/g, ''), 10);
    if (Number.isFinite(parsed)) price = parsed;
  }

  return {
    name: rawName.slice(0, 80) || (lang === 'fr' ? 'Nouveau produit' : 'New product'),
    description: rawDesc || (lang === 'fr'
      ? 'Découvrez ce produit de qualité, parfait pour vous.'
      : 'Discover this quality product, perfect for you.'),
    suggested_price_fcfa: price > 0 ? price : 5000,
  };
}

function fallbackProduct(lang: 'fr' | 'en', hint: string, reason?: string): GeneratedProduct {
  const hintClean = hint.trim().slice(0, 60);
  const name = hintClean
    ? (lang === 'fr' ? hintClean : hintClean)
    : (lang === 'fr' ? 'Nouveau produit' : 'New product');
  const description = lang === 'fr'
    ? 'Produit de qualité disponible dès maintenant. Modifiez ce texte pour ajouter vos propres détails et convaincre vos clients.'
    : 'Quality product available now. Edit this text to add your own details and convince your customers.';
  return {
    name,
    description,
    suggested_price_fcfa: 5000,
    _source: 'fallback',
    _error: reason,
  };
}

/* ─── Prompt builder ───────────────────────────────────────────────────── */

function buildPrompt(hint: string, lang: 'fr' | 'en', withImage: boolean): string {
  const image = withImage
    ? (lang === 'fr' ? 'Analyse cette image de produit et' : 'Analyze this product image and')
    : (lang === 'fr' ? 'À partir de l\'indice ci-dessous,' : 'Based on the hint below,');

  if (lang === 'fr') {
    return `Tu es un rédacteur e-commerce africain expert (marché Cameroun / Afrique francophone). ${image} génère une fiche produit vendeuse.

Contraintes strictes :
- "name" : titre accrocheur et court (max 60 caractères), sans emojis, sans guillemets
- "description" : description vendeuse de 2 à 3 phrases (max ~280 caractères), mentionne bénéfice concret + cible
- "suggested_price_fcfa" : prix suggéré en francs CFA (nombre entier, réaliste pour le marché africain, sans devise ni séparateur)

Indice de l'utilisateur : ${hint || '(aucun indice fourni — déduis tout de l\'image)'}

Réponds UNIQUEMENT en JSON valide, sans texte autour, sans balises \`\`\`, avec exactement ces 3 clés :
{"name":"...","description":"...","suggested_price_fcfa":0}`;
  }

  return `You are an expert African e-commerce copywriter (Cameroon / French-speaking Africa market). ${image} generate a compelling product sheet.

Strict constraints:
- "name": short catchy title (max 60 chars), no emojis, no quotes
- "description": 2-3 sentence sales pitch (max ~280 chars), mention concrete benefit + target audience
- "suggested_price_fcfa": suggested price in CFA francs (integer, realistic for African market, no currency, no separator)

User hint: ${hint || '(no hint provided — infer everything from the image)'}

Reply with ONLY valid JSON, no prose, no \`\`\` fences, exactly these 3 keys:
{"name":"...","description":"...","suggested_price_fcfa":0}`;
}

/* ─── Gemini backend (vision) ──────────────────────────────────────────── */

async function callGeminiVision(
  imageBase64: string | null,
  hint: string,
  lang: 'fr' | 'en',
): Promise<GeneratedProduct> {
  if (!GEMINI_API_KEY) throw new Error('VITE_GEMINI_API_KEY missing');

  const prompt = buildPrompt(hint, lang, !!imageBase64);

  const parts: Array<Record<string, unknown>> = [{ text: prompt }];
  if (imageBase64) {
    // Gemini wants raw base64, no `data:image/...;base64,` prefix
    const clean = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    // Best-effort MIME detection from the data URL, else default to jpeg
    const mimeMatch = imageBase64.match(/^data:(image\/[a-z0-9.+-]+);base64,/i);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    parts.push({ inline_data: { mime_type: mimeType, data: clean } });
  }

  const payload = {
    contents: [{ role: 'user', parts }],
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 512,
      responseMimeType: 'application/json',
    },
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const res = await withTimeout(
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
    REQUEST_TIMEOUT_MS,
  );

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Gemini HTTP ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  if (!text) throw new Error('Gemini returned empty response');

  const parsed = extractJson(text);
  const product = coerceProduct(parsed, lang);
  product._source = 'gemini';
  return product;
}

/* ─── Groq backend (text-only fallback) ────────────────────────────────── */

async function callGroqText(hint: string, lang: 'fr' | 'en'): Promise<GeneratedProduct> {
  if (!GROQ_API_KEY) throw new Error('VITE_GROQ_API_KEY missing');
  if (!hint.trim()) throw new Error('Groq fallback requires a hint (no image support)');

  const prompt = buildPrompt(hint, lang, false);

  const payload = {
    model: GROQ_MODEL,
    messages: [
      { role: 'system', content: lang === 'fr'
          ? 'Tu réponds toujours en JSON strict, sans prose autour.'
          : 'You always reply with strict JSON, no prose around it.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 512,
    response_format: { type: 'json_object' },
  };

  const res = await withTimeout(
    fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify(payload),
    }),
    REQUEST_TIMEOUT_MS,
  );

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Groq HTTP ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  const text: string = data?.choices?.[0]?.message?.content ?? '';
  if (!text) throw new Error('Groq returned empty response');

  const parsed = extractJson(text);
  const product = coerceProduct(parsed, lang);
  product._source = 'groq';
  return product;
}

/* ─── Public API ───────────────────────────────────────────────────────── */

/**
 * Generate a product sheet from an optional image + optional hint.
 * NEVER throws — always returns a GeneratedProduct (with fallback if all backends fail).
 */
export async function generateProductSheet(
  imageBase64: string | null,
  hint: string,
  lang: 'fr' | 'en',
): Promise<GeneratedProduct> {
  const errors: string[] = [];

  // 1) Gemini (vision)
  try {
    return await callGeminiVision(imageBase64, hint, lang);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn('[aiProductGenerator] Gemini failed:', msg);
    errors.push(`gemini: ${msg}`);
  }

  // 2) Groq (text) — only if we have a hint to work with
  if (hint.trim()) {
    try {
      return await callGroqText(hint, lang);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn('[aiProductGenerator] Groq failed:', msg);
      errors.push(`groq: ${msg}`);
    }
  } else {
    errors.push('groq: skipped (no hint)');
  }

  // 3) Ultimate fallback
  return fallbackProduct(lang, hint, errors.join(' | '));
}

/* ─── Helpers exposed for the UI ───────────────────────────────────────── */

/** Read a File as base64 data URL (includes the `data:...;base64,` prefix). */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('FileReader error'));
    reader.readAsDataURL(file);
  });
}

/** Fetch a remote image URL and convert it to a base64 data URL. Returns null on failure. */
export async function urlToBase64(url: string): Promise<string | null> {
  try {
    const res = await withTimeout(fetch(url), REQUEST_TIMEOUT_MS);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn('[aiProductGenerator] urlToBase64 failed:', e);
    return null;
  }
}

/* ─── Free-plan quota (localStorage counter) ───────────────────────────── */

const FREE_QUOTA_PER_MONTH = 3;
const QUOTA_KEY = 'biolink_ai_product_quota_v1';

interface QuotaState { month: string; count: number }

function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function readQuota(): QuotaState {
  try {
    const raw = localStorage.getItem(QUOTA_KEY);
    if (!raw) return { month: currentMonthKey(), count: 0 };
    const parsed = JSON.parse(raw) as QuotaState;
    if (parsed.month !== currentMonthKey()) return { month: currentMonthKey(), count: 0 };
    return parsed;
  } catch {
    return { month: currentMonthKey(), count: 0 };
  }
}

/** Remaining AI generations this month for a free-plan user. */
export function getFreeAiRemaining(): number {
  const q = readQuota();
  return Math.max(0, FREE_QUOTA_PER_MONTH - q.count);
}

/** Increment the free-plan counter after a successful generation. */
export function bumpFreeAiUsage(): void {
  try {
    const q = readQuota();
    const next: QuotaState = { month: q.month, count: q.count + 1 };
    localStorage.setItem(QUOTA_KEY, JSON.stringify(next));
  } catch {
    /* no-op */
  }
}

export const FREE_AI_QUOTA = FREE_QUOTA_PER_MONTH;
