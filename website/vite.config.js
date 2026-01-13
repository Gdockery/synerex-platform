import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({ 
  plugins: [react()],
  publicDir: 'public',
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg'],
  build: {
    rollupOptions: {
      external: (id) => {
        // Block SVG files from being processed
        if (id.endsWith('.svg')) {
          console.warn(`SVG file blocked: ${id}`);
          return true;
        }
        return false;
      }
    }
  }
})
