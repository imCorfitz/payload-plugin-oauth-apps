import isLocked from 'payload/dist/auth/isLocked'
import { AuthenticationError, LockedAuth } from 'payload/dist/errors'
import { initTransaction } from 'payload/dist/utilities/initTransaction'
import { killTransaction } from 'payload/dist/utilities/killTransaction'
import type { Collection, PayloadRequest } from 'payload/types'

import type { GenericUser, OAuthApp, OperationConfig } from '../../types'
import generateAuthCode from '../../utils/generate-auth-code'

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

async function sendOtp(incomingArgs: Arguments): Promise<void> {
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

    let user = await payload.db.findOne({
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

    let authCode = generateAuthCode()

    // Allow config to override auth code
    if (typeof config.authorization?.generateOTP === 'function') {
      authCode = await config.authorization.generateOTP({
        req,
        user,
      })
    }

    const exp = new Date(Date.now() + (config.authorization?.otpExpiration || 600) * 1000).getTime() // 10 minutes

    const otps = JSON.parse(user.oAuth._otp || '[]').filter(
      (otp: { exp: number }) => otp.exp > Date.now(), // Remove expired OTPs
    )

    user = (await req.payload.db.updateOne({
      id: user.id,
      collection: config.endpointCollection.slug,
      req,
      data: {
        oAuth: {
          ...user.oAuth,
          _otp: JSON.stringify([
            ...otps,
            {
              otp: authCode,
              exp,
              app: client.id,
            },
          ]),
        },
      },
    })) as GenericUser

    let html = `<p>Here is your one-time password: ${authCode}</p>`
    let subject = 'Your one-time password'

    if (client.settings?.customizeOtpEmail) {
      const variables: Record<string, string> = {
        email,
        otp: authCode,
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
      if (client.settings?.otpEmail) {
        html = client.settings.otpEmail.replace(
          /{{\s*([^}]+)\s*}}/g,
          (_, variable) => variables[variable.trim()] || '',
        )
      }

      if (client.settings?.otpEmailSubject) {
        subject = client.settings.otpEmailSubject.replace(
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
  } catch (error: unknown) {
    await killTransaction(req)
    throw error
  }
}

export default sendOtp
