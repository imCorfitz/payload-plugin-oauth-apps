import type { Endpoint } from 'payload/config'

import type { OperationConfig } from '../../types'
import verifyOtpHandler from '../handlers/verify/otp'

export const verify: (config: OperationConfig) => Endpoint[] = config => {
  return [
    {
      path: '/oauth/verify-otp',
      method: 'post',
      handler: verifyOtpHandler(config),
    },
  ]
}
