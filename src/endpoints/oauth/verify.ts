import type { Endpoint } from 'payload/config'

import type { OperationConfig } from '../../types'
import verifyCodeHandler from '../handlers/verify/code'
import verifyMagiclinkHandler from '../handlers/verify/magiclink'
import verifyOtpHandler from '../handlers/verify/otp'

export const verify: (config: OperationConfig) => Endpoint[] = config => {
  return [
    {
      path: '/oauth/verify-otp',
      method: 'post',
      handler: verifyOtpHandler(config),
    },
    {
      path: '/oauth/verify-magiclink',
      method: 'get',
      handler: verifyMagiclinkHandler(config),
    },
    {
      path: '/oauth/verify-magiclink',
      method: 'post',
      handler: verifyMagiclinkHandler(config),
    },
    {
      path: '/oauth/verify-code',
      method: 'post',
      handler: verifyCodeHandler(config),
    },
  ]
}
