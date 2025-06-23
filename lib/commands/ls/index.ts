import { readdir, stat } from "node:fs/promises";
import { join, resolve, isAbsolute } from "node:path";
import { FileEntry } from "../../types";

export default async (
  rootDirectory: string,
  args: string[]
): Promise<FileEntry[]> => {
  // Parse arguments to separate flags from path
  const flags = args.filter((arg) => arg.startsWith("-"));
  const pathArgs = args.filter((arg) => !arg.startsWith("-"));

  if (pathArgs.length === 0) {
    throw new Error("ls: missing operand (path required)");
  }

  const targetPath = pathArgs[0];

  if (!isAbsolute(targetPath)) {
    throw new Error("ls: only absolute paths are supported");
  }

  const resolvedPath = resolve(targetPath);

  if (!resolvedPath.startsWith(resolve(rootDirectory))) {
    throw new Error(
      `ls: ${targetPath}: Permission denied (outside root directory)`
    );
  }

  try {
    const files = await readdir(resolvedPath);
    const showHidden =
      flags.includes("-a") || flags.includes("-la") || flags.includes("-al");
    const longFormat =
      flags.includes("-l") || flags.includes("-la") || flags.includes("-al");

    let filteredFiles = files;
    if (!showHidden) {
      filteredFiles = files.filter((file) => !file.startsWith("."));
    }

    const fileEntries = await Promise.all(
      filteredFiles.map(async (file): Promise<FileEntry> => {
        const filePath = join(resolvedPath, file);
        const stats = await stat(filePath);
        const type = stats.isDirectory() ? "directory" : "file";
        
        const entry: FileEntry = {
          name: file,
          type: type as 'file' | 'directory'
        };

        if (longFormat) {
          const octalMode = stats.mode.toString(8).slice(-3);
          const permString = octalMode.split('').map(digit => {
            const num = parseInt(digit);
            return ((num & 4) ? 'r' : '-') + ((num & 2) ? 'w' : '-') + ((num & 1) ? 'x' : '-');
          }).join('');
          entry.permissions = `${type === 'directory' ? 'd' : '-'}${permString}`;
          entry.size = stats.size;
          entry.date = stats.mtime.toISOString().split('T')[0]; // YYYY-MM-DD format
        }

        return entry;
      })
    );

    return fileEntries;
  } catch (error) {
    throw new Error(
      `ls: cannot access '${targetPath}': ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};
