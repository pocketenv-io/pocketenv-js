import {
  afterEach,
  beforeEach,
  describe,
  expect,
  mock,
  spyOn,
  test,
} from "bun:test";
import { ApiClient } from "./api-client/api-client";
import { Sandbox } from "./sandbox";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockSandboxView(overrides = {}) {
  return {
    id: "sandbox-1",
    name: "my-sandbox",
    provider: "aws",
    createdAt: "2024-01-01T00:00:00Z",
    status: "running",
    ...overrides,
  };
}

function makeFetchMock(responses: Array<{ ok: boolean; body: unknown }>) {
  const queue = [...responses];
  return mock(async () => {
    const next = queue.shift();
    if (!next) throw new Error("No more mock responses");
    return {
      ok: next.ok,
      json: async () => next.body,
      text: async () =>
        next.body !== undefined ? JSON.stringify(next.body) : "",
    } as Response;
  });
}

// ---------------------------------------------------------------------------
// Sandbox static methods
// ---------------------------------------------------------------------------

describe("Sandbox.configure / getClient", () => {
  beforeEach(() => {
    // Reset the static client between tests
    (Sandbox as unknown as { _client: null })._client = null;
  });

  test("configure sets a global client", () => {
    Sandbox.configure({ token: "tok123" });
    expect(
      (Sandbox as unknown as { _client: ApiClient | null })._client,
    ).not.toBeNull();
  });

  test("create throws when no client is configured and no token is passed", async () => {
    await expect(Sandbox.create({ base: "openclaw" })).rejects.toThrow(
      "No API client configured",
    );
  });
});

describe("Sandbox.create", () => {
  let fetchSpy: ReturnType<typeof spyOn>;

  afterEach(() => {
    fetchSpy?.mockRestore();
    (Sandbox as unknown as { _client: null })._client = null;
  });

  test("creates a sandbox via inline token", async () => {
    const view = mockSandboxView();
    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify(view),
    } as Response);

    const sandbox = await Sandbox.create({ base: "openclaw", token: "tok" });

    expect(sandbox.id).toBe("sandbox-1");
    expect(sandbox.data.name).toBe("my-sandbox");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("createSandbox");
  });

  test("creates a sandbox using configured client", async () => {
    const view = mockSandboxView({ id: "sb-2" });
    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify(view),
    } as Response);

    Sandbox.configure({ token: "tok" });
    const sandbox = await Sandbox.create({ base: "openclaw" });

    expect(sandbox.id).toBe("sb-2");
  });

  test("creates a sandbox with a custom baseUrl", async () => {
    const view = mockSandboxView();
    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify(view),
    } as Response);

    await Sandbox.create({
      base: "openclaw",
      token: "tok",
      baseUrl: "https://custom.api",
    });

    const [url] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("https://custom.api");
  });
});

describe("Sandbox.get", () => {
  let fetchSpy: ReturnType<typeof spyOn>;

  afterEach(() => {
    fetchSpy?.mockRestore();
    (Sandbox as unknown as { _client: null })._client = null;
  });

  test("fetches a sandbox by id", async () => {
    const view = mockSandboxView({ id: "sb-get" });
    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sandbox: view }),
    } as Response);

    Sandbox.configure({ token: "tok" });
    const sandbox = await Sandbox.get("sb-get");

    expect(sandbox.id).toBe("sb-get");
    const [url] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("getSandbox");
    expect(url).toContain("id=sb-get");
  });
});

describe("Sandbox.list", () => {
  let fetchSpy: ReturnType<typeof spyOn>;

  afterEach(() => {
    fetchSpy?.mockRestore();
    (Sandbox as unknown as { _client: null })._client = null;
  });

  test("lists sandboxes", async () => {
    const views = [mockSandboxView(), mockSandboxView({ id: "sb-2" })];
    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sandboxes: views, total: 2 }),
    } as Response);

    Sandbox.configure({ token: "tok" });
    const result = await Sandbox.list();

    expect(result.total).toBe(2);
    expect(result.sandboxes).toHaveLength(2);
  });

  test("passes pagination params", async () => {
    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sandboxes: [], total: 0 }),
    } as Response);

    Sandbox.configure({ token: "tok" });
    await Sandbox.list({ limit: 10, offset: 20 });

    const [url] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("limit=10");
    expect(url).toContain("offset=20");
  });
});

// ---------------------------------------------------------------------------
// Sandbox instance methods
// ---------------------------------------------------------------------------

