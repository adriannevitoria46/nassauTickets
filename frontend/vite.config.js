import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// O proxy evita CORS: o navegador fala só com o Vite, que repassa /api ao backend.
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:3000' } },
});
