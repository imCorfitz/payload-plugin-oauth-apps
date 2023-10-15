import httpStatus from 'http-status'
import type { PayloadHandler } from 'payload/config'

import verifyCode from '../../../operations/verify/code'
import type { OperationConfig } from '../../../types'
import verifyClientCredentials from '../../../utils/verify-client-credentials'

const handler: (config: OperationConfig) => PayloadHandler = config => async (req, res, next) => {
  try {
    const { payload } = req

    const collection = payload.collections[config.endpointCollection.slug]

    const { code, email, clientId, clientSecret } = req.body as {
      code?: string
      email?: string
      clientId?: string
      clientSecret?: string
    }

    if (!code) {
      res.status(httpStatus.BAD_REQUEST).send('Bad Request: Missing code')
      return
    }

    if (!email) {
      res.status(httpStatus.BAD_REQUEST).send('Bad Request: Missing email')
      return
    }

    if (!clientId || !clientSecret) {
      res.status(httpStatus.BAD_REQUEST).send('Bad Request: Missing client credentials')
      return
    }

    // Validate the client credentials
    const client = await verifyClientCredentials(clientId, clientSecret, payload)

    if (!client) {
      res.status(httpStatus.UNAUTHORIZED).send('Unauthorized: Invalid client credentials')
      return
    }

    const result = await verifyCode({
      collection,
      req,
      data: {
        email,
        code,
      },
      res: res as unknown as Response,
      client,
      config,
    })

    res.status(httpStatus.OK).send({
      ...result,
      message: 'Auth Passed',
    })
  } catch (error) {
    next(error)
  }
}

export default handler
