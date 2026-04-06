# Changelog

All notable changes to this project will be documented in this file.

## [0.2.6] - 2026-04-06

### Changed

- **`Sandbox.start()` / `stop()` / `delete()`** — return type changed from `SandboxView` to `void`; response body is no longer parsed.
- **`Sandbox.putSshKey(publicKey, privateKey)`** — now accepts a `privateKey` argument and delegates to `sshKeys.put()`, encrypting the private key automatically.

### Added

- **`SandboxView`** — optional `displayName` and `uri` fields.
- **`SecretView`** — optional `createdAt` field.
- **`ServiceView`** — optional `status` field.

## [0.2.5] - 2026-04-06

### Fixed

- **`waitUntilRunning()`** — now correctly expects a `{ sandbox: SandboxView }` wrapped response from `getSandbox` and checks `data.sandbox.status` instead of `data.status`.

### Changed

- **`SandboxBuilder` / `Sandbox.create`** — inline type for options reformatted to multiline for clarity (no behaviour change).
- **`Sandbox.getTerminalToken`** / **`waitUntilRunning`** — method signatures reformatted to multiline for clarity (no behaviour change).

## [0.2.4] - 2026-04-06

### Fixed

- **`Sandbox.get()`** — now handles both bare `SandboxView` and `{ sandbox: SandboxView }` wrapped API responses gracefully.

### Changed

- **Examples** — removed explicit `Sandbox.configure({ token })` calls; token is now resolved automatically from the environment.

## [0.2.3] - 2026-04-06

### Changed

- **`Sandbox.configure()`** is now optional. The SDK resolves the API token from the first available source: explicit argument → `POCKETENV_TOKEN` env var → `~/.pocketenv/token.json` (`{ "token": "..." }`).

## [0.2.2] - 2026-04-05

### Fixed

- **`Sandbox.get` / `waitUntilRunning`** — response is now parsed directly as `SandboxView` (not wrapped in `{ sandbox: ... }`) per the `sandboxViewBasic` lexicon.
- **`SandboxView`** — removed `uri` (not in any lexicon view); added `timeout` field.
- **`SecretView`** — removed `createdAt` (not in `secretView` lexicon).
- **`VariableView`** — removed `createdAt` (not in `variableView` lexicon).
- **`SshKeysView`** — added `id`, `createdAt`, `updatedAt` per `sshKeysView` lexicon.
- **`TailscaleAuthKeyView`** — added `id`, `redacted`, `createdAt`, `updatedAt` per `tailscaleAuthKeyView` lexicon.
- **`ServiceView`** — removed `status` (not in `serviceView` lexicon).
- **`Service.list`** — removed unsupported `limit`/`offset` params; return type is now `{ services: ServiceView[] }` (no `total`).
- **`Service.start` / `stop` / `restart` / `delete`** — removed extra `sandboxId` param from request body (only `serviceId` required per lexicon).
- **`Service.update`** — moved `serviceId` to query params per lexicon (was previously in request body).

## [0.2.1] - 2026-04-05

### Added

- **`sandbox.copy`** sub-resource — copy files and directories between local and sandbox environments:
  - `copy.upload(localPath, sandboxPath)` — compress a local file/directory with ignore-file support (`.pocketenvignore`, `.gitignore`, `.npmignore`, `.dockerignore`) and upload it to the sandbox.
  - `copy.download(sandboxPath, localPath)` — download a directory from the sandbox and extract it locally.
  - `copy.to(destinationSandboxId, sourcePath, destPath)` — copy a path from this sandbox directly into another sandbox (no local download needed).
- All copy methods accept an optional `{ signal }` option for cancellation via `AbortController`.
- **`Sandbox.configure({ storageUrl })`** — optional override for the storage service URL (defaults to `https://sandbox.pocketenv.io`).
- **`Sandbox.getProfile()`** — static method that fetches the authenticated user's profile (`io.pocketenv.actor.getProfile`).
- **`Sandbox.getTerminalToken()`** — static method that fetches a short-lived terminal token (`io.pocketenv.actor.getTerminalToken`) used to open a Cloudflare WebSocket terminal session.
- **`sandbox.waitUntilRunning({ timeoutMs?, intervalMs? })`** — polls `getSandbox` until status is `RUNNING`, throws on timeout.
- **`providerOptions`** field in `CreateSandboxOptions` and `SandboxBuilder.providerOptions()` — spread into the create body, enabling provider-specific tokens (sprites, daytona, deno, vercel) to be passed through.
- **`encrypt`** exported from the package root — allows callers to encrypt provider tokens before passing them in `providerOptions`.
- **All view types exported** from the package root: `SandboxView`, `Profile`, `SecretView`, `VariableView`, `FileView`, `VolumeView`, `ServiceView`, `PortView`, `SshKeysView`, `TailscaleAuthKeyView`, `ExecResult`, `ListOptions`, `CreateSandboxOptions`.

### Changed

- **`File.write` and `File.update`** — file content is now encrypted with sodium before upload, consistent with secrets and Tailscale keys.
- **`ListOptions.isRunning`** — new optional field forwarded to `getActorSandboxes`, enabling `Sandbox.list({ isRunning: true })`.
- **`SecretView`** — added `createdAt` field.
- **`VariableView`** — added `createdAt` field.
- **`PortView`** — added `description` field.
- **`ServiceView`** — added `status` field.

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
