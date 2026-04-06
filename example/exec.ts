import { Sandbox } from "../src/index";

const sandbox = await Sandbox.create({ base: "openclaw" });
await sandbox.start();

// Tagged template — supports interpolation
const dir = "/";
const ls = await sandbox.sh`ls -la ${dir}`;
console.log(ls.stdout);

// Raw exec
const uname = await sandbox.exec("uname -a");
console.log(uname.stdout);

await sandbox.stop();
await sandbox.delete();
