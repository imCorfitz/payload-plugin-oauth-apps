# payload-plugin-oauth-apps

This plugin introduces the concept of refresh tokens and shorter-lived access tokens to payload CMS. Documentation will be updated soon.

> Please note this plugin is under active development. A lot `WILL` change.

## Configuration

### Setup plugin

```ts
import { oAuthApps } from "payload-plugin-oauth-apps";

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
import { oAuthManager } from "payload-plugin-oauth-apps";

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

### TODO

- [ ] Create magiclink auth flow
- [ ] Add custom generate security pass phrase function
- [ ] Overwrite Graphql APIs / Introduce new ones
      - Login
      - Logout
      - Refresh token
      - Reset password
- [ ] Overwrite REST APIs / Introduce new ones
      - Login
      - Logout
      - Refresh token
      - Reset password
- [ ] Write documentation
