export interface SandboxView {
  id: string;
  name: string;
  provider: string;
  description?: string;
  website?: string;
  logo?: string;
  topics?: string[];
  repo?: string;
  readme?: string;
  vcpus?: number;
  memory?: number;
  disk?: number;
  ports?: number[];
  installs?: number;
  createdAt: string;
  baseSandbox?: string;
  status?: string;
  startedAt?: string;
  timeout?: number;
  displayName?: string;
  uri?: string;
}

export interface SecretView {
  id: string;
  name: string;
  createdAt?: string;
}

export interface VariableView {
  id: string;
  name: string;
  value: string;
}

export interface FileView {
  id: string;
  path: string;
  createdAt: string;
  updatedAt: string;
}

export interface VolumeView {
  id: string;
  name: string;
  path?: string;
  readOnly?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceView {
  id: string;
  name: string;
  command: string;
  description?: string;
  ports?: number[];
  status?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PortView {
  port: number;
  description?: string;
  previewUrl?: string;
}

export interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface SshKeysView {
  id?: string;
  publicKey?: string;
  privateKey?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SSHKeyPair {
  publicKey: string;
  privateKey: string;
}

export interface TailscaleAuthKeyView {
  id?: string;
  authKey?: string;
  redacted?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSandboxOptions {
  base: string;
  name?: string;
  description?: string;
  provider?: string;
  topics?: string[];
  repo?: string;
  vcpus?: number;
  memory?: number;
  disk?: number;
  readme?: string;
  secrets?: Array<{ name: string; value: string }>;
  envs?: Array<{ name: string; value: string }>;
  keepAlive?: boolean;
  providerOptions?: Record<string, unknown>;
}

export interface ListOptions {
  limit?: number;
  offset?: number;
  isRunning?: boolean;
}

export type Profile = {
  id: string;
  did: string;
  handle: string;
  displayName: string;
  avatar: string;
  createdAt: string;
  updatedAt: string;
};
