/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable import/no-import-module-exports */
import express from 'express'
import type { Server } from 'http'
import payload from 'payload'
import path from 'path'
import { seed } from './seed'

// eslint-disable-next-line @typescript-eslint/no-var-requires -- This is required for dotenv to work
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

const app = express()

// Redirect root to Admin panel
app.get('/', (_, res) => {
  res.redirect('/admin')
})

export const start = async (args: { local: boolean } = { local: false }): Promise<Server> => {
  const { local } = args
  await payload.init({
    local,
    secret: process.env.PAYLOAD_SECRET || 'this-is-a-secret',
    express: app,
  })

  if (process.env.PAYLOAD_SEED === 'true') {
    await seed(payload)
  }

  return app.listen(3030)
}

// when build.js is launched directly
if (module.id === require.main?.id) {
  start()
}