describe("Sandbox instance methods", () => {
  let fetchSpy: ReturnType<typeof spyOn>;
  let sandbox: Sandbox;
  const sandboxView = mockSandboxView({ id: "sb-inst" });

  beforeEach(async () => {
    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify(sandboxView),
    } as Response);
    sandbox = await Sandbox.create({ base: "openclaw", token: "tok" });
    fetchSpy.mockRestore();
  });

  afterEach(() => {
    fetchSpy?.mockRestore();
    (Sandbox as unknown as { _client: null })._client = null;
  });

  test("start calls startSandbox", async () => {
    const updated = mockSandboxView({ id: "sb-inst", status: "started" });
    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify(updated),
    } as Response);

    const result = await sandbox.start({ keepAlive: true });

    expect(result.status).toBe("started");
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("startSandbox");
    expect(url).toContain("id=sb-inst");
    expect(JSON.parse(init.body as string)).toEqual({ keepAlive: true });
  });

  test("stop calls stopSandbox", async () => {
    const updated = mockSandboxView({ id: "sb-inst", status: "stopped" });
    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify(updated),
    } as Response);

    const result = await sandbox.stop();

    expect(result.status).toBe("stopped");
    const [url] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("stopSandbox");
  });

  test("delete calls deleteSandbox", async () => {
    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify(sandboxView),
    } as Response);

    await sandbox.delete();

    const [url] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("deleteSandbox");
  });

  test("exec sends command and returns ExecResult", async () => {
    const execResult = { stdout: "hello\n", stderr: "", exitCode: 0 };
    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify(execResult),
    } as Response);

    const result = await sandbox.exec("echo hello");

    expect(result.stdout).toBe("hello\n");
    expect(result.exitCode).toBe(0);
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("exec");
    expect(JSON.parse(init.body as string)).toEqual({ command: "echo hello" });
  });

  test("sh wraps command in /bin/sh -c", async () => {
    const execResult = { stdout: "ok\n", stderr: "", exitCode: 0 };
    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify(execResult),
    } as Response);

    await sandbox.sh("ls -la");

    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.command).toBe('/bin/sh -c "ls -la"');
  });

  test("expose calls exposePort and returns previewUrl", async () => {
    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({ previewUrl: "https://preview.example.com" }),
    } as Response);

    const result = await sandbox.expose(3000, "web");

    expect(result.previewUrl).toBe("https://preview.example.com");
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("exposePort");
    expect(JSON.parse(init.body as string)).toEqual({
      port: 3000,
      description: "web",
    });
  });

  test("unexpose calls unexposePort", async () => {
    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      text: async () => "",
    } as Response);

    await sandbox.unexpose(3000);

    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("unexposePort");
    expect(JSON.parse(init.body as string)).toEqual({ port: 3000 });
  });

  test("vscode calls exposeVscode", async () => {
    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      text: async () => "",
    } as Response);

    await sandbox.vscode();

    const [url] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("exposeVscode");
  });

  test("getSshKeys returns key view", async () => {
    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ publicKey: "ssh-rsa AAAA..." }),
    } as Response);

    const keys = await sandbox.getSshKeys();

    expect(keys.publicKey).toBe("ssh-rsa AAAA...");
    const [url] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("getSshKeys");
  });

  test("putSshKey sends public key", async () => {
    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      text: async () => "",
    } as Response);

    await sandbox.putSshKey("ssh-rsa BBBB...");

    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("putSshKeys");
    expect(JSON.parse(init.body as string)).toEqual({
      publicKey: "ssh-rsa BBBB...",
    });
  });
});

// ---------------------------------------------------------------------------
// Sub-resource: File
// ---------------------------------------------------------------------------

describe("sandbox.file", () => {
  let fetchSpy: ReturnType<typeof spyOn>;
  let sandbox: Sandbox;

  beforeEach(async () => {
    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify(mockSandboxView()),
    } as Response);
    sandbox = await Sandbox.create({ base: "openclaw", token: "tok" });
    fetchSpy.mockRestore();
  });

  afterEach(() => {
    fetchSpy?.mockRestore();
  });

  test("write sends file data", async () => {
    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      text: async () => "",
    } as Response);

    await sandbox.file.write("/tmp/foo.txt", "hello world");

    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("addFile");
    const body = JSON.parse(init.body as string);
    expect(body.file.path).toBe("/tmp/foo.txt");
    expect(body.file.content).toBe("hello world");
  });

  test("list returns files", async () => {
    const fileView = { id: "f1", path: "/a.txt", createdAt: "", updatedAt: "" };
    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ files: [fileView], total: 1 }),
    } as Response);

    const result = await sandbox.file.list();

    expect(result.total).toBe(1);
    expect(result.files[0].path).toBe("/a.txt");
  });

  test("get returns a single file", async () => {
    const fileView = { id: "f2", path: "/b.txt", createdAt: "", updatedAt: "" };
    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ file: fileView }),
    } as Response);

    const file = await sandbox.file.get("f2");

    expect(file.id).toBe("f2");
  });

  test("delete sends deleteFile", async () => {
    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      text: async () => "",
    } as Response);

    await sandbox.file.delete("f3");

    const [url] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("deleteFile");
    expect(url).toContain("id=f3");
  });
});

