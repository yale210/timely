import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Added Tailwind plugin, this is for modern styling purposes and may be accompanied by Bootstrap
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
<<<<<<< Updated upstream
=======
  test: {
    environment: 'jsdom',
    coverage: {
      provider: "v8",
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80
      }
    }
  },
>>>>>>> Stashed changes
  plugins: [react(), tailwindcss()], // Added tailwind plugin
  server: {
    proxy: {
      "/api": "http://localhost:8000"
    }
  }
})