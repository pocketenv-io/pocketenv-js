import type { ApiClient } from "./api-client/api-client.js";
import type { ListOptions, VolumeView } from "./api-client/validators.js";

export class Volume {
  constructor(
    private sandboxId: string,
    private client: ApiClient
  ) {}

  async create(name: string, options?: { path?: string; readOnly?: boolean }): Promise<void> {
    await this.client.post("io.pocketenv.volume.addVolume", {
      volume: { sandboxId: this.sandboxId, name, ...options },
    });
  }

  async list(options?: ListOptions): Promise<{ volumes: VolumeView[]; total: number }> {
    return this.client.get("io.pocketenv.volume.getVolumes", {
      sandboxId: this.sandboxId,
      limit: options?.limit,
      offset: options?.offset,
    });
  }

  async get(id: string): Promise<VolumeView> {
    const res = await this.client.get<{ volume: VolumeView }>(
      "io.pocketenv.volume.getVolume",
      { id }
    );
    return res.volume;
  }

  async update(
    id: string,
    name: string,
    options?: { path?: string; readOnly?: boolean }
  ): Promise<void> {
    await this.client.post("io.pocketenv.volume.updateVolume", {
      id,
      volume: { name, ...options },
    });
  }

  async delete(id: string): Promise<void> {
    await this.client.post("io.pocketenv.volume.deleteVolume", undefined, { id });
  }
}
