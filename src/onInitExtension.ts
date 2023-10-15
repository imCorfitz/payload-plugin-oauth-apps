import type { Payload } from 'payload/dist/payload'

import type { PluginTypes } from './types'

export const onInitExtension = (_pluginOptions: PluginTypes, payload: Payload): void => {
  const { express: app } = payload

  if (!app) return

  try {
    // You can use the existing express app here to add middleware, routes, etc.
    // app.use(...)
  } catch (err: unknown) {
    payload.logger.error(err)
  }
}
