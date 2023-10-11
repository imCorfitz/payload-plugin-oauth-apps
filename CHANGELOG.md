# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] - 2023-10-12

### Initial pre-release

- Ability to create multiple `OAuth Apps` with individual client credentials
- Better session flow using revokable longer-lived `refresh tokens`
- `Session management` on User collections with ability to revoke active sessions
- `Passwordless authentication` using One-time password (OTP) or Magiclink
- Automatically adds registered OAuth apps to `CSRF` and `CORS` config in Payload
- Full support of native Payload Auth cookies and JWT passport strategy

[0.1.1]: https://github.com/imcorfitz/payload-plugin-oauth-apps
