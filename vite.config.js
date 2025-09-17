import { defineConfig } from 'vite'
import { copyFileSync, existsSync } from 'fs'

export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './index.html'
      }
    },
    target: 'es2015',
    minify: 'esbuild'
  },
  server: {
    port: 5174
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['aws-amplify']
  },
  plugins: [
    {
      name: 'copy-amplify-outputs',
      writeBundle() {
        // Copy amplify_outputs.json to dist folder for production
        if (existsSync('./amplify_outputs.json')) {
          copyFileSync('./amplify_outputs.json', './dist/amplify_outputs.json');
          console.log('✅ Copied amplify_outputs.json to dist folder');
        } else {
          console.warn('⚠️ amplify_outputs.json not found - make sure to run "npx ampx sandbox --once" first');
        }
      }
    }
  ]
})
