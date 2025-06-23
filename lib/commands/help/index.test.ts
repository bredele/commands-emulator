import { test } from "node:test";
import assert from "node:assert";
import { tmpdir } from "node:os";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import emulator from "../..";

test("help command functionality", async (t) => {
  const testDir = join(tmpdir(), "help-test-" + Date.now());
  mkdirSync(testDir, { recursive: true });

  try {
    const commands = emulator(testDir);

    await t.test("help should return string", async () => {
      const result = await commands("help");
      assert(typeof result === "string", "help should return a string");
    });

    await t.test("help should list available commands", async () => {
      const result = await commands("help") as string;
      assert(result.includes("Available commands:"), "Should include header");
      assert(result.includes("cat"), "Should include cat command");
      assert(result.includes("cd"), "Should include cd command");
      assert(result.includes("date"), "Should include date command");
      assert(result.includes("echo"), "Should include echo command");
      assert(result.includes("help"), "Should include help command");
      assert(result.includes("ls"), "Should include ls command");
    });

    await t.test("help should include command descriptions", async () => {
      const result = await commands("help") as string;
      assert(result.includes("Display file contents"), "Should include cat description");
      assert(result.includes("Change directory"), "Should include cd description");
      assert(result.includes("Display current date and time"), "Should include date description");
      assert(result.includes("Display text"), "Should include echo description");
      assert(result.includes("Show available commands and their descriptions"), "Should include help description");
      assert(result.includes("List directory contents"), "Should include ls description");
    });

    await t.test("help should format commands properly", async () => {
      const result = await commands("help") as string;
      const lines = result.split("\n");
      
      // Should have header
      assert.strictEqual(lines[0], "Available commands:");
      
      // Command lines should be properly formatted (start with 2 spaces)
      const commandLines = lines.slice(1, -1); // Remove header and trailing newline
      for (const line of commandLines) {
        if (line.trim()) { // Skip empty lines
          assert(line.startsWith("  "), `Command line should start with 2 spaces: ${line}`);
          assert(line.includes(" - "), `Command line should include separator: ${line}`);
        }
      }
    });

    await t.test("help should sort commands alphabetically", async () => {
      const result = await commands("help") as string;
      const lines = result.split("\n").slice(1, -1); // Remove header and trailing newline
      const commandNames = lines
        .filter(line => line.trim())
        .map(line => line.trim().split(" ")[0]);
      
      const sortedNames = [...commandNames].sort();
      assert.deepStrictEqual(commandNames, sortedNames, "Commands should be sorted alphabetically");
    });

    await t.test("help should handle arguments gracefully", async () => {
      const result = await commands("help --verbose");
      assert(typeof result === "string", "help should return string even with arguments");
      assert(result.includes("Available commands:"), "Should still show commands with arguments");
    });

    await t.test("help should be consistent across multiple calls", async () => {
      const result1 = await commands("help");
      const result2 = await commands("help");
      assert.strictEqual(result1, result2, "Help output should be consistent");
    });

  } finally {
    rmSync(testDir, { recursive: true, force: true });
  }
});

test("help command with custom commands", async (t) => {
  const testDir = join(tmpdir(), "help-custom-test-" + Date.now());
  const customCommandsDir = join(testDir, "custom-commands");
  mkdirSync(testDir, { recursive: true });
  mkdirSync(customCommandsDir, { recursive: true });

  // Create a custom command with description
  const customCmdDir = join(customCommandsDir, "mycmd");
  mkdirSync(customCmdDir, { recursive: true });
  writeFileSync(
    join(customCmdDir, "index.js"),
    `
    exports.description = "My custom command";
    exports.default = async (rootDirectory, args) => {
      return "custom output";
    };
    `
  );

  // Create a custom command without description (should be excluded)
  const customCmdDir2 = join(customCommandsDir, "nodesc");
  mkdirSync(customCmdDir2, { recursive: true });
  writeFileSync(
    join(customCmdDir2, "index.js"),
    `
    exports.default = async (rootDirectory, args) => {
      return "no description";
    };
    `
  );

  try {
    // Set up global custom commands paths for help command
    (globalThis as any).__customCommandsPaths = [customCommandsDir];
    
    const commands = emulator(testDir, [customCommandsDir]);

    await t.test("help should include custom commands with descriptions", async () => {
      const result = await commands("help") as string;
      assert(result.includes("mycmd"), "Should include custom command");
      assert(result.includes("My custom command"), "Should include custom command description");
    });

    await t.test("help should exclude custom commands without descriptions", async () => {
      const result = await commands("help") as string;
      assert(!result.includes("nodesc"), "Should not include command without description");
    });

    await t.test("help should include both built-in and custom commands", async () => {
      const result = await commands("help") as string;
      assert(result.includes("mycmd"), "Should include custom command");
      assert(result.includes("cat"), "Should include built-in command");
      assert(result.includes("ls"), "Should include built-in command");
    });

  } finally {
    // Clean up global state
    delete (globalThis as any).__customCommandsPaths;
    rmSync(testDir, { recursive: true, force: true });
  }
});