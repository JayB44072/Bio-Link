import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { dirname, resolve } from 'node:path';

const DEMO = process.env.VITE_DEMO === '1';

/**
 * Mode démo (`VITE_DEMO=1`) : remplace le client Supabase par un faux client en mémoire (src/lib/demo)
 * pour afficher le vrai tableau de bord sans compte ni base de données (captures, vidéo de présentation).
 * Sans cette variable, ce plugin ne fait rien et le code de démo n'entre pas dans le site.
 */
const demoSupabase = {
  name: 'demo-supabase',
  enforce: 'pre' as const,
  resolveId(source: string, importer?: string) {
    if (!DEMO || !importer || !source.startsWith('.')) return null;
    const target = resolve(dirname(importer), source).split('\\').join('/');
    return target.endsWith('/src/lib/supabase') ? resolve(__dirname, 'src/lib/demo/supabase.ts') : null;
  },
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [demoSupabase, react()],
  define: DEMO ? { 'import.meta.env.VITE_DEMO': JSON.stringify('1') } : {},
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
