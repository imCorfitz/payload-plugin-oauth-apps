import type { PayloadHandler } from 'payload/config'

import type { OperationConfig } from '../../../types'

const handler: (config: OperationConfig) => PayloadHandler = () => (req, res) => {
  const method = req.method
  res.send(`Hello World - ${method}`)
}

export default handler
