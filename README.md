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

> Please note this plugin is under active development. A lot `WILL` change. see [TODO](TODO)

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
})
```

### Add OAuth Manager

Add the `oAuthManager` field to your admin user collection.

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

## Changelog

Please see [CHANGELOG](CHANGELOG.md) for more information what has changed recently.

## Known issues

### Reset password
Currently Payload doesn't feature operation hooks on `reset password`, and it automatically initialises a session and issues an access token when the operation is done. This is not a problem when operating within the CMS; however, it doesn't allow for this plugin to limit the session creation to be CMS-only – meaning that an OAuth application is all good to use the `reset password` REST endpoint and GraphQL mutation native to Payload, but this will only create an access token, that will be shortlived and not accompanied by a refresh token. It is therefor adviced for OAuth applications to disregard the session and access token issued by Payload post `reset password` and request the user to log in again after the password has been reset.

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

