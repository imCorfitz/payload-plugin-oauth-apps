import { oAuthManager } from '../../../src'
import { CollectionConfig } from 'payload/types'

const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    tokenExpiration: 1000,
  },
  admin: {
    useAsTitle: 'email',
  },
  access: {
    read: () => true,
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
