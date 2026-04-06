import { Sandbox } from "../src/index";

const sandbox = await Sandbox.get("ruinous-straw-wz8n");
console.log(`Sandbox: ${sandbox.id} `);

await sandbox.start();

const result = await sandbox.sh`echo hello from sandbox`;
console.log(result.stdout);

await sandbox.stop();
console.log("Done.");
