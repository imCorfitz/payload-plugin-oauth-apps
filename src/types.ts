import type { PayloadHandler } from 'payload/config'
import type { CollectionConfig } from 'payload/dist/collections/config/types'
import type { FieldAccess, PayloadRequest } from 'payload/types'

export interface PluginConfig {
  userCollections: string[]
  access?: {
    sessions?: {
      read?: FieldAccess<{ id: string }, unknown>
      create?: FieldAccess<{ id: string }, unknown>
      update?: FieldAccess<{ id: string }, unknown>
    }
  }
  authorization?: {
    method?: 'credentials' | 'otp' | 'magiclink' | 'custom'
    customHandler?: EndpointHandler
    otpExpiration?: number
    generateOTP?: (args?: { req?: PayloadRequest; user?: unknown }) => string | Promise<string>
    generateEmailHTML?: (args?: {
      req?: PayloadRequest
      token?: string
      user?: unknown
    }) => string | Promise<string>
    generateEmailSubject?: (args?: {
      req?: PayloadRequest
      token?: string
      user?: unknown
    }) => string | Promise<string>
  }
  sessions?: {
    limit?: number
    ipinfoApiKey?: string
    fetchLocationInfo?: (args?: {
      req?: PayloadRequest
      ip?: string
    }) => Record<string, unknown> | Promise<Record<string, unknown>>
    refreshTokenExpiration?: number
  }
}

export interface GenericUser {
  id: string
  email: string
  oAuth: {
    _otp?: string
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
  enableCookies: boolean
  credentials?: {
    clientId?: string
    clientSecret?: string
  }
}

export interface EndpointConfig extends PluginConfig {
  endpointCollection: CollectionConfig
}

export type EndpointHandler = (config: EndpointConfig) => PayloadHandler | PayloadHandler[]
