import type { Payload } from 'payload'
import type { OAuthApp } from '../types'

export default async function verifyClientCredentials(
  clientId: string,
  clientSecret: string,
  payload: Payload,
) {
  // Validate the client credentials
  const client = await payload.find({
    collection: 'oAuthApps',
    limit: 1,
    where: {
      and: [
        {
          'credentials.clientId': {
            equals: clientId,
          },
        },
        {
          'credentials.clientSecret': {
            equals: clientSecret,
          },
        },
      ],
    },
  })

  return client.docs.length > 0 ? (client.docs[0] as OAuthApp) : null
}
