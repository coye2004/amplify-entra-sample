import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
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
    include: ['aws-amplify', 'react', 'react-dom']
  },
  publicDir: 'public'
})
