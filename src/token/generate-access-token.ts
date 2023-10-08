import { sign } from 'jsonwebtoken'
import { fieldAffectsData, fieldHasSubFields } from 'payload/dist/fields/config/types'
import type { Payload } from 'payload'
import type { CollectionConfig, Field } from 'payload/types'
import type { IncomingAuthType } from 'payload/dist/auth'
import type { GenericUser } from '../types'

interface AccessTokenProps {
  user: GenericUser
  payload: Payload
  collection: CollectionConfig
  sessionId: string
}

export default function generateAccessToken({
  user,
  payload,
  collection,
  sessionId,
}: AccessTokenProps) {
  // Decide which user fields to include in the JWT
  const fieldsToSign: Record<string, unknown> = collection.fields.reduce<Record<string, unknown>>(
    (signedFields, field: Field) => {
      const result = {
        ...signedFields,
      }

      if (!fieldAffectsData(field) && fieldHasSubFields(field)) {
        field.fields.forEach(subField => {
          if (fieldAffectsData(subField) && subField.saveToJWT) {
            result[subField.name] = user[subField.name]
          }
        })
      }

      if (fieldAffectsData(field) && field.saveToJWT) {
        result[field.name] = user[field.name]
      }

      return result
    },
    {
      __ses: sessionId,
      email: user.email,
      id: user.id,
      collection: collection.slug,
    },
  )

  const expiresIn = (collection.auth as IncomingAuthType).tokenExpiration || 60 * 60

  // Sign the JWT
  const accessToken = sign(fieldsToSign, payload.secret, {
    expiresIn,
  })

  return {
    accessToken,
    expiresIn,
  }
}
