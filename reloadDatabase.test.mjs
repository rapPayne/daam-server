import { describe, test } from "node:test";
import assert from "assert";

describe("reloading", () => {
  test("foo", () => {
    console.log("foo");
    assert.strictEqual(1, 2)
  })
})
