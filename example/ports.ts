import { Sandbox } from "../src/index";

const sandbox = await Sandbox.create({ base: "openclaw" });
await sandbox.start();

const { previewUrl } = await sandbox.expose(3000, "web server");
console.log("Preview URL:", previewUrl);

const exposed = await sandbox.ports.list();
console.log(
  "Exposed ports:",
  exposed.map((p) => p.port),
);

await sandbox.unexpose(3000);
await sandbox.stop();
await sandbox.delete();
