# @pocketenv/sdk

Official JavaScript/TypeScript SDK for [Pocketenv](https://pocketenv.io).

## Installation

```bash
npm install @pocketenv/sdk
# or
bun add @pocketenv/sdk
```

## Quick Start

```ts
import { Sandbox } from "@pocketenv/sdk";

// Configure once (e.g. at app startup)
Sandbox.configure({ token: process.env.POCKETENV_TOKEN! });

// Create a sandbox
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

### `Sandbox.configure({ token, baseUrl? })`

Set a global API token (and optional base URL) used by all subsequent calls.

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
| `sandbox.getSshKeys()`                 | Get SSH public key     |
| `sandbox.putSshKey(publicKey)`         | Set an SSH public key  |

### Sub-resources

- **`sandbox.file`** — `write`, `list`, `get`, `update`, `delete`
- **`sandbox.env`** — `put`, `list`, `get`, `update`, `delete`
- **`sandbox.secret`** — `put`, `list`, `get`, `update`, `delete`
- **`sandbox.volume`** — `create`, `list`, `get`, `update`, `delete`
- **`sandbox.ports`** — `list`
- **`sandbox.service`** — `add`, `list`, `start`, `stop`, `restart`, `update`, `delete`
- **`sandbox.tailscale`** — `getAuthKey`, `setAuthKey`

## Development

```bash
bun install
bun test        # run tests
bun run build   # compile to dist/
```

## License

MIT
