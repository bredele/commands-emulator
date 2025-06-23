import { test } from "node:test";
import assert from "node:assert";
import { tmpdir } from "node:os";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import emulator from "../..";

test("cd command functionality", async (t) => {
  const testDir = join(tmpdir(), "cd-test-" + Date.now());
  mkdirSync(testDir, { recursive: true });
  mkdirSync(join(testDir, "subdir"));

  try {
    const commands = emulator(testDir);

    await t.test("cd should validate and return absolute path", async () => {
      const subdirPath = join(testDir, "subdir");
      const result = await commands(`cd ${subdirPath}`);
      assert.strictEqual(result, subdirPath);
    });

    await t.test("cd should fail with relative path", async () => {
      await assert.rejects(
        () => commands("cd subdir"),
        /only absolute paths are supported/
      );
    });

    await t.test("cd without path should return root directory", async () => {
      const result = await commands("cd");
      assert.strictEqual(result, testDir);
    });

    await t.test(
      "cd with non-existent directory should throw error",
      async () => {
        const nonExistentPath = join(testDir, "nonexistent");
        await assert.rejects(
          () => commands(`cd ${nonExistentPath}`),
          /No such file or directory/
        );
      }
    );

    await t.test("cd outside root should be prevented", async () => {
      await assert.rejects(
        () => commands("cd /"),
        /Permission denied.*outside root directory/
      );
    });

    await t.test("cd with file instead of directory should fail", async () => {
      const filePath = join(testDir, "testfile.txt");
      writeFileSync(filePath, "content");
      await assert.rejects(
        () => commands(`cd ${filePath}`),
        /Not a directory/
      );
    });
  } finally {
    rmSync(testDir, { recursive: true, force: true });
  }
});
