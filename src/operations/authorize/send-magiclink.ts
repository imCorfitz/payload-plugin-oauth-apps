import isLocked from 'payload/dist/auth/isLocked'
import { AuthenticationError, LockedAuth } from 'payload/dist/errors'
import { initTransaction } from 'payload/dist/utilities/initTransaction'
import { killTransaction } from 'payload/dist/utilities/killTransaction'
import type { Collection, PayloadRequest } from 'payload/types'

import { sentence, setAdjectives, setNouns, setTemplates } from '../../lib/txtgen'
import type { GenericUser } from '../../types'
import { type OAuthApp, type OperationConfig } from '../../types'
import generateAuthCode from '../../utils/generate-auth-code'

export interface Result {
  exp?: number
  code?: string
  verificationPhrase?: string
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
  const args = incomingArgs

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

    const user = await payload.db.findOne<GenericUser>({
      collection: collectionConfig.slug,
      req,
      where: { email: { equals: email.toLowerCase() } },
    })

    if (!user || (args.collection.config.auth.verify && user._verified === false)) {
      throw new AuthenticationError(req.t)
    }

    if (user && isLocked(Number(user.lockUntil))) {
      throw new LockedAuth(req.t)
    }

    setTemplates([config.authorization?.verificationPhraseTemplate || '{{ adjective }} {{ noun }}'])

    if (
      config.authorization?.verificationPhraseAdjectives &&
      config.authorization?.verificationPhraseAdjectives?.length > 0
    ) {
      setAdjectives(config.authorization?.verificationPhraseAdjectives)
    }

    if (
      config.authorization?.verificationPhraseNouns &&
      config.authorization?.verificationPhraseNouns?.length > 0
    ) {
      setNouns(config.authorization?.verificationPhraseNouns)
    }

    const verificationPhrase = sentence(true, true)

    const authCode = generateAuthCode(
      12,
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
    )

    const exp = new Date(
      Date.now() + (config.authorization?.magicLinkExpiration || 60 * 60 * 2) * 1000,
    ).getTime() // 2 hours

    const token = payload.encrypt(`${user.id}::${authCode}::${exp}::${client.id}`)
    const magiclink = `${payload.config.serverURL}/api/${collectionConfig.slug}/oauth/verify-magiclink?email=${user.email}&token=${token}`

    let html = `<p>We have received a login attempt with the following code:</p>
    <p style="font-weight: bold; text-align: center; padding: 4px; background-color: #eaeaea;">${verificationPhrase}</p>
    <p>To complete the login process, please click on following link:</p>
    <p><a style="word-break: break-all;" href="${magiclink}">${magiclink}</a></p>
    <p>&nbsp;</p>
    <p>If you didn't attempt to log in but received this email, please ignore this email.</p>`
    let subject = 'Login verification'

    if (client.settings?.customizeMagiclinkEmail) {
      // Clone client and remove sensitive data
      const emailClient: Partial<OAuthApp> = { ...client }
      delete emailClient.credentials
      delete emailClient.id

      const variables: Record<string, string> = {
        email,
        magiclink,
        token,
        verificationPhrase,
        ...(await config.authorization?.generateEmailVariables?.({
          req,
          variables: {
            __method: 'magiclink',
            magiclink,
            token,
          },
          user,
          client: emailClient as Omit<OAuthApp, 'id' | 'credentials'>,
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

    sendEmail({
      from: `"${emailOptions.fromName}" <${emailOptions.fromAddress}>`,
      to: email,
      subject,
      html,
    })

    if (shouldCommit && req.transactionID) await payload.db.commitTransaction?.(req.transactionID)

    return {
      code: authCode,
      exp,
      verificationPhrase,
    }
  } catch (error: unknown) {
    await killTransaction(req)
    throw error
  }
}

export default sendOtp
