import type { CheckboxField } from 'payload/types'

export const OAuthManager: CheckboxField = {
  type: 'checkbox',
  name: 'oAuthManager',
  label: 'Can manage OAuth apps',
  access: {
    read: () => true,
    create: () => false,
    update: () => false,
  },
  admin: {
    position: 'sidebar',
    readOnly: true,
  },
}
