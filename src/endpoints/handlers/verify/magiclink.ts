import httpStatus from 'http-status'
import type { PayloadHandler } from 'payload/config'

import verifyMagiclink from '../../../operations/verify/magiclink'
import type { OperationConfig } from '../../../types'

const handler: (config: OperationConfig) => PayloadHandler = config => async (req, res, next) => {
  try {
    const { payload, method } = req

    const collection = payload.collections[config.endpointCollection.slug]

    let token

    if (method === 'POST') {
      const { token: requestedToken } = req.body as {
        token?: string
      }

      token = requestedToken
    } else if (method === 'GET') {
      const { token: requestedToken } = req.query as {
        token?: string
      }

      token = requestedToken
    }

    if (!token) {
      res.status(httpStatus.BAD_REQUEST).send('Bad Request: Missing token')
      return
    }

    const result = await verifyMagiclink({
      collection,
      config,
      req,
      res: res as unknown as Response,
      data: {
        token,
      },
    })

    if (method === 'GET') {
      res.redirect(result.callbackUrl)
      return
    }

    res.send({
      message: 'Magiclink verified',
    })
  } catch (error: unknown) {
    next(error)
  }
}

export default handler
