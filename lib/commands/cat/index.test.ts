import { test } from "node:test";
import assert from "node:assert";
import { tmpdir } from "node:os";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import emulator from "../..";

// Helper function to read a ReadableStream to string
async function streamToString(stream: ReadableStream): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let result = '';
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      result += decoder.decode(value, { stream: true });
    }
    result += decoder.decode(); // flush
    return result;
  } finally {
    reader.releaseLock();
  }
}

test("cat command functionality", async (t) => {
  const testDir = join(tmpdir(), "cat-test-" + Date.now());
  mkdirSync(testDir, { recursive: true });
  mkdirSync(join(testDir, "subdir"));

  const testFile = join(testDir, "test.txt");
  const testContent = "Hello, World!\nThis is a test file.\nLine 3";
  writeFileSync(testFile, testContent);

  const subFile = join(testDir, "subdir", "nested.txt");
  const subContent = "Nested file content";
  writeFileSync(subFile, subContent);

  try {
    const commands = emulator(testDir);

    await t.test("cat should return ReadableStream", async () => {
      const result = await commands(`cat ${testFile}`);
      assert(result instanceof ReadableStream, "cat should return ReadableStream");
    });

    await t.test("cat should stream file contents", async () => {
      const result = await commands(`cat ${testFile}`) as ReadableStream;
      const content = await streamToString(result);
      assert.strictEqual(content, testContent);
    });

    await t.test("cat should stream nested file contents", async () => {
      const result = await commands(`cat ${subFile}`) as ReadableStream;
      const content = await streamToString(result);
      assert.strictEqual(content, subContent);
    });

    await t.test("cat should fail with relative path", async () => {
      await assert.rejects(
        () => commands("cat test.txt"),
        /only absolute paths are supported/
      );
    });

    await t.test("cat should fail without file path", async () => {
      await assert.rejects(
        () => commands("cat"),
        /missing operand.*file path required/
      );
    });

    await t.test("cat with non-existent file should throw error", async () => {
      const nonExistentFile = join(testDir, "nonexistent.txt");
      await assert.rejects(
        () => commands(`cat ${nonExistentFile}`),
        /No such file or directory/
      );
    });

    await t.test("cat with directory should throw error", async () => {
      const dirPath = join(testDir, "subdir");
      await assert.rejects(
        () => commands(`cat ${dirPath}`),
        /Is a directory/
      );
    });

    await t.test("cat outside root should be prevented", async () => {
      await assert.rejects(
        () => commands("cat /etc/passwd"),
        /Permission denied.*outside root directory/
      );
    });

    await t.test("cat should stream empty file", async () => {
      const emptyFile = join(testDir, "empty.txt");
      writeFileSync(emptyFile, "");
      const result = await commands(`cat ${emptyFile}`) as ReadableStream;
      const content = await streamToString(result);
      assert.strictEqual(content, "");
    });

    await t.test("cat should stream file with special characters", async () => {
      const specialFile = join(testDir, "special.txt");
      const specialContent =
        "Content with\ttabs\nand\nnewlines\r\nand unicode: 🚀";
      writeFileSync(specialFile, specialContent);
      const result = await commands(`cat ${specialFile}`) as ReadableStream;
      const content = await streamToString(result);
      assert.strictEqual(content, specialContent);
    });

    await t.test("cat should stream large file in chunks", async () => {
      const largeFile = join(testDir, "large.txt");
      const largeContent = "A".repeat(100000); // 100KB file
      writeFileSync(largeFile, largeContent);
      const result = await commands(`cat ${largeFile}`) as ReadableStream;
      const content = await streamToString(result);
      assert.strictEqual(content, largeContent);
      assert.strictEqual(content.length, 100000);
    });
  } finally {
    rmSync(testDir, { recursive: true, force: true });
  }
});
