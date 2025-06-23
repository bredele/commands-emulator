# commands-emulator

Emulate Unix commands for scripting, automation, and fun.

## Installation

```sh
npm install commands-emulator
```

## Usage

```ts
import emulator from "commands-emulator";

// Create a command executor with a root directory
const commands = emulator(process.cwd());

// Execute commands using the configured executor
await commands("ls /path/to/directory");
await commands("ls -la /path/to/directory");
await commands("cd /absolute/path");
```

### Custom Commands

You can extend the emulator with custom commands by providing additional command directories:

```ts
import emulator from "commands-emulator";

// Create a command executor with custom command directories
const commands = emulator(process.cwd(), [
  "/path/to/custom/commands",
  "/path/to/another/commands",
]);

// Commands will be resolved in order: custom directories first, then built-in commands
await commands("my-custom-command arg1 arg2");
await commands("ls /some/path"); // Falls back to built-in ls if not found in custom dirs
```

Custom command directories should follow the same structure as built-in commands:

- Each command is a folder named after the command
- Each folder contains an `index.ts` (or `index.js`) file
- The index file exports a default function with signature: `(rootDirectory: string, args: string[]) => Promise<any>`
