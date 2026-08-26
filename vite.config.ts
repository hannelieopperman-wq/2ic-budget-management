import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base is set for GitHub Pages project sites. Change to match your actual repo name if it differs.
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE ?? '/2ic-budget-management/',
})
