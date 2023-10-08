import type { Payload } from 'payload'
import type { CollectionConfig } from 'payload/types'
import type { GenericUser } from '../types'

interface RefreshTokenProps {
  app: string
  user: GenericUser
  expiration: number
  payload: Payload
  collection: CollectionConfig
  userAgent?: string
}

export default async function generateRefreshToken({
  app,
  user,
  expiration,
  payload,
  collection,
  userAgent,
}: RefreshTokenProps) {
  const currentSessions = (user.oAuth.sessions || []).map(session => {
    return {
      ...session,
      app: (session.app as { id: string }).id,
    }
  })

  const expiresAt = new Date(Date.now() + expiration * 1000)

  // Create new session for the user
  const updatedUser: NonNullable<GenericUser> = await payload.update({
    collection: collection.slug,
    id: user.id,
    data: {
      oAuth: {
        ...user.oAuth,
        sessions: [
          ...currentSessions,
          {
            app,
            userAgent,
            createdAt: new Date(Date.now()),
            lastUsedAt: new Date(Date.now()),
            expiresAt,
          },
        ],
      },
    },
  })

  const session = updatedUser.oAuth.sessions?.find(
    ses => currentSessions.findIndex(s => s.app === ses.app) === -1,
  )

  if (!session) return null

  const refreshToken = payload.encrypt(`${session.id}::${user.id}::${expiresAt.getTime()}`)

  return {
    refreshToken,
    sessionId: session.id,
    expiresAt,
  }
}
