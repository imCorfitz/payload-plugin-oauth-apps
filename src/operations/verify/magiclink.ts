import httpStatus from 'http-status'
import { APIError } from 'payload/dist/errors'
import { initTransaction } from 'payload/dist/utilities/initTransaction'
import { killTransaction } from 'payload/dist/utilities/killTransaction'
import type { Collection, PayloadRequest } from 'payload/types'

import type { OAuthApp, OperationConfig } from '../../types'

export interface Result {
  callbackUrl: string
}

export interface Arguments {
  collection: Collection
  data: {
    token: string
  }
  req: PayloadRequest
  res?: Response
  config: OperationConfig
}

async function verifyMagiclink(incomingArgs: Arguments): Promise<Result> {
  let args = incomingArgs

  const {
    collection: { config: collectionConfig },
    data,
    req,
    req: { payload },
  } = args

  try {
    const shouldCommit = await initTransaction(req)

    const { token } = data

    if (!token) {
      throw new APIError('Bad Request: Missing token', httpStatus.BAD_REQUEST)
    }

    const [userId, authCode, exp, clientId] = payload.decrypt(String(token)).split('::')

    if (!userId || !authCode || !exp || !clientId) {
      throw new APIError('Bad Request: Invalid token', httpStatus.BAD_REQUEST)
    }

    if (parseInt(exp) < Date.now()) {
      throw new APIError('Unauthorized: Expired token', httpStatus.UNAUTHORIZED)
    }

    const user = await payload.db.findOne<any>({
      collection: collectionConfig.slug,
      req,
      where: { id: { equals: userId } },
    })

    if (!user) {
      throw new APIError('Unauthorized: Invalid token', httpStatus.UNAUTHORIZED)
    }

    const magiclinks = JSON.parse(user.oAuth._magiclinks || '[]').filter(
      (o: { exp: number }) => o.exp > Date.now(), // Remove expired magiclinks
    )

    // Check if the token already has been verified once before.
    const linkIndex = magiclinks.findIndex((o: { code: string }) => o.code === authCode)

    // If link exists already, throw error
    if (linkIndex !== -1) {
      // Token has already been used
      throw new APIError('Unauthorized: Invalid token', httpStatus.UNAUTHORIZED)
    }

    const client = (await payload.db.findOne<any>({
      collection: 'oAuthApps',
      req,
      where: { id: { equals: clientId } },
    })) as OAuthApp

    if (!client) {
      throw new APIError('Unauthorized: Invalid token', httpStatus.UNAUTHORIZED)
    }

    await payload.db.updateOne({
      collection: collectionConfig.slug,
      req,
      id: user.id,
      data: {
        oAuth: {
          ...user.oAuth,
          _magiclinks: JSON.stringify([
            ...magiclinks,
            {
              exp,
              code: authCode,
              app: client.id,
              claimed: false,
            },
          ]),
        },
      },
    })

    const result: Result = {
      callbackUrl: client.callbackUrl,
    }

    if (shouldCommit && req.transactionID) await payload.db.commitTransaction?.(req.transactionID)

    return result
  } catch (error: unknown) {
    await killTransaction(req)
    throw error
  }
}

export default verifyMagiclink
