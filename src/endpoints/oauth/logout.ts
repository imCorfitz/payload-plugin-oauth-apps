import httpStatus from 'http-status'
import type { Endpoint } from 'payload/config'

import logoutUser from '../../operations/logout'
import type { OperationConfig } from '../../types'

export const logout: (config: OperationConfig) => Endpoint[] = config => {
  return [
    {
      path: '/oauth/logout',
      method: 'post',
      async handler(req, res, next) {
        try {
          const { payload } = req

          const collection = payload.collections[config.endpointCollection.slug]

          const { refreshToken, accessToken } = req.body as {
            refreshToken?: string
            accessToken?: string
          }

          if (!refreshToken && !accessToken) {
            res.status(httpStatus.BAD_REQUEST).send('Bad Request: Missing token')
            return
          }

          await logoutUser({
            collection,
            req,
            res: res as unknown as Response,
            data: {
              refreshToken,
              accessToken,
            },
            config,
          })

          res.send({
            message: 'Logged out',
          })
        } catch (error: unknown) {
          next(error)
        }
      },
    },
  ]
}
