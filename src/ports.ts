import type { ApiClient } from "./api-client/api-client";
import type { PortView } from "./api-client/validators";

export class Ports {
  constructor(
    private sandboxId: string,
    private client: ApiClient
  ) {}

  async list(): Promise<PortView[]> {
    const res = await this.client.get<{ ports: PortView[] }>(
      "io.pocketenv.sandbox.getExposedPorts",
      { id: this.sandboxId }
    );
    return res.ports;
  }
}
