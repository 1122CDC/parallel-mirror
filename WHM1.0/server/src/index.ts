import { env } from './config/env'
import { createApp } from './app'
import { DatabaseStore } from './store/databaseStore'

async function main() {
  const store = await DatabaseStore.create()
  const app = createApp(store)

  app.listen(env.port, '0.0.0.0', () => {
    console.log(`[whm-server] listening on http://0.0.0.0:${env.port} (H5: /, Admin: /admin)`)
  })
}

main().catch((error) => {
  console.error('[whm-server] failed to start', error)
  process.exit(1)
})