// ---------------------------------------------------------------------------
// Sub-resource: Env
// ---------------------------------------------------------------------------

describe("sandbox.env", () => {
  let fetchSpy: ReturnType<typeof spyOn>;
  let sandbox: Sandbox;

  beforeEach(async () => {
    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify(mockSandboxView()),
    } as Response);
    sandbox = await Sandbox.create({ base: "openclaw", token: "tok" });
    fetchSpy.mockRestore();
  });

  afterEach(() => {
    fetchSpy?.mockRestore();
  });

  test("put sends variable", async () => {
    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      text: async () => "",
    } as Response);

    await sandbox.env.put("NODE_ENV", "production");

    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("addVariable");
    const body = JSON.parse(init.body as string);
    expect(body.variable.name).toBe("NODE_ENV");
    expect(body.variable.value).toBe("production");
  });

  test("list returns variables", async () => {
    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        variables: [{ id: "v1", name: "FOO", value: "bar" }],
        total: 1,
      }),
    } as Response);

    const result = await sandbox.env.list();

    expect(result.total).toBe(1);
    expect(result.variables[0].name).toBe("FOO");
  });

  test("delete sends deleteVariable", async () => {
    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      text: async () => "",
    } as Response);

    await sandbox.env.delete("v1");

    const [url] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("deleteVariable");
    expect(url).toContain("id=v1");
  });
});

// ---------------------------------------------------------------------------
// Sub-resource: Secret
// ---------------------------------------------------------------------------

describe("sandbox.secret", () => {
  let fetchSpy: ReturnType<typeof spyOn>;
  let sandbox: Sandbox;

  beforeEach(async () => {
    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify(mockSandboxView()),
    } as Response);
    sandbox = await Sandbox.create({ base: "openclaw", token: "tok" });
    fetchSpy.mockRestore();
  });

  afterEach(() => {
    fetchSpy?.mockRestore();
  });

  test("put sends secret", async () => {
    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      text: async () => "",
    } as Response);

    await sandbox.secret.put("API_KEY", "supersecret");

    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("addSecret");
    const body = JSON.parse(init.body as string);
    expect(body.secret.name).toBe("API_KEY");
    expect(body.secret.value).toBe("supersecret");
  });

  test("list returns secrets", async () => {
    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        secrets: [{ id: "s1", name: "API_KEY" }],
        total: 1,
      }),
    } as Response);

    const result = await sandbox.secret.list();

    expect(result.total).toBe(1);
    expect(result.secrets[0].name).toBe("API_KEY");
  });

  test("delete sends deleteSecret", async () => {
    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      text: async () => "",
    } as Response);

    await sandbox.secret.delete("s1");

    const [url] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("deleteSecret");
    expect(url).toContain("id=s1");
  });
});

// ---------------------------------------------------------------------------
// Sub-resource: Volume
// ---------------------------------------------------------------------------

describe("sandbox.volume", () => {
  let fetchSpy: ReturnType<typeof spyOn>;
  let sandbox: Sandbox;

  beforeEach(async () => {
    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify(mockSandboxView()),
    } as Response);
    sandbox = await Sandbox.create({ base: "openclaw", token: "tok" });
    fetchSpy.mockRestore();
  });

  afterEach(() => {
    fetchSpy?.mockRestore();
  });

  test("create sends volume data", async () => {
    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      text: async () => "",
    } as Response);

    await sandbox.volume.create("my-vol", { path: "/data", readOnly: false });

    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("addVolume");
    const body = JSON.parse(init.body as string);
    expect(body.volume.name).toBe("my-vol");
    expect(body.volume.path).toBe("/data");
  });

  test("list returns volumes", async () => {
    const vol = { id: "vol1", name: "my-vol", createdAt: "", updatedAt: "" };
    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ volumes: [vol], total: 1 }),
    } as Response);

    const result = await sandbox.volume.list();

    expect(result.total).toBe(1);
    expect(result.volumes[0].name).toBe("my-vol");
  });

  test("delete sends deleteVolume", async () => {
    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      text: async () => "",
    } as Response);

    await sandbox.volume.delete("vol1");

    const [url] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("deleteVolume");
    expect(url).toContain("id=vol1");
  });
});

