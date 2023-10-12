# OAuth Apps plugin for Payload CMS

<a href="LICENSE">
  <img src="https://img.shields.io/badge/license-MIT-brightgreen.svg" alt="Software License" />
</a>
<a href="https://github.com/imcorfitz/payload-plugin-oauth-apps/issues">
  <img src="https://img.shields.io/github/issues/imcorfitz/payload-plugin-oauth-apps.svg" alt="Issues" />
</a>
<a href="https://npmjs.org/package/@imcorfitz/payload-plugin-oauth-apps">
  <img src="https://img.shields.io/npm/v/@imcorfitz/payload-plugin-oauth-apps.svg" alt="NPM" />
</a>

> Please note this plugin is under active development. It should be considered BETA. A lot `WILL` change. Please see [TODO](TODO.md)

## Features

- Ability to create multiple `OAuth Apps` with individual client credentials
- Better session flow using revokable longer-lived `refresh tokens`
- `Session management` on User collections with ability to revoke active sessions
- `Passwordless authentication` using One-time password (OTP) or Magiclink (Coming soon)
- Automatically adds registered OAuth apps to `CSRF` and `CORS` config in Payload
- Full support of native Payload Auth cookies and JWT passport strategy

## Installation

```
npm install @imcorfitz/payload-plugin-oauth-apps
# or
yarn add @imcorfitz/payload-plugin-oauth-apps
```

### Requirements

- Payload ^2.0.0
- `serverURL` is required in your `payload.config.ts` file

## Usage

### Setup plugin

```ts
// payload.config.ts
import { oAuthApps } from "@imcorfitz/payload-plugin-oauth-apps";

export default buildConfig({
  // ... Payload Config
  plugins: [
    // ... other plugins
    oAuthApps({
      userCollections: [Users.slug],
    }),
  ],
});
```

### Options

- `userCollections`: string[] | required

  An array of collections slugs to enable OAuth Sessions. Enabled collections receive an `OAuth` group with a sessions array, listing all currently active sessions.

- `access`: object | optional

  Allows you to configure field-level access control on the fields in the `OAuth` group on configured user collections.

  - `sessions`: object | optional
    - `read`: FieldAccess | optional
    - `create`: FieldAccess | optional
    - `update`: FieldAccess | optional

- `authorization`: object | optional

  Configure how `OAuth Apps` authorize users and initialize new sessions. The default `method` is 'crednetials'.

  - `method`: 'credentials' | 'otp' | 'magiclink' | 'custom' | optional
  - `customHandler`: EndpointHandler | optional
  - `otpExpiration`: number | optional
  - `generateOTP`: method | optional
  - `generateEmailHTML`: method | optional
  - `generateEmailSubject`: method | optional

  When using `otp` and authorization method, you can set the expiration (`otpExpiration` - defaults to 10 minutes) and customise how you want the one-time password to be generated (`generateOTP` - defaults to generating a 6-digit number).

  Both `magiclink` (Coming soon) and `otp` allows you to set the `generateEmailHTML` and `generateEmailSubject` methods to customise the email sent to the user for authentication. In both methods you will have access to following properties:

  - `req`: PayloadRequest
  - `token`: The generated OTP or an encrypted token depending on the set method
  - `user`: Information about the user to be authenticated

  > Note: `customHandler` should be set if `method` is set to 'custom' and allows you to perform the entire authentication flow yourself. Note that the plugin does expose the generateAccessToken and generateRefreshToken methods, however this goes beyond the scope of this documentation, and should be used in advance cases only.

