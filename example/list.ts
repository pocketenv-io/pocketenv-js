import { Sandbox } from "../src/index";

Sandbox.configure();
const { sandboxes, total } = await Sandbox.list({ limit: 10, offset: 0 });

console.log(`Total sandboxes: ${total}`);
for (const s of sandboxes) {
  console.log(`  ${s.id}  ${s.name}  [${s.status}]`);
}
