import type { ApiClient } from "./api-client/api-client";
import type { TailscaleAuthKeyView } from "./api-client/validators";

export class Tailscale {
  constructor(
    private sandboxId: string,
    private client: ApiClient
  ) {}

  async getAuthKey(): Promise<TailscaleAuthKeyView> {
    return this.client.get("io.pocketenv.sandbox.getTailscaleAuthKey", {
      id: this.sandboxId,
    });
  }

  async setAuthKey(authKey: string): Promise<void> {
    await this.client.post(
      "io.pocketenv.sandbox.putTailscaleAuthKey",
      { authKey },
      { id: this.sandboxId }
    );
  }
}
