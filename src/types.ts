import type { PayloadHandler } from 'payload/config'
import type { User } from 'payload/dist/auth'
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
    customHandlers?: Record<string, EndpointHandler>
    otpExpiration?: number
    generateOTP?: (args?: { req?: PayloadRequest; user?: unknown }) => string | Promise<string>
    generateEmailVariables?: (args?: {
      req?: PayloadRequest
      variables?:
        | {
            __method: 'magiclink'
            token?: string
            magiclink?: string
          }
        | {
            __method: 'otp'
            otp?: string
          }
      user?: unknown
      client?: Omit<OAuthApp, 'credentials' | 'id'>
    }) => Record<string, string> | Promise<Record<string, string>>
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

export interface GenericUser extends User {
  oAuth: {
    _otp?: string
    sessions?: Array<{
      app: string | { id: string }
      userAgent?: string
      expiresAt: Date
      lastUsedAt: Date
      createdAt: Date
      id: string
    }>
  }
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
  settings?: {
    customizeOtpEmail?: boolean
    otpEmail?: string
    otpEmailSubject?: string
    customizeMagiclinkEmail?: boolean
    magiclinkEmail?: string
    magiclinkEmailSubject?: string
  }
}

export interface OperationConfig extends PluginConfig {
  endpointCollection: CollectionConfig
}

export type EndpointHandler = (config: OperationConfig) => PayloadHandler | PayloadHandler[]
