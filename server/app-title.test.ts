import { describe, expect, it } from "vitest";

describe("Drivana app title configuration", () => {
  it("exposes the configured title to the runtime", () => {
    expect(process.env.VITE_APP_TITLE).toBe("Drivana");
  });
});
