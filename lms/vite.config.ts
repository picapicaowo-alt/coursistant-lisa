import {defineConfig, loadEnv} from 'vite'
import {resolve} from 'path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const tokensPath = resolve(__dirname, './src/styles/_tokens.scss').replace(/\\/g, '/')

// https://vite.dev/config/
export default defineConfig(({mode}) => {
  // auto load .env.development / .env.production
  const env = loadEnv(mode, process.cwd(), '')

  // Where the dev proxy forwards to. Built from the same variables the app
  // uses so there is only one place to change the backend host.
  const apiTarget =
    `${env.VITE_BASE_PROTOCOL}://${env.VITE_BASE_DOMAIN}:${env.VITE_BASE_PORT}`
  const apiPath = env.VITE_BASE_PATH || '/api'
  const aiAgentPath = env.VITE_AI_AGENT_API_DOMAIN_NAME || '/ai-agent'
  const aiAgentTarget = env.VITE_AI_AGENT_TARGET || 'https://dev.xlearnedu.com:8083'

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "src": resolve(__dirname, './src'),
        "@": resolve(__dirname, './src'),
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          // Design tokens are available in every .scss file as `t.$brand` etc.
          // without an explicit @use. See src/styles/_tokens.scss.
          //
          // The token files themselves are skipped: _tokens.scss would import
          // itself, and tokens.global.scss declares the namespace on its own.
          additionalData: (source: string, filename: string) => {
            const path = filename.replace(/\\/g, '/')
            if (path.includes('/src/styles/_tokens.scss') || path.includes('/src/styles/tokens.global.scss')) {
              return source
            }
            // Strip a leading BOM before prepending. Sass ignores a BOM at the
            // very start of a file but not one sitting mid-document, and
            // prepending a line is exactly what pushes it there — which broke
            // every one of the 28 stylesheets in this tree that carry one.
            return `@use "${tokensPath}" as t;\n${source.replace(/^﻿/, '')}`
          },
        },
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
      // In dev the app calls the API on a relative path so the browser sees a
      // same-origin request and this proxy forwards it. Two reasons, both of
      // which block login without it:
      //
      //  1. The backend emits Access-Control-Allow-Origin twice on real
      //     responses (once on preflight), and browsers reject a duplicated
      //     value. That is a server bug; this sidesteps it until it is fixed.
      //  2. The refreshToken cookie is SameSite=Lax, so it would never be sent
      //     on a cross-site XHR. Same-origin keeps token refresh working.
      //
      // Production is unaffected: .env.production points at an absolute URL
      // and no proxy is involved.
      proxy: {
        [apiPath]: {
          target: apiTarget,
          changeOrigin: true,
          // Drop the cookie's Domain attribute so it binds to localhost
          // instead of being rejected as a foreign-domain cookie.
          cookieDomainRewrite: '',
        },
        [aiAgentPath]: {
          target: aiAgentTarget,
          changeOrigin: true,
          secure: false,
          rewrite: path => path.replace(new RegExp(`^${aiAgentPath}`), ''),
          configure: proxy => {
            proxy.on('proxyReq', proxyRequest => {
              // This is a same-origin browser request by the time it reaches
              // Vite. The API's current duplicate CORS filters reject the
              // forwarded :8084 Origin on the actual POST, so the dev proxy
              // must not pass that browser-only header upstream.
              proxyRequest.removeHeader('origin')
            })
          },
        },
      },
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
