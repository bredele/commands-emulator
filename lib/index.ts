import { join } from "node:path";
import { access } from "node:fs/promises";
import { FileEntry, CommandExecutor } from "./types";

export { FileEntry, CommandExecutor };

export default function emulator(
  rootDirectory: string,
  customCommandsPaths?: string[]
): CommandExecutor {
  return async function executeCommand(
    commandString: string
  ): Promise<string | ReadableStream | FileEntry[] | void> {
    const parts = commandString.trim().split(/\s+/);
    const commandName = parts[0];
    const args = parts.slice(1);

    if (!commandName) {
      throw new Error("No command provided");
    }

    const commandPaths: string[] = [];
    
    if (customCommandsPaths) {
      for (const customPath of customCommandsPaths) {
        commandPaths.push(join(customPath, commandName, "index.js"));
      }
    }
    
    commandPaths.push(join(__dirname, "commands", commandName, "index.js"));

    let commandModule;
    let commandFunction;
    
    for (const commandPath of commandPaths) {
      try {
        await access(commandPath);
        commandModule = await import(commandPath);
        commandFunction = commandModule.default;
        break;
      } catch {
        continue;
      }
    }

    if (!commandFunction) {
      throw new Error(`bash: ${commandName}: command not found`);
    }

    if (typeof commandFunction !== "function") {
      throw new Error(`Invalid command module for '${commandName}'`);
    }

    try {
      return await commandFunction(rootDirectory, args);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to execute command '${commandName}'`);
    }
  };
}
