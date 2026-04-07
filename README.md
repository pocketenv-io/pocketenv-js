# @pocketenv/sdk

[![npm version](https://img.shields.io/npm/v/@pocketenv/sdk?color=green)](https://www.npmjs.com/package/@pocketenv/sdk)
![NPM Downloads](https://img.shields.io/npm/dw/%40pocketenv%2Fsdk)
[![discord](https://img.shields.io/discord/1270021300240252979?label=discord&logo=discord&color=5865F2)](https://discord.gg/9ada4pFUFS)
[![ci](https://github.com/pocketenv-io/pocketenv-js/actions/workflows/ci.yml/badge.svg)](https://github.com/pocketenv-io/pocketenv-js/actions/workflows/ci.yml)

Official JavaScript/TypeScript SDK for [Pocketenv](https://pocketenv.io).

## Installation

```bash
npm install @pocketenv/sdk
# or
bun add @pocketenv/sdk
```

## Authentication

The SDK resolves your API token from the first available source:

1. Passed explicitly to `Sandbox.configure({ token })` or `Sandbox.create({ token })`
2. `POCKETENV_TOKEN` environment variable
3. `~/.pocketenv/token.json` — a JSON file with the shape `{ "token": "tok_..." }`

This means `Sandbox.configure()` is **optional** if you have a token file or environment variable set.

## Quick Start

```ts
import { Sandbox } from "@pocketenv/sdk";

// No configuration needed if ~/.pocketenv/token.json or POCKETENV_TOKEN is set
const sandbox = await Sandbox.create({ base: "openclaw" });

// Run a command
const result = await sandbox.sh`echo hello`;
console.log(result.stdout); // "hello\n"

// With interpolation
const dir = "/home/user";
const files = await sandbox.sh`ls -la ${dir}`;

// Stop and clean up
await sandbox.stop();
await sandbox.delete();
```

## API

### `Sandbox.configure({ token?, baseUrl? })`

Optionally set a global API token (and optional base URL) used by all subsequent calls. If omitted, the SDK falls back to `POCKETENV_TOKEN` or `~/.pocketenv/token.json`.

### `Sandbox.create(options)`

Create a new sandbox. Pass `token` inline to skip `configure()`.

```ts
const sandbox = await Sandbox.create({
  base: "openclaw",
  name: "my-sandbox",
  token: "tok_...",
});
```

### `Sandbox.builder(base)`

Fluent builder for creating sandboxes — useful when setting many options, especially multiple envs or secrets.

```ts
const sandbox = await Sandbox.builder("openclaw")
  .name("my-sandbox")
  .vcpus(4)
  .memory(8192)
  .env("NODE_ENV", "production")
  .env("PORT", "3000")
  .secret("API_KEY", process.env.API_KEY!)
  .keepAlive()
  .create();
```

Available builder methods: `name`, `description`, `provider`, `topics`, `repo`, `vcpus`, `memory`, `disk`, `readme`, `env`, `secret`, `keepAlive`, `token`, `baseUrl`.

### `Sandbox.get(id)`

Fetch an existing sandbox by ID.

### `Sandbox.list({ limit?, offset? })`

List all sandboxes.

### Instance methods

| Method                                 | Description        |
|----------------------------------------|--------------------|
| `sandbox.start({ repo?, keepAlive? })` | Start the sandbox  |
| `sandbox.stop()`                       | Stop the sandbox   |
| `sandbox.delete()`                     | Delete the sandbox |
| `sandbox.exec(command)`                | Run a raw command  |
| `sandbox.sh\`command\`                 | Run a shell command via `/bin/sh -c` (tagged template or string) |
| `sandbox.expose(port, description?)`   | Expose a port publicly |
| `sandbox.unexpose(port)`               | Remove a port exposure |
| `sandbox.vscode()`                     | Expose VS Code         |
| `sandbox.getSshKeys()`                                       | Get SSH public key                             |
| `sandbox.putSshKey(publicKey, privateKey)`                   | Set an SSH key pair                            |
| `sandbox.createBackup(directory, description?, ttl?)`        | Create a backup of a sandbox directory         |
| `sandbox.listBackups()`                                      | List all backups for the sandbox               |
| `sandbox.restoreBackup(backupId)`                            | Restore the sandbox from a backup              |

### Sub-resources

- **`sandbox.file`** — `write`, `list`, `get`, `update`, `delete`
- **`sandbox.env`** — `put`, `list`, `get`, `update`, `delete`
- **`sandbox.secret`** — `put`, `list`, `get`, `update`, `delete`
- **`sandbox.volume`** — `create`, `list`, `get`, `update`, `delete`
- **`sandbox.ports`** — `list`
- **`sandbox.service`** — `add`, `list`, `start`, `stop`, `restart`, `update`, `delete`
- **`sandbox.tailscale`** — `getAuthKey`, `setAuthKey`
- **`sandbox.backup`** — `create(directory, description?, ttl?)`, `list()`, `restore(backupId)`

## Development

```bash
bun install
bun test        # run tests
bun run build   # compile to dist/
```

## License

MIT
