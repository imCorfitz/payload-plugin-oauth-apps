import httpStatus from 'http-status'
import { decode } from 'jsonwebtoken'
import { APIError } from 'payload/dist/errors'
import { initTransaction } from 'payload/dist/utilities/initTransaction'
import { killTransaction } from 'payload/dist/utilities/killTransaction'
import type { Collection, PayloadRequest } from 'payload/types'

import type { MaybeUser, OperationConfig } from '../../types'

export interface Arguments {
  collection: Collection
  req: PayloadRequest
  res?: Response
  data: {
    refreshToken?: string
    accessToken?: string
  }
  config: OperationConfig
}

async function logout(incomingArgs: Arguments): Promise<void> {
  let args = incomingArgs

  const {
    collection: { config: collectionConfig },
    req,
    req: { payload },
    data,
    config,
  } = args

  try {
    const shouldCommit = await initTransaction(req)
    const { accessToken, refreshToken } = data

    let userId: string | undefined, sessionId: string | undefined

    if (refreshToken) {
      ;[sessionId, userId] = payload.decrypt(String(refreshToken)).split('::')
    }

    if (accessToken) {
      const decoded = decode(accessToken) as { id: string; __ses: string } | null
      if (decoded) {
        userId = decoded.id
        sessionId = decoded.__ses
      }
    }

    if (!userId || !sessionId) {
      throw new APIError('Bad Request: Invalid token', httpStatus.BAD_REQUEST)
    }

    const user = (await payload.db.findOne<any>({
      collection: collectionConfig.slug,
      req,
      where: { id: { equals: userId } },
    })) as MaybeUser

    if (!user) {
      throw new APIError('User not Found', httpStatus.NOT_FOUND)
    }

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

    if (shouldCommit && req.transactionID) await payload.db.commitTransaction?.(req.transactionID)
  } catch (error: unknown) {
    await killTransaction(req)
    throw error
  }
}

export default logout
