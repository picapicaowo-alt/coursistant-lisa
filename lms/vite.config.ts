import {defineConfig, loadEnv, type ProxyOptions} from 'vite'
import {resolve} from 'path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import {releaseManifestPlugin, resolveReleaseInfo} from './config/releaseManifestPlugin'

const tokensPath = resolve(__dirname, './src/styles/_tokens.scss').replace(/\\/g, '/')
const release = resolveReleaseInfo(__dirname)

const readPath = (name: string, value: string | undefined, fallback: string): string => {
  const path = value?.trim() || fallback
  if (!/^\/(?!\/)/.test(path)) {
    throw new Error(`${name} must be a same-origin path beginning with one slash.`)
  }
  return path.replace(/\/$/, '') || '/'
}

const readProxyTarget = (name: string, value: string | undefined): string | undefined => {
  const target = value?.trim()
  if (!target) return undefined
  const url = new URL(target)
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error(`${name} must be an HTTP(S) origin without embedded credentials.`)
  }
  return url.origin
}

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const agentProxy = (pathPrefix: string, target: string, allowSelfSigned: boolean): ProxyOptions => ({
  target,
  changeOrigin: true,
  secure: !allowSelfSigned,
  rewrite: (path: string) => path.replace(new RegExp(`^${escapeRegExp(pathPrefix)}`), ''),
  configure: proxy => {
    proxy.on('proxyReq', proxyRequest => {
      // Duplicate CORS filters reject the forwarded Origin. See ADR 0001.
      proxyRequest.removeHeader('origin')
    })
  },
})

// https://vite.dev/config/
export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiPath = readPath('VITE_API_DOMAIN_NAME', env.VITE_API_DOMAIN_NAME, '/api')
  const aiAgentPath = readPath('VITE_AI_AGENT_API_DOMAIN_NAME', env.VITE_AI_AGENT_API_DOMAIN_NAME, '/ai-agent')
  const studySupportPath = readPath('VITE_STUDY_SUPPORT_API_DOMAIN_NAME', env.VITE_STUDY_SUPPORT_API_DOMAIN_NAME, '/study-support')
  const apiTarget = readProxyTarget('LMS_API_PROXY_TARGET', env.LMS_API_PROXY_TARGET)
  const aiAgentTarget = readProxyTarget('LMS_AI_AGENT_PROXY_TARGET', env.LMS_AI_AGENT_PROXY_TARGET)
  const studySupportTarget = readProxyTarget('LMS_STUDY_SUPPORT_PROXY_TARGET', env.LMS_STUDY_SUPPORT_PROXY_TARGET)
  const allowSelfSigned = env.LMS_PROXY_ALLOW_SELF_SIGNED === 'true'
  const proxy: Record<string, ProxyOptions> = {}

  if (apiTarget) {
    proxy[apiPath] = {
      target: apiTarget,
      changeOrigin: true,
      secure: !allowSelfSigned,
      cookieDomainRewrite: '',
    }
  }
  if (aiAgentTarget) proxy[aiAgentPath] = agentProxy(aiAgentPath, aiAgentTarget, allowSelfSigned)
  if (studySupportTarget) proxy[studySupportPath] = agentProxy(studySupportPath, studySupportTarget, allowSelfSigned)

  const allowedHosts = (env.LMS_DEV_ALLOWED_HOSTS || 'localhost,127.0.0.1')
    .split(',')
    .map(host => host.trim())
    .filter(Boolean)
  const configuredPort = Number(env.LMS_DEV_PORT || 5173)
  if (!Number.isInteger(configuredPort) || configuredPort < 1 || configuredPort > 65535) {
    throw new Error('LMS_DEV_PORT must be a valid TCP port.')
  }

  return {
    plugins: [react(), tailwindcss(), releaseManifestPlugin(release)],
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
            // Sass ignores a BOM at the start of a file but not after
            // additionalData prepends tokens. See docs/adr/0001-dev-proxy-and-error-reporting.md.
            return `@use "${tokensPath}" as t;\n${source.replace(/^﻿/, '')}`
          },
        },
      },
    },
    server: {
      host: env.LMS_DEV_HOST || '127.0.0.1',
      port: configuredPort,
      allowedHosts,
      // Same-origin proxy: refresh cookie is SameSite=Lax, and the backend's
      // duplicated CORS ACAO headers break cross-origin XHR. See ADR 0001.
      proxy,
    },
    test: {
      globals: true,
      environment: 'happy-dom',
      setupFiles: ['./src/setupTests.ts'],
      transformMode: {
        web: [/\.tsx$/]
      },
      mockReset: true,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html']
      },
      include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**']
    }
  }
})
