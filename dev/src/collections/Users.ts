import type { CollectionConfig } from 'payload/types'
import { oAuthManager } from '../../../src'

const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
  },
  fields: [
    // Email added by default
    // Add more fields as needed
    oAuthManager({
      access: {
        update: () => true,
      },
      admin: {
        readOnly: false,
      },
    }),
  ],
}

export default Users