// ---------------------------------------------------------------------------
// Sub-resource: Ports
// ---------------------------------------------------------------------------

describe("sandbox.ports", () => {
  let fetchSpy: ReturnType<typeof spyOn>;
  let sandbox: Sandbox;

  beforeEach(async () => {
    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify(mockSandboxView()),
    } as Response);
    sandbox = await Sandbox.create({ base: "openclaw", token: "tok" });
    fetchSpy.mockRestore();
  });

  afterEach(() => {
    fetchSpy?.mockRestore();
  });

  test("list returns exposed ports", async () => {
    const ports = [{ port: 3000, previewUrl: "https://preview.io" }];
    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ports }),
    } as Response);

    const result = await sandbox.ports.list();

    expect(result).toHaveLength(1);
    expect(result[0].port).toBe(3000);
    const [url] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("getExposedPorts");
  });
});

// ---------------------------------------------------------------------------
// Sub-resource: Service
// ---------------------------------------------------------------------------

describe("sandbox.service", () => {
  let fetchSpy: ReturnType<typeof spyOn>;
  let sandbox: Sandbox;

  beforeEach(async () => {
    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify(mockSandboxView()),
    } as Response);
    sandbox = await Sandbox.create({ base: "openclaw", token: "tok" });
    fetchSpy.mockRestore();
  });

  afterEach(() => {
    fetchSpy?.mockRestore();
  });

  test("add sends service data", async () => {
    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      text: async () => "",
    } as Response);

    await sandbox.service.add("web", "node server.js", { ports: [3000] });

    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("addService");
    const body = JSON.parse(init.body as string);
    expect(body.service.name).toBe("web");
    expect(body.service.command).toBe("node server.js");
    expect(body.service.ports).toEqual([3000]);
  });

  test("start sends startService", async () => {
    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      text: async () => "",
    } as Response);

    await sandbox.service.start("svc-1");

    const [url] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("startService");
    expect(url).toContain("serviceId=svc-1");
  });

  test("stop sends stopService", async () => {
    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      text: async () => "",
    } as Response);

    await sandbox.service.stop("svc-1");

    const [url] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("stopService");
  });

  test("restart sends restartService", async () => {
    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      text: async () => "",
    } as Response);

    await sandbox.service.restart("svc-1");

    const [url] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("restartService");
  });

  test("delete sends deleteService", async () => {
    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      text: async () => "",
    } as Response);

    await sandbox.service.delete("svc-1");

    const [url] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("deleteService");
  });
});

// ---------------------------------------------------------------------------
// Sub-resource: Tailscale
// ---------------------------------------------------------------------------

describe("sandbox.tailscale", () => {
  let fetchSpy: ReturnType<typeof spyOn>;
  let sandbox: Sandbox;

  beforeEach(async () => {
    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify(mockSandboxView()),
    } as Response);
    sandbox = await Sandbox.create({ base: "openclaw", token: "tok" });
    fetchSpy.mockRestore();
  });

  afterEach(() => {
    fetchSpy?.mockRestore();
  });

  test("getAuthKey returns auth key", async () => {
    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ authKey: "tskey-abc123" }),
    } as Response);

    const result = await sandbox.tailscale.getAuthKey();

    expect(result.authKey).toBe("tskey-abc123");
    const [url] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("getTailscaleAuthKey");
  });

  test("setAuthKey sends auth key", async () => {
    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      text: async () => "",
    } as Response);

    await sandbox.tailscale.setAuthKey("tskey-abc123");

    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("putTailscaleAuthKey");
    expect(JSON.parse(init.body as string)).toEqual({
      authKey: "tskey-abc123",
    });
  });
});

// ---------------------------------------------------------------------------
// ApiClient error handling
// ---------------------------------------------------------------------------

describe("ApiClient error handling", () => {
  let fetchSpy: ReturnType<typeof spyOn>;

  afterEach(() => {
    fetchSpy?.mockRestore();
    (Sandbox as unknown as { _client: null })._client = null;
  });

  test("get throws on non-ok response", async () => {
    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: async () => "not found",
    } as Response);

    Sandbox.configure({ token: "tok" });
    await expect(Sandbox.get("missing")).rejects.toThrow("API error 404");
  });

  test("create throws on non-ok response", async () => {
    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => "unauthorized",
    } as Response);

    await expect(
      Sandbox.create({ base: "openclaw", token: "bad" }),
    ).rejects.toThrow("API error 401");
  });
});
