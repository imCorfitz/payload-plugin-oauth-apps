import { sign } from 'jsonwebtoken'
import type { Payload } from 'payload'
import type { IncomingAuthType, User } from 'payload/dist/auth'
import { getFieldsToSign } from 'payload/dist/auth/operations/getFieldsToSign'
import type { CollectionConfig } from 'payload/types'

interface AccessTokenProps {
  user: User
  payload: Payload
  collection: CollectionConfig
  sessionId: string
}

interface AccessTokenResult {
  accessToken: string
  expiresIn: number
}

export default function generateAccessToken({
  user,
  payload: { secret },
  collection,
  sessionId,
}: AccessTokenProps): AccessTokenResult {
  const fieldsToSign = {
    ...getFieldsToSign({
      collectionConfig: collection,
      user,
      email: user.email,
    }),
    __ses: sessionId,
  }

  const expiresIn = (collection.auth as IncomingAuthType).tokenExpiration || 60 * 60

  // Sign the JWT
  const accessToken = sign(fieldsToSign, secret, {
    expiresIn,
  })

  return {
    accessToken,
    expiresIn,
  }
}
