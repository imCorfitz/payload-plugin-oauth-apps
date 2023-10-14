import isLocked from 'payload/dist/auth/isLocked'
import { AuthenticationError, LockedAuth } from 'payload/dist/errors'
import { initTransaction } from 'payload/dist/utilities/initTransaction'
import { killTransaction } from 'payload/dist/utilities/killTransaction'
import type { Collection, PayloadRequest } from 'payload/types'

import type { GenericUser, OAuthApp, OperationConfig } from '../../types'
import generateAuthCode from '../../utils/generate-auth-code'

export interface Result {
  exp?: number
  token?: string
}

export interface Arguments {
  collection: Collection
  req: PayloadRequest
  res?: Response
  data: {
    email: string
  }
  client: OAuthApp
  config: OperationConfig
}

async function sendOtp(incomingArgs: Arguments): Promise<Result> {
  let args = incomingArgs

  const {
    collection: { config: collectionConfig },
    req,
    req: { payload },
    data,
    client,
    config,
  } = args

  try {
    const { sendEmail, emailOptions } = payload

    const shouldCommit = await initTransaction(req)

    const { email: unsanitizedEmail } = data

    const email = unsanitizedEmail.toLowerCase().trim()

    let user = await payload.db.findOne<any>({
      collection: collectionConfig.slug,
      req,
      where: { email: { equals: email.toLowerCase() } },
    })

    if (!user || (args.collection.config.auth.verify && user._verified === false)) {
      throw new AuthenticationError(req.t)
    }

    if (user && isLocked(user.lockUntil)) {
      throw new LockedAuth(req.t)
    }

    const authCode = generateAuthCode(
      16,
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
    )

    // Allow config to override auth code
    // if (typeof config.authorization?.generateOTP === 'function') {
    //   authCode = await config.authorization.generateOTP({
    //     req,
    //     user,
    //   })
    // }

    const exp = new Date(Date.now() + (config.authorization?.otpExpiration || 600) * 1000).getTime() // 10 minutes

    const magiclink = ''

    let html = `<p>Here is your one-time password: ${authCode}</p>`
    let subject = 'Your one-time password'

    if (client.settings?.customizeMagiclinkEmail) {
      const variables: Record<string, string> = {
        email,
        magiclink,
        ...(await config.authorization?.generateEmailVariables?.({
          req,
          variables: {
            __method: 'otp',
            otp: authCode,
          },
          user,
          client,
        })),
      }

      // Replace all variables in the email subject and body {{variable}}
      if (client.settings?.magiclinkEmail) {
        html = client.settings.magiclinkEmail.replace(
          /{{\s*([^}]+)\s*}}/g,
          (_, variable) => variables[variable.trim()] || '',
        )
      }

      if (client.settings?.magiclinkEmailSubject) {
        subject = client.settings.magiclinkEmailSubject.replace(
          /{{\s*([^}]+)\s*}}/g,
          (_, variable) => variables[variable.trim()] || '',
        )
      }
    }

    void sendEmail({
      from: `"${emailOptions.fromName}" <${emailOptions.fromAddress}>`,
      to: email,
      subject,
      html,
    })

    if (shouldCommit && req.transactionID) await payload.db.commitTransaction?.(req.transactionID)

    return {
      token: '',
    }
  } catch (error: unknown) {
    await killTransaction(req)
    throw error
  }
}

export default sendOtp
