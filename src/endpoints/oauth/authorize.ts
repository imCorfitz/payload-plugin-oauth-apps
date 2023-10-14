import type { Endpoint } from 'payload/config'

import type { OperationConfig } from '../../types'
import credentials from '../handlers/authorize/credentials'
import magiclink from '../handlers/authorize/magiclink'
import otp from '../handlers/authorize/otp'

const handlers = {
  credentials,
  otp,
  magiclink,
}

export const authorize: (config: OperationConfig) => Endpoint[] = config => {
  return [
    {
      path: '/oauth/authorize',
      method: 'post',
      async handler(req, res, next) {
        try {
          const { method: requestedMethod } = req.body as {
            method?: string
          }

          const method = requestedMethod || 'credentials'

          const authHandlers = { ...handlers, ...config.authorization?.customHandlers }

          const methodIsSupported = Object.keys(authHandlers).includes(method)

          if (!methodIsSupported) {
            res.status(400).send('Bad Request: Invalid authorization method')
            return
          }

          const authHandler = authHandlers[method as keyof typeof authHandlers]

          if (!authHandler) {
            res.status(400).send('Bad Request: Invalid authorization method')
            return
          }

          return authHandler(config)(req, res, next)
        } catch (error) {
          next(error)
        }
      },
    },
  ]
}
