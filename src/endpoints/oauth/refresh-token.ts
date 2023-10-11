import type { Endpoint } from 'payload/config'
import type { IncomingAuthType } from 'payload/dist/auth'
import getCookieExpiration from 'payload/dist/utilities/getCookieExpiration'

import generateAccessToken from '../../token/generate-access-token'
import type { EndpointConfig, MaybeUser } from '../../types'
import verifyClientCredentials from '../../utils/verify-client-credentials'

export const refreshToken: (config: EndpointConfig) => Endpoint[] = config => {
  return [
    {
      path: '/oauth/refresh-token',
      method: 'post',
      async handler(req, res) {
        try {
          const { headers, payload } = req

          const {
            refreshToken: rftoken,
            clientId,
            clientSecret,
          } = req.body as {
            refreshToken?: string
            clientId?: string
            clientSecret?: string
          }

          if (!clientId || !clientSecret) {
            res.status(400).send('Bad Request: Missing client credentials')
            return
          }

          // Validate the client credentials
          const client = await verifyClientCredentials(clientId, clientSecret, payload)

          if (!client) {
            res.status(401).send('Unauthorized: Invalid client credentials')
            return
          }

          const cookies: Array<{ name: string; value: string }> | undefined = headers.cookie
            ?.split(';')
            .map((cookie: string) => cookie.trim())
            .map((cookie: string) => {
              const [name, value] = cookie.split('=')
              return { name, value }
            })

          const token =
            rftoken ||
            cookies?.find(cookie => cookie.name === `${payload.config.cookiePrefix}-refresh`)?.value

          if (!token) {
            res.status(400).send('Bad Request: Missing refresh token')
            return
          }

          const [sessionId, userId, expiration] = payload.decrypt(String(token)).split('::')

          const expiresAt = new Date(Number(expiration))

          if (expiresAt < new Date(Date.now())) {
            res.status(401).send('Unauthorized: Token expired')
            return
          }

          const user = (await payload.findByID({
            collection: config.endpointCollection.slug,
            id: userId,
            depth: 1,
          })) as MaybeUser

          if (!user) {
            res.status(404).send('User not Found')
            return
          }

          const session = user.oAuth.sessions?.find(ses => ses.id === sessionId)

          if (!session) {
            res.status(404).send('No active session found')
            return
          }

          const sessionAppId = typeof session.app === 'string' ? session.app : session.app.id

          if (sessionAppId !== client.id) {
            res.status(401).send('Unauthorized: Invalid client credentials')
            return
          }

          const { expiresIn, accessToken } = generateAccessToken({
            user,
            payload,
            collection: config.endpointCollection,
            sessionId,
          })

          const collectionAuthConfig = config.endpointCollection.auth as IncomingAuthType

          if (client.enableCookies) {
            // Set cookie
            res.cookie(`${payload.config.cookiePrefix}-token`, accessToken, {
              path: '/',
              httpOnly: true,
              expires: getCookieExpiration(collectionAuthConfig.tokenExpiration || 60 * 60),
              secure: collectionAuthConfig.cookies?.secure,
              sameSite: collectionAuthConfig.cookies?.sameSite,
              domain: collectionAuthConfig.cookies?.domain || undefined,
            })
          }

          res.send({
            accessToken,
            accessExpiration: expiresIn,
          })
        } catch (error) {
          // req.payload.logger.error(error)
          const message = String(error).includes('Invalid initialization vector')
            ? 'Bad Request: Refresh Token not valid'
            : 'Internal Server Error'
          res.status(500).send(message)
        }
      },
    },
  ]
}
