import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],

  test: {
    globals: true,               
    environment: 'jsdom',        
    setupFiles: './src/tests/setupTests.js',
    include: ['src/tests/**/*.test.jsx'],
  },

  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
        rewrite: path => path.replace(/^\/api/, '/api'),
      },
    },
  },
});

