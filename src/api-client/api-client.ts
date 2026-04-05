const DEFAULT_STORAGE_URL = "https://sandbox.pocketenv.io";

export class ApiClient {
  readonly baseUrl: string;
  readonly storageUrl: string;
  private token: string;

  constructor({
    baseUrl,
    token,
    storageUrl,
  }: {
    baseUrl: string;
    token: string;
    storageUrl?: string;
  }) {
    this.baseUrl = baseUrl;
    this.token = token;
    this.storageUrl = storageUrl ?? DEFAULT_STORAGE_URL;
  }

  authHeader(): string {
    return `Bearer ${this.token}`;
  }

  async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
    const url = new URL(`/xrpc/${endpoint}`, this.baseUrl);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${this.token}` },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API error ${res.status}: ${text}`);
    }
    return res.json() as Promise<T>;
  }

  async post<T>(
    endpoint: string,
    body?: unknown,
    params?: Record<string, unknown>
  ): Promise<T> {
    const url = new URL(`/xrpc/${endpoint}`, this.baseUrl);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }
    const res = await fetch(url.toString(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API error ${res.status}: ${text}`);
    }
    const text = await res.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }
}
