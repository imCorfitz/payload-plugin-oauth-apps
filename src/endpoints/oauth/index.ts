import type { Endpoint } from 'payload/config'

import type { OperationConfig } from '../../types'
import { authorize } from './authorize'
import { logout } from './logout'
import { refreshToken } from './refresh-token'
import { verify } from './verify'

export const oAuthEndpoints: (endpointConfig: OperationConfig) => Endpoint[] = endpointConfig => {
  return [
    ...authorize(endpointConfig),
    ...refreshToken(endpointConfig),
    ...verify(endpointConfig),
    ...logout(endpointConfig),
  ]
}
