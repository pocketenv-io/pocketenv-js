import ignore from "ignore";
import { readFile, readdir } from "node:fs/promises";
import { join, dirname, basename } from "node:path";

const IGNORE_FILE_NAMES = [
  ".pocketenvignore",
  ".gitignore",
  ".npmignore",
  ".dockerignore",
];

export type IgnoreContext = {
  dir: string;
  ig: ReturnType<typeof ignore>;
};

export async function loadIgnoreFiles(root: string): Promise<IgnoreContext[]> {
  const contexts: IgnoreContext[] = [];
  const ignoreFileSet = new Set(IGNORE_FILE_NAMES);
  const candidates = (await readdir(root, { recursive: true })).filter(
    (entry) => ignoreFileSet.has(basename(entry)),
  );

  for (const file of candidates) {
    try {
      const ig = ignore();
      ig.add(await readFile(join(root, file), "utf8"));
      const dir = dirname(file);
      contexts.push({ dir: dir === "." ? "" : dir, ig });
    } catch {
      // skip unreadable files
    }
  }

  return contexts;
}

export function makeIsIgnored(contexts: IgnoreContext[]) {
  return function isIgnored(path: string): boolean {
    return contexts.some(({ dir, ig }) => {
      const rel =
        dir === ""
          ? path
          : path.startsWith(dir + "/")
            ? path.slice(dir.length + 1)
            : null;

      if (rel === null) return false;

      const parts = rel.split("/");
      return parts.some((_, i) => {
        const sub = parts.slice(i).join("/");
        return ig.ignores(sub) || ig.ignores(sub + "/");
      });
    });
  };
}
