import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Added Tailwind plugin, this is for modern styling purposes and may be accompanied by Bootstrap
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()], // Added tailwind plugin
  server: {
    proxy: {
      "/api": "http://localhost:8000"
    }
  }
})