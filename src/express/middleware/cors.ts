import type { Response, NextFunction } from 'express'
import type { PayloadRequest } from 'payload/types'
import type { OAuthApp } from '../../types'

export default async function oAuthCorsHeaders(
  req: PayloadRequest,
  res: Response,
  next: NextFunction,
) {
  const { payload } = req

  const config = payload.config

  if (Array.isArray(config.cors)) {
    const apps = await payload.find({
      collection: 'oAuthApps',
      depth: 0,
    })

    const origins = apps.docs.map((app: OAuthApp) => app.homepageUrl)

    const cors = [...config.cors, ...origins].filter(
      (value, index, self) => self.indexOf(value) === index,
    )

    if (req.headers.origin && cors.includes(req.headers.origin)) {
      res.header('Access-Control-Allow-Credentials', 'true')
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin)
    }
  }

  next()
}
