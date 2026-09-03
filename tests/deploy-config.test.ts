/**
 * Template Header
 * Purpose: Verify the production deployment contract.
 * Feature Unit: Shared
 * Customize: Extend when the deployment topology or runtime command changes.
 * Depends on: Node.js filesystem APIs and Vitest.
 */

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const deployConfig = readFileSync("deploy.toml", "utf8");
const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
  scripts: Record<string, string>;
};

describe("Hestia deployment configuration", () => {
  it("enables the platform-managed PostgreSQL database", () => {
    expect(deployConfig).toMatch(/^database\s*=\s*true\s*$/m);
  });

  it("uses the root page as a healthy single-service endpoint", () => {
    expect(deployConfig).toMatch(/^healthcheck\s*=\s*"\/"\s*$/m);
  });

  it("does not declare a platform-managed port", () => {
    expect(deployConfig).not.toMatch(/^\s*port\s*=/m);
  });

  it("binds the production server to all interfaces on the injected port", () => {
    expect(packageJson.scripts.start).toBe(
      'next start --hostname 0.0.0.0 --port "$PORT"',
    );
  });
});
