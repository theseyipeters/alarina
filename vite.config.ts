import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // The API lives on :4000; proxying keeps requests same-origin so session cookies just work.
    proxy: { '/api': 'http://localhost:4000' },
  },
})
