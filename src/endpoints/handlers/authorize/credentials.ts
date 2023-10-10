import type { PayloadHandler } from 'payload/config'
import getCookieExpiration from 'payload/dist/utilities/getCookieExpiration'
import type { IncomingAuthType } from 'payload/dist/auth/types'
import generateAccessToken from '../../../token/generate-access-token'
import generateRefreshToken from '../../../token/generate-refresh-token'
import type { EndpointConfig, GenericUser } from '../../../types'
import verifyClientCredentials from '../../../utils/verify-client-credentials'

const handler: (config: EndpointConfig) => PayloadHandler = config => async (req, res) => {
  const { payload } = req

  const { email, password, clientId, clientSecret } = req.body as {
    email?: string
    password?: string
    clientId?: string
    clientSecret?: string
  }

  if (!email || !password || !clientId || !clientSecret) {
    res.status(400).send('Bad Request')
    return
  }

  // Validate the client credentials
  const client = await verifyClientCredentials(clientId, clientSecret, payload)

  if (!client) {
    res.status(401).send('Unauthorized: Invalid client credentials')
    return
  }

  // Validate the user credentials
  const user = await payload.login({
    collection: config.endpointCollection.slug,
    depth: 1,
    data: {
      email,
      password,
    },
  })

  if (!user.user) {
    res.status(401).send('Unauthorized: Invalid user credentials')
    return
  }

  // Generate the token
  const refreshData = await generateRefreshToken({
    app: client,
    user: user.user as GenericUser,
    req,
    config,
  })

  if (!refreshData) {
    res.status(500).send('Internal Server Error')
    return
  }

  const { expiresIn, accessToken } = generateAccessToken({
    user: user.user as GenericUser,
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
}

export default handler
