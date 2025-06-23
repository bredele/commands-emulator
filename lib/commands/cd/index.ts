import { resolve, isAbsolute } from "node:path";
import { existsSync, statSync } from "node:fs";

export default async (
  rootDirectory: string,
  args: string[]
): Promise<string> => {
  if (args.length === 0) {
    return resolve(rootDirectory);
  }

  const targetPath = args[0];

  if (!isAbsolute(targetPath)) {
    throw new Error("cd: only absolute paths are supported");
  }

  const resolvedPath = resolve(targetPath);

  if (!resolvedPath.startsWith(resolve(rootDirectory))) {
    throw new Error(
      `cd: ${targetPath}: Permission denied (outside root directory)`
    );
  }

  if (!existsSync(resolvedPath)) {
    throw new Error(`cd: ${targetPath}: No such file or directory`);
  }

  const stats = statSync(resolvedPath);
  if (!stats.isDirectory()) {
    throw new Error(`cd: ${targetPath}: Not a directory`);
  }

  return resolvedPath;
};
