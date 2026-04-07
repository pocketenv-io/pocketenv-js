import { Sandbox } from "../src/index";

const sandbox = await Sandbox.get("ruinous-straw-wz8n");
const ports = await sandbox.ports.list();

console.log(`Total sandboxes: ${ports.length}`);
for (const p of ports) {
  console.log(`  ${p.port} : ${p.description}`);
}

const files = await sandbox.file.list();

console.log(`Total files: ${files.total}`);
for (const f of files.files) {
  console.log(`  ${f.path}`);
}

const volumes = await sandbox.volume.list();

console.log(`Total volumes: ${volumes.total}`);
for (const v of volumes.volumes) {
  console.log(`  ${v.name} : ${v.path}`);
}

const envs = await sandbox.env.list();

console.log(`Total envs: ${envs.total}`);
for (const e of envs.variables) {
  console.log(`  ${e.name}`);
}

const backups = await sandbox.listBackups();

console.log(`Total backups: ${backups.backups.length}`);
for (const b of backups.backups) {
  console.log(`  ${b.id} ${b.directory} : ${b.createdAt}`);
}
