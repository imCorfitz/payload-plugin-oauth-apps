import type { Endpoint } from 'payload/config'
// Types
import type { EndpointConfig, EndpointHandler } from '../../types'
// Handlers
import credentials from '../handlers/authorize/credentials'
import otp from '../handlers/authorize/otp'
import magiclink from '../handlers/authorize/magiclink'

const handlers = {
  credentials,
  otp,
  magiclink,
}

export const authorize: (endpointConfig: EndpointConfig) => Endpoint[] = endpointConfig => {
  const authMethod = endpointConfig.authorization?.method || 'credentials'

  let handler: EndpointHandler | undefined

  if (authMethod === 'custom') {
    handler = endpointConfig.authorization?.customHandler
  } else {
    handler = handlers[authMethod]
  }

  if (!handler) {
    throw new Error(`No handler found for authorization method: ${authMethod}`)
  }

  return [
    {
      path: '/oauth/authorize',
      method: 'post',
      handler: handler(endpointConfig),
    },
  ]
}
