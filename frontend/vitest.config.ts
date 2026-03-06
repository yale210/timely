import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  test: {
    setupFiles: ['src/setupTests.ts'],
    environment: 'jsdom',
    coverage: {
      provider: 'v8', // or 'istanbul'
      reporter: ['text', 'json-summary'], // 'text' for you, 'json-summary' for the agent
      // Ensure the coverage directory is what you expect:
      reportsDirectory: './coverage', 
    },
  },
});