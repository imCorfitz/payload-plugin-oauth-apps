import type { Collection, PayloadRequest } from 'payload/types'
import type { AfterLogoutHook } from 'payload/dist/collections/config/types'
import type { IncomingAuthType } from 'payload/dist/auth'
import type { EndpointConfig, GenericUser } from '../types'

export interface Arguments {
  collection: Collection
  req: PayloadRequest
  res?: Response
  token: string
}

export const afterLogoutHook: (config: EndpointConfig) => AfterLogoutHook =
  config => async args => {
    const { req, res } = args

    const { headers, payload } = req

    const cookies: { name: string; value: string }[] | undefined = headers.cookie
      ?.split(';')
      .map((cookie: string) => cookie.trim())
      .map((cookie: string) => {
        const [name, value] = cookie.split('=')
        return { name, value }
      })

    const token = cookies?.find(
      cookie => cookie.name === `${payload.config.cookiePrefix}-refresh`,
    )?.value

    if (token) {
      const [sessionId, userId] = payload.decrypt(String(token)).split('::')

      const user = (await payload.findByID({
        collection: config.endpointCollection.slug,
        id: userId,
        depth: 0,
      })) as GenericUser

      await payload.update({
        collection: config.endpointCollection.slug,
        id: userId,
        data: {
          oAuth: {
            ...user.oAuth,
            sessions: [...(user.oAuth.sessions || []).filter(session => session.id !== sessionId)],
          },
        },
      })

      const collectionAuthConfig = config.endpointCollection.auth as IncomingAuthType

      res.clearCookie(`${payload.config.cookiePrefix}-refresh`, {
        domain: undefined,
        httpOnly: true,
        path: '/',
        sameSite: collectionAuthConfig.cookies?.sameSite,
        secure: collectionAuthConfig.cookies?.secure,
      })
      return
    }

    return args // return modified operation arguments as necessary
  }
