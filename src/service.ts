import type { ApiClient } from "./api-client/api-client.js";
import type { ServiceView } from "./api-client/validators.js";

export class Service {
  constructor(
    private sandboxId: string,
    private client: ApiClient
  ) {}

  async add(
    name: string,
    command: string,
    options?: { description?: string; ports?: number[] }
  ): Promise<void> {
    await this.client.post(
      "io.pocketenv.service.addService",
      { service: { name, command, ...options } },
      { sandboxId: this.sandboxId }
    );
  }

  async list(): Promise<{ services: ServiceView[] }> {
    return this.client.get("io.pocketenv.service.getServices", {
      sandboxId: this.sandboxId,
    });
  }

  async start(serviceId: string): Promise<void> {
    await this.client.post("io.pocketenv.service.startService", undefined, {
      serviceId,
    });
  }

  async stop(serviceId: string): Promise<void> {
    await this.client.post("io.pocketenv.service.stopService", undefined, {
      serviceId,
    });
  }

  async restart(serviceId: string): Promise<void> {
    await this.client.post("io.pocketenv.service.restartService", undefined, {
      serviceId,
    });
  }

  async update(
    serviceId: string,
    name: string,
    command: string,
    options?: { description?: string; ports?: number[] }
  ): Promise<void> {
    await this.client.post("io.pocketenv.service.updateService", {
      service: { name, command, ...options },
    }, { serviceId });
  }

  async delete(serviceId: string): Promise<void> {
    await this.client.post("io.pocketenv.service.deleteService", undefined, {
      serviceId,
    });
  }
}
