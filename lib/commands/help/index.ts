import { readdir } from "node:fs/promises";
import { join } from "node:path";

export const description = "Show available commands and their descriptions";

export default async (
  rootDirectory: string,
  args: string[]
): Promise<string> => {
  // Get custom command paths from the special argument that the emulator will pass
  // This is a bit of a hack but necessary since the help command needs access to custom paths
  const customCommandsPaths = (globalThis as any).__customCommandsPaths || [];
  
  const commands: Array<{ name: string; description: string }> = [];

  // Scan custom command directories first (they take precedence)
  for (const customPath of customCommandsPaths) {
    try {
      const entries = await readdir(customPath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const commandName = entry.name;
          try {
            const commandPath = join(customPath, commandName, "index.js");
            const commandModule = await import(commandPath);
            if (commandModule.description && typeof commandModule.description === "string") {
              // Only add if not already added (custom commands override built-in ones)
              if (!commands.find(cmd => cmd.name === commandName)) {
                commands.push({ name: commandName, description: commandModule.description });
              }
            }
          } catch {
            // Skip commands that can't be loaded or don't have descriptions
            continue;
          }
        }
      }
    } catch {
      // Skip directories that can't be read
      continue;
    }
  }

  // Scan built-in commands directory
  try {
    const builtInCommandsPath = join(__dirname, "..");
    const entries = await readdir(builtInCommandsPath, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const commandName = entry.name;
        
        // Skip if already added from custom commands
        if (commands.find(cmd => cmd.name === commandName)) {
          continue;
        }
        
        try {
          const commandPath = join(builtInCommandsPath, commandName, "index.js");
          const commandModule = await import(commandPath);
          
          if (commandModule.description && typeof commandModule.description === "string") {
            commands.push({ name: commandName, description: commandModule.description });
          }
        } catch {
          // Skip commands that can't be loaded or don't have descriptions
          continue;
        }
      }
    }
  } catch (error) {
    throw new Error(`help: Failed to scan commands directory: ${error instanceof Error ? error.message : "Unknown error"}`);
  }

  // Sort commands alphabetically
  commands.sort((a, b) => a.name.localeCompare(b.name));

  if (commands.length === 0) {
    return "No commands available.\n";
  }

  // Format output
  const maxNameLength = Math.max(...commands.map(cmd => cmd.name.length));
  const formattedCommands = commands.map(cmd => 
    `  ${cmd.name.padEnd(maxNameLength)} - ${cmd.description}`
  ).join("\n");

  return `Available commands:\n${formattedCommands}\n`;
};