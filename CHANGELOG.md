# Changelog

## 0.3.0

### Minor Changes

- 4452901: Migrating plugin codebase to payload plugin template to meet standards

## 0.2.0

### Minor Changes

- 2e62c9e: Removing cookies from plugin feature
- eb7abb6: Added logout route and operation
- 9108754: Using email settings from Oauth client settings instead of plugin config
- f81c4f5: Added magiclink auth flow

## 0.1.4

### Patch Changes

- 3bb8122: Minor updates to documentation

## 0.1.3

### Patch Changes

- e5d1de5: Updated documentation

## 0.1.2

### Patch Changes

- 7bc1279: Added changeset package, Github workflows and configured ESLint

## [0.1.1] - 2023-10-12

### Initial pre-release

- Ability to create multiple `OAuth Apps` with individual client credentials
- Better session flow using revokable longer-lived `refresh tokens`
- `Session management` on User collections with ability to revoke active sessions
- `Passwordless authentication` using One-time password (OTP) or Magiclink
- Automatically adds registered OAuth apps to `CSRF` and `CORS` config in Payload

[0.1.1]: https://github.com/imcorfitz/payload-plugin-oauth-apps

---

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
