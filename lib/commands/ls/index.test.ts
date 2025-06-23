import { test } from "node:test";
import assert from "node:assert";
import { tmpdir } from "node:os";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import emulator, { FileEntry } from "../..";

test("ls command functionality", async (t) => {
  const testDir = join(tmpdir(), "ls-test-" + Date.now());
  mkdirSync(testDir, { recursive: true });
  mkdirSync(join(testDir, "subdir"));
  writeFileSync(join(testDir, "file1.txt"), "content1");
  writeFileSync(join(testDir, "file2.txt"), "content2");
  writeFileSync(join(testDir, ".hidden"), "hidden content");

  try {
    const commands = emulator(testDir);

    await t.test("ls should return array of FileEntry objects", async () => {
      const result = await commands(`ls ${testDir}`) as FileEntry[];
      assert(Array.isArray(result), "ls should return an array");
      assert.strictEqual(result.length, 3);
      
      const names = result.map(entry => entry.name).sort();
      assert.deepStrictEqual(names, ["file1.txt", "file2.txt", "subdir"]);
      
      // Check types
      const file1 = result.find(entry => entry.name === "file1.txt");
      const subdirEntry = result.find(entry => entry.name === "subdir");
      assert.strictEqual(file1?.type, "file");
      assert.strictEqual(subdirEntry?.type, "directory");
    });

    await t.test("ls should fail with relative path", async () => {
      await assert.rejects(
        () => commands("ls subdir"),
        /only absolute paths are supported/
      );
    });

    await t.test("ls should fail without path", async () => {
      await assert.rejects(
        () => commands("ls"),
        /missing operand.*path required/
      );
    });

    await t.test("ls -a should include hidden files", async () => {
      const result = await commands(`ls -a ${testDir}`) as FileEntry[];
      assert(Array.isArray(result));
      assert.strictEqual(result.length, 4); // includes .hidden
      
      const names = result.map(entry => entry.name).sort();
      assert(names.includes(".hidden"));
      assert(names.includes("file1.txt"));
      assert(names.includes("subdir"));
    });

    await t.test("ls -l should include detailed information", async () => {
      const result = await commands(`ls -l ${testDir}`) as FileEntry[];
      assert(Array.isArray(result));
      
      const file1 = result.find(entry => entry.name === "file1.txt");
      const subdirEntry = result.find(entry => entry.name === "subdir");
      
      // Check that detailed info is present
      assert(file1?.permissions, "File should have permissions");
      assert(typeof file1?.size === "number", "File should have size");
      assert(file1?.date, "File should have date");
      assert.strictEqual(file1?.permissions?.charAt(0), "-"); // file
      
      assert(subdirEntry?.permissions, "Directory should have permissions");
      assert.strictEqual(subdirEntry?.permissions?.charAt(0), "d"); // directory
    });

    await t.test("ls with mixed flags should work", async () => {
      const result = await commands(`ls -l -a ${testDir}`) as FileEntry[];
      assert(Array.isArray(result));
      assert.strictEqual(result.length, 4); // includes .hidden
      
      const hiddenFile = result.find(entry => entry.name === ".hidden");
      assert(hiddenFile, "Hidden file should be included");
      assert(hiddenFile.permissions, "Hidden file should have permissions");
      assert(typeof hiddenFile.size === "number", "Hidden file should have size");
    });

    await t.test("ls outside root should be prevented", async () => {
      await assert.rejects(
        () => commands("ls /"),
        /Permission denied.*outside root directory/
      );
    });

    await t.test(
      "ls with non-existent directory should throw error",
      async () => {
        const nonExistentPath = join(testDir, "nonexistent");
        await assert.rejects(
          () => commands(`ls ${nonExistentPath}`),
          /cannot access/
        );
      }
    );
  } finally {
    rmSync(testDir, { recursive: true, force: true });
  }
});
