import type { ApiClient } from "./api-client/api-client.js";
import type { BackupView } from "./api-client/validators.js";

export class Backup {
  constructor(
    private sandboxId: string,
    private client: ApiClient,
  ) {}

  async create(
    directory: string,
    description?: string,
    ttl?: number,
  ): Promise<void> {
    await this.client.post(
      "io.pocketenv.sandbox.createBackup",
      {
        directory,
        description,
        ttl,
      },
      { id: this.sandboxId },
    );
  }

  async list(): Promise<{ backups: BackupView[] }> {
    return await this.client.get("io.pocketenv.sandbox.getBackups", {
      id: this.sandboxId,
    });
  }

  async restore(backupId: string): Promise<void> {
    await this.client.post("io.pocketenv.sandbox.restoreBackup", { backupId });
  }
}
