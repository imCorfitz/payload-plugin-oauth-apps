import httpStatus from 'http-status'
import isLocked from 'payload/dist/auth/isLocked'
import unlock from 'payload/dist/auth/operations/unlock'
import { authenticateLocalStrategy } from 'payload/dist/auth/strategies/local/authenticate'
import { incrementLoginAttempts } from 'payload/dist/auth/strategies/local/incrementLoginAttempts'
import { APIError, AuthenticationError, LockedAuth } from 'payload/dist/errors'
import { initTransaction } from 'payload/dist/utilities/initTransaction'
import { killTransaction } from 'payload/dist/utilities/killTransaction'
import sanitizeInternalFields from 'payload/dist/utilities/sanitizeInternalFields'
import type { Collection, PayloadRequest } from 'payload/types'

import generateAccessToken from '../../token/generate-access-token'
import generateRefreshToken from '../../token/generate-refresh-token'
import type { OAuthApp, OperationConfig } from '../../types'

export interface Result {
  exp?: number
  token?: string
  refreshToken?: string
  refreshExp?: number
}

export interface Arguments {
  collection: Collection
  req: PayloadRequest
  res?: Response
  data: {
    email: string
    password: string
  }
  client: OAuthApp
  config: OperationConfig
}

async function login(incomingArgs: Arguments): Promise<Result> {
  let args = incomingArgs

  const {
    collection,
    collection: { config: collectionConfig },
    req,
    req: { payload },
    data,
    client,
    config,
  } = args

  try {
    const shouldCommit = await initTransaction(req)

    const { email: unsanitizedEmail, password } = data

    const email = unsanitizedEmail.toLowerCase().trim()

    let user = await payload.db.findOne({
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

    const authResult = await authenticateLocalStrategy({ doc: user, password })

    user = sanitizeInternalFields(user)

    const maxLoginAttemptsEnabled = args.collection.config.auth.maxLoginAttempts > 0

    if (!authResult) {
      if (maxLoginAttemptsEnabled) {
        await incrementLoginAttempts({
          collection: collectionConfig,
          doc: user,
          payload: req.payload,
          req,
        })
      }

      throw new AuthenticationError(req.t)
    }

    if (maxLoginAttemptsEnabled) {
      await unlock({
        collection,
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

export default login
