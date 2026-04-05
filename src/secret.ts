import type { ApiClient } from "./api-client/api-client.js";
import type { ListOptions, SecretView } from "./api-client/validators.js";

export class Secret {
  constructor(
    private sandboxId: string,
    private client: ApiClient
  ) {}

  async put(name: string, value: string): Promise<void> {
    await this.client.post("io.pocketenv.secret.addSecret", {
      secret: { sandboxId: this.sandboxId, name, value },
    });
  }

  async list(options?: ListOptions): Promise<{ secrets: SecretView[]; total: number }> {
    return this.client.get("io.pocketenv.secret.getSecrets", {
      sandboxId: this.sandboxId,
      limit: options?.limit,
      offset: options?.offset,
    });
  }

  async get(id: string): Promise<SecretView> {
    const res = await this.client.get<{ secret: SecretView }>(
      "io.pocketenv.secret.getSecret",
      { id }
    );
    return res.secret;
  }

  async update(id: string, name: string, value: string): Promise<void> {
    await this.client.post("io.pocketenv.secret.updateSecret", {
      id,
      secret: { sandboxId: this.sandboxId, name, value },
    });
  }

  async delete(id: string): Promise<void> {
    await this.client.post("io.pocketenv.secret.deleteSecret", undefined, { id });
  }
}
