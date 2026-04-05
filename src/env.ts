import type { ApiClient } from "./api-client/api-client.js";
import type { ListOptions, VariableView } from "./api-client/validators.js";

export class Env {
  constructor(
    private sandboxId: string,
    private client: ApiClient
  ) {}

  async put(name: string, value: string): Promise<void> {
    await this.client.post("io.pocketenv.variable.addVariable", {
      variable: { sandboxId: this.sandboxId, name, value },
    });
  }

  async list(options?: ListOptions): Promise<{ variables: VariableView[]; total: number }> {
    return this.client.get("io.pocketenv.variable.getVariables", {
      sandboxId: this.sandboxId,
      limit: options?.limit,
      offset: options?.offset,
    });
  }

  async get(id: string): Promise<VariableView> {
    const res = await this.client.get<{ variable: VariableView }>(
      "io.pocketenv.variable.getVariable",
      { id }
    );
    return res.variable;
  }

  async update(id: string, name: string, value: string): Promise<void> {
    await this.client.post("io.pocketenv.variable.updateVariable", {
      id,
      variable: { sandboxId: this.sandboxId, name, value },
    });
  }

  async delete(id: string): Promise<void> {
    await this.client.post("io.pocketenv.variable.deleteVariable", undefined, { id });
  }
}
