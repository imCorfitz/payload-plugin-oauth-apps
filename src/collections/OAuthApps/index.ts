import type { CollectionConfig } from 'payload/types'

import type { MaybeUser, OAuthApp } from '../../types'

function generate(): string {
  let ret = ''
  for (let i = 0; i < 8; i += 1) {
    const newrand = Math.floor(Math.random() * 4026531840) + 268435456
    ret += newrand.toString(16)
  }
  return ret
}

// n times *
const nTimes = (n: number, char: string): string => {
  let ret = ''
  for (let i = 0; i < n; i += 1) {
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
          'When using magiclink, this is the URL that the user will be redirected to after they have authenticated.',
      },
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
          defaultValue: `CI_${generate()}`,
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
    {
      type: 'group',
      name: 'settings',
      label: 'Settings',
      fields: [
        {
          type: 'checkbox',
          name: 'customizeOtpEmail',
          label: 'Customize OTP Email',
          defaultValue: false,
        },
        {
          type: 'text',
          name: 'otpEmailSubject',
          label: 'OTP Email Subject',
          admin: {
            condition: (_, siblingData) => siblingData?.customizeOtpEmail,
            description:
              'This is the subject that will be sent in the email when using OTP authentication. You have access to the variables `{{otp}}` and `{{email}}` - and any additional variables made available by the administrator.',
          },
        },
        {
          type: 'code',
          name: 'otpEmail',
          label: 'OTP Email',
          admin: {
            language: 'html',
            condition: (_, siblingData) => siblingData?.customizeOtpEmail,
            description:
              'This is the HTML that will be sent in the email when using OTP authentication. You have access to the variables `{{otp}}` and `{{email}}` - and any additional variables made available by the administrator.',
          },
        },
        {
          type: 'checkbox',
          name: 'customizeMagiclinkEmail',
          label: 'Customize Magiclink Email',
          defaultValue: false,
        },
        {
          type: 'text',
          name: 'magiclinkEmailSubject',
          label: 'Magiclink Email Subject',
          admin: {
            condition: (_, siblingData) => siblingData?.customizeMagiclinkEmail,
            description:
              'This is the subject that will be sent in the email when using magiclink authentication. You have access to the variables `{{magiclink}}` and `{{email}}` - and any additional variables made available by the administrator.',
          },
        },
        {
          type: 'code',
          name: 'magiclinkEmail',
          label: 'Magiclink Email',
          admin: {
            language: 'html',
            condition: (_, siblingData) => siblingData?.customizeMagiclinkEmail,
            description:
              'This is the HTML that will be sent in the email when using magiclink authentication. You have access to the variables `{{magiclink}}` and `{{email}}` - and any additional variables made available by the administrator.',
          },
        },
      ],
    },
  ],
}
