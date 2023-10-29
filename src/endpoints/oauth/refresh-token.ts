import httpStatus from 'http-status'
import type { Endpoint } from 'payload/config'

import generateAccessToken from '../../token/generate-access-token'
import type { MaybeUser, OperationConfig } from '../../types'
import verifyClientCredentials from '../../utils/verify-client-credentials'

export const refreshToken: (config: OperationConfig) => Endpoint[] = config => {
  return [
    {
      path: '/oauth/refresh-token',
      method: 'post',
      async handler(req, res, next) {
        try {
          const { payload } = req

          const {
            refreshToken: token,
            clientId,
            clientSecret,
          } = req.body as {
            refreshToken?: string
            clientId?: string
            clientSecret?: string
          }

          if (!clientId || !clientSecret) {
            res.status(httpStatus.BAD_REQUEST).send('Bad Request: Missing client credentials')
            return
          }

          // Validate the client credentials
          const client = await verifyClientCredentials(clientId, clientSecret, payload)

          if (!client) {
            res.status(httpStatus.UNAUTHORIZED).send('Unauthorized: Invalid client credentials')
            return
          }

          if (!token) {
            res.status(httpStatus.BAD_REQUEST).send('Bad Request: Missing refresh token')
            return
          }

          const [sessionId, userId, expiration] = payload.decrypt(String(token)).split('::')

          const expiresAt = new Date(Number(expiration))

          if (expiresAt < new Date(Date.now())) {
            res.status(httpStatus.UNAUTHORIZED).send('Unauthorized: Token expired')
            return
          }

          const user = (await payload.findByID({
            collection: config.endpointCollection.slug,
            id: userId,
            depth: 1,
          })) as MaybeUser

          if (!user) {
            res.status(httpStatus.NOT_FOUND).send('User not Found')
            return
          }

          const session = user.oAuth.sessions?.find(ses => ses.id === sessionId)

          if (!session) {
            res.status(httpStatus.NOT_FOUND).send('No active session found')
            return
          }

          const sessionAppId = typeof session.app === 'string' ? session.app : session.app.id

          if (sessionAppId !== client.id) {
            res.status(httpStatus.UNAUTHORIZED).send('Unauthorized: Invalid client credentials')
            return
          }

          const { expiresIn, accessToken } = generateAccessToken({
            user,
            payload,
            collection: config.endpointCollection,
            sessionId,
          })

          res.send({
            token: accessToken,
            exp: expiresIn,
          })
        } catch (error: unknown) {
          next(error)
        }
      },
    },
  ]
}
