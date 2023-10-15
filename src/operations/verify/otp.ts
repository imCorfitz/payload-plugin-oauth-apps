import httpStatus from 'http-status'
import isLocked from 'payload/dist/auth/isLocked'
import unlock from 'payload/dist/auth/operations/unlock'
import { APIError, AuthenticationError, LockedAuth } from 'payload/dist/errors'
import { initTransaction } from 'payload/dist/utilities/initTransaction'
import { killTransaction } from 'payload/dist/utilities/killTransaction'
import sanitizeInternalFields from 'payload/dist/utilities/sanitizeInternalFields'
import type { Collection, PayloadRequest } from 'payload/types'

import generateAccessToken from '../../token/generate-access-token'
import generateRefreshToken from '../../token/generate-refresh-token'
import type { GenericUser, OAuthApp, OperationConfig } from '../../types'

export interface Result {
  exp?: number
  token?: string
  refreshToken?: string
  refreshExp?: number
}

export interface Arguments {
  collection: Collection
  data: {
    email: string
    otp: string
  }
  req: PayloadRequest
  res?: Response
  config: OperationConfig
  client: OAuthApp
}

async function verifyOtp(incomingArgs: Arguments): Promise<Result> {
  let args = incomingArgs

  const {
    collection: { config: collectionConfig },
    data,
    req,
    req: { payload },
    client,
    config,
  } = args

  try {
    const shouldCommit = await initTransaction(req)

    const { email: unsanitizedEmail, otp } = data

    const email = unsanitizedEmail.toLowerCase().trim()

    let user = await payload.db.findOne<any>({
      collection: collectionConfig.slug,
      req,
      where: { email: { equals: email.toLowerCase() } },
    })

    if (!user || (args.collection.config.auth.verify && user._verified === false)) {
      throw new AuthenticationError(req.t)
    }

    if (user && isLocked(user.lockUntil)) {
      throw new LockedAuth(req.t)
    }

    const otps = JSON.parse(user.oAuth._otp || '[]').filter(
      (o: { exp: number }) => o.exp > Date.now(), // Remove expired OTPs
    )

    const otpIndex = otps.findIndex((o: { otp: string }) => o.otp === otp)

    if (otpIndex === -1) {
      throw new APIError('Invalid OTP', httpStatus.UNAUTHORIZED)
    }

    const remainingOTPs = otps.filter((o: { otp: string }) => o.otp !== otp)

    user = (await payload.update({
      id: user.id,
      collection: config.endpointCollection.slug,
      depth: 1,
      data: {
        oAuth: {
          ...user.oAuth,
          _otp: JSON.stringify(remainingOTPs),
        },
      },
    })) as GenericUser

    user = sanitizeInternalFields(user)

    const maxLoginAttemptsEnabled = args.collection.config.auth.maxLoginAttempts > 0

    if (maxLoginAttemptsEnabled) {
      await unlock({
        collection: {
          config: collectionConfig,
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
      throw new APIError('Unable to generate refresh token', httpStatus.INTERNAL_SERVER_ERROR)
    }

    const { expiresIn, accessToken } = generateAccessToken({
      user,
      payload,
      collection: collectionConfig,
      sessionId: refreshData.sessionId,
    })

    const result: Result = {
      exp: expiresIn,
      token: accessToken,
      refreshToken: refreshData.refreshToken,
      refreshExp: refreshData.expiresIn,
    }

    if (shouldCommit && req.transactionID) await payload.db.commitTransaction?.(req.transactionID)

    return result
  } catch (error: unknown) {
    await killTransaction(req)
    throw error
  }
}

export default verifyOtp
