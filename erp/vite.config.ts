import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative asset paths so the build works from any subfolder/subdomain
  // it's deployed under, without needing to hardcode the deployment path.
  base: './',
})
