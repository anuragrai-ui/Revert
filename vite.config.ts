import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/users/access-token/stg': {
        target: 'https://ng-web.certifyos.com/api/users/access-token',
        changeOrigin: true,
        rewrite: () => '',
      },
      '/api/users/access-token/prod': {
        target: 'https://ng.certifyos.com/api/users/access-token',
        changeOrigin: true,
        rewrite: () => '',
      },
      '/api/stg': {
        target: 'https://ng-api-stg.certifyos.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/stg/, ''),
      },
      '/api/prod': {
        target: 'https://ng-api-production.certifyos.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/prod/, ''),
      }
    }
  }
})
