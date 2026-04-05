import { Sandbox } from "../src/index";

// Builder pattern — useful when setting many options, especially envs/secrets.
const sandbox = await Sandbox.builder("openclaw")
  .name("builder-example")
  .vcpus(2)
  .memory(4096)
  .env("NODE_ENV", "production")
  .env("PORT", "3000")
  .secret("API_KEY", process.env.API_KEY!)
  .keepAlive()
  .token(process.env.POCKETENV_TOKEN!)
  .create();

console.log(`Created: ${sandbox.id}`);
await sandbox.delete();
