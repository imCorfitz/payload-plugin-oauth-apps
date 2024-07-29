# OAuth Apps plugin for Payload CMS

> [!WARNING]
> This project is no longer maintained.

<a href="LICENSE">
  <img src="https://img.shields.io/badge/license-MIT-brightgreen.svg" alt="Software License" />
</a>
<a href="https://github.com/imcorfitz/payload-plugin-oauth-apps/issues">
  <img src="https://img.shields.io/github/issues/imcorfitz/payload-plugin-oauth-apps.svg" alt="Issues" />
</a>
<a href="https://npmjs.org/package/@imcorfitz/payload-plugin-oauth-apps">
  <img src="https://img.shields.io/npm/v/@imcorfitz/payload-plugin-oauth-apps.svg" alt="NPM" />
</a>

## Features

- Ability to create multiple `OAuth Apps` with individual client credentials
- Better session flow using revokable longer-lived `refresh tokens`
- `Session management` on User collections with ability to revoke active sessions
- `Passwordless authentication` using One-time password (OTP) or Magiclink
- Automatically adds registered OAuth apps to `CSRF` and `CORS` config in Payload

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

  Configure how `OAuth Apps` authorize users and initialize new sessions.

  - `customHandlers`: {<custom_method>: EndpointHandler} | optional
  - `otpExpiration`: number | optional
  - `generateOTP`: method | optional
  - `generateEmailVariables`: method | optional

  When using `otp` and authorization method, you can set the expiration (`otpExpiration` - defaults to 10 minutes) and customise how you want the one-time password to be generated (`generateOTP` - defaults to generating a 6-digit number).

  Both `magiclink` and `otp` allows you to set the `generateEmailVariables` method to customise the email variables available in the OAuth App settings. In both method you will have access to following properties:

  - `req`: PayloadRequest
  - `variables`: An object containing a magiclink and token, or an OTP, depending on the `method`
  - `user`: Information about the user to be authenticated
  - `client`: Details about the OAuth App making the auth request

  > Note: `customHandlers` should be set if you wish to create your own `method` and allows you to perform the entire authentication flow yourself. Note that the plugin does expose the generateAccessToken and generateRefreshToken methods, however this goes beyond the scope of this documentation, and should be used in advanced cases only.

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

  Used by OAuth apps to log in users. Upon sucessful login, the response will contain an access token and a refresh token. By passing `method` as part of the body, you can tell Payload CMS how you wish to authenticate the user. The plugin support `credentials`, `otp`, and `magiclink` out of the box.

  > Note: Don't ever expose your client id or client secret to the client. These operations should always be made securely from server-side.

  | Parameter               | Description                                                                                                  |
  | ----------------------- | ------------------------------------------------------------------------------------------------------------ |
  | email `required`        | The email address of the user to be logged in                                                                |
  | clientId `required`     | The client id of the OAuth App performing the operation                                                      |
  | clientSecret `required` | The client secret of the OAuth App performing the operation                                                  |
  | method                  | `'credentials' \| 'otp' \| 'magiclink' \| <custom_method>.` The default `method` is 'credentials'            |
  | password                | The password of the user to be logged in. _NB: `required` if `authorization.method` is set to 'credentials'_ |

  ```ts
  // Request
  const response = await fetch(`https://my.payloadcms.tld/<user-collection>/oauth/authorize`, {
    method: 'POST',
    body: JSON.stringify({
      method: "credentials",
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

  | Parameter               | Description                                                 |
  | ----------------------- | ----------------------------------------------------------- |
  | refreshToken `required` | The refresh token issued at authorization                   |
  | clientId `required`     | The client id of the OAuth App performing the operation     |
  | clientSecret `required` | The client secret of the OAuth App performing the operation |

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

  When `method` is set to 'otp', the user will receive an email with a one-time password. Use this endpoint to finalize the authentication process and receive an access and refresh token.

  > Note: Don't ever expose your client id or client secret to the client. These operations should always be made securely from server-side.

  | Parameter               | Description                                                 |
  | ----------------------- | ----------------------------------------------------------- |
  | email `required`        | The email address of the user to be logged in               |
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

- [GET] `oauth/verify-magiclink`:

  When `method` is set to 'magiclink', the user will receive an email with a link. The link is directing the user to this endpoint by default (if not overridden in OAuth App settings). When validated, the user will be redirected to the callbackUrl registered for the OAuth App.

  | Query Parameter  | Description                             |
  | ---------------- | --------------------------------------- |
  | token `required` | The token received by the user by email |

- [POST] `oauth/verify-magiclink`:

  Same endpoint can also be used by an OAuth app to post the user's token for validation. Same process applies, but instead of a redirect, the call will output a JSON object with the status of the validation.

  | Parameter        | Description                             |
  | ---------------- | --------------------------------------- |
  | token `required` | The token received by the user by email |

- [POST] `oauth/verify-code`:

  When `method` is set to 'magiclink' and the user has clicked the link they've received calling this endpoint with the code received at the authentication call, this endpoint will verify your code and finalize the authentication process and issue an access and refresh token.

  > Note: Don't ever expose your client id or client secret to the client. These operations should always be made securely from server-side.

  | Parameter               | Description                                                 |
  | ----------------------- | ----------------------------------------------------------- |
  | email `required`        | The email address of the user to be logged in               |
  | code `required`         | The code received during authentication call                |
  | clientId `required`     | The client id of the OAuth App performing the operation     |
  | clientSecret `required` | The client secret of the OAuth App performing the operation |

  ```ts
  // Request
  const response = await fetch(`https://my.payloadcms.tld/<user-collection>/oauth/verify-code`, {
    method: 'POST',
    body: JSON.stringify({
      email: "user@payloadcms.com",
      code: "AbCdEf123456",
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
