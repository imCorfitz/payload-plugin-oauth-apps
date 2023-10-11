import type { PayloadHandler } from 'payload/config'
import getCookieExpiration from 'payload/dist/utilities/getCookieExpiration'
import isLocked from 'payload/dist/auth/isLocked'
import sanitizeInternalFields from 'payload/dist/utilities/sanitizeInternalFields'
import { AuthenticationError, LockedAuth } from 'payload/dist/errors'
import { authenticateLocalStrategy } from 'payload/dist/auth/strategies/local/authenticate'
import { incrementLoginAttempts } from 'payload/dist/auth/strategies/local/incrementLoginAttempts'
import unlock from 'payload/dist/auth/operations/unlock'
import generateAccessToken from '../../../token/generate-access-token'
import generateRefreshToken from '../../../token/generate-refresh-token'
import type { EndpointConfig } from '../../../types'
import verifyClientCredentials from '../../../utils/verify-client-credentials'

const handler: (config: EndpointConfig) => PayloadHandler = config => async (req, res) => {
  const { payload } = req

  const collection = payload.collections[config.endpointCollection.slug]

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

  let user = await payload.db.findOne<any>({
    collection: collection.config.slug,
    req,
    where: { email: { equals: email.toLowerCase() } },
  })

  if (!user || (collection.config.auth.verify && user._verified === false)) {
    throw new AuthenticationError(req.t)
  }

  if (user && isLocked(user.lockUntil)) {
    throw new LockedAuth(req.t)
  }

  const authResult = await authenticateLocalStrategy({ doc: user, password })

  user = sanitizeInternalFields(user)

  const maxLoginAttemptsEnabled = (collection.config.auth.maxLoginAttempts || 0) > 0

  if (!authResult) {
    if (maxLoginAttemptsEnabled) {
      await incrementLoginAttempts({
        collection: collection.config,
        doc: user,
        payload: req.payload,
        req,
      })
    }

    throw new AuthenticationError(req.t)
  }

  if (maxLoginAttemptsEnabled) {
    await unlock({
      collection: {
        config: collection.config,
      },
      data: {
        email,
      },
      overrideAccess: true,
      req,
    })
  }

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
    collection: collection.config,
    sessionId: refreshData.sessionId,
  })

  if (client.enableCookies) {
    // Set cookie
    res.cookie(`${payload.config.cookiePrefix}-token`, accessToken, {
      path: '/',
      httpOnly: true,
      expires: getCookieExpiration(collection.config.auth.tokenExpiration || 60 * 60),
      secure: collection.config.auth.cookies.secure,
      sameSite: collection.config.auth.cookies.sameSite,
      domain: collection.config.auth.cookies.domain || undefined,
    })

    // Set cookie
    res.cookie(`${payload.config.cookiePrefix}-refresh`, refreshData.refreshToken, {
      path: '/',
      httpOnly: true,
      expires: getCookieExpiration(refreshData.expiresIn),
      secure: collection.config.auth.cookies.secure,
      sameSite: collection.config.auth.cookies.sameSite,
      domain: collection.config.auth.cookies.domain || undefined,
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
