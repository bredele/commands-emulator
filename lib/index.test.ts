import { test } from "node:test";
import assert from "node:assert";
import { tmpdir } from "node:os";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import emulator from ".";

test("core emulator functionality", async (t) => {
  const testDir = join(tmpdir(), "emulator-core-test-" + Date.now());
  mkdirSync(testDir, { recursive: true });

  try {
    await t.test("emulator should handle empty command", async () => {
      const commands = emulator(testDir);
      await assert.rejects(() => commands(""), /No command provided/);
    });

    await t.test("emulator should handle whitespace-only command", async () => {
      const commands = emulator(testDir);
      await assert.rejects(
        () => commands("   "),
        /No command provided/
      );
    });

    await t.test("unknown command should throw error", async () => {
      const commands = emulator(testDir);
      await assert.rejects(
        () => commands("invalidcommand"),
        /command not found/
      );
    });

    await t.test(
      "emulator should parse command with multiple arguments",
      async () => {
        const commands = emulator(testDir);
        // This will fail because ls requires a path, but it tests argument parsing
        await assert.rejects(
          () => commands("ls -l -a"),
          /missing operand.*path required/
        );
      }
    );

    await t.test(
      "emulator should handle commands with extra whitespace",
      async () => {
        const commands = emulator(testDir);
        await assert.rejects(
          () => commands("  ls   -l   "),
          /missing operand.*path required/
        );
      }
    );

    await t.test("custom commands path support", async () => {
      const commands = emulator(testDir, ["/nonexistent/custom/path"]);
      await assert.rejects(
        () => commands("invalidcommand"),
        /command not found/
      );
    });

    await t.test("falls back to built-in commands when custom command not found", async () => {
      const commands = emulator(testDir, ["/nonexistent/custom/path"]);
      await assert.rejects(
        () => commands("ls -l -a"),
        /missing operand.*path required/
      );
    });
  } finally {
    rmSync(testDir, { recursive: true, force: true });
  }
});
