import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// https://vite.dev/config/
const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),tailwindcss()
  ],
  server: {
    host: true, // Listen on all local IPs
    proxy: {
      // Proxy API requests to the backend — works from any device on the network
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true,         // proxy WebSocket upgrades too
      },
    },
    fs: {
      allow: [path.resolve(__dirname, '..')],
    },
  },
})