# commands-emulator

Emulate Unix commands for scripting, automation, and fun.

## Installation

```sh
npm install commands-emulator
```

## Usage

```ts 
import emulator from 'commands-emulator'

// Execute commands with explicit paths (stateless)
await emulator(process.cwd(), 'ls /path/to/directory')
await emulator(process.cwd(), 'ls -la /path/to/directory')  
await emulator(process.cwd(), 'cd /absolute/path')
```
