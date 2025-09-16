import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './index.html'
      }
    },
    target: 'es2015'
  },
  server: {
    port: 5174
  },
  define: {
    global: 'globalThis',
  }
})
