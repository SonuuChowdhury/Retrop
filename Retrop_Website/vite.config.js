import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import qrcode from 'qrcode-terminal'
import { networkInterfaces } from 'os'

function getLocalIP() {
  const nets = networkInterfaces()
  const results = []

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        results.push(net.address)
      }
    }
  }

  // Prefer 192.168.x.x (home/office WiFi) over 172.x.x.x (WSL/Docker/VM)
  const preferred = results.find((ip) => ip.startsWith('192.168.'))
  return preferred ?? results[0] ?? 'localhost'
}

export default defineConfig(({ mode }) => {
  // Load env variables to grab the live public Ngrok URL if present
  const env = loadEnv(mode, process.cwd(), '')
  const globalUrl = env.VITE_API_URL || 'Not connected'

  return {
    plugins: [
      react(),
      {
        name: 'qr-on-start',
        configureServer(server) {
          server.httpServer?.once('listening', () => {
            const ip = getLocalIP()
            const port = server.config.server.port ?? 5180
            const url = `http://${ip}:${port}`

            console.log('\n')
            console.log('━'.repeat(50))
            console.log('  📱  Scan to open Retrop Website on your phone')
            console.log('━'.repeat(50))
            qrcode.generate(url, { small: true })
            console.log(`  🌐  Local Network: \x1b[36m${url}\x1b[0m`)
            console.log(`  🔗  Global API Link: \x1b[35m${globalUrl}\x1b[0m`)
            console.log('━'.repeat(50))
            console.log('\n')
          })
        },
      },
    ],
    server: {
      host: true,
      port: 5180,
    },
  }
})
