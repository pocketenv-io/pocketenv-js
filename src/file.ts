import type { ApiClient } from "./api-client/api-client.js";
import type { FileView, ListOptions } from "./api-client/validators.js";

export class File {
  constructor(
    private sandboxId: string,
    private client: ApiClient
  ) {}

  async write(path: string, content: string): Promise<void> {
    await this.client.post("io.pocketenv.file.addFile", {
      file: { sandboxId: this.sandboxId, path, content },
    });
  }

  async list(options?: ListOptions): Promise<{ files: FileView[]; total: number }> {
    return this.client.get("io.pocketenv.file.getFiles", {
      sandboxId: this.sandboxId,
      limit: options?.limit,
      offset: options?.offset,
    });
  }

  async get(id: string): Promise<FileView> {
    const res = await this.client.get<{ file: FileView }>(
      "io.pocketenv.file.getFile",
      { id }
    );
    return res.file;
  }

  async update(id: string, path: string, content: string): Promise<void> {
    await this.client.post("io.pocketenv.file.updateFile", {
      id,
      file: { path, content },
    });
  }

  async delete(id: string): Promise<void> {
    await this.client.post("io.pocketenv.file.deleteFile", undefined, { id });
  }
}
