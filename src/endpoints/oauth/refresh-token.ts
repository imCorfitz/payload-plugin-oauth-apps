import type { Endpoint } from 'payload/config'
import type { IncomingAuthType } from 'payload/dist/auth'
import getCookieExpiration from 'payload/dist/utilities/getCookieExpiration'
import generateAccessToken from '../../token/generate-access-token'
// Types
import type { EndpointConfig, MaybeUser } from '../../types'
import verifyClientCredentials from '../../utils/verify-client-credentials'

export const refreshToken: (endpointConfig: EndpointConfig) => Endpoint[] = endpointConfig => {
  return [
    {
      path: '/refresh-token',
      method: 'post',
      handler: (_req, res) => {
        res.status(404).send('Not Found. Use /oauth/refresh-token instead.')
      },
    },
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

          const cookies: { name: string; value: string }[] | undefined = headers.cookie
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

          const user: MaybeUser = await payload.findByID({
            collection: endpointConfig.endpointCollection.slug,
            id: userId,
            depth: 1,
          })

          if (!user) {
            res.status(404).send('User not Found')
            return
          }

          const session = user.oAuth.sessions?.find(ses => ses.id === sessionId)

          if (!session) {
            res.status(404).send('No active session found')
            return
          }

          const { expiresIn, accessToken } = generateAccessToken({
            user,
            payload,
            collection: endpointConfig.endpointCollection,
            sessionId,
          })

          const collectionAuthConfig = endpointConfig.endpointCollection.auth as IncomingAuthType

          // Set cookie
          res.cookie(`${payload.config.cookiePrefix}-token`, accessToken, {
            path: '/',
            httpOnly: true,
            expires: getCookieExpiration(collectionAuthConfig.tokenExpiration || 60 * 60),
            secure: collectionAuthConfig.cookies?.secure,
            sameSite: collectionAuthConfig.cookies?.sameSite,
            domain: collectionAuthConfig.cookies?.domain || undefined,
          })

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
