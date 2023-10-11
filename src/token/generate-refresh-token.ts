import type { IPinfo } from 'node-ipinfo'
import IPinfoWrapperClass from 'node-ipinfo'
import type { PayloadRequest } from 'payload/types'

import type { EndpointConfig, GenericUser, OAuthApp } from '../types'

interface RefreshTokenProps {
  req: PayloadRequest
  app: OAuthApp
  user: GenericUser
  config: EndpointConfig
}

export default async function generateRefreshToken({ app, req, user, config }: RefreshTokenProps) {
  const { payload } = req
  const { endpointCollection: collection, sessions } = config
  const { refreshTokenExpiration, limit } = sessions || {}

  const expiresIn = refreshTokenExpiration || 60 * 60 * 24 * 30

  const userAgent = req.headers['user-agent']
  const detectedIp = String(
    (req.headers['x-forwarded-for'] || req.socket.remoteAddress) ?? '81.38.224.102',
  ).split(',')[0]

  let location

  if (config.sessions?.ipinfoApiKey && typeof config.sessions.fetchLocationInfo !== 'function') {
    try {
      const ipinfoWrapper = new IPinfoWrapperClass(config.sessions.ipinfoApiKey)

      let ipInfo: IPinfo | undefined
      if (detectedIp) ipInfo = await ipinfoWrapper.lookupIp(detectedIp)

      location = ipInfo
    } catch (error) {
      payload.logger.error(error)
    }
  }

  if (typeof config.sessions?.fetchLocationInfo === 'function') {
    const locationInfo = await config.sessions.fetchLocationInfo({ req, ip: detectedIp })
    location = locationInfo
  }

  let currentSessions = (user.oAuth.sessions || [])
    .map(session => {
      return {
        ...session,
        app: (session.app as { id: string }).id,
      }
    })
    .filter(session => {
      // Filter out expired sessions
      return new Date(session.expiresAt).getTime() > Date.now()
    })

  if (limit && currentSessions.length >= limit) {
    const sortedSessions = currentSessions.sort(
      (a, b) => new Date(a.lastUsedAt).getTime() - new Date(b.lastUsedAt).getTime(),
    )
    currentSessions = sortedSessions.slice(1, limit)
  }

  const expiresAt = new Date(Date.now() + expiresIn * 1000)

  // Create new session for the user
  const updatedUser = (await payload.update({
    collection: collection.slug,
    id: user.id,
    data: {
      oAuth: {
        sessions: [
          ...currentSessions,
          {
            app: app.id,
            userAgent,
            createdAt: new Date(Date.now()),
            lastUsedAt: new Date(Date.now()),
            location,
            expiresAt,
          },
        ],
      },
    },
  })) as NonNullable<GenericUser>

  const session = updatedUser.oAuth.sessions?.find(
    ses => currentSessions.findIndex(s => s.app === ses.app) === -1,
  )

  if (!session) return null

  const refreshToken = payload.encrypt(`${session.id}::${user.id}::${expiresAt.getTime()}`)

  return {
    refreshToken,
    sessionId: session.id,
    expiresIn,
  }
}
