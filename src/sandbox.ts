import { ApiClient } from "./api-client/api-client";
import type {
  CreateSandboxOptions,
  ExecResult,
  ListOptions,
  SandboxView,
  SshKeysView,
} from "./api-client/validators";

export class SandboxBuilder {
  private options: CreateSandboxOptions & { token?: string; baseUrl?: string };

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
import { Env } from "./env";
import { File } from "./file";
import { Ports } from "./ports";
import { Secret } from "./secret";
import { Service } from "./service";
import { Tailscale } from "./tailscale";
import { Volume } from "./volume";

const DEFAULT_BASE_URL = "https://api.pocketenv.io";

export class Sandbox {
  readonly id: string;
  readonly data: SandboxView;

  readonly file: File;
  readonly volume: Volume;
  readonly env: Env;
  readonly secret: Secret;
  readonly tailscale: Tailscale;
  readonly ports: Ports;
  readonly service: Service;

  private static _client: ApiClient | null = null;

  private constructor(
    data: SandboxView,
    private client: ApiClient,
  ) {
    this.id = data.id;
    this.data = data;
    this.file = new File(data.id, client);
    this.volume = new Volume(data.id, client);
    this.env = new Env(data.id, client);
    this.secret = new Secret(data.id, client);
    this.tailscale = new Tailscale(data.id, client);
    this.ports = new Ports(data.id, client);
    this.service = new Service(data.id, client);
  }

  static configure({
    token,
    baseUrl,
  }: {
    token: string;
    baseUrl?: string;
  }): void {
    Sandbox._client = new ApiClient({
      token,
      baseUrl: baseUrl ?? DEFAULT_BASE_URL,
    });
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

  static builder(base: string): SandboxBuilder {
    return new SandboxBuilder(base);
  }

  static async create(
    options: CreateSandboxOptions & { token?: string; baseUrl?: string },
  ): Promise<Sandbox> {
    const { token, baseUrl, ...body } = options;
    const client = token
      ? new ApiClient({ token, baseUrl: baseUrl ?? DEFAULT_BASE_URL })
      : Sandbox.getClient();
    const data = await client.post<SandboxView>(
      "io.pocketenv.sandbox.createSandbox",
      body,
    );
    return new Sandbox(data, client);
  }

  static async get(id: string, client?: ApiClient): Promise<Sandbox> {
    const c = Sandbox.getClient(client);
    const res = await c.get<{ sandbox: SandboxView }>(
      "io.pocketenv.sandbox.getSandbox",
      { id },
    );
    return new Sandbox(res.sandbox, c);
  }

  static async list(
    options?: ListOptions & { client?: ApiClient },
  ): Promise<{ sandboxes: SandboxView[]; total: number }> {
    const { client, ...params } = options ?? {};
    const c = Sandbox.getClient(client);
    return c.get("io.pocketenv.sandbox.getSandboxes", params);
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
    return this.client.get("io.pocketenv.sandbox.getSshKeys", { id: this.id });
  }

  async putSshKey(publicKey: string): Promise<void> {
    await this.client.post(
      "io.pocketenv.sandbox.putSshKeys",
      { publicKey },
      { id: this.id },
    );
  }
}
