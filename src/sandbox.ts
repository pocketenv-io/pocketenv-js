import { ApiClient } from "./api-client/api-client.js";
import type {
  CreateSandboxOptions,
  ExecResult,
  ListOptions,
  Profile,
  SandboxView,
  SshKeysView,
} from "./api-client/validators.js";

export class SandboxBuilder {
  private options: CreateSandboxOptions & { token?: string; baseUrl?: string; storageUrl?: string; publicKey?: string };

  constructor(base: string) {
    this.options = { base };
  }

  name(name: string): this {
    this.options.name = name;
    return this;
  }

  description(description: string): this {
    this.options.description = description;
    return this;
  }

  provider(provider: string): this {
    this.options.provider = provider;
    return this;
  }

  topics(...topics: string[]): this {
    this.options.topics = topics;
    return this;
  }

  repo(repo: string): this {
    this.options.repo = repo;
    return this;
  }

  vcpus(vcpus: number): this {
    this.options.vcpus = vcpus;
    return this;
  }

  memory(memory: number): this {
    this.options.memory = memory;
    return this;
  }

  disk(disk: number): this {
    this.options.disk = disk;
    return this;
  }

  readme(readme: string): this {
    this.options.readme = readme;
    return this;
  }

  env(name: string, value: string): this {
    this.options.envs ??= [];
    this.options.envs.push({ name, value });
    return this;
  }

  secret(name: string, value: string): this {
    this.options.secrets ??= [];
    this.options.secrets.push({ name, value });
    return this;
  }

  keepAlive(keepAlive = true): this {
    this.options.keepAlive = keepAlive;
    return this;
  }

  providerOptions(opts: Record<string, unknown>): this {
    this.options.providerOptions = opts;
    return this;
  }

  token(token: string): this {
    this.options.token = token;
    return this;
  }

  baseUrl(baseUrl: string): this {
    this.options.baseUrl = baseUrl;
    return this;
  }

  create(): Promise<Sandbox> {
    return Sandbox.create(this.options);
  }
}

import { Copy } from "./copy.js";
import { Env } from "./env.js";
import { File } from "./file.js";
import { Ports } from "./ports.js";
import { Secret } from "./secret.js";
import { Service } from "./service.js";
import { SshKeys } from "./sshkeys.js";
import { Tailscale } from "./tailscale.js";
import { Volume } from "./volume.js";

const DEFAULT_BASE_URL = "https://api.pocketenv.io";
const DEFAULT_PUBLIC_KEY =
  "2bf96e12d109e6948046a7803ef1696e12c11f04f20a6ce64dbd4bcd93db9341";

export class Sandbox {
  readonly id: string;
  readonly data: SandboxView;

  readonly copy: Copy;
  readonly file: File;
  readonly volume: Volume;
  readonly env: Env;
  readonly secret: Secret;
  readonly tailscale: Tailscale;
  readonly sshKeys: SshKeys;
  readonly ports: Ports;
  readonly service: Service;

  private static _client: ApiClient | null = null;
  private static _publicKey: string | null = null;

  private constructor(
    data: SandboxView,
    private client: ApiClient,
    publicKeyHex?: string,
  ) {
    this.id = data.id;
    this.data = data;
    this.copy = new Copy(data.id, client);
    this.file = new File(data.id, client, publicKeyHex);
    this.volume = new Volume(data.id, client);
    this.env = new Env(data.id, client);
    this.secret = new Secret(data.id, client, publicKeyHex);
    this.tailscale = new Tailscale(data.id, client, publicKeyHex);
    this.sshKeys = new SshKeys(data.id, client, publicKeyHex);
    this.ports = new Ports(data.id, client);
    this.service = new Service(data.id, client);
  }

  static configure({
    token,
    baseUrl,
    storageUrl,
    publicKey,
  }: {
    token?: string;
    baseUrl?: string;
    storageUrl?: string;
    publicKey?: string;
  } = {}): void {
    if (!token && !process.env.POCKETENV_TOKEN) {
      throw new Error(
        "API token is required. Pass it to configure() or set the POCKETENV_TOKEN environment variable.",
      );
    }
    Sandbox._client = new ApiClient({
      token: token ?? process.env.POCKETENV_TOKEN!,
      baseUrl: baseUrl ?? DEFAULT_BASE_URL,
      storageUrl,
    });
    Sandbox._publicKey =
      publicKey ?? process.env.POCKETENV_PUBLIC_KEY ?? DEFAULT_PUBLIC_KEY;
  }

  private static getClient(client?: ApiClient): ApiClient {
    const c = client ?? Sandbox._client;
    if (!c) {
      throw new Error(
        "No API client configured. Call Sandbox.configure({ token }) or pass a client.",
      );
    }
    return c;
  }

