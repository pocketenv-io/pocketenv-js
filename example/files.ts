import { Sandbox } from "../src/index";

Sandbox.configure({ token: process.env.POCKETENV_TOKEN! });

const sandbox = await Sandbox.create({ base: "openclaw" });

await sandbox.file.write("/workspace/hello.txt", "Hello, Pocketenv!");

const { files } = await sandbox.file.list();
console.log("Files:", files.map((f) => f.path));

const file = await sandbox.file.get(files[0].id);
console.log("File path:", file.path);

await sandbox.file.delete(files[0].id);
await sandbox.delete();
