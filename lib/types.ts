export interface FileEntry {
  name: string;
  type: 'file' | 'directory';
  permissions?: string;
  size?: number;
  date?: string;
}

export type CommandExecutor = (
  commandString: string
) => Promise<string | ReadableStream | FileEntry[] | void>;