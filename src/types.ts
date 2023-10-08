import type { PayloadHandler } from 'payload/config'
import type { CollectionConfig } from 'payload/dist/collections/config/types'
import type { FieldAccess } from 'payload/types'

export interface PluginConfig {
  userCollections: string[]
  adminCollection?: string
  oAuthGroupAccessControl?: {
    read?: FieldAccess<
      {
        id: string
      },
      unknown
    >
    create?: FieldAccess<
      {
        id: string
      },
      unknown
    >
    update?: FieldAccess<
      {
        id: string
      },
      unknown
    >
  }
  authorizationMethod?: 'credentials' | 'passwordless' | 'magiclink' | 'custom'
  customAuthorizationHandler?: EndpointHandler
  refreshTokenExpiration?: number
}

export interface GenericUser {
  id: string
  email: string
  oAuth: {
    __authCode?: string
    sessions?: {
      app: string | { id: string }
      userAgent?: string
      expiresAt: Date
      lastUsedAt: Date
      createdAt: Date
      id: string
    }[]
  }
  [key: string]: unknown
}

export type MaybeUser = GenericUser | null | undefined

export interface OAuthApp {
  id: string
  applicationName: string
  description: string
  homepageUrl: string
  callbackUrl: string
  credentials?: {
    clientId?: string
    clientSecret?: string
  }
}

export interface EndpointConfig extends PluginConfig {
  endpointCollection: CollectionConfig
}

export type EndpointHandler = (config: EndpointConfig) => PayloadHandler | PayloadHandler[]
