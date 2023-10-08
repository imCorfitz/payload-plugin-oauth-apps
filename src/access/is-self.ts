import type { Access } from 'payload/config'
import type { FieldAccess } from 'payload/types'

export const isSelf: Access = ({ req: { user } }) => {
  // Need to be logged in
  if (user) {
    // If any other type of user, only provide access to themselves
    return {
      id: {
        equals: user.id,
      },
    }
  }

  // Reject everyone else
  return false
}

export const isSelfFieldLevel: FieldAccess<{ id: string }, unknown> = ({ req: { user }, id }) => {
  if (user?.id === id) return true
  return false
}
