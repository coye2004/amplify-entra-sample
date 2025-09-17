import { defineConfig } from 'vite'

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
  }
})
