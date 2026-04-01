import type { ApiClient } from "./api-client/api-client";
import type { ListOptions, ServiceView } from "./api-client/validators";

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

  async list(options?: ListOptions): Promise<{ services: ServiceView[]; total: number }> {
    return this.client.get("io.pocketenv.service.getServices", {
      sandboxId: this.sandboxId,
      limit: options?.limit,
      offset: options?.offset,
    });
  }

  async start(serviceId: string): Promise<void> {
    await this.client.post("io.pocketenv.service.startService", undefined, {
      sandboxId: this.sandboxId,
      serviceId,
    });
  }

  async stop(serviceId: string): Promise<void> {
    await this.client.post("io.pocketenv.service.stopService", undefined, {
      sandboxId: this.sandboxId,
      serviceId,
    });
  }

  async restart(serviceId: string): Promise<void> {
    await this.client.post("io.pocketenv.service.restartService", undefined, {
      sandboxId: this.sandboxId,
      serviceId,
    });
  }

  async update(
    id: string,
    name: string,
    command: string,
    options?: { description?: string; ports?: number[] }
  ): Promise<void> {
    await this.client.post("io.pocketenv.service.updateService", {
      id,
      service: { name, command, ...options },
    });
  }

  async delete(serviceId: string): Promise<void> {
    await this.client.post("io.pocketenv.service.deleteService", undefined, {
      sandboxId: this.sandboxId,
      serviceId,
    });
  }
}
