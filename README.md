# commands-emulator

Emulate Unix commands for scripting, automation, and fun.

## Installation

```sh
npm install commands-emulator
```

## Usage

```ts
import commands from "commands-emulator";

// Execute commands with explicit paths (stateless)
await commands(process.cwd(), "ls /path/to/directory");
await commands(process.cwd(), "ls -la /path/to/directory");
await commands(process.cwd(), "cd /absolute/path");
```
