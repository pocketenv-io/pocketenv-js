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
  uri?: string;
  baseSandbox?: string;
  status?: string;
  startedAt?: string;
}

export interface SecretView {
  id: string;
  name: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface PortView {
  port: number;
  previewUrl?: string;
}

export interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface SshKeysView {
  publicKey?: string;
}

export interface TailscaleAuthKeyView {
  authKey?: string;
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
}

export interface ListOptions {
  limit?: number;
  offset?: number;
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
