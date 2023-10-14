import type { PayloadHandler } from 'payload/config'

import type { EndpointConfig } from '../../../types'

const handler: (config: EndpointConfig) => PayloadHandler = () => (req, res) => {
  const method = req.method
  res.send(`Hello World - ${method}`)
}

export default handler
