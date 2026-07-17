const { buildSync } = require("esbuild");
const { existsSync, unlinkSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join, resolve } = require("node:path");

const output = join(tmpdir(), `ziya-phase2-${process.pid}.cjs`);
process.on("exit", () => {
  if (existsSync(output)) unlinkSync(output);
});

buildSync({
  entryPoints: [resolve("tests/phase2.test.js")],
  bundle: true,
  platform: "node",
  format: "cjs",
  outfile: output,
  loader: { ".css": "empty" },
  logLevel: "silent"
});

require(output);
