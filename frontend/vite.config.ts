/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Required for path alias configuration
import path from "path"

// Added Tailwind plugin, this is for modern styling purposes and may be accompanied by Bootstrap
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: "v8",
      thresholds: {
        lines: 60,
        branches: 60,
        statements: 60,
      }
    }
  },
  plugins: [react(), tailwindcss()], // Added tailwind plugin
  server: {
    port: 80,
    proxy: {
      "/api": "http://localhost:8000",
      "/ws": {
        target: "http://localhost:8000",
        ws: true,
      },
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
})