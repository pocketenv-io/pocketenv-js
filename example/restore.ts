import { Sandbox } from "../src/index";

const sandbox = await Sandbox.get("ruinous-straw-wz8n");
await sandbox.restoreBackup("f9b02d36-3d81-4557-a081-e76dd9930e8a");
