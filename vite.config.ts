import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/spor/',
  plugins: [react(), tailwindcss()],
  build: {
    // Tek JS paketi: yayın sırasında scripts/encrypt.mjs bu paketi şifreler
    chunkSizeWarningLimit: 1200,
    modulePreload: false,
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
})
