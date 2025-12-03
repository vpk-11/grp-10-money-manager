import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,          // Allows describe, it, expect globally
    environment: 'jsdom',   // Provides window/document for React testing
    setupFiles: './src/tests/setupTests.js', // optional, for jest-dom matchers
    include: ['src/tests/**/*.test.jsx'],    // only run your test files
  },
});

