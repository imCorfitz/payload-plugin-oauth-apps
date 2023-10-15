import httpStatus from 'http-status'
import type { PayloadHandler } from 'payload/config'

import login from '../../../operations/authorize/login'
import type { OperationConfig } from '../../../types'
import verifyClientCredentials from '../../../utils/verify-client-credentials'

const handler: (config: OperationConfig) => PayloadHandler = config => async (req, res, next) => {
  try {
    const { payload } = req

    const collection = payload.collections[config.endpointCollection.slug]

    const { email, password, clientId, clientSecret } = req.body as {
      email?: string
      password?: string
      clientId?: string
      clientSecret?: string
    }

    if (!email || !password || !clientId || !clientSecret) {
      res.status(httpStatus.BAD_REQUEST).send('Bad Request: Missing required fields')
      return
    }

    // Validate the client credentials
    const client = await verifyClientCredentials(clientId, clientSecret, payload)

    if (!client) {
      res.status(httpStatus.UNAUTHORIZED).send('Unauthorized: Invalid client credentials')
      return
    }

    const result = await login({
      collection,
      req,
      res: res as unknown as Response,
      data: {
        email,
        password,
      },
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
