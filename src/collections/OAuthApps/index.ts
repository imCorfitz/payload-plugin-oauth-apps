import type { CollectionConfig } from 'payload/types'

import type { MaybeUser, OAuthApp } from '../../types'

function generate() {
  let ret = ''
  for (let i = 0; i < 8; i++) {
    const newrand = Math.floor(Math.random() * 4026531840) + 268435456
    ret += newrand.toString(16)
  }
  return ret
}

// n times *
const nTimes = (n: number, char: string) => {
  let ret = ''
  for (let i = 0; i < n; i++) {
    ret += char
  }
  return ret
}

export const OAuthApps: CollectionConfig = {
  slug: 'oAuthApps',
  labels: {
    singular: 'OAuth App',
    plural: 'OAuth Apps',
  },
  admin: {
    useAsTitle: 'applicationName',
    group: 'Auth',
    hidden: ({ user }) => !user.oAuthManager,
    defaultColumns: ['applicationName', 'homepageUrl'],
  },
  graphQL: {
    singularName: 'OAuth App',
    pluralName: 'OAuth Apps',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean((user as MaybeUser)?.oAuthManager),
    update: ({ req: { user } }) => Boolean((user as MaybeUser)?.oAuthManager),
    delete: ({ req: { user } }) => Boolean((user as MaybeUser)?.oAuthManager),
  },
  hooks: {
    beforeRead: [
      ({ doc }) => {
        const document = doc as OAuthApp

        if (document.credentials?.clientSecret) {
          document.credentials.clientSecret = `CS_${nTimes(
            document.credentials.clientSecret.length - 8,
            '*',
          )}${document.credentials.clientSecret.slice(-5)}`
        }
        return document
      },
    ],
  },
  fields: [
    {
      name: 'applicationName',
      label: 'Application Name',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      label: 'Application Description',
      type: 'textarea',
    },
    {
      name: 'homepageUrl',
      label: 'Homepage URL',
      type: 'text',
      required: true,
    },
    {
      name: 'callbackUrl',
      label: 'Application Callback URL',
      type: 'text',
      required: true,
      admin: {
        description:
          'When using magiclink, this is the URL that the user will be redirected to after they have authenticated. The callback URL will receive a query parameter called `token` which can be used in exchange for an access and refresh token.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          type: 'checkbox',
          name: 'enableCookies',
          label: 'Enable Cookies',
          defaultValue: false,
          admin: {
            description:
              'This will create responsoe cookies when the user authenticates as well as add the hostname to the list of allowed origins for CSRF.',
          },
        },
      ],
    },
    {
      type: 'group',
      name: 'credentials',
      label: 'Application Credentials',
      admin: {
        description:
          'These are the credentials that will be used to authenticate your application. IMPORTANT: These credentials will only be shown once, so make sure to save them somewhere safe.',
      },
      access: {
        read: ({ req: { user } }) => Boolean((user as MaybeUser)?.oAuthManager),
        create: () => false,
        update: () => false,
      },
      fields: [
        {
          name: 'clientId',
          label: 'Application Client ID',
          type: 'text',
          access: {
            read: ({ req: { user } }) => Boolean((user as MaybeUser)?.oAuthManager),
            create: () => false,
            update: () => false,
          },
          defaultValue: `CID_${generate()}`,
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'clientSecret',
          label: 'Application Client Secret',
          type: 'text',
          access: {
            read: ({ req: { user } }) => Boolean((user as MaybeUser)?.oAuthManager),
            create: () => false,
            update: () => false,
          },
          defaultValue: `CS_${generate()}`,
          admin: {
            readOnly: true,
            description: 'This will only be shown once, so make sure to save it somewhere safe.',
          },
        },
      ],
    },
  ],
}
