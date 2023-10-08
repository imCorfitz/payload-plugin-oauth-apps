import type { Endpoint } from 'payload/config'
import type { EndpointConfig } from '../../types'
import { authorize } from './authorize'
import { refreshToken } from './refresh-token'

export const oAuthEndpoints: (endpointConfig: EndpointConfig) => Endpoint[] = endpointConfig => {
  return [...authorize(endpointConfig), ...refreshToken(endpointConfig)]
}
