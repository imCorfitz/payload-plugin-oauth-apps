import type { PayloadHandler } from 'payload/config'

import type { EndpointConfig, GenericUser } from '../../../types'
import generateAuthCode from '../../../utils/generate-auth-code'
import verifyClientCredentials from '../../../utils/verify-client-credentials'

const handler: (config: EndpointConfig) => PayloadHandler = config => async (req, res) => {
  const { payload } = req

  const { sendEmail, emailOptions } = payload

  const { email, clientId, clientSecret } = req.body as {
    email?: string
    clientId?: string
    clientSecret?: string
  }

  if (!email || !clientId || !clientSecret) {
    res.status(400).send('Bad Request')
    return
  }

  // Validate the client credentials
  const client = await verifyClientCredentials(clientId, clientSecret, payload)

  if (!client) {
    res.status(401).send('Unauthorized: Invalid client credentials')
    return
  }

  let user = (
    await payload.find({
      collection: config.endpointCollection.slug,
      depth: 1,
      limit: 1,
      showHiddenFields: true,
      where: { email: { equals: email.toLowerCase() } },
    })
  ).docs[0] as GenericUser | null

  if (!user) {
    // No such user
    res.status(401).send('Unauthorized: Invalid user credentials')
    return
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

  user = (await payload.update({
    id: user.id,
    collection: config.endpointCollection.slug,
    data: {
      oAuth: {
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

  res.send({
    message: 'OTP sent',
  })
}

export default handler
