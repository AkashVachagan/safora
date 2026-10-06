import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/user": "http://127.0.0.1:3000",
      "/packages": "http://127.0.0.1:3000",
      "/contacts": "http://127.0.0.1:3000",
      "/api": "http://127.0.0.1:3000",
      "/clear": "http://127.0.0.1:3000",
    },
  },
})
