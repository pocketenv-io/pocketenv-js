import { Sandbox } from "../src/index";

const sandbox = await Sandbox.create({ base: "openclaw" });

await sandbox.service.add("web", "node server.js", { ports: [3000] });

const { services } = await sandbox.service.list();
console.log(
  "Services:",
  services.map((s) => s.name),
);

const svcId = services[0]!.id;
await sandbox.service.start(svcId);
await sandbox.service.restart(svcId);
await sandbox.service.stop(svcId);
await sandbox.service.delete(svcId);

await sandbox.delete();