- `sessions`: object | optional

  Configuration of the sessions created.

  - `limit`: number | optional
  - `ipinfoApiKey`: string | optional
  - `fetchLocationInfo`: method | optional
  - `refreshTokenExpiration`: number | optional

  Allows you set a `limit` of number of sessions per user. If not set, users are free to create unlimited sessions (not adviced). When set, oldest session will be removed when limit has been reached and a new session is initialised.

  By default all refresh tokens have a lifespan of 30 days. You can override this by passing `refreshTokenExpiration` with the amount of seconds a refresh token should be valid for.

  The plugin uses [`IPInfo`](https://ipinfo.io/) to fetch location information whenever a session is created. To use this, simply set your own `ipinfoApiKey`. (_Please note, that it doesn't work on localhost_). If you wish to use an alternative location detection service, feel free to use the `fetchLocationInfo` method which gives you following properties:

  - `req`: PayloadRequest
  - `ip`: The detected IP address | possibly undefined

### Add OAuth Manager

Add the `oAuthManager` field to your admin user collection. This determines which users have access to manage OAuth Apps in Payload CMS.

```ts
// collections/admins.ts
import { oAuthManager } from "@imcorfitz/payload-plugin-oauth-apps";

const Admins: CollectionConfig = {
  slug: "admins",
  auth: true,
  // ... Collection config
  fields: [
    // ... Other fields
    oAuthManager({
      // NOTE: You can pass Checkbox field properties here to override all field properties except for: name, label and type.
      access: {
        update: isAdminFieldLevel,
      },
      admin: {
        readOnly: false,
      },
    }),
  ],
};
```

## OAuth REST API endpoints

- [POST] `oauth/authorize`:

  Used by OAuth apps to log in users. Upon sucessful login, the response will contain an access token and a refresh token.

  > Note: Don't ever expose your client id or client secret to the client. These operations should always be made securely from server-side.

  | Parameter               | Description                                                                                                  |
  | ----------------------- | ------------------------------------------------------------------------------------------------------------ |
  | email `required`        | The email address of the user to be logged in.                                                               |
  | password                | The password of the user to be logged in. _NB: `required` if `authorization.method` is set to 'credentials'_ |
  | clientId `required`     | The client id of the OAuth App performing the operation                                                      |
  | clientSecret `required` | The client secret of the OAuth App performing the operation                                                  |

  ```ts
  // Request
  const response = await fetch(`https://my.payloadcms.tld/<user-collection>/oauth/authorize`, {
    method: 'POST',
    body: JSON.stringify({
      email: "user@payloadcms.com",
      password: "very-safe-password-1234",
      clientId: "CID_s3o8y384y5...",
      clientSecret: "CS_skijorintg..."
    })
  })

  // Successful Response
  {
    "accessToken": "eyJhbGciOiJIUzI1N...XMnxpb1NTK9K0",
    "accessExpiration": 3600,
    "refreshToken": "43d5cc1ee66ac880...94b8f2df",
    "refreshExpiration": 2592000
  }
  ```

- [POST] `oauth/refresh-token`:

  Used by OAuth apps to request a new access token using their issued refresh token. Upon sucessful login, the response will contain an access token and a refresh token.

  > Note: Don't ever expose your client id or client secret to the client. These operations should always be made securely from server-side.

  | Parameter               | Description                                                                                                                          |
  | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
  | refreshToken            | Only `required` if cookie authentication isn't enable for the OAuth app. Otherwise passing the cookies with the request will suffice |
  | clientId `required`     | The client id of the OAuth App performing the operation                                                                              |
  | clientSecret `required` | The client secret of the OAuth App performing the operation                                                                          |

  ```ts
  // Request
  const response = await fetch(`https://my.payloadcms.tld/<user-collection>/oauth/refresh-token`, {
    method: 'POST',
    body: JSON.stringify({
      refreshToken: "43d5cc1ee66ac880...94b8f2df",
      clientId: "CID_s3o8y384y5...",
      clientSecret: "CS_skijorintg..."
    })
  })

  // Successful Response
  {
    "accessToken": "eyJhbGciOiJIUAhd7...XMnxpVbUoAyhI",
    "accessExpiration": 3600,
  }
  ```

- [POST] `oauth/verify-otp`:

  When `authorization.method` is set to 'otp', the user will receive an email with a one-time password. Use this endpoint to finalize the authentication process and receive an access and refresh token.

  > Note: Don't ever expose your client id or client secret to the client. These operations should always be made securely from server-side.

  | Parameter               | Description                                                 |
  | ----------------------- | ----------------------------------------------------------- |
  | email `required`        | The email address of the user to be logged in.              |
  | otp `required`          | The one-time password received by the user by email         |
  | clientId `required`     | The client id of the OAuth App performing the operation     |
  | clientSecret `required` | The client secret of the OAuth App performing the operation |

  ```ts
  // Request
  const response = await fetch(`https://my.payloadcms.tld/<user-collection>/oauth/verify-otp`, {
    method: 'POST',
    body: JSON.stringify({
      email: "user@payloadcms.com",
      otp: "123456",
      clientId: "CID_s3o8y384y5...",
      clientSecret: "CS_skijorintg..."
    })
  })

  // Successful Response
  {
    "accessToken": "eyJhbGciOiJIUzI1N...XMnxpb1NTK9K0",
    "accessExpiration": 3600,
    "refreshToken": "43d5cc1ee66ac880...94b8f2df",
    "refreshExpiration": 2592000
  }
  ```

## Changelog

Please see [CHANGELOG](CHANGELOG.md) for more information what has changed recently.

## Known issues

### Reset password

Currently Payload doesn't feature operation hooks on `reset password`, and it automatically initialises a session and issues an access token when the operation is done. This is not a problem when operating within the CMS; however, it doesn't allow for this plugin to limit the session creation to be CMS-only – meaning that an OAuth application is all good to use the `reset password` REST endpoint and GraphQL mutation native to Payload, but this will only create an access token, that will be shortlived and not accompanied by a refresh token. It is therefor adviced for OAuth applications to disregard the session and access token issued by Payload post `reset password` and request the user to log in again after the password has been reset.

## Disclaimer

### Payload 2.0

This plugin was initially written to work with Payload ^1.0.0. An effort has been made to match ^2.0.0, thus leaving behind the legacy ^1.0.0 versions. It should be working fine however, I have yet to test the plugin using the `vite-bundler` and `postgres` db adapter.

### GraphQL

The entire auth, refresh and logout flow is fully working using the REST api. I have yet to create dedicated GraphQL mutations and resolvers. This is in the works.

## Contributing

Contributions and feedback are very welcome.

To get it running:

1. Clone the project.
2. `yarn install`
3. `yarn build`

## Credits

- [Corfitz](https://github.com/imcorfitz)
- [All Contributors][link-contributors]

## License

The MIT License (MIT). Please see [License File](LICENSE) for more information.

[link-contributors]: ../../contributors
