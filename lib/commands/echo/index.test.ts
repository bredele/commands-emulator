import { test } from "node:test";
import assert from "node:assert";
import { tmpdir } from "node:os";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import emulator from "../..";

test("echo command functionality", async (t) => {
  const testDir = join(tmpdir(), "echo-test-" + Date.now());
  mkdirSync(testDir, { recursive: true });

  try {
    const commands = emulator(testDir);

    await t.test("echo should return string", async () => {
      const result = await commands("echo hello");
      assert.strictEqual(typeof result, "string", "echo should return string");
    });

    await t.test("echo with single argument", async () => {
      const result = await commands("echo hello");
      assert.strictEqual(result, "hello\n");
    });

    await t.test("echo with multiple arguments", async () => {
      const result = await commands("echo hello world test");
      assert.strictEqual(result, "hello world test\n");
    });

    await t.test("echo with no arguments", async () => {
      const result = await commands("echo");
      assert.strictEqual(result, "\n");
    });

    await t.test("echo with -n flag should omit newline", async () => {
      const result = await commands("echo -n hello");
      assert.strictEqual(result, "hello");
    });

    await t.test("echo with -n flag and multiple arguments", async () => {
      const result = await commands("echo -n hello world test");
      assert.strictEqual(result, "hello world test");
    });

    await t.test("echo with -n flag and no text arguments", async () => {
      const result = await commands("echo -n");
      assert.strictEqual(result, "");
    });

    await t.test("echo with special characters", async () => {
      const result = await commands("echo hello\\ttab\\nnewline");
      assert.strictEqual(result, "hello\\ttab\\nnewline\n");
    });

    await t.test("echo with quotes and spaces", async () => {
      const result = await commands('echo "hello world" test');
      assert.strictEqual(result, '"hello world" test\n');
    });

    await t.test("echo with unicode characters", async () => {
      const result = await commands("echo 🚀 unicode test 你好");
      assert.strictEqual(result, "🚀 unicode test 你好\n");
    });

    await t.test("echo with mixed flags and text", async () => {
      const result = await commands("echo -n text with flag");
      assert.strictEqual(result, "text with flag");
    });

    await t.test("echo with numbers and symbols", async () => {
      const result = await commands("echo 123 !@# $%^ &*()");
      assert.strictEqual(result, "123 !@# $%^ &*()\n");
    });

    await t.test("echo with empty string arguments", async () => {
      const result = await commands('echo "" hello ""');
      assert.strictEqual(result, '"" hello ""\n');
    });

    await t.test("echo with only spaces", async () => {
      const result = await commands("echo    ");
      assert.strictEqual(result, "\n");
    });

    await t.test("echo with backslashes", async () => {
      const result = await commands("echo hello\\world\\test");
      assert.strictEqual(result, "hello\\world\\test\n");
    });
  } finally {
    rmSync(testDir, { recursive: true, force: true });
  }
});