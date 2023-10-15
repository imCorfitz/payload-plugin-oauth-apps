import type { Payload } from 'payload'

export const seed = async (payload: Payload): Promise<void> => {
  payload.logger.info('Seeding data...')

  await payload.create({
    collection: 'users',
    data: {
      email: 'dev@payloadcms.com',
      password: '1234',
      oAuthManager: true,
    },
  })

  await payload.create({
    collection: 'oAuthApps',
    data: {
      applicationName: 'My Front-end App',
      description: "This is my front-end app's description",
      homepageUrl: 'http://localhost:3000',
      callbackUrl: 'http://localhost:3000/auth/callback',
      credentials: {
        clientId: `CI_8da98ef44d877f6e50abeab6cc665e01350d5281abc6a509d8253f9f2b88608e`,
        clientSecret: `CS_b3aaedc04ec3d944499d4108f1d9342c368672aced6ce625614d5e5410ade95d`,
      },
      settings: {
        customizeOtpEmail: false,
        otpEmail: `<p>This is using a custom email using variables.</p><p>Your one-time password is: {{otp}}</p>`,
        otpEmailSubject: 'Your one-time password is {{otp}}',
        customizeMagiclinkEmail: false,
        magiclinkEmail: `<p>This is using a custom email using variables.</p><p>Click <a href="{{magiclink}}">here</a> to log in.</p>`,
        magiclinkEmailSubject: 'Verify login request',
      },
    },
  })

  // Add additional seed data here
}
