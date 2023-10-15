import { oAuthManager } from '../../../src'
import { CollectionConfig } from 'payload/types'

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
