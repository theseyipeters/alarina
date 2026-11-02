import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // The app calls the API directly at VITE_API_URL; refuse to build without it.
  if (!loadEnv(mode, process.cwd()).VITE_API_URL) {
    throw new Error(`VITE_API_URL is not set for "${mode}". Add it to fe/.env.${mode} (e.g. http://localhost:5001).`)
  }

  return {
    plugins: [react()],
  }
})
