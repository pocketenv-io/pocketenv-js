import * as tar from "tar";
import crypto from "node:crypto";
import { lstat, readdir, readFile, writeFile, mkdir, unlink } from "node:fs/promises";
import { join } from "node:path";
import type { ApiClient } from "./api-client/api-client.js";
import { loadIgnoreFiles, makeIsIgnored } from "./ignore.js";

export class Copy {
  constructor(
    private sandboxId: string,
    private client: ApiClient,
  ) {}

  /**
   * Upload a local file or directory to a path inside this sandbox.
   * Equivalent to: `pocketenv cp ./local sandboxId:/remote`
   */
  async upload(
    localPath: string,
    sandboxPath: string,
    options?: { signal?: AbortSignal },
  ): Promise<void> {
    const signal = options?.signal;
    const archive = await compressDirectory(localPath);
    try {
      signal?.throwIfAborted();
      const uuid = await this.uploadToStorage(archive, signal);
      await this.client.post("io.pocketenv.sandbox.pullDirectory", {
        uuid,
        sandboxId: this.sandboxId,
        directoryPath: sandboxPath,
      });
    } finally {
      await unlink(archive).catch(() => undefined);
    }
  }

  /**
   * Download a path from inside this sandbox to a local directory.
   * Equivalent to: `pocketenv cp sandboxId:/remote ./local`
   */
  async download(
    sandboxPath: string,
    localPath: string,
    options?: { signal?: AbortSignal },
  ): Promise<void> {
    const signal = options?.signal;
    const { uuid } = await this.client.post<{ uuid: string }>(
      "io.pocketenv.sandbox.pushDirectory",
      { sandboxId: this.sandboxId, directoryPath: sandboxPath },
    );

    signal?.throwIfAborted();

    const archive = `${crypto.randomBytes(16).toString("hex")}.tar.gz`;
    try {
      await this.downloadFromStorage(uuid, archive, signal);
      await decompressDirectory(archive, localPath);
    } finally {
      await unlink(archive).catch(() => undefined);
    }
  }

  /**
   * Copy a path from inside this sandbox to a path inside another sandbox.
   * Equivalent to: `pocketenv cp srcId:/path dstId:/path`
   */
  async to(
    destinationSandboxId: string,
    sourcePath: string,
    destPath: string,
    options?: { signal?: AbortSignal },
  ): Promise<void> {
    const signal = options?.signal;
    const { uuid } = await this.client.post<{ uuid: string }>(
      "io.pocketenv.sandbox.pushDirectory",
      { sandboxId: this.sandboxId, directoryPath: sourcePath },
    );

    signal?.throwIfAborted();

    await this.client.post("io.pocketenv.sandbox.pullDirectory", {
      uuid,
      sandboxId: destinationSandboxId,
      directoryPath: destPath,
    });
  }

  private async uploadToStorage(
    filePath: string,
    signal?: AbortSignal,
  ): Promise<string> {
    const fileBuffer = await readFile(filePath);
    const form = new FormData();
    form.append(
      "file",
      new Blob([fileBuffer], { type: "application/gzip" }),
      "archive.tar.gz",
    );

    const response = await fetch(`${this.client.storageUrl}/cp`, {
      method: "POST",
      signal,
      headers: { Authorization: this.client.authHeader() },
      body: form,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as { uuid: string };
    return data.uuid;
  }

  private async downloadFromStorage(
    uuid: string,
    destFile: string,
    signal?: AbortSignal,
  ): Promise<void> {
    const response = await fetch(`${this.client.storageUrl}/cp/${uuid}`, {
      signal,
      headers: { Authorization: this.client.authHeader() },
    });

    if (!response.ok) {
      throw new Error(
        `Download failed: ${response.status} ${response.statusText}`,
      );
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    await writeFile(destFile, buffer);
  }
}

async function compressDirectory(source: string): Promise<string> {
  const stat = await lstat(source);
  const output = `${crypto.createHash("sha256").update(source).digest("hex")}.tar.gz`;

  if (stat.isFile()) {
    await tar.create({ file: output, gzip: { level: 6 } }, [source]);
    return output;
  }

  const isIgnored = makeIsIgnored(await loadIgnoreFiles(source));
  const files = (
    await Promise.all(
      (await readdir(source, { recursive: true })).map(async (entry) => {
        if (isIgnored(entry)) return null;
        const s = await lstat(join(source, entry));
        if (s.isDirectory() || s.isSymbolicLink()) return null;
        return entry;
      }),
    )
  ).filter((f): f is string => f !== null);

  await tar.create(
    { cwd: source, file: output, portable: true, gzip: { level: 6 } },
    files,
  );

  return output;
}

async function decompressDirectory(archive: string, destination: string): Promise<void> {
  await mkdir(destination, { recursive: true });
  await tar.extract({ file: archive, cwd: destination });
}
