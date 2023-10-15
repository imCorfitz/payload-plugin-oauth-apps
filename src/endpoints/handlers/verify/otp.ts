import httpStatus from 'http-status'
import type { PayloadHandler } from 'payload/config'

import verifyOtp from '../../../operations/verify/otp'
import type { OperationConfig } from '../../../types'
import verifyClientCredentials from '../../../utils/verify-client-credentials'

const handler: (config: OperationConfig) => PayloadHandler = config => async (req, res, next) => {
  try {
    const { payload } = req

    const collection = payload.collections[config.endpointCollection.slug]

    const { otp, email, clientId, clientSecret } = req.body as {
      otp?: string
      email?: string
      clientId?: string
      clientSecret?: string
    }

    if (!otp) {
      res.status(httpStatus.BAD_REQUEST).send('Bad Request: Missing OTP')
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

    const result = await verifyOtp({
      collection,
      req,
      data: {
        email,
        otp,
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
