import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
  },
  build: {
    // Sourcemaps activées pour que Sentry (§17) remonte des stacks lisibles.
    sourcemap: true,

    // Découpage laissé au bundler.
    //
    // Un `manualChunks` écrit à la main paraît tentant pour isoler React et
    // Supabase dans des lots durablement cachés, mais il fige un graphe de
    // dépendances qui évolue à chaque nouvelle route. Mal ajusté, il produit
    // l'inverse de l'effet recherché : des lots qui se chargent tous au
    // premier écran.
    //
    // Le découpage automatique suit les frontières réelles du code — les
    // `import()` paresseux des routes (§42). C'est là qu'il faut agir, et
    // c'est ce que fera l'ajout des espaces client et administrateur.
  },
});
