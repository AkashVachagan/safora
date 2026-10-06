import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/user": "http://localhost:3000",
      "/packages": "http://localhost:3000",
      "/contacts": "http://localhost:3000",
    },
  },
})
