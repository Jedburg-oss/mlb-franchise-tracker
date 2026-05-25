import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Base is pre-set for Jedburg-oss/mlb-franchise-tracker on GitHub Pages.
// If you fork to a different repo, change this to '/your-repo-name/'.
// For Vercel/Netlify deployments, change back to './'.
export default defineConfig({
  plugins: [react()],
  base: '/mlb-franchise-tracker/',
})
