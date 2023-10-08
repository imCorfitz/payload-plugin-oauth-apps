import type { Endpoint } from 'payload/config'
// Types
import type { EndpointConfig, EndpointHandler } from '../../types'
// Handlers
import credentials from '../handlers/authorize/credentials'
import passwordless from '../handlers/authorize/passwordless'
import magiclink from '../handlers/authorize/magiclink'

const handlers = {
  credentials,
  passwordless,
  magiclink,
}

export const authorize: (endpointConfig: EndpointConfig) => Endpoint[] = endpointConfig => {
  const authMethod = endpointConfig.authorizationMethod || 'credentials'

  let handler: EndpointHandler | undefined

  if (authMethod === 'custom') {
    handler = endpointConfig.customAuthorizationHandler
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
