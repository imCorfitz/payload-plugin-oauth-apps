import type { NextFunction, Response } from 'express'
import type { PayloadRequest } from 'payload/types'

import type { OAuthApp } from '../../types'

export default async function oAuthCsrf(req: PayloadRequest, _res: Response, next: NextFunction) {
  const { payload } = req

  const config = payload.config

  if (Array.isArray(config.csrf)) {
    const apps = (await payload.find({
      collection: 'oAuthApps',
      depth: 0,
    })) as unknown as { docs: OAuthApp[] }

    const origins = apps.docs.map((app: OAuthApp) => app.homepageUrl)

    config.csrf = [...config.csrf, ...origins].filter(
      (value, index, self) => self.indexOf(value) === index,
    )
  }

  next()
}
