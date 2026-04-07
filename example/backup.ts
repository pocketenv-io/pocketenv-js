import { Sandbox } from "../src/index";

const sandbox = await Sandbox.get("ruinous-straw-wz8n");
await sandbox.createBackup("/home/coder");
