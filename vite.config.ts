import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/tatic-arena/',
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts']
  }
});
