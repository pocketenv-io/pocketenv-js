# Changelog

All notable changes to this project will be documented in this file.

## [0.2.0] - 2026-04-05

### Added

- **Encryption** — secrets, Tailscale auth keys, and SSH private keys are now encrypted client-side using `libsodium` (`crypto_box_seal`) before being sent to the API. A default public key is bundled so no extra configuration is required.
- **`Sandbox.configure({ publicKey })`** — optional `publicKey` parameter to override the encryption key. Falls back to `POCKETENV_PUBLIC_KEY` env var, then the bundled default.
- **`sandbox.sshKeys`** sub-resource — new `SshKeys` class replacing ad-hoc SSH key methods:
  - `sshKeys.get()` — retrieve public and private keys for the sandbox.
  - `sshKeys.put(publicKey, privateKey)` — store an SSH key pair (private key is encrypted automatically).
  - `sshKeys.generate(comment?)` — generate a fresh Ed25519 key pair locally using libsodium.
- **`generateEd25519SSHKeyPair`** exported from the package root for standalone use.
- **`SSHKeyPair`** type exported from the package root.

### Changed

- **`Tailscale.setAuthKey`** — now validates that the key starts with `tskey-auth-` (throws otherwise), encrypts the key, and sends a `redacted` field alongside `id` in the request body (aligning with the CLI).
- **`Secret.put`** — value is now encrypted before being sent to the API.
- **`SshKeysView`** — extended with `privateKey?: string` field returned by `getSshKeys`.
- **`Sandbox.create`** — accepts an optional `publicKey` option for per-call encryption key override.

## [0.1.2] - 2025-01-01

- Document `Sandbox.configure` token as optional.

## [0.1.1] - 2024-12-01

- Add `.js` extensions to imports.
- Add GitHub Actions CI workflow.

## [0.1.0] - 2024-11-01

- Initial release.
