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
      await assert.rejects(() => emulator(testDir, ""), /No command provided/);
    });

    await t.test("emulator should handle whitespace-only command", async () => {
      await assert.rejects(
        () => emulator(testDir, "   "),
        /No command provided/
      );
    });

    await t.test("unknown command should throw error", async () => {
      await assert.rejects(
        () => emulator(testDir, "invalidcommand"),
        /command not found/
      );
    });

    await t.test(
      "emulator should parse command with multiple arguments",
      async () => {
        // This will fail because ls requires a path, but it tests argument parsing
        await assert.rejects(
          () => emulator(testDir, "ls -l -a"),
          /missing operand.*path required/
        );
      }
    );

    await t.test(
      "emulator should handle commands with extra whitespace",
      async () => {
        await assert.rejects(
          () => emulator(testDir, "  ls   -l   "),
          /missing operand.*path required/
        );
      }
    );
  } finally {
    rmSync(testDir, { recursive: true, force: true });
  }
});