  private static resolvePublicKey(override?: string): string {
    return (
      override ??
      Sandbox._publicKey ??
      process.env.POCKETENV_PUBLIC_KEY ??
      DEFAULT_PUBLIC_KEY
    );
  }

  static builder(base: string): SandboxBuilder {
    return new SandboxBuilder(base);
  }

  static async create(
    options: CreateSandboxOptions & {
      token?: string;
      baseUrl?: string;
      storageUrl?: string;
      publicKey?: string;
    },
  ): Promise<Sandbox> {
    const { token, baseUrl, storageUrl, publicKey, providerOptions, ...rest } = options;
    const client = token
      ? new ApiClient({ token, baseUrl: baseUrl ?? DEFAULT_BASE_URL, storageUrl })
      : Sandbox.getClient();
    const publicKeyHex = Sandbox.resolvePublicKey(publicKey);
    const data = await client.post<SandboxView>(
      "io.pocketenv.sandbox.createSandbox",
      { ...rest, ...providerOptions },
    );
    return new Sandbox(data, client, publicKeyHex);
  }

  static async get(id: string, client?: ApiClient): Promise<Sandbox> {
    const c = Sandbox.getClient(client);
    const data = await c.get<SandboxView>(
      "io.pocketenv.sandbox.getSandbox",
      { id },
    );
    return new Sandbox(data, c, Sandbox.resolvePublicKey());
  }

  static async list(
    options?: ListOptions & { client?: ApiClient },
  ): Promise<{ sandboxes: SandboxView[]; total: number }> {
    const { client, ...params } = options ?? {};
    const c = Sandbox.getClient(client);
    const { did } = await c.get<Profile>("io.pocketenv.actor.getProfile");
    return c.get("io.pocketenv.actor.getActorSandboxes", { did, ...params });
  }

  static async getProfile(client?: ApiClient): Promise<Profile> {
    const c = Sandbox.getClient(client);
    return c.get("io.pocketenv.actor.getProfile");
  }

  static async getTerminalToken(client?: ApiClient): Promise<string | undefined> {
    const c = Sandbox.getClient(client);
    const res = await c.get<{ token?: string }>(
      "io.pocketenv.actor.getTerminalToken",
    );
    return res.token;
  }

  async waitUntilRunning(
    options?: { timeoutMs?: number; intervalMs?: number },
  ): Promise<void> {
    const { timeoutMs = 60_000, intervalMs = 2_000 } = options ?? {};
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const data = await this.client.get<SandboxView>(
        "io.pocketenv.sandbox.getSandbox",
        { id: this.id },
      );
      if (data?.status === "RUNNING") return;
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
    throw new Error(
      `Sandbox ${this.id} did not reach RUNNING state within ${timeoutMs / 1000}s`,
    );
  }

  async start(options?: {
    repo?: string;
    keepAlive?: boolean;
  }): Promise<SandboxView> {
    return this.client.post("io.pocketenv.sandbox.startSandbox", options, {
      id: this.id,
    });
  }

  async stop(): Promise<SandboxView> {
    return this.client.post("io.pocketenv.sandbox.stopSandbox", undefined, {
      id: this.id,
    });
  }

  async delete(): Promise<SandboxView> {
    return this.client.post("io.pocketenv.sandbox.deleteSandbox", undefined, {
      id: this.id,
    });
  }

  async exec(command: string): Promise<ExecResult> {
    return this.client.post(
      "io.pocketenv.sandbox.exec",
      { command },
      { id: this.id },
    );
  }

  sh(
    strings: TemplateStringsArray | string,
    ...values: unknown[]
  ): Promise<ExecResult> {
    const command =
      typeof strings === "string"
        ? strings
        : strings.reduce((acc, str, i) => acc + str + (values[i] ?? ""), "");
    const quoted = `'${command.replace(/'/g, "'\\''")}'`;
    return this.exec(`/bin/sh -c ${quoted}`);
  }

  async expose(
    port: number,
    description?: string,
  ): Promise<{ previewUrl?: string }> {
    return this.client.post(
      "io.pocketenv.sandbox.exposePort",
      { port, description },
      { id: this.id },
    );
  }

  async unexpose(port: number): Promise<void> {
    await this.client.post(
      "io.pocketenv.sandbox.unexposePort",
      { port },
      { id: this.id },
    );
  }

  async vscode(): Promise<void> {
    await this.client.post("io.pocketenv.sandbox.exposeVscode", undefined, {
      id: this.id,
    });
  }

  async getSshKeys(): Promise<SshKeysView> {
    return this.sshKeys.get();
  }

  async putSshKey(publicKey: string): Promise<void> {
    await this.client.post(
      "io.pocketenv.sandbox.putSshKeys",
      { publicKey },
      { id: this.id },
    );
  }
}
