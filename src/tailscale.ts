import type { ApiClient } from "./api-client/api-client.js";
import type { TailscaleAuthKeyView } from "./api-client/validators.js";
import { encrypt } from "./encrypt.js";

export class Tailscale {
  constructor(
    private sandboxId: string,
    private client: ApiClient,
    private publicKeyHex?: string,
  ) {}

  async getAuthKey(): Promise<TailscaleAuthKeyView> {
    return this.client.get("io.pocketenv.sandbox.getTailscaleAuthKey", {
      id: this.sandboxId,
    });
  }

  async setAuthKey(authKey: string): Promise<void> {
    if (!authKey.startsWith("tskey-auth-")) {
      throw new Error(
        "Invalid Tailscale Auth Key: must start with 'tskey-auth-'",
      );
    }

    const encryptedKey = this.publicKeyHex
      ? await encrypt(authKey, this.publicKeyHex)
      : authKey;

    const redacted =
      authKey.length > 14
        ? authKey.slice(0, 11) +
          "*".repeat(authKey.length - 14) +
          authKey.slice(-3)
        : authKey;

    await this.client.post("io.pocketenv.sandbox.putTailscaleAuthKey", {
      id: this.sandboxId,
      authKey: encryptedKey,
      redacted,
    });
  }
}
