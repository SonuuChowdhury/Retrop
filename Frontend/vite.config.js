import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import qrcode from 'qrcode-terminal'
import os from 'os'

function getLocalIP() {
  const interfaces = os.networkInterfaces()
  const candidates = []

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        candidates.push({ name, address: iface.address })
      }
    }
  }

  // Prefer real WiFi: 192.168.x.x first, then 10.x.x.x, then anything else
  const preferred =
    candidates.find(c => c.address.startsWith('192.168.')) ||
    candidates.find(c => c.address.startsWith('10.'))      ||
    candidates[0]

  return preferred?.address || 'localhost'
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'qr-on-dev',
      configureServer(server) {
        server.httpServer?.once('listening', () => {
          const port = server.config.server.port || 5173
          const ip = getLocalIP()
          const url = `http://${ip}:${port}`

          console.log('\n')
          qrcode.generate(url, { small: true })
          console.log(`\n  📱  Scan above to open on your phone`)
          console.log(`  🔗  ${url}\n`)
        })
      },
    },
  ],
  server: {
    host: true,
    port: 5173,
  },
})