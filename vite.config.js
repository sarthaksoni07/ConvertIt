import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  const ngrokHost = env.VITE_NGROK_URL 
    ? env.VITE_NGROK_URL.replace(/(^\w+:|^)\/\//, '') 
    : 'localhost';

  return {
    plugins: [react()],
    server: {
      host: true,
      strictPort: true,
      allowedHosts: [ngrokHost, '.ngrok-free.app'],
      hmr: {
        host: ngrokHost,
        protocol: 'wss',
        clientPort: 443,
      },
    },
  }
})