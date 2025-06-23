import { test } from "node:test";
import assert from "node:assert";
import { tmpdir } from "node:os";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import emulator from "../..";

test("date command functionality", async (t) => {
  const testDir = join(tmpdir(), "date-test-" + Date.now());
  mkdirSync(testDir, { recursive: true });

  try {
    const commands = emulator(testDir);

    await t.test("date should return string", async () => {
      const result = await commands("date");
      assert.strictEqual(typeof result, "string", "date should return string");
    });

    await t.test("date with no arguments should return default format", async () => {
      const result = await commands("date");
      assert.strictEqual(typeof result, "string");
      // Should match pattern like "Wed Dec 25 2024 14:30:25 GMT-0800 (PST)"
      assert.match(result as string, /^[A-Za-z]{3}\s+[A-Za-z]{3}\s+\d{1,2}\s+\d{4}\s+\d{2}:\d{2}:\d{2}/);
    });

    await t.test("date with -u flag should return UTC time", async () => {
      const result = await commands("date -u");
      assert.strictEqual(typeof result, "string");
      // UTC format should contain "GMT"
      assert.match(result as string, /GMT/);
    });

    await t.test("date with --utc flag should return UTC time", async () => {
      const result = await commands("date --utc");
      assert.strictEqual(typeof result, "string");
      assert.match(result as string, /GMT/);
    });

    await t.test("date with -I flag should return ISO 8601 format", async () => {
      const result = await commands("date -I");
      assert.strictEqual(typeof result, "string");
      // ISO format should match YYYY-MM-DDTHH:MM:SS.sssZ or YYYY-MM-DDTHH:MM:SS.sss+HH:MM
      assert.match(result as string, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}[Z\+\-]/);
    });

    await t.test("date with --iso-8601 flag should return ISO 8601 format", async () => {
      const result = await commands("date --iso-8601");
      assert.strictEqual(typeof result, "string");
      assert.match(result as string, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}[Z\+\-]/);
    });

    await t.test("date with -I -u flags should return ISO 8601 UTC format", async () => {
      const result = await commands("date -I -u");
      assert.strictEqual(typeof result, "string");
      // UTC ISO format should end with Z
      assert.match(result as string, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    await t.test("date with custom format +%Y should return year", async () => {
      const result = await commands("date +%Y");
      assert.strictEqual(typeof result, "string");
      const currentYear = new Date().getFullYear().toString();
      assert.strictEqual(result, currentYear);
    });

    await t.test("date with custom format +%Y-%m-%d should return date", async () => {
      const result = await commands("date +%Y-%m-%d");
      assert.strictEqual(typeof result, "string");
      // Should match YYYY-MM-DD format
      assert.match(result as string, /^\d{4}-\d{2}-\d{2}$/);
    });

    await t.test("date with custom format +%H:%M:%S should return time", async () => {
      const result = await commands("date +%H:%M:%S");
      assert.strictEqual(typeof result, "string");
      // Should match HH:MM:SS format
      assert.match(result as string, /^\d{2}:\d{2}:\d{2}$/);
    });

    await t.test("date with custom format +%a should return weekday abbreviation", async () => {
      const result = await commands("date +%a");
      assert.strictEqual(typeof result, "string");
      // Should be one of the weekday abbreviations
      assert.match(result as string, /^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)$/);
    });

    await t.test("date with custom format +%A should return full weekday name", async () => {
      const result = await commands("date +%A");
      assert.strictEqual(typeof result, "string");
      // Should be one of the full weekday names
      assert.match(result as string, /^(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)$/);
    });

    await t.test("date with custom format +%b should return month abbreviation", async () => {
      const result = await commands("date +%b");
      assert.strictEqual(typeof result, "string");
      // Should be one of the month abbreviations
      assert.match(result as string, /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)$/);
    });

    await t.test("date with custom format +%B should return full month name", async () => {
      const result = await commands("date +%B");
      assert.strictEqual(typeof result, "string");
      // Should be one of the full month names
      assert.match(result as string, /^(January|February|March|April|May|June|July|August|September|October|November|December)$/);
    });

    await t.test("date with custom format +%d should return day of month", async () => {
      const result = await commands("date +%d");
      assert.strictEqual(typeof result, "string");
      // Should be 01-31
      assert.match(result as string, /^(0[1-9]|[12][0-9]|3[01])$/);
    });

    await t.test("date with custom format +%m should return month number", async () => {
      const result = await commands("date +%m");
      assert.strictEqual(typeof result, "string");
      // Should be 01-12
      assert.match(result as string, /^(0[1-9]|1[0-2])$/);
    });

    await t.test("date with custom format +%I should return 12-hour format", async () => {
      const result = await commands("date +%I");
      assert.strictEqual(typeof result, "string");
      // Should be 01-12
      assert.match(result as string, /^(0[1-9]|1[0-2])$/);
    });

    await t.test("date with custom format +%p should return AM/PM", async () => {
      const result = await commands("date +%p");
      assert.strictEqual(typeof result, "string");
      // Should be AM or PM
      assert.match(result as string, /^(AM|PM)$/);
    });

    await t.test("date with custom format +%y should return 2-digit year", async () => {
      const result = await commands("date +%y");
      assert.strictEqual(typeof result, "string");
      // Should be 2 digits
      assert.match(result as string, /^\d{2}$/);
      const currentYear = new Date().getFullYear() % 100;
      assert.strictEqual(result, currentYear.toString().padStart(2, '0'));
    });

    await t.test("date with custom format +%% should return literal %", async () => {
      const result = await commands("date +%%");
      assert.strictEqual(result, "%");
    });

    await t.test("date with custom format +%n should return newline", async () => {
      const result = await commands("date +%n");
      assert.strictEqual(result, "\n");
    });

    await t.test("date with custom format +%t should return tab", async () => {
      const result = await commands("date +%t");
      assert.strictEqual(result, "\t");
    });

    await t.test("date with complex custom format", async () => {
      const result = await commands("date +%Y-%m-%d %H:%M:%S");
      assert.strictEqual(typeof result, "string");
      // Should match YYYY-MM-DD HH:MM:SS format
      assert.match(result as string, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    });

    await t.test("date with custom format and UTC flag", async () => {
      const result = await commands("date -u +%Y-%m-%d");
      assert.strictEqual(typeof result, "string");
      assert.match(result as string, /^\d{4}-\d{2}-\d{2}$/);
    });

    await t.test("date with multiple flags should work", async () => {
      const result = await commands("date -u -I");
      assert.strictEqual(typeof result, "string");
      // Should be ISO format in UTC
      assert.match(result as string, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    await t.test("date output should be consistent within same second", async () => {
      const result1 = await commands("date +%Y-%m-%d %H:%M:%S");
      const result2 = await commands("date +%Y-%m-%d %H:%M:%S");
      // Both should be strings
      assert.strictEqual(typeof result1, "string");
      assert.strictEqual(typeof result2, "string");
      // Results might be the same or differ by 1 second max
      const time1 = new Date(result1 as string).getTime();
      const time2 = new Date(result2 as string).getTime();
      const diff = Math.abs(time1 - time2);
      assert.ok(diff <= 1000, "Date outputs should be within 1 second of each other");
    });

    await t.test("date with edge case format +%e should return space-padded day", async () => {
      const result = await commands("date +%e");
      assert.strictEqual(typeof result, "string");
      // Should be 1-2 characters, space-padded for single digits
      assert.match(result as string, /^( [1-9]|[12][0-9]|3[01])$/);
    });

    await t.test("date should handle midnight correctly", async () => {
      // Test that we can format times correctly regardless of current time
      const result = await commands("date +%H");
      assert.strictEqual(typeof result, "string");
      // Should be 00-23
      assert.match(result as string, /^([01][0-9]|2[0-3])$/);
    });

    await t.test("date with multiple format specifiers", async () => {
      const result = await commands("date +Today is %A, %B %d, %Y");
      assert.strictEqual(typeof result, "string");
      // Should match pattern like "Today is Wednesday, December 25, 2024"
      assert.match(result as string, /^Today is (Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday), (January|February|March|April|May|June|July|August|September|October|November|December) ([0-9]{1,2}), \d{4}$/);
    });

    await t.test("date with time zone format should work", async () => {
      const result = await commands("date");
      assert.strictEqual(typeof result, "string");
      // Default format should contain timezone information
      assert.ok((result as string).includes("GMT") || (result as string).includes("UTC") || (result as string).match(/[+-]\d{4}/));
    });

  } finally {
    rmSync(testDir, { recursive: true, force: true });
  }
});