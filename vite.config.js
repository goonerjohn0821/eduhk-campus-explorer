import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const project = fileURLToPath(new URL('.', import.meta.url));
const webRoot = resolve(project, 'source/dist');

// Keep the complete original project under source/, including its authored dist/.
// The top-level dist/ is exclusively the GitHub Pages build output.
export default defineConfig({
  root: webRoot,
  base: './',
  publicDir: false,
  appType: 'mpa',
  resolve: {
    // Original modules use both relative imports and the bare "three" specifier.
    // Resolve both to the SAME original r180 module; do not mix renderer copies.
    alias: [{ find: /^three$/, replacement: resolve(webRoot, 'vendor/three.module.js') }],
  },
  optimizeDeps: { exclude: ['three'] },
  plugins: [{
    name: 'preserve-campus-static-assets',
    apply: 'build',
    transformIndexHtml(html) {
      // Vite resolves bare imports at build time. No runtime import map is needed.
      return html.replace(/<script type="importmap">[\s\S]*?<\/script>/g, '');
    },
    generateBundle() {
      // The existing Audio() URL and credits links are document-relative strings.
      // Keep their exact paths. Vite handles the imported GLB and CSS font itself.
      for (const fileName of [
        'assets/campus-score.mp3',
        'assets/CREDITS.txt',
        'assets/LICENSE-Noto-Sans.txt',
        'assets/LICENSE-Noto-Serif.txt',
        'vendor/LICENSE-three.txt',
      ]) {
        this.emitFile({ type: 'asset', fileName, source: readFileSync(resolve(webRoot, fileName)) });
      }
      this.emitFile({ type: 'asset', fileName: '.nojekyll', source: '' });
    },
  }],
  build: {
    outDir: resolve(project, 'dist'),
    emptyOutDir: true,
    target: 'es2022',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      input: {
        campus: resolve(webRoot, 'index.html'),
        film: resolve(webRoot, 'film.html'),
      },
      output: {
        manualChunks(id) {
          if (id.includes('/vendor/')) return 'three';
        },
      },
    },
  },
});
