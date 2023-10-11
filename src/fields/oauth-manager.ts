import type { CheckboxField } from 'payload/types'

import deepMerge from '../utils/deepmerge'

export const oAuthManager: (
  config?: Omit<CheckboxField, 'type' | 'name' | 'label'>,
) => CheckboxField = config =>
  deepMerge(
    {
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
    },
    config,
  )
