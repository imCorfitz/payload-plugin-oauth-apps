import type { Endpoint } from 'payload/config'
import type { IncomingAuthType } from 'payload/dist/auth'
import getCookieExpiration from 'payload/dist/utilities/getCookieExpiration'
import generateAccessToken from '../../token/generate-access-token'
import generateRefreshToken from '../../token/generate-refresh-token'
// Types
import type { EndpointConfig, GenericUser } from '../../types'
import verifyClientCredentials from '../../utils/verify-client-credentials'

export const verify: (config: EndpointConfig) => Endpoint[] = config => {
  return [
    {
      path: '/oauth/verify-otp',
      method: 'post',
      async handler(req, res) {
        try {
          const { payload } = req

          const { otp, email, clientId, clientSecret } = req.body as {
            otp?: string
            email?: string
            clientId?: string
            clientSecret?: string
          }

          if (!otp) {
            res.status(400).send('Bad Request: Missing OTP')
            return
          }

          if (!email) {
            res.status(400).send('Bad Request: Missing email')
            return
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

          let user = (
            await payload.find({
              collection: config.endpointCollection.slug,
              depth: 1,
              limit: 1,
              showHiddenFields: true,
              where: { email: { equals: email.toLowerCase() } },
            })
          ).docs[0] as GenericUser | null

          if (!user) {
            // No such user
            res.status(401).send('Unauthorized: Invalid user credentials')
            return
          }

          const otps = JSON.parse(user.oAuth._otp || '[]').filter(
            (o: { exp: number }) => o.exp > Date.now(), // Remove expired OTPs
          )

          const otpIndex = otps.findIndex((o: { otp: string }) => o.otp === otp)

          if (otpIndex === -1) {
            res.status(401).send('Unauthorized: Invalid OTP')
            return
          }

          const remainingOTPs = otps.filter((o: { otp: string }) => o.otp !== otp)

          user = (await payload.update({
            id: user.id,
            collection: config.endpointCollection.slug,
            depth: 1,
            data: {
              oAuth: {
                _otp: JSON.stringify(remainingOTPs),
              },
            },
          })) as GenericUser

          // Generate the token
          const refreshData = await generateRefreshToken({
            app: client,
            user,
            req,
            config,
          })

          if (!refreshData) {
            res.status(500).send('Internal Server Error')
            return
          }

          const { expiresIn, accessToken } = generateAccessToken({
            user,
            payload,
            collection: config.endpointCollection,
            sessionId: refreshData.sessionId,
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

            // Set cookie
            res.cookie(`${payload.config.cookiePrefix}-refresh`, refreshData.refreshToken, {
              path: '/',
              httpOnly: true,
              expires: getCookieExpiration(refreshData.expiresIn),
              secure: collectionAuthConfig.cookies?.secure,
              sameSite: collectionAuthConfig.cookies?.sameSite,
              domain: collectionAuthConfig.cookies?.domain || undefined,
            })
          }

          res.send({
            accessToken,
            accessExpiration: expiresIn,
            refreshToken: refreshData.refreshToken,
            refreshExpiration: refreshData.expiresIn,
          })
        } catch (error) {
          req.payload.logger.error(error)
          res.status(500).send('Internal Server Error')
        }
      },
    },
  ]
}
