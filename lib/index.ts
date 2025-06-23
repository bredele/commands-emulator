import { join } from "node:path";
import { access } from "node:fs/promises";
import { FileEntry } from "./types";

export { FileEntry };

export default async function emulator(
  rootDirectory: string,
  commandString: string
): Promise<string | ReadableStream | FileEntry[] | void> {
  const parts = commandString.trim().split(/\s+/);
  const commandName = parts[0];
  const args = parts.slice(1);

  if (!commandName) {
    throw new Error("No command provided");
  }

  try {
    const commandPath = join(__dirname, "commands", commandName, "index.js");

    try {
      await access(commandPath);
    } catch {
      throw new Error(`bash: ${commandName}: command not found`);
    }

    const commandModule = await import(commandPath);
    const commandFunction = commandModule.default;

    if (typeof commandFunction !== "function") {
      throw new Error(`Invalid command module for '${commandName}'`);
    }

    return await commandFunction(rootDirectory, args);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to execute command '${commandName}'`);
  }
}
