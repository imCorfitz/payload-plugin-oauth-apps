import httpStatus from 'http-status'
import type { PayloadHandler } from 'payload/config'

import sendOtp from '../../../operations/authorize/send-otp'
import type { OperationConfig } from '../../../types'
import verifyClientCredentials from '../../../utils/verify-client-credentials'

const handler: (config: OperationConfig) => PayloadHandler = config => async (req, res) => {
  const { payload } = req

  const collection = payload.collections[config.endpointCollection.slug]

  const { email, clientId, clientSecret } = req.body as {
    email?: string
    clientId?: string
    clientSecret?: string
  }

  if (!email || !clientId || !clientSecret) {
    res.status(httpStatus.BAD_REQUEST).send('Bad Request: Missing required fields')
    return
  }

  // Validate the client credentials
  const client = await verifyClientCredentials(clientId, clientSecret, payload)

  if (!client) {
    res.status(401).send('Unauthorized: Invalid client credentials')
    return
  }

  await sendOtp({
    client,
    collection,
    config,
    data: {
      email,
    },
    req,
    res: res as unknown as Response,
  })

  res.send({
    message: 'OTP sent',
  })
}

export default handler
