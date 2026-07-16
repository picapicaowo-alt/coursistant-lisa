import {defineConfig, loadEnv} from 'vite'
import {resolve} from 'path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({mode}) => {
  // auto load .env.development / .env.production
  // noinspection JSUnusedLocalSymbols
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "src": resolve(__dirname, './src'),
        "@": resolve(__dirname, './src'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 13005,
      allowedHosts: [
        'dev.xlearnedu.com',
        'ec2.dev.xlearnedu.com',
        'localhost',
        '127.0.0.1',
      ],
    },
    test: {
      globals: true,
      environment: 'happy-dom',
      transformMode: {
        web: [/\.tsx$/]
      },
      mockReset: true,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html']
      },
      include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      exclude: ['**/node_modules/**', '**/dist/**']
    }
  }
})