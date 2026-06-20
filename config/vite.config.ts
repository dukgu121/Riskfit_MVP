import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  root: fileURLToPath(new URL('../app', import.meta.url)),
  envDir: fileURLToPath(new URL('..', import.meta.url)),
  plugins: [react(), tailwindcss()],
  build: {
    outDir: fileURLToPath(new URL('../dist', import.meta.url)),
    emptyOutDir: true,
  },
  server: {
    port: 38215,
    strictPort: true,
    // The repo lives on a Windows mount (/mnt/c) under WSL2, where inotify file
    // events don't fire — without polling, edits never reach the running dev
    // server / HMR. Poll so changes hot-reload instead of needing a restart.
    watch: { usePolling: true, interval: 300 },
    proxy: {
      '/api': 'http://127.0.0.1:47821',
      '/health': 'http://127.0.0.1:47821',
    },
  },
})
