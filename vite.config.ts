import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import netlify from '@netlify/vite-plugin-tanstack-start'

export default defineConfig(({ command }) => ({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: { port: 3000 },
  plugins: [
    tanstackStart({ srcDirectory: 'src', router: { routesDirectory: 'routes' } }),
    command === 'build' && netlify(),
    tailwindcss(),
    viteReact(),
  ],
}))
