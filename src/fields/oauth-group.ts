import type { GroupField } from 'payload/types'

import { isSelfFieldLevel } from '../access/is-self'
import type { PluginTypes } from '../types'

export const OAuthGroup: (pluginOptions: PluginTypes) => GroupField = pluginOptions => {
  return {
    type: 'group',
    name: 'oAuth',
    label: 'OAuth',
    fields: [
      {
        name: '_otp',
        type: 'text',
        label: 'Auth Code',
        hidden: true,
        index: false,
        access: {
          read: () => false,
          create: () => false,
          update: () => false,
        },
      },
      {
        name: '_magiclinks',
        type: 'text',
        label: 'Magic Links',
        hidden: true,
        index: false,
        access: {
          read: () => false,
          create: () => false,
          update: () => false,
        },
      },
      {
        type: 'array',
        name: 'sessions',
        label: 'Sessions',
        access: {
          read: pluginOptions.access?.sessions?.read || isSelfFieldLevel,
          create: pluginOptions.access?.sessions?.create || (() => false),
          update: pluginOptions.access?.sessions?.update || isSelfFieldLevel,
        },
        fields: [
          {
            type: 'relationship',
            name: 'app',
            label: 'App',
            relationTo: 'oAuthApps',
            hasMany: false,
            required: true,
            admin: {
              readOnly: true,
            },
          },
          {
            type: 'row',
            fields: [
              {
                name: 'createdAt',
                type: 'date',
                label: 'Created At',
                admin: {
                  readOnly: true,
                  date: {
                    pickerAppearance: 'dayAndTime',
                  },
                  width: '33%',
                },
              },
              {
                name: 'lastUsedAt',
                type: 'date',
                label: 'Last Used At',
                admin: {
                  readOnly: true,
                  date: {
                    pickerAppearance: 'dayAndTime',
                  },
                  width: '33%',
                },
              },
              {
                name: 'expiresAt',
                type: 'date',
                label: 'Expires At',
                admin: {
                  readOnly: true,
                  date: {
                    pickerAppearance: 'dayAndTime',
                  },
                  width: '33%',
                },
              },
            ],
          },
          {
            name: 'userAgent',
            type: 'text',
            label: 'User Agent',
            admin: {
              readOnly: true,
            },
          },
          {
            name: 'location',
            type: 'json',
            label: 'Location',
            admin: {
              readOnly: true,
            },
          },
        ],
      },
    ],
  }
}
