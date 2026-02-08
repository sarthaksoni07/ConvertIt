import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

const ngrokDomain ='escapingly-oblongish-annalisa.ngrok-free.dev';

export default defineConfig({
 plugins: [react()],
 server: {
    // Allows access from the ngrok domain
    allowedHosts: [ngrokDomain],
    hmr: {
      host: ngrokDomain,
      protocol: 'wss', // Use 'wss' for secure WebSocket connection
      clientPort: 443, // Use port 443 (standard HTTPS port)
    },
  },
});
