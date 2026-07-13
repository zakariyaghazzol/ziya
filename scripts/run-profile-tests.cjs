const { buildSync } = require("esbuild");
const { existsSync, unlinkSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join, resolve } = require("node:path");

const output = join(tmpdir(), `ziya-profile-${process.pid}.cjs`);

process.on("exit", () => {
  if (existsSync(output)) unlinkSync(output);
});

buildSync({
  entryPoints: [resolve("tests/profile-personalization.test.jsx")],
  bundle: true,
  platform: "node",
  format: "cjs",
  outfile: output,
  loader: { ".css": "empty" },
  logLevel: "silent"
});

require(output);
