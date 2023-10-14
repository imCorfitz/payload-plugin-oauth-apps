import APIError from 'payload/dist/errors/APIError'
import type { Collection, CollectionBeforeOperationHook, PayloadRequest } from 'payload/types'

import type { OperationConfig } from '../types'

export interface Arguments {
  collection: Collection
  req: PayloadRequest
  res?: Response
  token: string
}

export const beforeRefreshOperationHook: (
  config: OperationConfig,
) => CollectionBeforeOperationHook =
  () =>
  ({
    args, // original arguments passed into the operation
    operation, // name of the operation
  }) => {
    if (operation === 'refresh') {
      // Only allow server/cms itself to perform these refresh operations

      const {
        req,
        req: { payload },
      } = args as Arguments
      const origin = req.get('Origin')

      if (origin !== payload.config.serverURL)
        throw new APIError(
          'Only Payload CMS can perform refresh operations on this endpoint. Please refer to oauth/refresh-token for OAuth apps.',
          403,
        )

      return args // return modified operation arguments as necessary
    }
  }
